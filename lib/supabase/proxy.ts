import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { homePathForRole } from "@/lib/auth/paths"

function isAuthPage(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register")
}

function isProtectedRoute(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/queue") ||
    pathname.startsWith("/my-queue") ||
    pathname.startsWith("/my-visits") ||
    pathname.startsWith("/my-reviews") ||
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile") ||
    pathname === "/complete-profile" ||
    pathname === "/pending-approval"
  )
}

/** Redirects must copy cookies from the Supabase response or a token refresh is thrown away. */
function redirectWithSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  const redirectResponse = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Must run on every matched request (including /auth/callback) so the session is refreshed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isProtectedRoute(pathname)) {
      return redirectWithSession(request, supabaseResponse, "/login")
    }
    return supabaseResponse
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, profile_completed")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    return supabaseResponse
  }

  const home = homePathForRole(profile.role)

  if (!profile.profile_completed && pathname !== "/complete-profile" && !pathname.startsWith("/auth")) {
    return redirectWithSession(request, supabaseResponse, "/complete-profile")
  }

  if (
    profile.role === "provider" &&
    profile.profile_completed &&
    pathname !== "/pending-approval" &&
    !pathname.startsWith("/auth") &&
    pathname !== "/complete-profile"
  ) {
    const { data: provider } = await supabase
      .from("providers")
      .select("verification_status")
      .eq("user_id", user.id)
      .maybeSingle()

    if (provider && provider.verification_status !== "approved") {
      return redirectWithSession(request, supabaseResponse, "/pending-approval")
    }
  }

  if (isAuthPage(pathname)) {
    return redirectWithSession(request, supabaseResponse, home)
  }

  if (pathname.startsWith("/dashboard") && profile.role === "admin") {
    return redirectWithSession(request, supabaseResponse, "/admin")
  }

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return redirectWithSession(request, supabaseResponse, home)
  }

  if (pathname === "/dashboard" && profile.role === "provider") {
    return redirectWithSession(request, supabaseResponse, "/dashboard/queue")
  }

  if (pathname.startsWith("/dashboard") && profile.role === "patient") {
    return redirectWithSession(request, supabaseResponse, "/my-queue")
  }

  return supabaseResponse
}

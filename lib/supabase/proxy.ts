import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
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

  // Refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes that don't need any checks
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/auth")

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register")

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/queue")

  const isCompleteProfileRoute = pathname === "/complete-profile"
  const isPendingApprovalRoute = pathname === "/pending-approval"

  // --- Not logged in ---
  if (!user) {
    if (isProtectedRoute || isCompleteProfileRoute || isPendingApprovalRoute) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // --- Logged in: fetch profile from public.users ---
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, profile_completed")
    .eq("id", user.id)
    .single()


  // TEMP DEBUG
  if (profileError) console.log("[MW]", user.email, "profile error:", profileError.message)
  if (profile) console.log("[MW]", user.email, "role:", profile.role)

  // If no profile row exists yet (edge case), let them through
  if (!profile) {
    return supabaseResponse
  }

  // --- Profile not completed (Google users on first login) ---
  if (!profile.profile_completed && !isCompleteProfileRoute && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/complete-profile"
    return NextResponse.redirect(url)
  }

  // --- Doctor pending approval ---
  if (
    profile.role === "provider" &&
    profile.profile_completed &&
    !isPendingApprovalRoute &&
    !pathname.startsWith("/auth") &&
    !isCompleteProfileRoute
  ) {
    // Check if the doctor is verified
    const { data: provider } = await supabase
      .from("providers")
      .select("verification_status")
      .eq("user_id", user.id)
      .single()

    if (provider && provider.verification_status === "pending") {
      const url = request.nextUrl.clone()
      url.pathname = "/pending-approval"
      return NextResponse.redirect(url)
    }

    if (provider && provider.verification_status === "rejected") {
      const url = request.nextUrl.clone()
      url.pathname = "/pending-approval"
      return NextResponse.redirect(url)
    }
  }

  // --- Logged in user visiting auth pages → redirect based on role ---
  if (isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname =
      profile.role === "admin"
        ? "/admin"
        : profile.role === "provider"
        ? "/dashboard/queue"
        : "/my-queue"
    return NextResponse.redirect(url)
  }

  // --- Admin visiting /dashboard → redirect to /admin ---
  if (pathname.startsWith("/dashboard") && profile.role === "admin") {
    const url = request.nextUrl.clone()
    url.pathname = "/admin"
    return NextResponse.redirect(url)
  }

  // --- Non-admin trying to access /admin → redirect to their home ---
  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    const url = request.nextUrl.clone()
    url.pathname = profile.role === "provider" ? "/dashboard/queue" : "/my-queue"
    return NextResponse.redirect(url)
  }

  // --- Provider visiting patient dashboard index → redirect to /dashboard/queue ---
  if (pathname === "/dashboard" && profile.role === "provider") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/queue"
    return NextResponse.redirect(url)
  }

  // --- Patient visiting any /dashboard route → redirect to /my-queue ---
  if (pathname.startsWith("/dashboard") && profile.role === "patient") {
    const url = request.nextUrl.clone()
    url.pathname = "/my-queue"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
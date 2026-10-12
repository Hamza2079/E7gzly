import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Create the initial response — must always return THIS or a redirect built from it.
  // Never return a plain NextResponse.next() at the end; that would drop Set-Cookie headers.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write new cookie values into the request object so downstream
          // server code sees the refreshed token immediately.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Rebuild supabaseResponse with the mutated request so Next.js
          // sends the updated cookies back to the browser.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Per Next.js 16 docs: Proxy should perform OPTIMISTIC checks only.
  // Avoid DB queries here — they add latency on every request and can cause
  // cookie loss on Vercel when the async call delays the response.
  // getUser() is the correct call — it validates the JWT with Supabase Auth
  // and silently refreshes the token if needed (which triggers setAll above).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated user hitting a protected route → redirect to login
  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    const redirectResponse = NextResponse.redirect(url)
    // Copy any refreshed session cookies onto the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // Authenticated user hitting a login/register page → send to their home
  if (user && isAuthPage(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/my-queue"
    url.search = ""
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // IMPORTANT: Always return supabaseResponse (not NextResponse.next()).
  // supabaseResponse carries the Set-Cookie headers that persist the session.
  return supabaseResponse
}

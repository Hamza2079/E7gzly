import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware — runs on every request.
 * Protects dashboard routes and redirects unauthenticated users.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: Validate Supabase session from cookies
  // const session = await getSession(request);

  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtectedRoute) {
    // TODO: Check for valid session
    // if (!session) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }

    // TODO: Check role-based access
    // if (pathname.startsWith("/admin") && session.role !== "admin") {
    //   return NextResponse.redirect(new URL("/dashboard", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};

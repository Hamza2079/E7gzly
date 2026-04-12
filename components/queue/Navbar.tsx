// @ts-nocheck — Remove after regenerating types
import Link from "next/link"
import { createServer } from "@/lib/supabase/server"

export default async function Navbar() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, full_name")
      .eq("id", user.id)
      .single()
    role = profile?.role || null
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-bold text-blue-600">
          E7gzly
        </Link>

        <div className="flex items-center gap-6">
          {role !== "provider" && (
            <Link href="/doctors" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Doctors
            </Link>
          )}

          {!user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Admin
                </Link>
              )}
              {role === "patient" && (
                <div className="group relative z-50 py-4">
                  <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                    Account
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute right-0 top-full hidden w-48 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl group-hover:flex">
                    <Link href="/profile" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile Settings</Link>
                    <Link href="/favorites" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Saved Doctors</Link>
                    <Link href="/my-reviews" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Reviews</Link>
                    <Link href="/notifications" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Notifications</Link>
                    <Link href="/support" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:bg-gray-50">FAQ & Support</Link>
                    <div className="border-t border-gray-100"></div>
                     <form action="/auth/signout" method="POST">
                       <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                     </form>
                  </div>
                </div>
              )}
              
              <Link
                href={role === "provider" ? "/dashboard/queue" : "/my-queue"}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {role === "provider" ? "Dashboard" : "My Queue"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

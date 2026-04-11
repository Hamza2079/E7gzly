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
          <Link href="/doctors" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Doctors
          </Link>

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
              <Link
                href={role === "provider" ? "/dashboard/queue" : "/dashboard"}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

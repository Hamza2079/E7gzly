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
        <Link href="/" className="text-2xl font-black text-blue-600 tracking-tight">
          إحجزلي
        </Link>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8">
            {role !== "provider" && (
              <Link href="/doctors" className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                الأطباء
              </Link>
            )}

            {!user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-bold text-gray-500 hover:text-gray-900"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
                >
                  ابدأ الآن
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {role === "admin" && (
                  <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-blue-600">
                    الإدارة
                  </Link>
                )}
                
                {role === "patient" && (
                  <div className="group relative z-50 py-4">
                    <button className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">
                      حسابي
                      <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div className="absolute right-0 top-full hidden w-52 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl group-hover:flex animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">مرحباً بك</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{(user as any).email}</p>
                      </div>
                      <Link href="/profile" className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">إعدادات الملف الشخصي</Link>
                      <Link href="/my-visits" className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">زياراتي</Link>
                      <Link href="/favorites" className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600">الأطباء المحفوظون</Link>
                      <div className="border-t border-gray-50"></div>
                       <Link href="/auth/signout" className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50">
                         تسجيل الخروج
                       </Link>
                    </div>
                  </div>
                )}
                
                <Link
                  href={role === "provider" ? "/dashboard/queue" : "/my-queue"}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
                >
                  {role === "provider" ? "لوحة التحكم" : "طابوري"}
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Login Button (Simplified) */}
          {!user && (
            <Link
              href="/login"
              className="md:hidden rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
            >
              دخول
            </Link>
          )}
          {user && (
             <div className="md:hidden h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                {user.email?.[0].toUpperCase()}
             </div>
          )}
        </div>
      </div>
    </nav>
  )
}

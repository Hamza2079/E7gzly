import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import { LayoutDashboard, ListOrdered, Users, BarChart3, Settings, LogOut, Plus, Bell } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "OVERVIEW" },
    { href: "/admin/queue", icon: ListOrdered, label: "QUEUE" },
    { href: "/admin/patients", icon: Users, label: "PATIENTS" },
    { href: "/admin/analytics", icon: BarChart3, label: "ANALYTICS" },
    { href: "/admin/settings", icon: Settings, label: "SETTINGS" },
  ]

  return (
    <div className="flex h-screen overflow-hidden text-gray-900 bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-16 md:w-64 shrink-0 flex-col bg-[#EEF2FF] transition-all duration-300 shadow-sm z-10 border-r border-indigo-100/50">
        <div className="flex h-20 items-center justify-center md:justify-start px-0 md:px-6 mb-4">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
               <span className="text-white font-bold text-lg leading-none">e</span>
             </div>
             <div className="hidden md:block">
               <Link href="/admin" className="text-lg font-bold text-blue-700 leading-tight block">
                 e7gzly<span className="font-extrabold text-blue-900">admin</span>
               </Link>
               <p className="text-[10px] uppercase text-blue-400 font-bold tracking-widest leading-none">Clinical Precision</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-4 md:px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center md:justify-start gap-3 rounded-xl p-3 md:px-4 text-xs font-bold tracking-widest transition-colors ${
                item.href === "/admin" 
                ? "bg-white text-blue-600 shadow-sm" 
                : "text-gray-500 hover:bg-white/50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 md:p-6 mb-4">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 px-4 text-xs font-bold transition hover:bg-blue-700 shadow-sm md:shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)]">
             <Plus className="h-4 w-4" /> <span className="hidden md:inline">New Appointment</span>
          </button>
        </div>

        <div className="border-t border-indigo-100/50 p-4 md:p-6 mb-2 space-y-2">
            <button
              className="flex w-full items-center justify-center md:justify-start gap-3 rounded-lg p-2 md:px-3 md:py-2 text-xs font-bold text-gray-500 transition-colors hover:text-gray-900"
            >
              <div className="h-5 w-5 rounded-full border border-gray-400 flex items-center justify-center">?</div> <span className="hidden md:inline">HELP CENTER</span>
            </button>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center md:justify-start gap-3 rounded-lg p-2 md:px-3 md:py-2 text-xs font-bold text-gray-500 transition-colors hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 shrink-0" /> <span className="hidden md:inline">LOGOUT</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Dashboard */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        
        {/* Top Navbar Header */}
        <header className="flex h-20 items-center justify-between bg-white px-8 lg:px-12 shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] z-0 relative">
           <div className="w-1/3 min-w-[200px] relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" placeholder="Search clinics, doctors, or patient IDs..." className="text-sm border-none bg-transparent pl-10 pr-4 py-2 w-full focus:ring-0 text-gray-900 placeholder-gray-400 focus:outline-none" />
           </div>

           <div className="flex gap-8 text-xs font-bold text-gray-500 items-center">
             <Link href="/doctors" className="text-blue-600 border-b-2 border-blue-600 pb-1">Directory</Link>
             <Link href="/tickets" className="hover:text-gray-900">Tickets</Link>
             <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
             <Link href="/support" className="hover:text-gray-900">Support</Link>
           </div>

           <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 text-gray-400">
                <Bell className="h-5 w-5" />
                <Settings className="h-5 w-5" />
             </div>
             <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-gray-900">Dr. Sarah Khalil</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chief Admin</p>
                </div>
                <img src="https://i.pravatar.cc/150?img=47" className="h-10 w-10 rounded-full" alt="Admin" />
             </div>
           </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 px-8 lg:px-12 py-8 w-full max-w-7xl mx-auto">
           {children}
        </main>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Ticket, User, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav({ role }: { role: string | null }) {
  const pathname = usePathname()

  // Hide on auth pages or if not logged in (optional, but good for UX)
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")
  if (isAuthPage) return null

  const tabs = [
    {
      label: "الرئيسية",
      href: "/",
      icon: Home,
      show: true
    },
    {
      label: "البحث",
      href: "/doctors",
      icon: Search,
      show: role !== "provider"
    },
    {
      label: role === "provider" ? "التحكم" : "طابوري",
      href: role === "provider" ? "/dashboard/queue" : "/my-queue",
      icon: role === "provider" ? LayoutDashboard : Ticket,
      show: !!role
    },
    {
      label: "حسابي",
      href: "/profile",
      icon: User,
      show: !!role
    }
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/80 backdrop-blur-lg border-t border-gray-100 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.filter(tab => tab.show).map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-colors duration-200",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <tab.icon className={cn("h-5 w-5", isActive && "fill-current")} />
              <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="h-1 w-1 rounded-full bg-blue-600 mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

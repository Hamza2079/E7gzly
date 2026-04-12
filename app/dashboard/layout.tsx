// @ts-nocheck — Remove after regenerating types
import type { Metadata } from "next";
import { createServer } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Stethoscope,
  ListOrdered,
  BarChart3,
  User,
  Star,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "patient";
  const name = profile?.full_name || "User";

  const navItems = [
    { href: "/dashboard/queue", icon: ListOrdered, label: "Queue" },
    { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
    { href: "/dashboard/reviews", icon: Star, label: "Reviews" },
    { href: "/dashboard/profile", icon: User, label: "Profile Settings" },
    { href: "/dashboard/settings", icon: Settings, label: "Queue Settings" },
  ];

  return (
    <div className="flex h-screen overflow-hidden text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-16 md:w-64 shrink-0 flex-col border-r bg-white transition-all duration-300">
        <div className="flex h-16 items-center justify-center md:justify-start border-b px-0 md:px-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            <span className="md:hidden">E7</span>
            <span className="hidden md:inline">E7gzly</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="flex items-center justify-center md:justify-start gap-3 rounded-lg p-2.5 md:px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="h-6 w-6 md:h-5 md:w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t p-2 md:p-4">
          <div className="mb-3 flex items-center justify-center md:justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {name.charAt(0)}
            </div>
            <div className="hidden flex-1 overflow-hidden md:block">
              <p className="truncate text-sm font-medium text-gray-900">{name}</p>
              <p className="truncate text-xs text-gray-400">
                {role === "provider" ? "Doctor" : "Patient"}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Sign Out"
              className="flex w-full items-center justify-center md:justify-start gap-2 rounded-lg border border-red-200 p-2.5 md:px-3 md:py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 shrink-0" /> <span className="hidden md:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Doctor Dashboard
          </h2>
        </header>
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}

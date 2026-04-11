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

  const navItems =
    role === "provider"
      ? [
          { href: "/dashboard/queue", icon: ListOrdered, label: "Queue" },
          { href: "/dashboard/settings", icon: Settings, label: "Schedule" },
        ]
      : [
          { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
          { href: "/doctors", icon: Stethoscope, label: "Find Doctor" },
        ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            E7gzly
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              {name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">{name}</p>
              <p className="truncate text-xs text-gray-400">
                {role === "provider" ? "Doctor" : "Patient"}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {role === "provider" ? "Doctor Dashboard" : "Patient Dashboard"}
          </h2>
        </header>
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}

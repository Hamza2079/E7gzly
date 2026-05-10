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
import MobileMenu from "@/components/dashboard/MobileMenu";

export const metadata: Metadata = {
  title: "لوحة التحكم",
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
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/auth/signout")
  }

  const role = profile?.role || "patient";
  const name = profile?.full_name || "مستخدم";

  const navItems = [
    { href: "/dashboard/queue", iconName: "ListOrdered", label: "إدارة الطابور" },
    { href: "/dashboard/services", iconName: "Stethoscope", label: "الخدمات" },
    { href: "/dashboard/reports", iconName: "BarChart3", label: "التقارير" },
    { href: "/dashboard/reviews", iconName: "Star", label: "التقييمات" },
    { href: "/dashboard/profile", iconName: "User", label: "إعدادات الملف الشخصي" },
    { href: "/dashboard/settings", iconName: "Settings", label: "إعدادات الطابور" },
  ];

  const ICON_MAP: Record<string, any> = {
    ListOrdered,
    Stethoscope,
    BarChart3,
    Star,
    User,
    Settings,
  };

  return (
    <div className="flex h-screen overflow-hidden text-gray-900 bg-gray-50 md:bg-white" dir="rtl">
      {/* Sidebar - Hidden on mobile entirely */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-l bg-white transition-all duration-300">
        <div className="flex h-16 items-center justify-center md:justify-start border-b px-0 md:px-6">
          <Link href="/" className="text-xl font-bold text-blue-600">
            <span className="md:hidden">E7</span>
            <span className="hidden md:inline">E7gzly</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.iconName];
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex items-center justify-center md:justify-start gap-3 rounded-lg p-2.5 md:px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                <Icon className="h-6 w-6 md:h-5 md:w-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="mb-3 flex items-center justify-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 overflow-hidden bg-blue-100 text-sm font-bold text-blue-600">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                name.charAt(0)
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">{name}</p>
              <p className="truncate text-xs text-gray-400">
                {role === "provider" ? "طبيب" : "مريض"}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="تسجيل الخروج"
              className="flex w-full items-center justify-center md:justify-start gap-2 rounded-lg border border-red-200 p-2.5 md:px-3 md:py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 shrink-0" /> <span>تسجيل الخروج</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-y-auto pb-20 md:pb-0">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center gap-3">
            <MobileMenu 
              navItems={navItems}
              profileName={name}
              profileRole={role}
              avatarUrl={profile?.avatar_url}
            />
            <h2 className="text-lg font-semibold text-gray-900">
              لوحة تحكم الطبيب
            </h2>
          </div>
        </header>
        <main className="flex-1 bg-gray-50 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

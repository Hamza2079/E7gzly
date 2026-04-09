"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Settings,
  BarChart3,
  Star,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const patientLinks: SidebarLink[] = [
  { href: "/dashboard/patient", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/patient/appointments", label: "Appointments", icon: <Calendar className="h-5 w-5" /> },
  { href: "/dashboard/patient/profile", label: "Profile", icon: <Settings className="h-5 w-5" /> },
];

const providerLinks: SidebarLink[] = [
  { href: "/dashboard/provider", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/provider/schedule", label: "Schedule", icon: <Clock className="h-5 w-5" /> },
  { href: "/dashboard/provider/patients", label: "Patients", icon: <Users className="h-5 w-5" /> },
  { href: "/dashboard/provider/analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { href: "/dashboard/provider/reviews", label: "Reviews", icon: <Star className="h-5 w-5" /> },
];

const adminLinks: SidebarLink[] = [
  { href: "/dashboard/admin", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/dashboard/admin/users", label: "Users", icon: <Users className="h-5 w-5" /> },
  { href: "/dashboard/admin/providers", label: "Providers", icon: <Shield className="h-5 w-5" /> },
  { href: "/dashboard/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
];

interface SidebarProps {
  role?: "patient" | "provider" | "admin";
}

export default function Sidebar({ role = "patient" }: SidebarProps) {
  const pathname = usePathname();

  const links =
    role === "admin" ? adminLinks : role === "provider" ? providerLinks : patientLinks;

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      <div className="border-b px-6 py-4">
        <Link href="/" className="text-xl font-bold text-blue-600">
          E7gzly
        </Link>
        <p className="mt-1 text-xs capitalize text-gray-400">{role} Dashboard</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

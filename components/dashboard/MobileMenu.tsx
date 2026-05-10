"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ListOrdered, Stethoscope, BarChart3, Star, User, Settings } from "lucide-react";

interface MobileMenuProps {
  navItems: { href: string; iconName: string; label: string }[];
  profileName: string;
  profileRole: string;
  avatarUrl?: string | null;
}

const ICON_MAP: Record<string, any> = {
  ListOrdered,
  Stethoscope,
  BarChart3,
  Star,
  User,
  Settings,
};

export default function MobileMenu({ navItems, profileName, profileRole, avatarUrl }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          
          <div className="relative flex w-4/5 max-w-sm flex-col bg-white h-full overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <Link href="/" className="text-xl font-bold text-blue-600">
                E7gzly
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 overflow-hidden bg-blue-100 text-lg font-bold text-blue-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  profileName.charAt(0)
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{profileName}</p>
                <p className="text-xs text-gray-500">{profileRole === "provider" ? "طبيب" : "مريض"}</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = ICON_MAP[item.iconName];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {Icon && <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl border border-red-200 p-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" /> تسجيل الخروج
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

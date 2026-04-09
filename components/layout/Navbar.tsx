"use client";

import Link from "next/link";
import { Menu, X, Bell } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/doctors", label: "Doctors" },
  { href: "/booking", label: "Book" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          E7gzly
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            {/* TODO: notification badge */}
          </button>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

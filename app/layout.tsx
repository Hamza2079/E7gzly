import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "إحجزلي — نظام الطوابير الذكي للعيادات",
    template: "%s | إحجزلي",
  },
  description:
    "احجز مكانك في طابور العيادة أونلاين وتابع دورك بشكل فوري — لا انتظار في العيادة.",
  keywords: ["عيادة", "طابور", "دكتور", "صحة", "مصر", "انتظار", "حجز"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn("h-full", "antialiased", cairo.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}

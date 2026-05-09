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

import NextTopLoader from "nextjs-toploader";
import BottomNav from "@/components/queue/BottomNav";
import { createServer } from "@/lib/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = null;
  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    role = profile?.role || null;
  }

  return (
    <html
      lang="ar"
      dir="rtl"
      className={cn("h-full", "antialiased", cairo.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900 pb-16 md:pb-0">
        <NextTopLoader 
          color="#2563eb"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        {children}
        <BottomNav role={role} />
      </body>
    </html>
  );
}

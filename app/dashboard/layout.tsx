import type { Metadata } from "next";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      {/* TODO: Determine role dynamically from auth session */}
      <Sidebar role="patient" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <div className="flex items-center gap-4">
            {/* TODO: Notification bell, user menu */}
            <div className="h-8 w-8 rounded-full bg-blue-100" />
          </div>
        </header>
        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}

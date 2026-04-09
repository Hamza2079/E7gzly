import type { Metadata } from "next";
import { Users, Shield, BarChart3, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-500">Platform overview and management.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: "12,540", icon: <Users className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
          { title: "Verified Providers", value: "342", icon: <Shield className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
          { title: "Pending Verification", value: "8", icon: <AlertCircle className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
          { title: "Month Revenue", value: "EGP 1.12M", icon: <BarChart3 className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div key={stat.title} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{stat.title}</span>
              <span className={`rounded-lg p-2 ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Verifications */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending Provider Verifications</h2>
        </div>
        <div className="divide-y">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div>
                  <p className="font-medium text-gray-900">Dr. Provider #{i + 1}</p>
                  <p className="text-sm text-gray-500">Specialty • Applied 2 days ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">
                  Approve
                </button>
                <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

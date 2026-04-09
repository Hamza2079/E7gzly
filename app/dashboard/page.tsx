import { Calendar, Clock, Star, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="mt-1 text-gray-500">Here&apos;s an overview of your appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Upcoming", value: "3", icon: <Calendar className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
          { title: "Completed", value: "24", icon: <Star className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
          { title: "Cancelled", value: "2", icon: <Clock className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
          { title: "This Month", value: "5", icon: <TrendingUp className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
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

      {/* Upcoming appointments */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100" />
                <div>
                  <p className="font-medium text-gray-900">Doctor Name #{i + 1}</p>
                  <p className="text-sm text-gray-500">Specialty • Tomorrow, 10:00 AM</p>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Confirmed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

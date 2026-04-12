// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Banknote, Users, CheckCircle, CalendarOff, History } from "lucide-react"

export const metadata = {
  title: "Reports & Analytics",
  description: "View your queue performance and earnings.",
}

export default async function DoctorReportsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get provider
  const { data: provider } = await supabase
    .from("providers")
    .select("id, is_verified, consultation_fee")
    .eq("user_id", user.id)
    .single()

  if (!provider || !provider.is_verified) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-500">Your account must be verified to view reports.</p>
      </div>
    )
  }

  // Fetch queue history for this provider
  const { data: entries } = await supabase
    .from("queue_entries")
    .select("*, queues!inner(date, provider_id), users(full_name)")
    .eq("queues.provider_id", provider.id)
    .in("status", ["completed", "no_show", "cancelled"])
    .order("created_at", { ascending: false })

  const completed = entries?.filter(e => e.status === "completed") || []
  const noShows = entries?.filter(e => e.status === "no_show") || []

  const totalEarnings = completed.length * (provider.consultation_fee || 0)
  
  const uniquePatients = new Set(entries?.map(e => e.patient_id)).size

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">Reports & Analytics</h1>
        <p className="mt-2 text-gray-500">Track your consultation earnings and patient history.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Earnings Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{totalEarnings} <span className="text-sm text-gray-400 font-normal">EGP</span></p>
            </div>
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Consultations</p>
              <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
            </div>
          </div>
        </div>

        {/* Unique Patients */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{uniquePatients}</p>
            </div>
          </div>
        </div>

        {/* No-Shows */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <CalendarOff className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">No-Shows</p>
              <p className="text-2xl font-bold text-gray-900">{noShows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient History Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-6 py-5">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Patient History</h2>
        </div>
        
        {(!entries || entries.length === 0) ? (
          <div className="px-6 py-12 text-center">
             <p className="text-gray-500 text-sm">No patient history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Fee Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {entries.map((entry) => {
                  const q = entry.queues as any
                  const u = entry.users as any
                  
                  const isCompleted = entry.status === "completed"
                  const earned = isCompleted ? (provider.consultation_fee || 0) : 0

                  return (
                    <tr key={entry.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{q?.date || "—"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{u?.full_name || "Unknown"}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{entry.visit_reason || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isCompleted ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" :
                          entry.status === "no_show" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20" :
                          "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                        }`}>
                          {isCompleted ? "Completed" :
                           entry.status === "no_show" ? "No Show" : "Cancelled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {earned ? `${earned} EGP` : "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

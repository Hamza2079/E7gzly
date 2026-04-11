// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Stethoscope, Clock, History, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Dashboard",
  description: "Your patient dashboard.",
}

export default async function PatientDashboard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check for active queue entry
  const { data: activeEntry } = await supabase
    .from("queue_entries")
    .select("*, queues(*, providers(*, users(full_name), specialties(name)))")
    .eq("patient_id", user.id)
    .in("status", ["waiting", "called", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch recent history
  const { data: history } = await supabase
    .from("queue_entries")
    .select("*, queues(date, providers(users(full_name), specialties(name)))")
    .eq("patient_id", user.id)
    .in("status", ["completed", "no_show", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back! Here&apos;s your queue activity.</p>
      </div>

      {/* Active Ticket */}
      {activeEntry && (
        <Link
          href={`/queue/${activeEntry.id}`}
          className="block rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 transition-colors hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600">ACTIVE QUEUE TICKET</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                #{String(activeEntry.queue_number).padStart(3, "0")} — Dr.{" "}
                {(activeEntry.queues as { providers: { users: { full_name: string } } })?.providers?.users?.full_name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {(activeEntry.queues as { providers: { specialties: { name: string } } })?.providers?.specialties?.name || "General"}
              </p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                activeEntry.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
                activeEntry.status === "called" ? "bg-green-100 text-green-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {activeEntry.status === "waiting" ? "Waiting" :
                 activeEntry.status === "called" ? "It's your turn!" :
                 "In Consultation"}
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-blue-400" />
          </div>
        </Link>
      )}

      {/* No active ticket */}
      {!activeEntry && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-lg font-semibold text-gray-700">No Active Queue</h3>
          <p className="mt-1 text-sm text-gray-500">Browse doctors and join a queue to get started.</p>
          <Link
            href="/doctors"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find a Doctor <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Queue History</h2>
        </div>
        {(!history || history.length === 0) ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No past visits yet.</p>
        ) : (
          <div className="divide-y">
            {history.map((entry) => {
              const q = entry.queues as { date: string; providers: { users: { full_name: string }; specialties: { name: string } } } | null
              return (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Dr. {q?.providers?.users?.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {q?.providers?.specialties?.name} · {q?.date || "—"}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.status === "completed" ? "bg-green-100 text-green-700" :
                    entry.status === "no_show" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {entry.status === "completed" ? "Completed" :
                     entry.status === "no_show" ? "Missed" : "Cancelled"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

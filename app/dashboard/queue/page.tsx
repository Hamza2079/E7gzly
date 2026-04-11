// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DoctorQueuePanel from "@/components/queue/DoctorQueuePanel"
import Link from "next/link"
import { Settings } from "lucide-react"

export const metadata = {
  title: "Queue Dashboard",
  description: "Manage your patient queue.",
}

export default async function DoctorQueueDashboard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get provider
  const { data: provider } = await supabase
    .from("providers")
    .select("id, is_verified, verification_status, users(full_name), specialties(name)")
    .eq("user_id", user.id)
    .single()

  if (!provider || !provider.is_verified) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-500">Your account must be verified to access the queue dashboard.</p>
      </div>
    )
  }

  // Get today's queue
  const today = new Date().toISOString().split("T")[0]
  const { data: queue } = await supabase
    .from("queues")
    .select("id")
    .eq("provider_id", provider.id)
    .eq("date", today)
    .maybeSingle()

  // Get today's stats
  let todayServed = 0
  let todayNoShows = 0
  if (queue) {
    const { count: sc } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .eq("status", "completed")
    todayServed = sc || 0

    const { count: ns } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .eq("status", "no_show")
    todayNoShows = ns || 0
  }

  // Get schedule info
  const dayOfWeek = new Date().getDay()
  const { data: schedule } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("provider_id", provider.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  const pUser = provider.users as { full_name: string }
  const pSpec = provider.specialties as { name: string }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Dr. {pUser.full_name} · {pSpec.name}
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
      </div>

      {/* Schedule info */}
      {schedule ? (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Today&apos;s Schedule:</span>{" "}
            {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
            {schedule.break_start && schedule.break_end && (
              <span className="text-gray-400">
                {" "}(break {schedule.break_start.slice(0, 5)}–{schedule.break_end.slice(0, 5)})
              </span>
            )}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            No schedule set for today.{" "}
            <Link href="/dashboard/settings" className="font-medium underline">
              Configure your schedule
            </Link>
          </p>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{todayServed}</p>
          <p className="text-xs text-green-600">Served Today</p>
        </div>
        <div className="rounded-xl bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{todayNoShows}</p>
          <p className="text-xs text-red-600">No-shows</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{todayServed + todayNoShows}</p>
          <p className="text-xs text-blue-600">Total Called</p>
        </div>
      </div>

      {/* Queue Panel (realtime) */}
      <DoctorQueuePanel
        queueId={queue?.id || null}
        providerId={provider.id}
      />
    </div>
  )
}

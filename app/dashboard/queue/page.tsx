// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DoctorQueuePanel from "@/components/queue/DoctorQueuePanel"

export const metadata = {
  title: "Queue Management",
}

export default async function DoctorQueueDashboard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: provider } = await supabase
    .from("providers")
    .select("id, is_verified, users(full_name), specialties(name)")
    .eq("user_id", user.id)
    .single()

  if (!provider) redirect("/login")

  const today = new Date().toISOString().split("T")[0]
  const { data: queue } = await supabase
    .from("queues")
    .select("id")
    .eq("provider_id", provider.id)
    .eq("date", today)
    .maybeSingle()

  // Stats
  let todayServed = 0
  let todayNoShows = 0
  if (queue) {
    const { count: sc } = await supabase.from("queue_entries").select("*", { count: "exact", head: true }).eq("queue_id", queue.id).eq("status", "completed")
    todayServed = sc || 0
    const { count: ns } = await supabase.from("queue_entries").select("*", { count: "exact", head: true }).eq("queue_id", queue.id).eq("status", "no_show")
    todayNoShows = ns || 0
  }

  return (
    <div className="w-full">
      <DoctorQueuePanel
        queueId={queue?.id || null}
        providerId={provider.id}
        doctorName={provider.users.full_name}
        specialty={provider.specialties?.name || "General Practice"}
        todayServed={todayServed}
        todayNoShows={todayNoShows}
      />
    </div>
  )
}

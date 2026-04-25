import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DoctorQueuePanel from "@/components/queue/DoctorQueuePanel"

export const metadata = {
  title: "Queue Management",
}

type ProviderSummary = {
  id: string
  is_verified: boolean
  users: { full_name: string }
  specialties: { name: string } | null
}

type TodayQueue = {
  id: string
}

export default async function DoctorQueueDashboard() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: providerResult } = await supabase
    .from("providers")
    .select("id, is_verified, users(full_name), specialties(name)")
    .eq("user_id", user.id)
    .single()

  const provider = providerResult as unknown as ProviderSummary | null
  if (!provider) redirect("/login")

  const today = new Date().toISOString().split("T")[0]
  const { data: queueResult } = await supabase
    .from("queues")
    .select("id")
    .eq("provider_id", provider.id)
    .eq("date", today)
    .maybeSingle()

  const queue = queueResult as unknown as TodayQueue | null

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
        doctorName={provider.users.full_name}
        specialty={provider.specialties?.name || "General Practice"}
        todayServed={todayServed}
        todayNoShows={todayNoShows}
      />
    </div>
  )
}

// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import QueueTicket from "@/components/queue/QueueTicket"
import Navbar from "@/components/queue/Navbar"

export const metadata = {
  title: "Your Queue Ticket",
  description: "Track your position and estimated wait time.",
}

export default async function QueueTicketPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = await params
  const supabase = await createServer()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch entry with queue and provider info
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("*, queues(*, providers(*, users(full_name), specialties(name)))")
    .eq("id", entryId)
    .single()

  if (!entry) notFound()

  // Verify ownership
  if (entry.patient_id !== user.id) notFound()

  const queue = entry.queues as { id: string; providers: { users: { full_name: string }; specialties: { name: string } } }
  const doctorName = `Dr. ${queue?.providers?.users?.full_name || "Unknown"}`
  const specialtyName = queue?.providers?.specialties?.name || "General"

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-lg px-6 py-8">
        <QueueTicket
          entryId={entry.id}
          queueId={entry.queue_id}
          queueNumber={entry.queue_number}
          initialStatus={entry.status}
          doctorName={doctorName}
          specialtyName={specialtyName}
        />
      </div>
    </>
  )
}

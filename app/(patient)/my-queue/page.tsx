import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar } from "lucide-react"
import QueueTicket from "@/components/queue/QueueTicket"

export const metadata = {
  title: "My Ticket | E7gzly",
}

type ActiveQueueEntry = {
  id: string
  status: "waiting" | "called" | "in_progress"
  queue_number: number
  queue_id: string
  queues: {
    id: string
    current_serving: number | null
    status: string
    avg_duration: number | null
    providers: {
      clinic_name: string | null
      clinic_address: string | null
      city: string | null
      users: { full_name: string }
    }
  }
}

export default async function MyQueuePage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date().toISOString().split("T")[0]
  const { data: activeEntry } = await supabase
    .from("queue_entries")
    .select(`
      id, status, queue_number, queue_id,
      queues!inner (
        id, date, current_serving, status, avg_duration,
        providers (
          id, clinic_name, clinic_address, city,
          users (full_name),
          specialties (name)
        )
      )
    `)
    .eq("patient_id", user.id)
    .in("status", ["waiting", "called", "in_progress", "completed"])
    .eq("queues.date", today)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const entry = activeEntry as unknown as ActiveQueueEntry | null

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">No Active Tickets</h2>
        <p className="mt-2 max-w-sm text-gray-500">
          You are not currently waiting in any clinic queues. Find a doctor to book your spot.
        </p>
        <Link href="/doctors"
          className="mt-8 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700 transition">
          Find a Doctor
        </Link>
      </div>
    )
  }

  const queue = entry.queues
  const provider = queue.providers as any
  const doctorName = `Dr. ${provider.users.full_name}`
  const specialtyName = provider.specialties?.name || "General"

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <QueueTicket
        entryId={entry.id}
        queueId={entry.queue_id}
        queueNumber={entry.queue_number}
        initialStatus={entry.status}
        doctorName={doctorName}
        specialtyName={specialtyName}
        providerId={provider.id}
        clinicName={provider.clinic_name}
        clinicAddress={provider.clinic_address || provider.city}
      />
    </div>
  )
}

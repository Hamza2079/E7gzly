// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import ReceptionistQueuePanel from "@/components/queue/ReceptionistQueuePanel"

export default async function ReceptionistSessionPage({ params }: { params: Promise<{ token: string }> }) {
  const supabase = await createServer()
  const { token } = await params

  // Verify token
  const { data: queue } = await supabase
    .from("queues")
    .select("*, providers(*, users(full_name), specialties(name))")
    .eq("session_token", token)
    .single()

  if (!queue || queue.status !== "open") {
    return notFound()
  }

  if (queue.session_expires_at && new Date(queue.session_expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Session Expired</h2>
          <p className="mt-2 text-gray-500">This receptionist link has expired. Please ask the doctor to generate a new one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Receptionist Portal</h1>
          <p className="text-gray-500 mt-1">
            Dr. {(queue.providers as any)?.users?.full_name || "Doctor"} • {(queue.providers as any)?.specialties?.name || "Specialty"}
          </p>
        </div>
        
        <ReceptionistQueuePanel queueId={queue.id} sessionToken={token} />
      </div>
    </div>
  )
}

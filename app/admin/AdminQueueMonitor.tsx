"use client"

import { closeQueue } from "@/actions/queue"
import { useTransition } from "react"
import { Users, XCircle, Clock } from "lucide-react"

interface QueueData {
  id: string
  status: string
  current_number: number
  current_serving: number | null
  avg_duration: number
  providers: {
    users: { full_name: string }
    specialties: { name: string }
  }
}

export default function AdminQueueMonitor({ queues }: { queues: QueueData[] }) {
  const [isPending, startTransition] = useTransition()

  if (queues.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">
        No active queues today.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {queues.map((q) => (
        <div key={q.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  q.status === "open" ? "bg-green-500" :
                  q.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                }`} />
                <p className="font-semibold text-gray-900">
                  Dr. {q.providers?.users?.full_name}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {q.providers?.specialties?.name}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              q.status === "open" ? "bg-green-50 text-green-700" :
              q.status === "paused" ? "bg-yellow-50 text-yellow-700" :
              "bg-red-50 text-red-700"
            }`}>
              {q.status}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> {q.current_number} joined
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> #{q.current_serving || "—"} serving
            </span>
          </div>

          {q.status !== "completed" && (
            <button
              onClick={() => startTransition(async () => { await closeQueue(q.id) })}
              disabled={isPending}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Force Close
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

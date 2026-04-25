"use client"

import { joinQueue } from "@/actions/queue"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface JoinQueueButtonProps {
  queueId: string
  disabled?: boolean
  disabledReason?: string
}

export default function JoinQueueButton({ queueId, disabled, disabledReason }: JoinQueueButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [readiness, setReadiness] = useState<"ready" | "not_ready">("ready")
  const router = useRouter()

  const handleJoin = (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      const visitReason = formData.get("visitReason") as string
      // If ready, we pass "here", otherwise "nearby" as a proxy for not_ready
      const travelCategory = readiness === "ready" ? "here" : "nearby"

      const result = await joinQueue(queueId, visitReason || undefined, travelCategory)

      if ("error" in result && result.error) {
        if (result.entryId) {
          router.push(`/queue/${result.entryId}`)
          return
        }
        setError(result.error)
      } else if ("entryId" in result) {
        router.push(`/queue/${result.entryId}`)
      }
    })
  }

  if (disabled) {
    return (
      <div className="rounded-xl bg-gray-100 px-6 py-3 text-center">
        <p className="text-sm font-medium text-gray-500">{disabledReason || "Cannot join queue"}</p>
      </div>
    )
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 shadow-md"
      >
        Join Queue
      </button>
    )
  }

  return (
    <form action={handleJoin} className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">{error}</div>
      )}

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">Are you at the clinic?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setReadiness("ready")}
            className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-1 transition ${
              readiness === "ready" 
                ? "bg-blue-50 border-blue-500 text-blue-700" 
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">🏥</span>
            Yes, I&apos;m here
          </button>
          <button
            type="button"
            onClick={() => setReadiness("not_ready")}
            className={`p-3 rounded-xl border text-sm font-semibold flex flex-col items-center gap-1 transition ${
              readiness === "not_ready" 
                ? "bg-amber-50 border-amber-500 text-amber-700" 
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">🚶</span>
            No, on my way
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">Visit Reason <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          name="visitReason"
          type="text"
          placeholder="e.g. Follow-up, Cold symptoms..."
          className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {isPending ? "Joining..." : "Confirm"}
        </button>
      </div>
    </form>
  )
}

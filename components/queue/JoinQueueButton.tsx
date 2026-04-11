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
  const router = useRouter()

  const handleJoin = (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      const visitReason = formData.get("visitReason") as string
      const travelCategory = formData.get("travelCategory") as string

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
        className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Join Queue
      </button>
    )
  }

  return (
    <form action={handleJoin} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600">Visit Reason (optional)</label>
        <input
          name="visitReason"
          type="text"
          placeholder="e.g. Follow-up, Cold symptoms..."
          className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600">How far are you?</label>
        <select
          name="travelCategory"
          defaultValue="here"
          className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="here">🏥 I&apos;m already here</option>
          <option value="nearby">🚶 Less than 10 min</option>
          <option value="medium">🚗 10–20 minutes</option>
          <option value="far">🚌 20–40 minutes</option>
          <option value="very_far">🛣️ More than 40 min</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 rounded-lg border py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Joining..." : "Confirm"}
        </button>
      </div>
    </form>
  )
}

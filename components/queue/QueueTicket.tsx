"use client"

import { useQueueRealtime, useGraceCountdown } from "@/hooks/use-queue-realtime"
import { leaveQueue } from "@/actions/queue"
import { useState, useTransition } from "react"
import { Clock, Users, Hash, AlertTriangle, CheckCircle } from "lucide-react"

interface QueueTicketProps {
  entryId: string
  queueId: string
  queueNumber: number
  initialStatus: string
  doctorName: string
  specialtyName: string
}

export default function QueueTicket({
  entryId,
  queueId,
  queueNumber,
  initialStatus,
  doctorName,
  specialtyName,
}: QueueTicketProps) {
  const { queueData, waitingEntries, currentPatient } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()
  const [cancelled, setCancelled] = useState(false)

  // Find my entry in the live data
  const myEntry = [...waitingEntries, currentPatient].find(
    (e) => e && (e as { id: string }).id === entryId
  ) as { status: string; grace_deadline: string | null } | undefined

  const status = myEntry?.status || initialStatus
  const graceRemaining = useGraceCountdown(
    status === "called" ? myEntry?.grace_deadline || null : null
  )

  // Calculate position
  const position = waitingEntries.filter((e) => e.queue_number < queueNumber).length + 1
  const estimatedWait = position * (queueData?.avgDuration || 10)

  const handleCancel = () => {
    startTransition(async () => {
      await leaveQueue(entryId)
      setCancelled(true)
    })
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Queue Cancelled</h2>
        <p className="mt-2 text-sm text-gray-500">You have left the queue.</p>
        <a href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          Browse doctors
        </a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Main ticket card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className={`px-6 py-4 text-white ${
          status === "called" ? "bg-green-600" :
          status === "in_progress" ? "bg-blue-600" :
          "bg-gradient-to-r from-blue-600 to-blue-700"
        }`}>
          <p className="text-sm font-medium text-white/80">
            {doctorName} · {specialtyName}
          </p>
          <p className="text-xs text-white/60">
            Queue {queueData?.status === "paused" ? "Paused" : queueData?.status || "—"}
          </p>
        </div>

        {/* Queue Number */}
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-gray-500">Your Queue Number</p>
          <p className="mt-1 text-6xl font-black text-gray-900">
            #{String(queueNumber).padStart(3, "0")}
          </p>

          {status === "called" && (
            <div className="mt-4 rounded-xl bg-green-50 p-4">
              <p className="text-lg font-bold text-green-700">🔔 It&apos;s your turn!</p>
              {graceRemaining !== null && graceRemaining > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  Please arrive within{" "}
                  <span className="font-mono font-bold">
                    {Math.floor(graceRemaining / 60)}:{String(graceRemaining % 60).padStart(2, "0")}
                  </span>
                </p>
              )}
            </div>
          )}

          {status === "in_progress" && (
            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <CheckCircle className="mx-auto h-8 w-8 text-blue-600" />
              <p className="mt-2 text-lg font-bold text-blue-700">Consultation in progress</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {status === "waiting" && (
          <div className="grid grid-cols-3 gap-px border-t bg-gray-100">
            <div className="bg-white px-4 py-4 text-center">
              <Users className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-1 text-lg font-bold text-gray-900">{position}</p>
              <p className="text-xs text-gray-500">Position</p>
            </div>
            <div className="bg-white px-4 py-4 text-center">
              <Clock className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-1 text-lg font-bold text-gray-900">~{estimatedWait}m</p>
              <p className="text-xs text-gray-500">Est. Wait</p>
            </div>
            <div className="bg-white px-4 py-4 text-center">
              <Hash className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-1 text-lg font-bold text-gray-900">
                #{queueData?.currentServing || "—"}
              </p>
              <p className="text-xs text-gray-500">Now Serving</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {status === "waiting" && queueData?.currentServing && (
          <div className="px-6 py-3">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${Math.min(100, ((queueData.currentServing / queueNumber) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cancel button */}
      {(status === "waiting" || status === "called") && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "Cancelling..." : "Leave Queue"}
        </button>
      )}
    </div>
  )
}

"use client"

import { useQueueRealtime, useGraceCountdown } from "@/hooks/use-queue-realtime"
import { callNextPatient, startConsultation, completePatient, skipPatient, openQueue, closeQueue } from "@/actions/queue"
import { useTransition } from "react"
import { Phone, User, Clock, Play, CheckCircle, SkipForward, UserPlus, Users, Activity } from "lucide-react"

interface DoctorQueuePanelProps {
  queueId: string | null
  providerId: string
}

export default function DoctorQueuePanel({ queueId, providerId }: DoctorQueuePanelProps) {
  const { queueData, waitingEntries, currentPatient, isConnected } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()

  const calledPatient = currentPatient?.status === "called" ? currentPatient : null
  const inProgressPatient = currentPatient?.status === "in_progress" ? currentPatient : null
  const graceRemaining = useGraceCountdown(calledPatient?.grace_deadline || null)

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => { await action() })
  }

  // No queue yet - show open button
  if (!queueId || !queueData) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No Queue Today</h3>
        <p className="mt-1 text-sm text-gray-500">Open your queue to start accepting patients.</p>
        <button
          onClick={() => handleAction(openQueue)}
          disabled={isPending}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Opening..." : "Open Queue"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Queue Status Header */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${
            queueData.status === "open" ? "bg-green-500 animate-pulse" :
            queueData.status === "paused" ? "bg-yellow-500" :
            "bg-red-500"
          }`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Queue {queueData.status.charAt(0).toUpperCase() + queueData.status.slice(1)}
            </p>
            <p className="text-xs text-gray-500">
              {isConnected ? "🟢 Live" : "⚪ Connecting..."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {queueData.status === "open" && (
            <button
              onClick={() => handleAction(() => closeQueue(queueId!))}
              disabled={isPending}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              Close Queue
            </button>
          )}
          {queueData.status === "closed" && waitingEntries.length === 0 && (
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
              Completed
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{waitingEntries.length}</p>
          <p className="text-xs text-gray-500">Waiting</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">#{queueData.currentServing || "—"}</p>
          <p className="text-xs text-gray-500">Serving</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-700">{queueData.avgDuration}m</p>
          <p className="text-xs text-gray-500">Avg Time</p>
        </div>
      </div>

      {/* Current Patient Card */}
      {calledPatient && (
        <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-yellow-700">CALLED — Waiting for arrival</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                #{calledPatient.queue_number} — {(calledPatient as unknown as { users: { full_name: string } }).users?.full_name || "Walk-in"}
              </p>
              {calledPatient.visit_reason && (
                <p className="mt-0.5 text-sm text-gray-500">{calledPatient.visit_reason}</p>
              )}
            </div>
            {graceRemaining !== null && (
              <div className="rounded-lg bg-yellow-100 px-3 py-1.5 text-center">
                <p className="font-mono text-lg font-bold text-yellow-800">
                  {Math.floor(graceRemaining / 60)}:{String(graceRemaining % 60).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-yellow-600">grace</p>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleAction(() => startConsultation(calledPatient.id))}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Play className="h-4 w-4" /> Start Consultation
            </button>
            <button
              onClick={() => handleAction(() => skipPatient(calledPatient.id))}
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <SkipForward className="h-4 w-4" /> Skip
            </button>
          </div>
        </div>
      )}

      {inProgressPatient && (
        <div className="rounded-xl border-2 border-blue-400 bg-blue-50 p-5">
          <p className="text-xs font-medium text-blue-700">IN PROGRESS</p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            #{inProgressPatient.queue_number} — {(inProgressPatient as unknown as { users: { full_name: string } }).users?.full_name || "Walk-in"}
          </p>
          <button
            onClick={() => handleAction(() => completePatient(inProgressPatient.id))}
            disabled={isPending}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" /> Complete
          </button>
        </div>
      )}

      {/* Call Next Button */}
      {!currentPatient && queueData.status !== "closed" && queueData.status !== "completed" && (
        <button
          onClick={() => handleAction(() => callNextPatient(queueId!))}
          disabled={isPending || waitingEntries.length === 0}
          className="w-full rounded-xl bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {waitingEntries.length === 0
            ? "No patients waiting"
            : isPending ? "Calling..." : `Call Next Patient (#${waitingEntries[0]?.queue_number})`
          }
        </button>
      )}

      {/* Waiting List */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Waiting List</p>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {waitingEntries.length}
          </span>
        </div>
        {waitingEntries.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Queue is empty</p>
        ) : (
          <div className="divide-y">
            {waitingEntries.map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                    #{entry.queue_number}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(entry as unknown as { users: { full_name: string } }).users?.full_name || "Walk-in"}
                    </p>
                    {entry.visit_reason && (
                      <p className="text-xs text-gray-400">{entry.visit_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.source === "walk_in" && (
                    <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      Walk-in
                    </span>
                  )}
                  <span className="text-xs text-gray-400">~{(i + 1) * (queueData?.avgDuration || 10)}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

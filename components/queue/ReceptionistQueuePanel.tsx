"use client"

import { useQueueRealtime } from "@/hooks/use-queue-realtime"
import { receptionistAddWalkIn, receptionistMarkPatientReady } from "@/actions/receptionist"
import { useState, useTransition } from "react"
import { Users, Plus, CheckCircle, Clock } from "lucide-react"

export default function ReceptionistQueuePanel({ queueId, sessionToken }: { queueId: string, sessionToken: string }) {
  const { queueData, waitingEntries, refetch } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()
  const [walkInName, setWalkInName] = useState("")

  const readyEntries = waitingEntries.filter(e => e.status === "ready")
  const notReadyEntries = waitingEntries.filter(e => e.status === "not_ready")

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action()
      refetch()
    })
  }

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkInName.trim()) return
    handleAction(async () => {
      await receptionistAddWalkIn(sessionToken, walkInName)
      setWalkInName("")
    })
  }

  if (!queueData || queueData.status !== "open") {
    return <div className="text-center py-12 text-gray-500 font-medium">Queue is offline or closed.</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Left Col - Queue */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Walk-in Form */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" /> Add Walk-in Patient
          </h3>
          <form onSubmit={handleAddWalkIn} className="flex gap-3">
            <input 
              type="text" 
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="Patient Name..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button type="submit" disabled={isPending || !walkInName.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
        </div>

        {/* Ready List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" /> Ready to be called
            </h3>
            <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{readyEntries.length}</span>
          </div>
          <div className="space-y-2">
            {readyEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No patients are ready.</p>
            ) : (
              readyEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <span className="font-bold text-blue-600 mr-2">#{String(entry.queue_number).padStart(3, '0')}</span>
                    <span className="font-semibold text-gray-900">{entry.users?.full_name || "Walk-in"}</span>
                  </div>
                  <span className="text-xs font-bold text-green-600">Ready</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Not Ready List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Not Ready Yet
            </h3>
            <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{notReadyEntries.length}</span>
          </div>
          <div className="space-y-2">
            {notReadyEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No patients waiting.</p>
            ) : (
              notReadyEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <span className="font-bold text-gray-400 mr-2">#{String(entry.queue_number).padStart(3, '0')}</span>
                    <span className="font-semibold text-gray-600">{entry.users?.full_name || "Online Patient"}</span>
                  </div>
                  <button onClick={() => handleAction(() => receptionistMarkPatientReady(sessionToken, entry.id))} disabled={isPending}
                    className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm transition">
                    Mark Ready
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Col */}
      <div>
        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Queue Info</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Currently Serving</p>
              <p className="text-2xl font-black text-blue-700">#{queueData.currentServing ? String(queueData.currentServing).padStart(3, '0') : "---"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Waiting</p>
              <p className="text-2xl font-black text-gray-900">{readyEntries.length + notReadyEntries.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

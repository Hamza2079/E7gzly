"use client"

import { useQueueRealtime, useGraceCountdown } from "@/hooks/use-queue-realtime"
import { receptionistAddWalkIn, receptionistMarkPatientReady, receptionistCallNextPatient, receptionistCallNextNotReadyPatient } from "@/actions/receptionist"
import { useState, useTransition, useEffect, useRef } from "react"
import { Users, Plus, CheckCircle, Clock, FileText, AlertTriangle } from "lucide-react"

const getPatientName = (entry: any) => {
  if (entry.source === "walk_in") {
    return entry.visit_reason?.replace("Walk-in: ", "") || "مريض"
  }
  return entry.users?.full_name || "مريض"
}

export default function ReceptionistQueuePanel({ queueId, sessionToken }: { queueId: string, sessionToken: string }) {
  const { queueData, waitingEntries, refetch } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()
  const [walkInName, setWalkInName] = useState("")

  const readyEntries = waitingEntries.filter(e => e.status === "ready")
  const notReadyEntries = waitingEntries.filter(e => e.status === "not_ready")
  const calledPatient = waitingEntries.find(e => e.status === "called")

  const graceRemaining = useGraceCountdown(calledPatient?.grace_deadline || null)

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action()
      refetch()
    })
  }

  // Auto-skip logic for receptionist panel (in case doctor panel is closed)
  const hasAutoSkipped = useRef<string | null>(null)
  
  useEffect(() => {
    if (calledPatient && graceRemaining === 0 && hasAutoSkipped.current !== calledPatient.id) {
      hasAutoSkipped.current = calledPatient.id
      // We need to import skipPatient from actions/queue.ts
      import("@/actions/queue").then(({ skipPatient }) => {
        handleAction(() => skipPatient(calledPatient.id))
      })
    }
    if (!calledPatient || calledPatient.id !== hasAutoSkipped.current) {
      hasAutoSkipped.current = null
    }
  }, [calledPatient, graceRemaining])

  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walkInName.trim()) return
    handleAction(async () => {
      await receptionistAddWalkIn(sessionToken, walkInName)
      setWalkInName("")
    })
  }

  if (!queueData || queueData.status !== "open") {
    return <div className="text-center py-12 text-gray-500 font-medium" dir="rtl">الطابور مغلق حالياً. لا يمكن استقبال مرضى.</div>
  }

  return (
    <div className="grid gap-6 md:grid-cols-3" dir="rtl">
      {/* Left Col - Queue */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Currently Called / Call Controls */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          {calledPatient ? (
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 text-center">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 block">المريض المستدعى حالياً</span>
              <div className="flex flex-col items-center gap-3 mb-2">
                <div className="flex items-center justify-center gap-4">
                  {calledPatient.users?.avatar_url && (
                    <img src={calledPatient.users.avatar_url} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md shrink-0" alt="" />
                  )}
                  <div className="text-4xl font-black tracking-tighter text-blue-700" dir="ltr">#{String(calledPatient.queue_number).padStart(3, '0')}</div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {getPatientName(calledPatient)}
                </h2>
              </div>
              <p className="text-sm text-gray-500 mt-2">يرجى توجيه المريض للدخول لغرفة الطبيب.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2">استدعاء المريض التالي</h3>
              <button onClick={() => handleAction(() => receptionistCallNextPatient(sessionToken))} disabled={isPending || readyEntries.length === 0}
                className="bg-blue-600 text-white rounded-xl py-4 px-6 font-bold text-sm shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-300">
                <FileText className="h-5 w-5" /> استدع التالي من الجاهزين
              </button>
              {readyEntries.length === 0 && notReadyEntries.length > 0 && (
                <button onClick={() => handleAction(() => receptionistCallNextNotReadyPatient(sessionToken))} disabled={isPending}
                  className="bg-amber-100 text-amber-700 rounded-xl py-3 px-6 font-bold text-sm shadow-sm hover:bg-amber-200 transition flex items-center justify-center gap-2 border border-amber-200 mt-2">
                  <AlertTriangle className="h-4 w-4" /> استدع قسراً (غير جاهز)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Walk-in Form */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" /> إضافة مريض بدون حجز (Walk-in)
          </h3>
          <form onSubmit={handleAddWalkIn} className="flex gap-3">
            <input 
              type="text" 
              value={walkInName}
              onChange={(e) => setWalkInName(e.target.value)}
              placeholder="اسم المريض..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button type="submit" disabled={isPending || !walkInName.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              <Plus className="h-4 w-4" /> إضافة
            </button>
          </form>
        </div>

        {/* Ready List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" /> جاهزون للدخول (هنا)
            </h3>
            <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{readyEntries.length}</span>
          </div>
          <div className="space-y-2">
            {readyEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">لا يوجد مرضى جاهزين.</p>
            ) : (
              readyEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      {entry.users?.avatar_url ? (
                        <img src={entry.users.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getPatientName(entry))}&background=e2e8f0&color=475569`} alt="" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-blue-600">#{String(entry.queue_number).padStart(3, '0')}</span>
                      <span className="font-semibold text-gray-900">{getPatientName(entry)}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-600">جاهز</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Not Ready List */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> في الانتظار (لم يصلوا بعد)
            </h3>
            <span className="bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{notReadyEntries.length}</span>
          </div>
          <div className="space-y-2">
            {notReadyEntries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">لا يوجد مرضى في هذه القائمة.</p>
            ) : (
              notReadyEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0 opacity-80">
                      {entry.users?.avatar_url ? (
                        <img src={entry.users.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getPatientName(entry))}&background=e2e8f0&color=475569`} alt="" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400">#{String(entry.queue_number).padStart(3, '0')}</span>
                      <span className="font-semibold text-gray-600">{getPatientName(entry)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleAction(() => receptionistMarkPatientReady(sessionToken, entry.id))} disabled={isPending}
                    className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm transition">
                    تعيين كجاهز
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
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">معلومات الطابور</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">يُخدَم الآن</p>
              <p className="text-2xl font-black text-blue-700" dir="ltr">#{queueData.currentServing ? String(queueData.currentServing).padStart(3, '0') : "---"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">إجمالي المنتظرين</p>
              <p className="text-2xl font-black text-gray-900" dir="ltr">{readyEntries.length + notReadyEntries.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

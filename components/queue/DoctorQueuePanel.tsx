"use client"

import { useQueueRealtime, useGraceCountdown } from "@/hooks/use-queue-realtime"
import {
  callNextPatient, callNextNotReadyPatient, startConsultation, completePatient, skipPatient,
  openQueue, pauseQueue, resumeQueue, closeQueue,
  sendDoctorMessage, clearDoctorMessage, extendGracePeriod
} from "@/actions/queue"
import { regenerateReceptionistSession } from "@/actions/receptionist"
import { getServicesForProvider } from "@/actions/services"
import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Play, CheckCircle, Users, Activity, Clock, LogOut, FileText,
  Coffee, MessageSquare, Send, X, MapPin, Car, Home, Navigation,
  AlertTriangle, Zap, Timer
} from "lucide-react"
import PostConsultationModal from "@/components/services/PostConsultationModal"
import VisitHistoryPanel from "@/components/visit-notes/VisitHistoryPanel"
import type { Service } from "@/types"

interface DoctorQueuePanelProps {
  queueId: string | null
  providerId: string
  doctorName: string
  specialty: string
  todayServed: number
  todayNoShows: number
}

const TRAVEL_ICONS: Record<string, { icon: typeof MapPin; color: string; label: string }> = {
  here:     { icon: MapPin,     color: "text-green-600", label: "هنا ✅" },
  nearby:   { icon: Navigation, color: "text-blue-600",  label: "~10 د" },
  medium:   { icon: Car,        color: "text-orange-500", label: "~20 د" },
  far:      { icon: Car,        color: "text-red-500",    label: "~40 د" },
  very_far: { icon: Home,       color: "text-red-700",    label: "+40 د" },
}

export default function DoctorQueuePanel({ queueId, providerId, doctorName, specialty, todayServed, todayNoShows }: DoctorQueuePanelProps) {
  const { queueData, waitingEntries, currentPatient, refetch } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [breakMinutes, setBreakMinutes] = useState(15)
  const [showBreakPicker, setShowBreakPicker] = useState(false)
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showPostConsult, setShowPostConsult] = useState(false)
  const [providerServices, setProviderServices] = useState<Service[]>([])

  const getPatientName = (entry: any) => {
    if (!entry) return "---"
    if (entry.source === "walk_in") {
      return entry.visit_reason?.replace("Walk-in: ", "") || "مريض"
    }
    return entry.users?.full_name || "مريض"
  }

  const calledPatient = currentPatient?.status === "called" ? currentPatient : null
  const inProgressPatient = currentPatient?.status === "in_progress" ? currentPatient : null
  const activePatient = inProgressPatient || calledPatient

  const graceRemaining = useGraceCountdown(calledPatient?.grace_deadline || null)

  const readyEntries = waitingEntries.filter(e => e.status === "ready")
  const notReadyEntries = waitingEntries.filter(e => e.status === "not_ready")

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action()
      refetch()
    })
  }

  const handleOpenPostConsult = () => {
    // Lazily fetch services when the modal is opened
    getServicesForProvider(providerId).then(setProviderServices)
    setShowPostConsult(true)
  }

  const handleCompleteFromModal = (entryId: string) => {
    handleAction(() => completePatient(entryId))
  }

  // Auto-skip logic
  const hasAutoSkipped = useRef<string | null>(null)
  
  useEffect(() => {
    if (calledPatient && graceRemaining === 0 && hasAutoSkipped.current !== calledPatient.id) {
      hasAutoSkipped.current = calledPatient.id
      handleAction(() => skipPatient(calledPatient.id))
    }
    // Reset ref if patient changes
    if (!calledPatient || calledPatient.id !== hasAutoSkipped.current) {
      hasAutoSkipped.current = null
    }
  }, [calledPatient, graceRemaining])

  // ── No queue state ──
  if (!queueId || !queueData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
        <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">الطابور مغلق</h2>
        <p className="mt-2 max-w-sm text-gray-500">افتح طابور عيادتك لبدء استقبال المرضى وإدارتهم اليوم.</p>
        <button onClick={() => handleAction(openQueue)} disabled={isPending}
          className="mt-8 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50">
          {isPending ? "جار الاتصال..." : "فتح جلسة الطابور"}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full" dir="rtl">
      {/* queue panel */}
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الطابور</h1>
          <p className="text-sm text-gray-500 mt-1">د. {doctorName} • {specialty}</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
          <button onClick={() => handleAction(openQueue)} disabled={queueData.status === "open"}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${queueData.status === "open" ? "bg-green-600 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}>
            {queueData.status === "open" && <span className="h-1.5 w-1.5 rounded-full bg-white" />} مفتوح
          </button>
          {/* Break button with time picker */}
          {queueData.status === "open" ? (
            showBreakPicker ? (
              <div className="flex items-center gap-1">
                <select value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white">
                  <option value={5}>5 د</option><option value={10}>10 د</option>
                  <option value={15}>15 د</option><option value={20}>20 د</option>
                  <option value={30}>30 د</option><option value={45}>45 د</option>
                  <option value={60}>ساعة</option>
                </select>
                <button onClick={() => { handleAction(() => pauseQueue(queueId!, breakMinutes)); setShowBreakPicker(false) }}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition">
                  <Coffee className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setShowBreakPicker(false)} className="text-gray-400 hover:text-gray-600 px-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowBreakPicker(true)}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-50 flex items-center gap-2 transition">
                <Coffee className="h-3.5 w-3.5" /> استراحة
              </button>
            )
          ) : queueData.status === "paused" ? (
            <button onClick={() => handleAction(() => resumeQueue(queueId!))}
              className="px-4 py-1.5 rounded-lg text-sm font-bold bg-yellow-500 text-white shadow flex items-center gap-2 transition hover:bg-yellow-600">
              استئناف
            </button>
          ) : null}
          <button onClick={() => handleAction(() => closeQueue(queueId!))}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${queueData.status === "closed" ? "bg-red-500 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}>
            إغلاق
          </button>
          
          {queueData.status === "open" && (
            <div className="border-l border-gray-200 pl-2 ml-1 hidden md:block">
              <button 
                onClick={() => handleAction(() => regenerateReceptionistSession(queueId!))}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-1 transition whitespace-nowrap"
                title="تجديد رابط الاستقبال"
              >
                <Users className="h-3.5 w-3.5" /> رابط الاستقبال
              </button>
            </div>
          )}
        </div>
      </div>

      {queueData.sessionToken && queueData.status === "open" && (
        <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 overflow-hidden mr-4">
            <span className="text-xs font-bold text-gray-500 shrink-0">رابط الاستقبال:</span>
            <code className="text-xs text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 truncate">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/clinic/session/${queueData.sessionToken}`}
            </code>
          </div>
          <button 
            onClick={() => {
              if (typeof navigator !== 'undefined') {
                navigator.clipboard.writeText(`${window.location.origin}/clinic/session/${queueData.sessionToken}`)
                alert("تم نسخ رابط الاستقبال إلى الحافظة!")
              }
            }}
            className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition shrink-0 shadow-sm"
          >
            نسخ الرابط
          </button>
        </div>
      )}

      {/* Break/Delay alert banner */}
      {queueData.breakUntil && queueData.status === "paused" && (
        <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-700">
              في استراحة — يعود عند الساعة {new Date(queueData.breakUntil).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          </div>
          <button onClick={() => handleAction(() => resumeQueue(queueId!))}
            className="text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-lg hover:bg-orange-200 transition">
            إنهاء الاستراحة مبكراً
          </button>
        </div>
      )}

      {queueData.delayMinutes > 5 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">تأخر ~{queueData.delayMinutes} دقيقة عن الجدول</p>
          </div>
          <button onClick={() => setShowBroadcast(true)}
            className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg hover:bg-amber-200 transition">
            إشعار المرضى
          </button>
        </div>
      )}

      {/* Active broadcast */}
      {queueData.doctorMessage && (
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700"><span className="font-bold">بث حي:</span> {queueData.doctorMessage}</p>
          </div>
          <button onClick={() => handleAction(() => clearDoctorMessage(queueId!))}
            className="text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Broadcast input */}
      {showBroadcast && !queueData.doctorMessage && (
        <div className="mb-4 rounded-xl bg-white border border-gray-200 p-4 flex gap-2">
          <input value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
            placeholder="رسالة لجميع المرضى المنتظرين..." maxLength={300}
            className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button onClick={() => { handleAction(() => sendDoctorMessage(queueId!, broadcastMsg)); setBroadcastMsg(""); setShowBroadcast(false) }}
            disabled={!broadcastMsg.trim()} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Send className="h-3.5 w-3.5" /> إرسال
          </button>
          <button onClick={() => setShowBroadcast(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* ACTIVE PATIENT CARD */}
          <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-50/50 rounded-l-[100px] -z-10" />
            <div className="flex items-center gap-6 flex-1">
              <div className="h-28 w-28 shrink-0 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-4xl font-black tracking-tighter" dir="ltr">#{activePatient ? String(activePatient.queue_number).padStart(3, '0') : "---"}</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">يُخدَم الآن</p>
                <div className="flex items-center gap-3">
                  {activePatient?.users?.avatar_url && (
                    <img src={activePatient.users.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {activePatient ? getPatientName(activePatient) : "في الانتظار"}
                  </h2>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {activePatient?.visit_reason && (
                    <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {activePatient.visit_reason}</span>
                  )}
                  {activePatient && (
                    <span className="flex items-center gap-1.5">
                      {activePatient.is_checked_in ? <><MapPin className="h-3.5 w-3.5 text-green-600" /> At clinic</> :
                       <><Car className="h-3.5 w-3.5 text-orange-500" /> {activePatient.travel_category}</>}
                    </span>
                  )}
                </div>
                {/* Patient message for called patient */}
                {calledPatient?.patient_message && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">{calledPatient.patient_message}</p>
                  </div>
                )}
                {/* Grace countdown for called patient */}
                {calledPatient && graceRemaining !== null && graceRemaining > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Timer className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-mono font-bold text-orange-600">
                      سماح: {Math.floor(graceRemaining / 60)}:{String(graceRemaining % 60).padStart(2, "0")}
                    </span>
                    <button onClick={() => handleAction(() => extendGracePeriod(calledPatient.id, 3))}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 ml-2">+3 min</button>
                    <button onClick={() => handleAction(() => extendGracePeriod(calledPatient.id, 5))}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800">+5 min</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[140px]">
              {activePatient ? (
                inProgressPatient ? (
                  <button onClick={handleOpenPostConsult} disabled={isPending}
                    className="bg-blue-600 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" /> إنهاء الكشف
                  </button>
                ) : (
                  <button onClick={() => handleAction(() => startConsultation(calledPatient!.id))} disabled={isPending}
                    className="bg-yellow-500 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-sm hover:bg-yellow-600 transition flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" /> بدء الكشف
                  </button>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-4 px-2 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 w-full">
                  <Clock className="h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-600">في انتظار استدعاء المريض...</p>
                  <p className="text-xs text-gray-400 mt-1">يقوم موظف الاستقبال باستدعاء المرضى</p>
                </div>
              )}
              {activePatient && (
                <button onClick={() => handleAction(() => skipPatient(activePatient.id))} disabled={isPending}
                  className="bg-white text-gray-700 border border-gray-200 rounded-xl py-2 px-4 font-bold text-sm hover:bg-gray-50 transition">
                  تخطي
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE PATIENT HISTORY (Visible only during consultation) */}
          {activePatient && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
              <VisitHistoryPanel 
                patientId={activePatient.patient_id} 
                providerId={providerId} 
              />
            </div>
          )}

          {/* WAITING LIST */}
          <div className="flex items-center justify-between mt-8 mb-4">
            <h3 className="text-lg font-bold text-gray-900">قائمة الانتظار</h3>
            <div className="flex items-center gap-3">
              {!showBroadcast && !queueData.doctorMessage && (
                <button onClick={() => setShowBroadcast(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" /> بث رسالة
                </button>
              )}
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {waitingEntries.length} منتظر
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">رقم الطابور</th>
                    <th className="px-6 py-4">المريض</th>
                    <th className="px-6 py-4">الموقع</th>
                    <th className="px-6 py-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {waitingEntries.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-gray-400">لا يوجد مرضى في الانتظار.</td></tr>
                  ) : (
                    waitingEntries.map((entry) => {
                      const travel = TRAVEL_ICONS[entry.travel_category] || TRAVEL_ICONS.here
                      const TravelIcon = travel.icon
                      const isReady = entry.status === "ready"
                      return (
                        <tr key={entry.id} className={`transition ${isReady ? "hover:bg-gray-50/50" : "opacity-60 bg-gray-50/30"}`}>
                          <td className="px-6 py-4">
                            <span className={`font-bold ${isReady ? "text-blue-600" : "text-gray-400"}`} dir="ltr">#{String(entry.queue_number).padStart(3, '0')}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0 opacity-80">
                                {entry.users?.avatar_url ? (
                                  <img src={entry.users.avatar_url} className="w-full h-full object-cover" alt="Patient" />
                                ) : (
                                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getPatientName(entry))}&background=e2e8f0&color=475569`} alt="Patient" />
                                )}
                              </div>
                              <div>
                                <span className={`font-semibold ${isReady ? "text-gray-900" : "text-gray-500"}`}>{getPatientName(entry)}</span>
                                {entry.patient_message && (
                                  <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                                    <MessageSquare className="h-2.5 w-2.5" /> {entry.patient_message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {entry.is_checked_in ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                  <MapPin className="h-3 w-3" /> هنا ✅
                                </span>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${travel.color} bg-gray-50 px-2 py-1 rounded-full`}>
                                  <TravelIcon className="h-3 w-3" /> {travel.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isReady ? (
                              <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">جاهز</span>
                            ) : (
                              <span className="inline-flex items-center bg-gray-200 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">غير جاهز</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-100 shadow-sm">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">إحصائيات اليوم</h3>
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Users className="h-5 w-5" /></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">تم خدمتهم</span>
                </div>
                <span className="text-xl font-black text-gray-900" dir="ltr">{todayServed}</span>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><Activity className="h-5 w-5" /></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">متوسط الوقت</span>
                </div>
                <span className="text-xl font-black text-gray-900" dir="ltr">{queueData.avgDuration} <span className="text-xs text-gray-400 font-medium ml-1">د</span></span>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><LogOut className="h-5 w-5" /></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">غيابات</span>
                </div>
                <span className="text-xl font-black text-gray-900" dir="ltr">{String(todayNoShows).padStart(2, '0')}</span>
              </div>
              {queueData.delayMinutes > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Clock className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">تأخر</span>
                  </div>
                  <span className="text-xl font-black text-amber-700" dir="ltr">{queueData.delayMinutes} <span className="text-xs font-medium ml-1">د</span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showPostConsult && inProgressPatient && (
        <PostConsultationModal
          entryId={inProgressPatient.id}
          patientName={inProgressPatient.users?.full_name || "مريض"}
          queueNumber={inProgressPatient.queue_number}
          availableServices={providerServices}
          onClose={() => setShowPostConsult(false)}
          onComplete={handleCompleteFromModal}
        />
      )}
    </div>
  )
}

// Re-export type for the page that passes providerId
export type { DoctorQueuePanelProps }

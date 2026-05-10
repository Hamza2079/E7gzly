"use client"

import { usePatientTicket } from "@/hooks/use-patient-ticket"
import { leaveQueue } from "@/actions/queue"
import { updateTravelStatus, sendPatientMessage, respondToCall, checkInAtClinic, markReady } from "@/actions/patient-queue"
import { submitReview } from "@/actions/review"
import { useState, useTransition } from "react"
import Link from "next/link"
import {
  Clock, Users, Hash, AlertTriangle, CheckCircle, MapPin,
  Coffee, Pause, XCircle, MessageSquare, Send, Navigation,
  Home, Car, Zap, ChevronRight, Star, Stethoscope
} from "lucide-react"

interface QueueTicketProps {
  entryId: string
  queueId: string
  queueNumber: number
  initialStatus: string
  doctorName: string
  specialtyName: string
  providerId?: string
  clinicName?: string
  clinicAddress?: string
}

export default function QueueTicket({
  entryId, queueId, queueNumber, initialStatus,
  doctorName, specialtyName, providerId, clinicName, clinicAddress,
}: QueueTicketProps) {
  const ticket = usePatientTicket(queueId, entryId, queueNumber, initialStatus)
  const [isPending, startTransition] = useTransition()
  const [cancelled, setCancelled] = useState(false)
  const [showMessageInput, setShowMessageInput] = useState(false)
  const [message, setMessage] = useState("")
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const handleCancel = () => {
    startTransition(async () => {
      await leaveQueue(entryId)
      setCancelled(true)
    })
  }

  const handleTravel = (cat: "here" | "nearby" | "medium" | "far") => {
    startTransition(async () => {
      if (cat === "here") {
        await checkInAtClinic(entryId)
      } else {
        await updateTravelStatus(entryId, cat)
      }
    })
  }

  const handleSendMessage = () => {
    if (!message.trim()) return
    startTransition(async () => {
      await sendPatientMessage(entryId, message)
      setMessage("")
      setShowMessageInput(false)
    })
  }

  const handleRespondToCall = (response: "coming" | "need_time") => {
    startTransition(async () => {
      await respondToCall(entryId, response)
    })
  }

  const handleMarkReady = () => {
    startTransition(async () => {
      await markReady(entryId)
    })
  }

  // ── Terminal states ──────────────────────────────────────

  if (cancelled) {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">تم إلغاء الطابور</h2>
        <p className="mt-2 text-sm text-gray-500">لقد غادرت الطابور.</p>
        <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          تصفح الأطباء
        </Link>
      </div>
    )
  }

  if (ticket.entryStatus === "no_show" || ticket.entryStatus === "cancelled") {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {ticket.entryStatus === "no_show" ? "فاتك دورك" : "تم إلغاء الحجز"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          {ticket.entryStatus === "no_show" 
            ? "لم ترد في الوقت المحدد. يمكنك الحجز مجدداً." 
            : "لقد غادرت الطابور بنجاح."}
        </p>
        <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          تصفح الأطباء
        </Link>
      </div>
    )
  }

  if (ticket.entryStatus === "completed") {
    // Already submitted
    if (reviewSubmitted) {
      return (
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">شكراً لك! 🎉</h2>
          <p className="mt-2 text-sm text-gray-500">تم إرسال تقييمك. رأيك يساعد المرضى الآخرين في اختيار الطبيب المناسب.</p>
          <div className="flex justify-center gap-1 mt-3">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-5 w-5 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            ))}
          </div>
          <Link href="/doctors" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition">
            تصفح الأطباء
          </Link>
        </div>
      )
    }

    // Review form
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">تمّت الزيارة ✅</h2>
            <p className="mt-1 text-sm text-gray-500">كيف كانت تجربتك مع {doctorName}؟</p>
          </div>

          {/* Star rating */}
          <div className="flex justify-center gap-2 mb-6">
            {[1,2,3,4,5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                onMouseEnter={() => setReviewHover(star)}
                onMouseLeave={() => setReviewHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star className={`h-10 w-10 transition-colors ${
                  star <= (reviewHover || reviewRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-200 hover:text-yellow-300"
                }`} />
              </button>
            ))}
          </div>

          {/* Rating label */}
          {reviewRating > 0 && (
            <p className="text-center text-sm font-medium text-gray-600 mb-4">
              {reviewRating === 1 ? "ضعيف" : reviewRating === 2 ? "مقبول" : reviewRating === 3 ? "جيد" : reviewRating === 4 ? "جيد جداً" : "ممتاز! 🌟"}
            </p>
          )}

          {/* Comment */}
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="شاركنا تجربتك (اختياري)..."
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />

          {reviewError && (
            <p className="mt-2 text-sm text-red-600">{reviewError}</p>
          )}

          {/* Submit */}
          <button
            onClick={() => {
              if (reviewRating === 0) { setReviewError("يرجى اختيار تقييم"); return }
              if (!providerId) { setReviewError("معلومات الطبيب غير متوفرة"); return }
              startTransition(async () => {
                setReviewError(null)
                const result = await submitReview(entryId, providerId, reviewRating, reviewComment)
                if (result.error) { setReviewError(result.error) }
                else { setReviewSubmitted(true) }
              })
            }}
            disabled={isPending || reviewRating === 0}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "جاري الإرسال..." : "إرسال التقييم"}
          </button>

          {/* Skip */}
          <Link href="/doctors" className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600 transition">
            تخطّي الآن
          </Link>
        </div>
      </div>
    )
  }

  // ── Active ticket ────────────────────────────────────────

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* ── DOCTOR STATUS BANNER ── */}
      <DoctorStatusBanner
        status={ticket.doctorStatus}
        breakReturnsAt={ticket.breakReturnsAt}
        breakRemainingSeconds={ticket.breakRemainingSeconds}
        delayMinutes={ticket.delayMinutes}
        doctorMessage={ticket.doctorMessage}
      />

      {/* ── MAIN TICKET CARD ── */}
      <div className="ticket-card">
        {/* Top Part: Clinic Info */}
        <div className={`px-8 py-6 text-white rounded-t-[2.5rem] ${
          ticket.entryStatus === "called" ? "bg-gradient-to-br from-green-600 to-emerald-600" :
          ticket.entryStatus === "in_progress" ? "bg-gradient-to-br from-blue-600 to-indigo-600" :
          ticket.isNextInLine ? "bg-gradient-to-br from-amber-500 to-orange-500" :
          "bg-gradient-to-br from-blue-600 to-indigo-700"
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
              <span className={`h-2 w-2 rounded-full ${ticket.isConnected ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
              <span className="text-[10px] font-black text-white">
                {ticket.isConnected ? "تحديث مباشر" : "جاري الاتصال"}
              </span>
            </div>
            <div className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-2xl font-black">{doctorName}</h3>
            <p className="text-sm font-bold text-white/80">{specialtyName}</p>
            <div className="flex items-center gap-1.5 text-xs text-white/60 pt-1">
              <MapPin className="h-3 w-3" />
              <span>{clinicName}</span>
            </div>
          </div>
        </div>

        {/* The Perforation */}
        <div className="ticket-cutout" />

        {/* Bottom Part: Queue Info */}
        <div className="px-8 pb-8 pt-2">
          <div className="text-center mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">رقمك في الطابور</p>
            <div className="relative inline-block">
               <span className="text-7xl font-black text-gray-900 tracking-tighter">
                {String(queueNumber).padStart(2, "0")}
               </span>
               <div className="absolute -right-4 top-0 h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <Hash className="h-2 w-2 text-blue-600" />
               </div>
            </div>
          </div>

          {/* Status Specific UI */}
          <div className="space-y-4">
            {/* ── IN PROGRESS STATE ── */}
            {ticket.entryStatus === "in_progress" && (
              <div className="rounded-2xl bg-blue-50 border-2 border-blue-100 p-4 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center mb-3 shadow-lg shadow-blue-600/20">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <p className="text-lg font-black text-blue-800">أنت الآن مع الطبيب</p>
                <p className="text-xs text-blue-500 mt-1 font-bold">يرجى اتباع تعليمات الطاقم الطبي</p>
              </div>
            )}

            {/* ── CALLED STATE ── */}
            {ticket.entryStatus === "called" && (
              <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-100 p-6 text-center animate-pulse">
                <p className="text-2xl font-black text-emerald-800 mb-2">تفضل بالدخول ✨</p>
                <div className="flex items-center justify-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <p className="text-sm text-emerald-600 font-bold">الطبيب بانتظارك الآن</p>
                </div>
              </div>
            )}

            {/* ── NOT READY / READY STATS ── */}
            {(ticket.entryStatus === "not_ready" || ticket.entryStatus === "ready") && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">وقت الانتظار</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-xl font-black text-gray-900">
                        ~{ticket.estimatedWaitMinutes} <span className="text-[10px]">د</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">المريض الحالي</p>
                    <div className="flex items-center justify-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      <p className="text-xl font-black text-gray-900">#{ticket.currentServing || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Patient Count Progress */}
                <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-50">
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-xs font-bold text-gray-600">
                       {ticket.patientsBeforeYou === 0 ? "أنت التالي في القائمة" : `يوجد ${ticket.patientsBeforeYou} مرضى قبلك`}
                    </p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                       {Math.round(((ticket.currentServing ?? 1) / queueNumber) * 100) || 0}%
                    </p>
                  </div>
                  <div className="h-2.5 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      style={{ width: `${Math.min(100, (((ticket.currentServing ?? 1) / queueNumber) * 100)) || 5}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── NOT READY ACTION ── */}
            {ticket.entryStatus === "not_ready" && (
              <button
                onClick={handleMarkReady}
                disabled={isPending}
                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4" />
                </div>
                لقد وصلت للعيادة / أنا جاهز
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TRAVEL STATUS UPDATER ── */}
      {(ticket.entryStatus === "ready" || ticket.entryStatus === "called") && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📍 أين أنت الآن؟</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleTravel("here")}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-3 text-center hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
            >
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="text-[10px] font-bold text-gray-700">هنا</span>
            </button>
            <button
              onClick={() => handleTravel("nearby")}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-3 text-center hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
            >
              <Navigation className="h-5 w-5 text-blue-600" />
              <span className="text-[10px] font-bold text-gray-700">~10 min</span>
            </button>
            <button
              onClick={() => handleTravel("medium")}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-3 text-center hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
            >
              <Car className="h-5 w-5 text-orange-500" />
              <span className="text-[10px] font-bold text-gray-700">~20 min</span>
            </button>
            <button
              onClick={() => handleTravel("far")}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-3 text-center hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
            >
              <Home className="h-5 w-5 text-red-500" />
              <span className="text-[10px] font-bold text-gray-700">30+ min</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MESSAGE TO CLINIC ── */}
      {(ticket.entryStatus === "ready" || ticket.entryStatus === "called") && (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          {showMessageInput ? (
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">💬 رسالة للعيادة</p>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="مثال: سأتأخر 5 دقائق..."
                maxLength={200}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowMessageInput(false); setMessage("") }}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isPending || !message.trim()}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" /> إرسال
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMessageInput(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="h-4 w-4 text-blue-600" /> راسل العيادة
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      )}

      {/* ── CLINIC LOCATION ── */}
      {clinicAddress && (
        <div className="rounded-2xl bg-gray-50 p-4 flex items-center gap-3 border border-gray-100">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{clinicName || doctorName}</p>
            <p className="text-xs text-gray-500">{clinicAddress}</p>
          </div>
        </div>
      )}

      {/* ── CANCEL BUTTON ── */}
      {(ticket.entryStatus === "waiting" || ticket.entryStatus === "called") && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "جاري الإلغاء..." : "مغادرة الطابور"}
        </button>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Doctor Status Banner — shows what the doctor is doing RIGHT NOW
// ══════════════════════════════════════════════════════════════

function DoctorStatusBanner({
  status, breakReturnsAt, breakRemainingSeconds, delayMinutes, doctorMessage,
}: {
  status: string
  breakReturnsAt: string | null
  breakRemainingSeconds: number | null
  delayMinutes: number
  doctorMessage: string | null
}) {
  // Always show doctor broadcast message if exists
  const showBroadcast = !!doctorMessage

  return (
    <div className="space-y-2">
      {/* Dynamic status banner */}
      {status === "active" && delayMinutes <= 5 && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          <p className="text-sm font-medium text-green-700">الطبيب نشط ويستقبل المرضى الآن</p>
        </div>
      )}

      {status === "active" && delayMinutes > 5 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">
              الطبيب متأخر ~{delayMinutes} دقيقة عن الجدول
            </p>
            <p className="text-xs text-amber-600 mt-0.5">تم تحديث وقت انتظارك تلقائياً</p>
          </div>
        </div>
      )}

      {status === "on_break" && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Coffee className="h-4 w-4 text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                الطبيب في استراحة{breakReturnsAt ? ` — يعود عند ${breakReturnsAt}` : ""}
              </p>
              {breakRemainingSeconds && breakRemainingSeconds > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">
                  يعود خلال {Math.ceil(breakRemainingSeconds / 60)} دقيقة · مكانك محفوظ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {status === "paused" && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 flex items-center gap-3">
          <Pause className="h-4 w-4 text-yellow-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-700">الطابور متوقف مؤقتاً</p>
            <p className="text-xs text-yellow-600 mt-0.5">مكانك محفوظ، سنُعلمك عند استئناف الطابور.</p>
          </div>
        </div>
      )}

      {status === "closed" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">الطابور مغلق أمام المرضى الجدد</p>
            <p className="text-xs text-red-500 mt-0.5">المرضى الحاليون سيُستقبلون حتى النهاية</p>
          </div>
        </div>
      )}

      {/* Doctor broadcast message */}
      {showBroadcast && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
          <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">رسالة من الطبيب</p>
            <p className="text-sm font-medium text-blue-700 mt-0.5">{doctorMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

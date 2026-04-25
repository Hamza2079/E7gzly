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
  Home, Car, Zap, ChevronRight, Star
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
        <h2 className="text-xl font-bold text-gray-900">Queue Cancelled</h2>
        <p className="mt-2 text-sm text-gray-500">You have left the queue.</p>
        <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          Browse doctors
        </Link>
      </div>
    )
  }

  if (ticket.entryStatus === "no_show" || ticket.entryStatus === "cancelled") {
    return (
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {ticket.entryStatus === "no_show" ? "Marked No-show" : "Queue Cancelled"}
        </h2>
        <p className="mt-2 text-sm text-gray-500">This ticket is no longer active.</p>
        <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
          Browse doctors
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
          <h2 className="text-xl font-bold text-gray-900">Thank you!</h2>
          <p className="mt-2 text-sm text-gray-500">Your review has been submitted. It helps other patients find great doctors.</p>
          <div className="flex justify-center gap-1 mt-3">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-5 w-5 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            ))}
          </div>
          <Link href="/doctors" className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition">
            Browse Doctors
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
            <h2 className="text-xl font-bold text-gray-900">Visit Completed!</h2>
            <p className="mt-1 text-sm text-gray-500">How was your experience with {doctorName}?</p>
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
              {reviewRating === 1 ? "Poor" : reviewRating === 2 ? "Fair" : reviewRating === 3 ? "Good" : reviewRating === 4 ? "Very Good" : "Excellent!"}
            </p>
          )}

          {/* Comment */}
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your experience (optional)..."
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
              if (reviewRating === 0) { setReviewError("Please select a rating"); return }
              if (!providerId) { setReviewError("Missing provider info"); return }
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
            {isPending ? "Submitting..." : "Submit Review"}
          </button>

          {/* Skip */}
          <Link href="/doctors" className="mt-3 block text-center text-sm text-gray-400 hover:text-gray-600 transition">
            Skip for now
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
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        {/* Header */}
        <div className={`px-6 py-4 text-white ${
          ticket.entryStatus === "called" ? "bg-gradient-to-r from-green-600 to-emerald-600" :
          ticket.entryStatus === "in_progress" ? "bg-gradient-to-r from-blue-600 to-indigo-600" :
          ticket.isNextInLine ? "bg-gradient-to-r from-amber-500 to-orange-500" :
          "bg-gradient-to-r from-blue-600 to-blue-700"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{doctorName} · {specialtyName}</p>
              <p className="text-xs text-white/60 mt-0.5">
                {clinicName || "Clinic"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className={`h-1.5 w-1.5 rounded-full ${ticket.isConnected ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
              <span className="text-[10px] font-bold text-white/90">
                {ticket.isConnected ? "LIVE" : "CONNECTING"}
              </span>
            </div>
          </div>
        </div>

        {/* Queue Number */}
        <div className="px-6 py-6 text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Queue Number</p>
          <p className="mt-1 text-6xl font-black text-gray-900">
            #{String(queueNumber).padStart(3, "0")}
          </p>

          {/* ── CALLED STATE ── */}
          {ticket.entryStatus === "called" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-green-50 border border-green-200 p-4">
                <p className="text-lg font-bold text-green-700">🔔 It&apos;s your turn!</p>
                {ticket.graceRemainingSeconds !== null && ticket.graceRemainingSeconds > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      Please arrive within{" "}
                      <span className="font-mono font-bold text-green-800">
                        {Math.floor(ticket.graceRemainingSeconds / 60)}:{String(ticket.graceRemainingSeconds % 60).padStart(2, "0")}
                      </span>
                    </p>
                    {/* Grace progress bar */}
                    <div className="mt-2 h-2 w-full rounded-full bg-green-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${Math.min(100, (ticket.graceRemainingSeconds / 180) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Response buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondToCall("coming")}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Navigation className="h-4 w-4" /> I&apos;m heading in
                </button>
                <button
                  onClick={() => handleRespondToCall("need_time")}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-orange-200 bg-orange-50 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100 transition disabled:opacity-50"
                >
                  Need more time
                </button>
              </div>
            </div>
          )}

          {/* ── IN PROGRESS STATE ── */}
          {ticket.entryStatus === "in_progress" && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <CheckCircle className="mx-auto h-8 w-8 text-blue-600" />
              <p className="mt-2 text-lg font-bold text-blue-700">Consultation in progress</p>
              <p className="text-sm text-blue-500 mt-1">You are currently with the doctor</p>
            </div>
          )}

          {/* ── GET READY ALERT ── */}
          {ticket.entryStatus === "ready" && ticket.isNextInLine && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 animate-pulse">
              <p className="text-lg font-bold text-amber-700">⚡ Get ready!</p>
              <p className="text-sm text-amber-600">You&apos;re next in line. Make sure you&apos;re at the clinic.</p>
            </div>
          )}

          {/* ── NOT READY STATE ── */}
          {ticket.entryStatus === "not_ready" && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-base font-bold text-gray-700 text-center">You are not in the active queue yet.</p>
                <p className="text-sm text-gray-500 text-center mt-1">Please mark yourself as ready when you arrive or are nearby.</p>
              </div>
              <button
                onClick={handleMarkReady}
                disabled={isPending}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin className="h-4 w-4" /> I&apos;m Here / I&apos;m Ready
              </button>
            </div>
          )}
        </div>

        {/* ── WAITING STATS ── */}
        {ticket.entryStatus === "ready" && (
          <>
            <div className="grid grid-cols-3 gap-px border-t bg-gray-100">
              <div className="bg-white px-4 py-4 text-center">
                <Users className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900">{ticket.position}</p>
                <p className="text-[10px] text-gray-500 font-medium">Position</p>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <Clock className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {ticket.estimatedCallTime || `~${ticket.estimatedWaitMinutes}m`}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {ticket.estimatedCallTime ? "Est. Time" : "Est. Wait"}
                </p>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <Hash className="mx-auto h-4 w-4 text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  #{ticket.currentServing || "—"}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Now Serving</p>
              </div>
            </div>

            {/* Progress bar */}
            {ticket.currentServing && (
              <div className="px-6 py-3">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-700"
                    style={{ width: `${Math.min(100, ((ticket.currentServing / queueNumber) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── TRAVEL STATUS UPDATER ── */}
      {(ticket.entryStatus === "ready" || ticket.entryStatus === "called") && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">📍 Where are you?</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleTravel("here")}
              disabled={isPending}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 p-3 text-center hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
            >
              <MapPin className="h-5 w-5 text-green-600" />
              <span className="text-[10px] font-bold text-gray-700">Here</span>
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">💬 Message to clinic</p>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Running 5 min late..."
                maxLength={200}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowMessageInput(false); setMessage("") }}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={isPending || !message.trim()}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMessageInput(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <MessageSquare className="h-4 w-4 text-blue-600" /> Message the Clinic
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
          {isPending ? "Cancelling..." : "Leave Queue"}
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
          <p className="text-sm font-medium text-green-700">Doctor is active and seeing patients</p>
        </div>
      )}

      {status === "active" && delayMinutes > 5 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">
              Doctor is running ~{delayMinutes} min behind schedule
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Your wait time has been adjusted</p>
          </div>
        </div>
      )}

      {status === "on_break" && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Coffee className="h-4 w-4 text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700">
                Doctor is on break{breakReturnsAt ? ` — returns at ${breakReturnsAt}` : ""}
              </p>
              {breakRemainingSeconds && breakRemainingSeconds > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">
                  Back in {Math.ceil(breakRemainingSeconds / 60)} min · Your position is saved
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
            <p className="text-sm font-medium text-yellow-700">Queue is temporarily paused</p>
            <p className="text-xs text-yellow-600 mt-0.5">Your position is saved. We&apos;ll notify you when it resumes.</p>
          </div>
        </div>
      )}

      {status === "closed" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Queue is closed to new patients</p>
            <p className="text-xs text-red-500 mt-0.5">Existing patients will still be served</p>
          </div>
        </div>
      )}

      {/* Doctor broadcast message */}
      {showBroadcast && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
          <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">From the Doctor</p>
            <p className="text-sm font-medium text-blue-700 mt-0.5">{doctorMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

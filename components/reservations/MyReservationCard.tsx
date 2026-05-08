"use client"

import { useState, useTransition } from "react"
import { cancelReservation } from "@/actions/reservations"
import type { Reservation } from "@/types"
import { CalendarDays, Clock, Hash, XCircle, Loader2, AlertTriangle } from "lucide-react"

interface MyReservationCardProps {
  reservation: Reservation
  doctorName: string
  specialty?: string
}

const DAY_NAMES_AR: Record<number, string> = {
  0: "الأحد", 1: "الاثنين", 2: "الثلاثاء", 3: "الأربعاء",
  4: "الخميس", 5: "الجمعة", 6: "السبت",
}

const MONTH_NAMES_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
]

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  pending:   { label: "قيد الانتظار",  class: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "مؤكد",          class: "bg-green-100 text-green-700"  },
  converted: { label: "في الطابور",    class: "bg-blue-100 text-blue-700"    },
  cancelled: { label: "ملغى",          class: "bg-red-100 text-red-600"      },
  no_show:   { label: "لم يحضر",       class: "bg-gray-200 text-gray-500"    },
}

function formatArabicDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return `${DAY_NAMES_AR[d.getDay()]}، ${d.getDate()} ${MONTH_NAMES_AR[d.getMonth()]} ${d.getFullYear()}`
}

export default function MyReservationCard({ reservation, doctorName, specialty }: MyReservationCardProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const [isPending, startTransition] = useTransition()

  const statusConfig = STATUS_LABELS[reservation.status] || STATUS_LABELS.pending
  const canCancel = ["pending", "confirmed"].includes(reservation.status) && !cancelled

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelReservation(reservation.id)
      if (res.error) {
        setCancelError(res.error)
      } else {
        setCancelled(true)
        setShowCancelConfirm(false)
      }
    })
  }

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center opacity-70">
        <p className="text-sm font-semibold text-gray-500">تم إلغاء الحجز</p>
      </div>
    )
  }

  return (
    <>
      <div dir="rtl" className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${reservation.status === "converted" ? "bg-blue-600" : "bg-blue-400"}`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{specialty || "طبيب"}</p>
              <h3 className="font-bold text-gray-900">{doctorName}</h3>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${statusConfig.class}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Date & number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CalendarDays className="h-4 w-4 text-blue-500 shrink-0" />
              <span>{formatArabicDate(reservation.reservedDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Hash className="h-4 w-4 text-blue-500 shrink-0" />
              <span>رقم الحجز: <strong className="text-blue-700">#{reservation.reservationNumber}</strong></span>
            </div>
            {reservation.visitReason && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{reservation.visitReason}</span>
              </div>
            )}
          </div>

          {/* Converted state info */}
          {reservation.status === "converted" && (
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700 leading-relaxed">
              تم تحويل حجزك إلى قائمة الانتظار. اضغط "أنا هنا" في شاشة الطابور عند وصولك.
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition"
            >
              <XCircle className="h-4 w-4" />
              إلغاء الحجز
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirm modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">إلغاء الحجز</h3>
                <p className="text-sm text-gray-500 mt-0.5">هذه العملية لا يمكن التراجع عنها</p>
              </div>
            </div>

            {cancelError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {cancelError}
              </div>
            )}

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              هل أنت متأكد من إلغاء حجزك ليوم{" "}
              <strong>{formatArabicDate(reservation.reservedDate)}</strong>؟
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelError(null) }}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                رجوع
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? "جاري الإلغاء..." : "نعم، إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

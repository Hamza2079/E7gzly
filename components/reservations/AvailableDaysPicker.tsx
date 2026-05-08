"use client"

import { useState, useTransition } from "react"
import { createReservation } from "@/actions/reservations"
import type { DayAvailability } from "@/types"
import { CalendarDays, ChevronLeft, ChevronRight, Users, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface AvailableDaysPickerProps {
  providerId: string
  availableDays: DayAvailability[]
}

const DAY_NAMES_AR: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
}

const MONTH_NAMES_AR = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
]

function CrowdBar({ level }: { level: DayAvailability["crowdLevel"] }) {
  const config = {
    low:      { color: "bg-emerald-400", width: "25%",  label: "هادئ" },
    moderate: { color: "bg-yellow-400",  width: "55%",  label: "متوسط" },
    high:     { color: "bg-orange-400",  width: "80%",  label: "مزدحم" },
    full:     { color: "bg-red-400",     width: "100%", label: "ممتلئ" },
  }
  const c = config[level]
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c.color}`} style={{ width: c.width }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400 shrink-0">{c.label}</span>
    </div>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return `${d.getDate()} ${MONTH_NAMES_AR[d.getMonth()]}`
}

export default function AvailableDaysPicker({ providerId, availableDays }: AvailableDaysPickerProps) {
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null)
  const [visitReason, setVisitReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; reservationNumber?: number } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [page, setPage] = useState(0)

  const PAGE_SIZE = 5
  const totalPages = Math.ceil(availableDays.length / PAGE_SIZE)
  const pageDays = availableDays.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSelect = (day: DayAvailability) => {
    if (day.isFull || day.myReservation) return
    setSelectedDay(day)
    setResult(null)
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    if (!selectedDay) return
    startTransition(async () => {
      const res = await createReservation(providerId, selectedDay.date, visitReason || undefined)
      setResult(res)
      if (!res.error) {
        setShowConfirm(false)
        setSelectedDay(null)
        setVisitReason("")
      }
    })
  }

  if (availableDays.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
        <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500">لا توجد أيام متاحة للحجز حالياً</p>
      </div>
    )
  }

  return (
    <div dir="rtl">
      {/* Success banner */}
      {result?.success && (
        <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">تم تأكيد حجزك ✓</p>
            <p className="text-xs text-emerald-600 mt-0.5">رقم حجزك: #{result.reservationNumber}</p>
          </div>
        </div>
      )}

      {/* Days grid */}
      <div className="space-y-2">
        {pageDays.map((day) => {
          const isSelected = selectedDay?.date === day.date
          const hasMyRes = !!day.myReservation

          return (
            <button
              key={day.date}
              onClick={() => handleSelect(day)}
              disabled={day.isFull && !hasMyRes}
              className={`w-full text-right rounded-2xl border p-4 transition-all cursor-pointer
                ${hasMyRes ? "border-blue-300 bg-blue-50 cursor-default" :
                  day.isFull ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed" :
                  isSelected ? "border-blue-500 bg-blue-50 shadow-sm" :
                  "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40 shadow-sm"
                }
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{DAY_NAMES_AR[day.dayOfWeek]}</span>
                    <span className="text-sm text-gray-500">{formatDate(day.date)}</span>
                    {hasMyRes && (
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        حجزك #{day.myReservation!.reservationNumber}
                      </span>
                    )}
                    {day.isFull && !hasMyRes && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">ممتلئ</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {day.scheduleStart} – {day.scheduleEnd}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {day.reservationCount} / {day.maxReservations}
                    </span>
                  </div>
                  <CrowdBar level={day.crowdLevel} />
                </div>
                {!day.isFull && !hasMyRes && (
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition
                    ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                    <CalendarDays className="h-4 w-4" />
                  </div>
                )}
                {hasMyRes && (
                  <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-blue-600 transition"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>
          <span className="text-xs text-gray-400">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-blue-600 transition"
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Confirm dialog (inline) */}
      {showConfirm && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">تأكيد الحجز</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {DAY_NAMES_AR[selectedDay.dayOfWeek]} — {formatDate(selectedDay.date)}
                </p>
              </div>
              <button onClick={() => setShowConfirm(false)} className="text-gray-400 hover:text-gray-600 mt-1">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Error */}
            {result?.error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {result.error}
              </div>
            )}

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                سبب الزيارة (اختياري)
              </label>
              <textarea
                value={visitReason}
                onChange={e => setVisitReason(e.target.value)}
                placeholder="مثال: كشف، متابعة، نتائج..."
                maxLength={200}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 mb-5 text-sm text-blue-700">
              <p className="font-semibold mb-1">ملاحظة مهمة</p>
              <p className="text-xs leading-relaxed text-blue-600">
                حجزك محفوظ. يوم الكشف، ستحتاج للضغط على "أنا هنا" عند وصولك للعيادة.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? "جاري الحجز..." : "تأكيد الحجز"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

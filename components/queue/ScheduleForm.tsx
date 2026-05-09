// @ts-nocheck — Remove after regenerating types
"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { upsertSchedule } from "@/actions/queue"
import { Save, Clock, CalendarDays } from "lucide-react"

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
  max_active: number
  queue_window: number
  grace_period: number
  is_active: boolean
  max_reservations: number
  advance_days: number
}

export default function ScheduleForm({ providerId }: { providerId: string }) {
  const [schedules, setSchedules] = useState<Record<number, Schedule>>({})
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<number | null>(null)
  // Global advance days state — single value for all days
  const [globalAdvanceDays, setGlobalAdvanceDays] = useState(7)
  const [savingAdvance, setSavingAdvance] = useState(false)
  const [advanceSaved, setAdvanceSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [scheduleRes, limitsRes] = await Promise.all([
        supabase.from("doctor_schedules").select("*").eq("provider_id", providerId),
        supabase.from("queue_day_limits").select("*").eq("provider_id", providerId)
      ])

      const data = scheduleRes.data
      const limitsData = limitsRes.data || []

      // Pick max advance_days from the limits row to ensure consistency
      if (limitsData.length > 0) {
        const maxAdvance = Math.max(...limitsData.map(l => l.advance_days ?? 7))
        setGlobalAdvanceDays(maxAdvance)
      }

      if (data) {
        const map: Record<number, Schedule> = {}
        data.forEach((s) => {
          const limit = limitsData.find(l => l.day_of_week === s.day_of_week)
          map[s.day_of_week] = {
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            break_start: s.break_start,
            break_end: s.break_end,
            max_active: s.max_active,
            queue_window: s.queue_window,
            grace_period: s.grace_period,
            is_active: s.is_active,
            max_reservations: limit?.max_reservations ?? 20,
            advance_days: globalAdvanceDays,
          }
        })
        setSchedules(map)
      }
    }
    load()
  }, [providerId])

  const getSchedule = (day: number): Schedule => {
    return schedules[day] || {
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      break_start: null,
      break_end: null,
      max_active: 33,
      queue_window: 10,
      grace_period: 3,
      is_active: false,
      max_reservations: 20,
      advance_days: globalAdvanceDays,
    }
  }

  const handleSave = (day: number) => {
    const s = getSchedule(day)
    const fd = new FormData()
    fd.set("dayOfWeek", String(day))
    fd.set("startTime", s.start_time)
    fd.set("endTime", s.end_time)
    fd.set("breakStart", s.break_start || "")
    fd.set("breakEnd", s.break_end || "")
    fd.set("maxActive", String(s.max_active))
    fd.set("queueWindow", String(s.queue_window))
    fd.set("gracePeriod", String(s.grace_period))
    fd.set("isActive", String(s.is_active))
    fd.set("maxReservations", String(s.max_reservations))
    fd.set("advanceDays", String(globalAdvanceDays)) // always use global value

    startTransition(async () => {
      await upsertSchedule(fd)
      setSaved(day)
      setTimeout(() => setSaved(null), 2000)
    })
  }

  // Save the global advance_days to ALL 7 days at once consistently
  const handleSaveAdvanceDays = async () => {
    setSavingAdvance(true)
    for (let day = 0; day < 7; day++) {
      const s = getSchedule(day)
      const fd = new FormData()
      fd.set("dayOfWeek", String(day))
      fd.set("startTime", s.start_time)
      fd.set("endTime", s.end_time)
      fd.set("breakStart", s.break_start || "")
      fd.set("breakEnd", s.break_end || "")
      fd.set("maxActive", String(s.max_active))
      fd.set("queueWindow", String(s.queue_window))
      fd.set("gracePeriod", String(s.grace_period))
      fd.set("isActive", String(s.is_active))
      fd.set("maxReservations", String(s.max_reservations))
      fd.set("advanceDays", String(globalAdvanceDays))
      await upsertSchedule(fd)
    }
    setSavingAdvance(false)
    setAdvanceSaved(true)
    setTimeout(() => setAdvanceSaved(false), 2000)
  }

  const updateDay = (day: number, updates: Partial<Schedule>) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: { ...getSchedule(day), ...updates },
    }))
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Global: Advance Booking Days ── */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">أيام الحجز المسبق</p>
              <p className="text-xs text-gray-500 mt-0.5">
                كم يوماً مستقبلياً يُسمح للمريض بالحجز فيه — يُطبَّق على جميع أيام العمل
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={globalAdvanceDays}
                onChange={(e) => setGlobalAdvanceDays(parseInt(e.target.value) || 1)}
                className="w-20 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                min={1}
                max={90}
              />
              <span className="text-sm text-gray-500">يوم</span>
            </div>
            <button
              onClick={handleSaveAdvanceDays}
              disabled={savingAdvance}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {advanceSaved ? "✓ تم الحفظ" : <><Save className="h-3.5 w-3.5" /> حفظ</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Per-day schedules ── */}
      <div className="space-y-4">
        {DAYS.map((dayName, dayIndex) => {
          const s = getSchedule(dayIndex)
          return (
            <div
              key={dayIndex}
              className={`rounded-xl border p-5 transition-colors ${
                s.is_active ? "border-blue-200 bg-white" : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.is_active}
                      onChange={(e) => updateDay(dayIndex, { is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className={`font-semibold ${s.is_active ? "text-gray-900" : "text-gray-400"}`}>
                      {dayName}
                    </span>
                  </label>
                </div>
                <button
                  onClick={() => handleSave(dayIndex)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saved === dayIndex ? "✓ تم الحفظ" : <><Save className="h-3.5 w-3.5" /> حفظ</>}
                </button>
              </div>

              {s.is_active && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">وقت البداية</label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateDay(dayIndex, { start_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">وقت الانتهاء</label>
                    <input
                      type="time"
                      value={s.end_time}
                      onChange={(e) => updateDay(dayIndex, { end_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">بداية الاستراحة</label>
                    <input
                      type="time"
                      value={s.break_start || ""}
                      onChange={(e) => updateDay(dayIndex, { break_start: e.target.value || null })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">نهاية الاستراحة</label>
                    <input
                      type="time"
                      value={s.break_end || ""}
                      onChange={(e) => updateDay(dayIndex, { break_end: e.target.value || null })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">الحد الأقصى للمرضى النشطين</label>
                    <input
                      type="number"
                      value={s.max_active}
                      onChange={(e) => updateDay(dayIndex, { max_active: parseInt(e.target.value) || 33 })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      min={1}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">نافذة الطابور (دقيقة)</label>
                    <input
                      type="number"
                      value={s.queue_window}
                      onChange={(e) => updateDay(dayIndex, { queue_window: parseInt(e.target.value) || 10 })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      min={1}
                      max={50}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">فترة السماح (دقيقة)</label>
                    <input
                      type="number"
                      value={s.grace_period}
                      onChange={(e) => updateDay(dayIndex, { grace_period: parseInt(e.target.value) || 3 })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      min={1}
                      max={15}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">الحد الأقصى للحجوزات المستقبلية</label>
                    <input
                      type="number"
                      value={s.max_reservations}
                      onChange={(e) => updateDay(dayIndex, { max_reservations: parseInt(e.target.value) || 20 })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

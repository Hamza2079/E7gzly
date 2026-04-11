// @ts-nocheck — Remove after regenerating types
"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { upsertSchedule } from "@/actions/queue"
import { Save, Clock } from "lucide-react"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

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
}

export default function ScheduleForm({ providerId }: { providerId: string }) {
  const [schedules, setSchedules] = useState<Record<number, Schedule>>({})
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("doctor_schedules")
        .select("*")
        .eq("provider_id", providerId)

      if (data) {
        const map: Record<number, Schedule> = {}
        data.forEach((s) => {
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

    startTransition(async () => {
      await upsertSchedule(fd)
      setSaved(day)
      setTimeout(() => setSaved(null), 2000)
    })
  }

  const updateDay = (day: number, updates: Partial<Schedule>) => {
    setSchedules((prev) => ({
      ...prev,
      [day]: { ...getSchedule(day), ...updates },
    }))
  }

  return (
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
                {saved === dayIndex ? "✓ Saved" : <><Save className="h-3.5 w-3.5" /> Save</>}
              </button>
            </div>

            {s.is_active && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Start Time</label>
                  <input
                    type="time"
                    value={s.start_time}
                    onChange={(e) => updateDay(dayIndex, { start_time: e.target.value })}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">End Time</label>
                  <input
                    type="time"
                    value={s.end_time}
                    onChange={(e) => updateDay(dayIndex, { end_time: e.target.value })}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Break Start</label>
                  <input
                    type="time"
                    value={s.break_start || ""}
                    onChange={(e) => updateDay(dayIndex, { break_start: e.target.value || null })}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Break End</label>
                  <input
                    type="time"
                    value={s.break_end || ""}
                    onChange={(e) => updateDay(dayIndex, { break_end: e.target.value || null })}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Max Active Patients</label>
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
                  <label className="block text-xs font-medium text-gray-500">Queue Window</label>
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
                  <label className="block text-xs font-medium text-gray-500">Grace Period (min)</label>
                  <input
                    type="number"
                    value={s.grace_period}
                    onChange={(e) => updateDay(dayIndex, { grace_period: parseInt(e.target.value) || 3 })}
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    min={1}
                    max={15}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

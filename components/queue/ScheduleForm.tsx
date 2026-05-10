// @ts-nocheck — Remove after regenerating types
"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { upsertSchedule } from "@/actions/queue"
import { Save, CalendarDays, HelpCircle } from "lucide-react"

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

/** Click the icon for a readable explanation (works on phones; backdrop tap closes). */
function FieldHint({
  hintKey,
  text,
  activeKey,
  setActiveKey,
}: {
  hintKey: string
  text: string
  activeKey: string | null
  setActiveKey: (k: string | null) => void
}) {
  const open = activeKey === hintKey
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        className={`rounded-full p-0.5 transition-colors ${open ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-blue-600"}`}
        aria-label={text}
        aria-expanded={open}
        aria-controls={open ? `${hintKey}-tip` : undefined}
        id={`${hintKey}-trigger`}
        onClick={() => setActiveKey(open ? null : hintKey)}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          id={`${hintKey}-tip`}
          role="tooltip"
          className="absolute end-[calc(100%+0.5rem)] top-1/2 z-50 w-56 max-w-[min(16rem,calc(100vw-5rem))] -translate-y-1/2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium leading-relaxed text-gray-700 shadow-lg sm:start-[calc(100%+0.5rem)] sm:end-auto sm:-translate-y-1/4"
          dir="rtl"
        >
          {text}
        </span>
      )}
    </span>
  )
}

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
  const [openHintKey, setOpenHintKey] = useState<string | null>(null)

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
    <div className="relative space-y-6" dir="rtl">

      {openHintKey !== null && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/25"
          aria-label="إغلاق الشرح"
          onClick={() => setOpenHintKey(null)}
        />
      )}

      {/* ── Global: Advance Booking Days ── */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mt-1 sm:mt-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">أيام الحجز المسبق</p>
              <p className="text-xs text-gray-500 mt-0.5">
                كم يوماً مستقبلياً يُسمح للمريض بالحجز فيه — يُطبَّق على جميع أيام العمل
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={globalAdvanceDays}
                onChange={(e) => setGlobalAdvanceDays(parseInt(e.target.value) || 1)}
                className="relative z-50 w-20 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                min={1}
                max={90}
              />
              <span className="text-sm text-gray-500">يوم</span>
              <FieldHint
                hintKey="global-advance-days"
                activeKey={openHintKey}
                setActiveKey={setOpenHintKey}
                text="عدد الأيام المستقبلية التي يستطيع المريض فيها أخذ حجز مسبق عندك؛ تُحفَظ نفس القيمة لكل أيام الدوام عند الضغط على «حفظ للكل»."
              />
            </div>
            <button
              onClick={handleSaveAdvanceDays}
              disabled={savingAdvance}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {advanceSaved ? "✓ تم الحفظ" : <><Save className="h-3.5 w-3.5" /> حفظ للكل</>}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <label className="relative z-50 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={s.is_active}
                      onChange={(e) => updateDay(dayIndex, { is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className={`font-semibold ${s.is_active ? "text-gray-900" : "text-gray-400"}`}>
                      {dayName}
                    </span>
                    <FieldHint
                      hintKey={`day-${dayIndex}-active`}
                      activeKey={openHintKey}
                      setActiveKey={setOpenHintKey}
                      text='عند التفعيل: يعتبر هذا يوم عمل، يمكن للمرضى رؤيته وحجوزات هذا اليوم تُطبّق وفق المواعيد أدناه. عند الإيقاف: لا يعمل الطابور ولا الحجز المسبق لهذا الاسم اليوم.'
                    />
                  </label>
                </div>
                <button
                  onClick={() => handleSave(dayIndex)}
                  disabled={isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saved === dayIndex ? "✓ تم الحفظ" : <><Save className="h-3.5 w-3.5" /> حفظ</>}
                </button>
              </div>

              {s.is_active && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      وقت البداية
                      <FieldHint
                        hintKey={`day-${dayIndex}-start`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="أول وقت يسمح فيه النظام للمرضى بالانضمام للطابور أو الحجز المسبق وفق هذا اليوم."
                      />
                    </label>
                    <input
                      type="time"
                      value={s.start_time}
                      onChange={(e) => updateDay(dayIndex, { start_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      وقت الانتهاء
                      <FieldHint
                        hintKey={`day-${dayIndex}-end`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="لا يمكن للمرضى الجدد الانضمام بعد هذا الوقت؛ من يمكن أن يكمّلوا يظل وفق وقت التشغيل لديك."
                      />
                    </label>
                    <input
                      type="time"
                      value={s.end_time}
                      onChange={(e) => updateDay(dayIndex, { end_time: e.target.value })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      بداية الاستراحة
                      <FieldHint
                        hintKey={`day-${dayIndex}-break-start`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="بداية فترة لا تستقبل فيها الطابور (مثل غذاء)، اختياري؛ اتركه فارغاً إن لم يوجد وقت ثابت."
                      />
                    </label>
                    <input
                      type="time"
                      value={s.break_start || ""}
                      onChange={(e) => updateDay(dayIndex, { break_start: e.target.value || null })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      نهاية الاستراحة
                      <FieldHint
                        hintKey={`day-${dayIndex}-break-end`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="عند هذا الوقت يُعتبر الطابور عاداً للعمل بعد الاستراحة."
                      />
                    </label>
                    <input
                      type="time"
                      value={s.break_end || ""}
                      onChange={(e) => updateDay(dayIndex, { break_end: e.target.value || null })}
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      الحد الأقصى للمرضى النشطين
                      <FieldHint
                        hintKey={`day-${dayIndex}-max-active`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="أكبر عدد للمرضى الذين يكونون في وقت واحد بحالات طابور: جاهز، غير جاهز، مدعو، أو تحت الكشف."
                      />
                    </label>
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
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      نافذة الطابور
                      <FieldHint
                        hintKey={`day-${dayIndex}-queue-window`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text='عدد المرضى "الجاهزين" الذين يُسمَح بحجزهم دفعة واحدة؛ يقيّد ازدحام غرفة الانتظار دون قطع عددكم الكلي اليوم.'
                      />
                    </label>
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
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      فترة السماح (دقيقة)
                      <FieldHint
                        hintKey={`day-${dayIndex}-grace`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text="بعد استدعاء المريض لهذه المدة بالدقائق؛ إن لم يحضر قد يُؤجَّل أو يُعتبر متأخراً حسب سياسات التخطّي لديك."
                      />
                    </label>
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
                    <label className="relative z-50 flex items-start gap-1 text-xs font-medium text-gray-500">
                      الحد الأقصى للحجوزات المستقبلية
                      <FieldHint
                        hintKey={`day-${dayIndex}-max-res`}
                        activeKey={openHintKey}
                        setActiveKey={setOpenHintKey}
                        text='أكبر عدد أسماء في "قوائم الانتظار المسبقة" لهذا الاسم اليوم قبل أن يعبأ اليوم عند الحجز المسبق فقط.'
                      />
                    </label>
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

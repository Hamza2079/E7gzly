import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  Stethoscope, MapPin, ArrowLeft, History
} from "lucide-react"
import QueueTicket from "@/components/queue/QueueTicket"

export const metadata = { title: "طابوري | E7gzly" }

const STATUSES: Record<string, { label: string; dot: string; badge: string }> = {
  ready:       { label: "في الانتظار",  dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 ring-blue-200" },
  not_ready:   { label: "لم أصل بعد",  dot: "bg-yellow-400",  badge: "bg-yellow-50 text-yellow-700 ring-yellow-200" },
  called:      { label: "تم استدعاؤك", dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  in_progress: { label: "جاري الكشف",  dot: "bg-indigo-500",  badge: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  completed:   { label: "مكتمل ✓",     dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  no_show:     { label: "غياب",         dot: "bg-rose-400",    badge: "bg-rose-50 text-rose-700 ring-rose-200" },
  cancelled:   { label: "ملغي",         dot: "bg-gray-300",    badge: "bg-gray-100 text-gray-500 ring-gray-200" },
}

const ACTIVE = ["ready", "not_ready", "called", "in_progress"]

export default async function MyQueuePage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const today = new Date().toISOString().split("T")[0]

  const { data: activeRaw } = await supabase
    .from("queue_entries")
    .select(`id, status, queue_number, queue_id, visit_reason, joined_at,
      queues!inner(id, date, current_serving, status, avg_duration,
        providers(id, clinic_name, clinic_address, city, users(full_name), specialties(name)))`)
    .eq("patient_id", user.id)
    .in("status", ACTIVE)
    .eq("queues.date", today)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: allRaw } = await supabase
    .from("queue_entries")
    .select(`id, status, queue_number, queue_id, visit_reason, joined_at,
      queues!inner(date, providers(id, clinic_name, users(full_name), specialties(name)))`)
    .eq("patient_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(60)

  const active = activeRaw as any
  const all = (allRaw || []) as any[]
  const history = all.filter(e => !active || e.id !== active.id)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-bl from-blue-700 to-indigo-800 px-6 pt-10 pb-20">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="inline-flex items-center gap-1.5 text-blue-200 text-sm mb-6 hover:text-white transition">
            <ArrowLeft className="h-3.5 w-3.5" /> الرئيسية
          </Link>
          <h1 className="text-3xl font-black text-white">طابوري</h1>
          <p className="mt-1 text-blue-200 text-sm">تذكرتك النشطة وسجل جميع حجوزاتك</p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-12 pb-16 space-y-6">

        {/* ── Active Ticket Card ── */}
        {active ? (() => {
          const q = active.queues as any
          const p = q.providers as any
          return (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">نشط الآن</span>
              </div>
              <QueueTicket
                entryId={active.id}
                queueId={active.queue_id}
                queueNumber={active.queue_number}
                initialStatus={active.status}
                doctorName={`د. ${p.users.full_name}`}
                specialtyName={p.specialties?.name || "عام"}
                providerId={p.id}
                clinicName={p.clinic_name}
                clinicAddress={p.clinic_address || p.city}
              />
            </div>
          )
        })() : (
          /* Empty active state */
          <div className="rounded-3xl bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
              <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">لا توجد تذكرة نشطة</h2>
              <p className="mt-1 text-sm text-blue-100">لست في أي طابور حالياً</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500 mb-5">احجز موعدك مع أفضل الأطباء وتابع دورك في الطابور في الوقت الحقيقي</p>
              <Link href="/doctors"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition">
                ابحث عن طبيب
              </Link>
            </div>
          </div>
        )}

        {/* ── History ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">سجل الحجوزات</h2>
            {history.length > 0 && (
              <span className="mr-auto rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                {history.length}
              </span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">لا توجد حجوزات سابقة بعد</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {history.map((entry: any, idx: number) => {
                const q = entry.queues as any
                const p = q.providers as any
                const s = STATUSES[entry.status] || STATUSES.cancelled
                const isLast = idx === history.length - 1
                const dateStr = new Date(q.date).toLocaleDateString("ar-EG", {
                  weekday: "long", day: "numeric", month: "long"
                })
                const isCompleted = entry.status === "completed"
                const isCancelled = entry.status === "cancelled" || entry.status === "no_show"

                return (
                  <div key={entry.id}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 ${isCancelled ? "opacity-60" : ""}`}>

                    {/* Timeline dot */}
                    <div className="flex flex-col items-center self-stretch shrink-0">
                      <div className={`h-3 w-3 rounded-full ring-2 ring-offset-2 ring-white ${s.dot}`} />
                      {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            د. {p.users.full_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.specialties?.name || "عام"}
                            {p.clinic_name ? ` · ${p.clinic_name}` : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3 inline" /> {dateStr}
                          </p>
                          {entry.visit_reason && (
                            <p className="text-xs text-gray-500 mt-1 truncate italic">
                              "{entry.visit_reason}"
                            </p>
                          )}
                        </div>

                        {/* Queue # + badge */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-2xl font-black ${isCompleted ? "text-emerald-400" : isCancelled ? "text-gray-200" : "text-blue-300"}`}>
                            #{String(entry.queue_number).padStart(3, "0")}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${s.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Banknote, Users, CheckCircle, CalendarOff, History } from "lucide-react"

export const metadata = {
  title: "التقارير والتحليلات",
  description: "عرض أداء طابورك وإيراداتك.",
}

export const dynamic = "force-dynamic"

function entryReceiptTotal(
  entry: Record<string, unknown>
): number {
  const lines = entry.queue_entry_services as
    | { quantity?: number; price_override?: number | null; services?: { price?: number | null } | null }[]
    | null
    | undefined
  if (!lines?.length) return 0
  return lines.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0
    const unit = Number(
      row.price_override != null ? row.price_override : (row.services?.price ?? 0)
    )
    return sum + unit * qty
  }, 0)
}

export default async function DoctorReportsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get provider
  const { data: provider } = await supabase
    .from("providers")
    .select("id, is_verified, consultation_fee")
    .eq("user_id", user.id)
    .single()

  if (!provider || !provider.is_verified) {
    return (
      <div className="py-20 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-900">غير مصرح بالوصول</h2>
        <p className="mt-2 text-gray-500">يجب أن يكون حسابك موثّقاً لعرض التقارير.</p>
      </div>
    )
  }

  // Fetch queue history for this provider (include line items so revenue matches سجل الزيارات)
  const { data: entriesRaw } = await supabase
    .from("queue_entries")
    .select(`
      *,
      queues!inner(date, provider_id, status),
      users(full_name),
      queue_entry_services(quantity, price_override, services(price))
    `)
    .eq("queues.provider_id", provider.id)
    .in("status", ["completed", "no_show", "cancelled"])
    .order("created_at", { ascending: false })

  const entries = entriesRaw as Record<string, unknown>[] | null

  const completed = entries?.filter((e) => e.status === "completed") || []
  const noShows = entries?.filter((e) => e.status === "no_show") || []

  const feeFallback = Number(provider.consultation_fee) || 0
  const totalEarnings = completed.reduce((sum, e) => {
    const receipt = entryReceiptTotal(e)
    const rowTotal = receipt > 0 ? receipt : feeFallback
    return sum + rowTotal
  }, 0)
  
  const uniquePatients = new Set(entries?.map(e => e.patient_id)).size

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">التقارير والتحليلات</h1>
        <p className="mt-2 text-gray-500">تتبّع إيرادات استشاراتك وسجل مرضاك.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Earnings Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">{totalEarnings.toLocaleString("ar-EG")} <span className="text-sm text-gray-400 font-normal">ج.م</span></p>
            </div>
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">الكشوف المكتملة</p>
              <p className="text-2xl font-bold text-gray-900">{completed.length}</p>
            </div>
          </div>
        </div>

        {/* Unique Patients */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">إجمالي المرضى</p>
              <p className="text-2xl font-bold text-gray-900">{uniquePatients}</p>
            </div>
          </div>
        </div>

        {/* No-Shows */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <CalendarOff className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">الغيابات</p>
              <p className="text-2xl font-bold text-gray-900">{noShows.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient History Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-6 py-5">
          <History className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">سجل المرضى</h2>
        </div>
        
        {(!entries || entries.length === 0) ? (
          <div className="px-6 py-12 text-center">
             <p className="text-gray-500 text-sm">لا يوجد سجل مرضى حتى الآن.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-gray-600">
              <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                  <th className="px-6 py-4 whitespace-nowrap">اسم المريض</th>
                  <th className="px-6 py-4 whitespace-nowrap">سبب الزيارة</th>
                  <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                  <th className="px-6 py-4 text-left whitespace-nowrap">الرسوم المحصّلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {entries.map((entry) => {
                  const q = entry.queues as { date?: string; provider_id?: string; status?: string } | null
                  const u = entry.users as { full_name?: string } | null

                  const isCompleted = entry.status === "completed"
                  const receipt = entryReceiptTotal(entry)
                  const earned = isCompleted
                    ? receipt > 0
                      ? receipt
                      : feeFallback
                    : 0

                  return (
                    <tr key={String(entry.id)} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">{q?.date || "—"}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{u?.full_name || "غير معروف"}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{String(entry.visit_reason || "—")}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isCompleted ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" :
                          entry.status === "no_show" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20" :
                          "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20"
                        }`}>
                          {isCompleted ? "مكتمل" :
                           entry.status === "no_show" ? "غياب" : "ملغي"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left font-semibold text-gray-900">
                        {isCompleted ? `${Number(earned).toLocaleString("ar-EG")} ج.م` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

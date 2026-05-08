"use client"

import { useState, useTransition } from "react"
import { upsertService, deleteService } from "@/actions/services"
import type { Service } from "@/types"
import { Plus, Pencil, Trash2, Loader2, X, CheckCircle, ToggleLeft, ToggleRight, DollarSign, Clock } from "lucide-react"

interface ServiceManagerProps {
  initialServices: Service[]
}

function ServiceForm({
  service,
  onDone,
}: {
  service?: Service | null
  onDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (service) fd.set("id", service.id)
    startTransition(async () => {
      const res = await upsertService(fd)
      if (res?.error) setError(res.error)
      else onDone()
    })
  }

  return (
    <form onSubmit={handleSubmit} dir="rtl" className="space-y-4">
      <input type="hidden" name="isActive" value="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">اسم الخدمة (عربي) *</label>
          <input
            name="nameAr"
            defaultValue={service?.nameAr}
            required
            placeholder="مثال: كشف عام"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">اسم الخدمة (إنجليزي)</label>
          <input
            name="nameEn"
            defaultValue={service?.nameEn ?? ""}
            placeholder="e.g. General Consultation"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">السعر (ر.س)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={service?.price ?? 0}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">المدة التقديرية (دقيقة)</label>
          <input
            name="estimatedDuration"
            type="number"
            min="1"
            defaultValue={service?.estimatedDuration ?? 10}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onDone}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
          إلغاء
        </button>
        <button type="submit" disabled={isPending}
          className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {service ? "تحديث" : "إضافة الخدمة"}
        </button>
      </div>
    </form>
  )
}

export default function ServiceManager({ initialServices }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [editingId, setEditingId] = useState<string | "new" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteService(id)
      setServices(s => s.filter(x => x.id !== id))
      setDeletingId(null)
    })
  }

  const refreshAndClose = () => {
    // Reload services from server by forcing a revalidation
    setEditingId(null)
    // A route refresh picks up revalidatePath from the action
    window.location.reload()
  }

  const totalRevenue = services
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.price, 0)

  return (
    <div dir="rtl" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">قائمة الخدمات</h2>
          <p className="text-xs text-gray-500 mt-0.5">{services.filter(s => s.isActive).length} خدمة نشطة</p>
        </div>
        <button
          onClick={() => setEditingId("new")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          إضافة خدمة
        </button>
      </div>

      {/* Add form */}
      {editingId === "new" && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm">خدمة جديدة</h3>
            <button onClick={() => setEditingId(null)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <ServiceForm onDone={refreshAndClose} />
        </div>
      )}

      {/* Services list */}
      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
          <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500 mb-1">لا توجد خدمات بعد</p>
          <p className="text-xs text-gray-400">أضف خدماتك لتتمكن من تعيينها للمرضى بعد الكشف</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {services.map(service => (
              <div key={service.id}>
                {editingId === service.id ? (
                  <div className="p-5 bg-blue-50/30">
                    <ServiceForm service={service} onDone={refreshAndClose} />
                  </div>
                ) : (
                  <div className={`flex items-center justify-between gap-4 px-5 py-4 transition ${!service.isActive ? "opacity-50 bg-gray-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{service.nameAr}</span>
                        {service.nameEn && (
                          <span className="text-xs text-gray-400">· {service.nameEn}</span>
                        )}
                        {!service.isActive && (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                            معطّل
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1 font-bold text-blue-700">
                          <DollarSign className="h-3 w-3" />
                          {service.price.toLocaleString("ar-SA")} ر.س
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.estimatedDuration} د
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setEditingId(service.id)}
                        className="h-8 w-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeletingId(service.id)}
                        className="h-8 w-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Footer summary */}
          <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">مجموع قائمة الأسعار</span>
            <span className="font-bold text-gray-900">{totalRevenue.toLocaleString("ar-SA")} ر.س</span>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" dir="rtl">
            <h3 className="font-bold text-gray-900 mb-2">تعطيل الخدمة؟</h3>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              سيتم إخفاء الخدمة من قائمتك. لن تُحذف سجلات الزيارات السابقة.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition">
                إلغاء
              </button>
              <button onClick={() => handleDelete(deletingId)} disabled={isPending}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                تعطيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

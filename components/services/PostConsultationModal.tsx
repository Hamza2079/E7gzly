"use client"

import { useState, useTransition } from "react"
import { assignServicesToEntry } from "@/actions/services"
import { upsertVisitNote } from "@/actions/visit-notes"
import type { Service, EntryService } from "@/types"
import { X, Plus, Minus, DollarSign, FileText, Loader2, CheckCircle, ChevronDown } from "lucide-react"

interface PostConsultationModalProps {
  entryId: string
  patientName: string
  queueNumber: number
  availableServices: Service[]
  existingServices?: EntryService[]
  onClose: () => void
  onComplete: (entryId: string) => void   // calls completePatient from outside
}

interface SelectedService {
  serviceId: string
  quantity: number
  priceOverride?: number
}

export default function PostConsultationModal({
  entryId,
  patientName,
  queueNumber,
  availableServices,
  existingServices = [],
  onClose,
  onComplete,
}: PostConsultationModalProps) {
  // Tab state
  const [tab, setTab] = useState<"services" | "notes">("services")

  // Services state
  const [selected, setSelected] = useState<SelectedService[]>(
    existingServices.map(es => ({
      serviceId: es.serviceId,
      quantity: es.quantity,
      priceOverride: es.priceOverride,
    }))
  )

  // Notes state
  const [prescription, setPrescription] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [chiefComplaint, setChiefComplaint] = useState("")

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  // --- Service helpers ---
  const isSelected = (id: string) => selected.some(s => s.serviceId === id)
  const getSelected = (id: string) => selected.find(s => s.serviceId === id)

  const toggle = (service: Service) => {
    if (isSelected(service.id)) {
      setSelected(s => s.filter(x => x.serviceId !== service.id))
    } else {
      setSelected(s => [...s, { serviceId: service.id, quantity: 1 }])
    }
  }

  const updateQty = (id: string, delta: number) => {
    setSelected(s => s.map(x => x.serviceId !== id ? x : {
      ...x,
      quantity: Math.max(1, (x.quantity || 1) + delta)
    }))
  }

  const priceOf = (s: SelectedService) => {
    const base = availableServices.find(a => a.id === s.serviceId)?.price ?? 0
    return (s.priceOverride ?? base) * s.quantity
  }

  const total = selected.reduce((sum, s) => sum + priceOf(s), 0)

  // --- Save & complete ---
  const handleSaveAndComplete = () => {
    startTransition(async () => {
      // Save services
      await assignServicesToEntry(entryId, selected.map(s => ({
        serviceId: s.serviceId,
        quantity: s.quantity,
        priceOverride: s.priceOverride,
      })))

      // Always upsert visit note row so receipts show in المريض + التقارير even if only خدمات
      await upsertVisitNote(entryId, {
        prescription: prescription || undefined,
        followUpInstructions: followUp || undefined,
        internalNotes: internalNotes || undefined,
        chiefComplaint: chiefComplaint || undefined,
      })

      setSaved(true)
      // Slight delay to show success feedback
      setTimeout(() => {
        onComplete(entryId)
        onClose()
      }, 600)
    })
  }

  const activeServices = availableServices.filter(s => s.isActive)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh]" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">إنهاء الكشف</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {patientName} — رقم #{String(queueNumber).padStart(3, "0")}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setTab("services")}
            className={`flex-1 py-3 text-sm font-bold transition ${tab === "services" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-400 hover:text-gray-600"}`}
          >
            الخدمات والفاتورة
          </button>
          <button
            onClick={() => setTab("notes")}
            className={`flex-1 py-3 text-sm font-bold transition ${tab === "notes" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-400 hover:text-gray-600"}`}
          >
            <FileText className="h-4 w-4 inline ml-1.5" />
            ملاحظات الزيارة
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/* SERVICES TAB */}
          {tab === "services" && (
            <div className="p-5 space-y-3">
              {activeServices.length === 0 ? (
                <div className="py-10 text-center">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">لم تُضف أي خدمات بعد</p>
                  <p className="text-xs text-gray-400 mt-1">أضف خدماتك من إعدادات العيادة</p>
                </div>
              ) : (
                activeServices.map(service => {
                  const sel = getSelected(service.id)
                  const isChecked = !!sel
                  return (
                    <div key={service.id}
                      className={`rounded-2xl border p-4 transition cursor-pointer
                        ${isChecked ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"}
                      `}
                      onClick={() => toggle(service)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition
                            ${isChecked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"}`}>
                            {isChecked && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{service.nameAr}</p>
                            {service.nameEn && <p className="text-xs text-gray-400">{service.nameEn}</p>}
                          </div>
                        </div>
                        <span className="font-bold text-blue-700 text-sm shrink-0">
                          {service.price.toLocaleString("ar-SA")} ر.س
                        </span>
                      </div>

                      {/* Qty controls (only when selected) */}
                      {isChecked && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateQty(service.id, -1)}
                              className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200 transition">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-4 text-center">{sel!.quantity}</span>
                            <button onClick={() => updateQty(service.id, 1)}
                              className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200 transition">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            = {priceOf(sel!).toLocaleString("ar-SA")} ر.س
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* NOTES TAB */}
          {tab === "notes" && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">الشكوى الرئيسية</label>
                <input
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="مثال: ألم في الصدر منذ يومين..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                  ملاحظات داخلية <span className="text-gray-400 font-normal">(غير مرئية للمريض)</span>
                </label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="ملاحظات سريرية، تشخيص مبدئي..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">الوصفة الطبية</label>
                <textarea
                  value={prescription}
                  onChange={e => setPrescription(e.target.value)}
                  placeholder="الأدوية والجرعات..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">تعليمات المتابعة</label>
                <textarea
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  placeholder="تعليمات للمريض بعد الزيارة..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          {selected.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                الإجمالي ({selected.length} خدمة)
              </span>
              <span className="text-lg font-black text-blue-700">
                {total.toLocaleString("ar-SA")} ر.س
              </span>
            </div>
          )}
          <button
            onClick={handleSaveAndComplete}
            disabled={isPending || saved}
            className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {saved ? (
              <><CheckCircle className="h-5 w-5" /> تم الحفظ!</>
            ) : isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> جاري الحفظ...</>
            ) : (
              "حفظ وإنهاء الكشف"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

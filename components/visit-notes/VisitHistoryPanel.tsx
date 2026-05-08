"use client"

import { useEffect, useState } from "react"
import { getPatientHistoryForDoctor } from "@/actions/visit-notes"
import type { VisitNote } from "@/types"
import { Loader2, History, Stethoscope, FileText, Pill, Clock } from "lucide-react"

export default function VisitHistoryPanel({
  patientId,
  providerId,
}: {
  patientId: string
  providerId: string
}) {
  const [history, setHistory] = useState<VisitNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getPatientHistoryForDoctor(patientId, providerId)
      setHistory(data)
      setLoading(false)
    }
    load()
  }, [patientId, providerId])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center" dir="rtl">
        <History className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-500">لا يوجد سجل زيارات سابق لهذا المريض</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-gray-900">سجل الزيارات السابقة ({history.length})</h3>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {history.map((note) => (
          <div key={note.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-3">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(note.createdAt).toLocaleDateString("ar-SA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="space-y-3">
              {note.chiefComplaint && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    الشكوى الرئيسية
                  </h4>
                  <p className="text-sm text-gray-800">{note.chiefComplaint}</p>
                </div>
              )}
              
              {note.internalNotes && (
                <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50">
                  <h4 className="text-xs font-bold text-amber-600/80 flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    ملاحظات داخلية (خاصة بك)
                  </h4>
                  <p className="text-sm text-amber-900/90 whitespace-pre-wrap">{note.internalNotes}</p>
                </div>
              )}

              {note.prescription && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-1">
                    <Pill className="h-3.5 w-3.5" />
                    الوصفة الطبية
                  </h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.prescription}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

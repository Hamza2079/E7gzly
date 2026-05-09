"use client"

import { useEffect, useState } from "react"
import { getPatientHistoryForDoctor, getPatientMedicalProfile } from "@/actions/visit-notes"
import type { VisitNote } from "@/types"
import { Loader2, History, Stethoscope, FileText, Pill, Clock, Activity, Droplets, AlertCircle } from "lucide-react"

export default function VisitHistoryPanel({
  patientId,
  providerId,
}: {
  patientId: string
  providerId: string
}) {
  const [history, setHistory] = useState<VisitNote[]>([])
  const [medicalProfile, setMedicalProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [historyData, profileData] = await Promise.all([
        getPatientHistoryForDoctor(patientId, providerId),
        getPatientMedicalProfile(patientId)
      ])
      setHistory(historyData)
      setMedicalProfile(profileData)
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

  const hasMedicalProfile = medicalProfile && (
    medicalProfile.blood_type || 
    medicalProfile.chronic_diseases || 
    medicalProfile.past_surgeries || 
    medicalProfile.allergies || 
    medicalProfile.current_medications
  )

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Medical Profile Summary (if any) */}
      {hasMedicalProfile && (
        <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" /> السجل الطبي الأساسي للمريض
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {medicalProfile.blood_type && (
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-red-400" />
                <span className="text-xs font-bold text-gray-500">فصيلة الدم:</span>
                <span className="text-sm font-semibold text-gray-900" dir="ltr">{medicalProfile.blood_type}</span>
              </div>
            )}
            {medicalProfile.chronic_diseases && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-gray-500 block">الأمراض المزمنة:</span>
                  <span className="text-sm font-medium text-gray-900">{medicalProfile.chronic_diseases}</span>
                </div>
              </div>
            )}
            {medicalProfile.past_surgeries && (
              <div className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-gray-500 block">عمليات سابقة:</span>
                  <span className="text-sm font-medium text-gray-900">{medicalProfile.past_surgeries}</span>
                </div>
              </div>
            )}
            {medicalProfile.allergies && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-gray-500 block">حساسية:</span>
                  <span className="text-sm font-medium text-gray-900">{medicalProfile.allergies}</span>
                </div>
              </div>
            )}
            {medicalProfile.current_medications && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Pill className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-gray-500 block">أدوية مستمرة:</span>
                  <span className="text-sm font-medium text-gray-900">{medicalProfile.current_medications}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">سجل الزيارات السابقة ({history.length})</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center" dir="rtl">
            <History className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">لا يوجد سجل زيارات سابق لهذا المريض</p>
          </div>
        ) : (
      
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
      )}
      </div>
    </div>
  )
}

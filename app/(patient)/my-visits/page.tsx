import { getMyVisitSummaries } from "@/actions/visit-notes"
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Stethoscope, Pill, MapPin, Receipt, CheckCircle, ChevronLeft } from "lucide-react"

export const metadata = {
  title: "سجل زياراتي",
}

export default async function MyVisitsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  const summaries = await getMyVisitSummaries(20)

  // We need to fetch doctor details for these summaries since patient_visit_summaries 
  // only has provider_id. We can do a quick join here.
  const providerIds = [...new Set(summaries.map(s => s.providerId))]
  const { data: providers } = await supabase
    .from("providers")
    .select("id, users!user_id(full_name), specialties(name_ar, name)")
    .in("id", providerIds)
    
  const providerMap = new Map()
  providers?.forEach(p => {
    providerMap.set(p.id, {
      name: p.users?.full_name,
      specialty: p.specialties?.name_ar || p.specialties?.name || "طبيب"
    })
  })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      
      {/* Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-black text-gray-900 mb-2">سجل زياراتي</h1>
        <p className="text-gray-500 font-medium">راجع الوصفات الطبية وتعليمات الطبيب وتفاصيل الدفع لزياراتك السابقة.</p>
      </div>

      {summaries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center animate-in fade-in duration-700">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">لا يوجد سجل زيارات سابق</h2>
          <p className="text-sm font-medium text-gray-500">عند إتمام أول كشف لك في العيادة، ستظهر تفاصيل الزيارة هنا.</p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {summaries.map((summary, index) => {
            const providerInfo = providerMap.get(summary.providerId)
            const date = new Date(summary.createdAt)
            
            return (
              <div 
                key={summary.id} 
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Timeline Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  <CheckCircle className="h-5 w-5" />
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 transform group-hover:-translate-y-1">
                    
                    {/* Header: Date & Doctor */}
                    <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-blue-600 mb-1.5">
                          <Stethoscope className="h-4 w-4" />
                          <h3 className="font-bold text-base">{providerInfo?.name || "طبيب"}</h3>
                        </div>
                        <p className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md inline-block">
                          {providerInfo?.specialty}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black text-gray-900">
                          {date.getDate().toString().padStart(2, "0")}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {date.toLocaleDateString("ar-SA", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      
                      {/* Prescription */}
                      {summary.prescription && (
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                          <h4 className="text-xs font-bold text-blue-800 flex items-center gap-1.5 mb-2">
                            <Pill className="h-4 w-4" /> الوصفة الطبية
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                            {summary.prescription}
                          </p>
                        </div>
                      )}

                      {/* Instructions */}
                      {summary.followUpInstructions && (
                        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
                          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
                            <MapPin className="h-4 w-4" /> تعليمات الطبيب
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                            {summary.followUpInstructions}
                          </p>
                        </div>
                      )}

                      {/* Services & Receipt */}
                      {summary.services && summary.services.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                          <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mb-3">
                            <Receipt className="h-4 w-4" /> إيصال الخدمات
                          </h4>
                          <ul className="space-y-2 mb-3">
                            {summary.services.map((s: any, i: number) => (
                              <li key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">
                                  {s.quantity > 1 ? `${s.quantity}x ` : ""}{s.nameAr}
                                </span>
                                <span className="text-gray-900 font-bold">{s.subtotal} ر.س</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <span className="text-sm font-bold text-gray-600">الإجمالي</span>
                            <span className="text-base font-black text-blue-700">{summary.totalAmount} ر.س</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* View Details Button (Decorative for now, adds to the premium feel) */}
                    <div className="mt-5 pt-4 border-t border-gray-50 flex justify-end">
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group/btn transition-colors">
                        التفاصيل
                        <ChevronLeft className="h-3 w-3 transform group-hover/btn:-translate-x-1 transition-transform" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

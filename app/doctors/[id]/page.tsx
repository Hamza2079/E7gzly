// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Navbar from "@/components/queue/Navbar"
import JoinQueueButton from "@/components/queue/JoinQueueButton"
import AvailableDaysPicker from "@/components/reservations/AvailableDaysPicker"
import MyReservationCard from "@/components/reservations/MyReservationCard"
import { getAvailableDays, getMyReservations } from "@/actions/reservations"
import { MapPin, Star, GraduationCap, Globe, Award, UserCircle, CalendarDays, Clock } from "lucide-react"

export async function generateMetadata({ params }) {
  const { id } = await params
  return { title: `Doctor Profile`, description: `View queue status and join.` }
}

export default async function DoctorProfilePage({ params }) {
  const { id: providerId } = await params
  const supabase = await createServer()

  // Fetch provider
  const { data: provider } = await supabase
    .from("providers")
    .select("*, users(full_name, avatar_url, email), specialties(name)")
    .eq("id", providerId)
    .eq("is_verified", true)
    .single()

  if (!provider) notFound()

  const user = provider.users
  const specialty = provider.specialties

  // Fetch today's queue
  const today = new Date().toISOString().split("T")[0]
  const { data: queue } = await supabase
    .from("queues")
    .select("*, doctor_schedules(max_active, end_time, break_start, break_end)")
    .eq("provider_id", providerId)
    .eq("date", today)
    .maybeSingle()

  // Queue stats
  let waitingCount = 0
  let atClinicCount = 0
  let nextTicketNumber = 1
  if (queue) {
    const { count: wc } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .in("status", ["not_ready", "ready", "called", "in_progress"])
    waitingCount = wc || 0

    const { count: rc } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .in("status", ["ready", "called", "in_progress"])
    atClinicCount = rc || 0

    nextTicketNumber = (queue.current_number || 0) + 1
  }

  const schedule = queue?.doctor_schedules
  const maxActive = schedule?.max_active || 33
  const estimatedWait = waitingCount * (queue?.avg_duration || 10)
  const isFull = waitingCount >= maxActive
  const isOpen = queue?.status === "open"

  const { data: { user: authUser } } = await supabase.auth.getUser()

  let canJoin = isOpen && !isFull && !!authUser
  let disabledReason = ""
  if (!authUser) disabledReason = "قم بتسجيل الدخول للحجز"
  else if (!queue) disabledReason = "لا يوجد طابور مفتوح اليوم"
  else if (queue.status === "paused") disabledReason = "الطابور في استراحة مؤقتة"
  else if (queue.status === "closed") disabledReason = "الطابور مغلق"
  else if (isFull) disabledReason = "الطابور مكتمل"

  // Future reservations data
  const [availableDays, myReservations] = await Promise.all([
    getAvailableDays(providerId),
    authUser ? getMyReservations() : Promise.resolve([]),
  ])
  // Filter reservations to only this doctor
  const myDoctorReservations = myReservations.filter(r => r.providerId === providerId)
    .filter(r => ["pending", "confirmed", "converted"].includes(r.status))

  const placeholderImg = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop"
  const currentServingText = queue?.current_serving ? `#${queue.current_serving}` : "—"

  return (
    <div className="bg-white min-h-screen pb-24">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-6 pt-12">
        <div className="grid gap-16 lg:grid-cols-5">
          
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-12">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row gap-8 items-start">
               <div className="h-32 w-32 shrink-0 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                 <img src={user?.avatar_url || placeholderImg} alt="صورة الطبيب" className="h-full w-full object-cover" />
               </div>
               <div className="mt-2">
                 <div className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 mb-3">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                     {specialty?.name || "متخصص"}
                   </span>
                 </div>
                 <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                   د. {user?.full_name}
                 </h1>
                 <p className="flex items-center gap-2 mt-3 text-sm text-gray-500 font-medium">
                   <MapPin className="h-4 w-4" /> {provider.clinic_address || provider.city || "موقع العيادة"}
                 </p>
               </div>
            </div>

            {/* Clinical Background */}
            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">نبذة عن الطبيب</h2>
              <p className="text-[15px] leading-relaxed text-gray-600">
                {provider.bio || `د. ${user?.full_name} طبيب متخصص بخبرة تتجاوز ${provider.years_of_experience} سنة في تقديم الرعاية الصحية بأسلوب علمي متكامل يجمع بين أحدث التقنيات والخبرة السريرية.`}
              </p>
            </div>

            {/* Info Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-gray-50 rounded-2xl p-5">
                 <GraduationCap className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">التعليم</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">طب معتمد</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-5">
                 <Globe className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">اللغات</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">عربي، إنجليزي</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-5">
                 <Award className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">الخبرة</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">{provider.years_of_experience}+ سنوات</p>
               </div>
            </div>

            {/* Patient Feedback */}
            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">آراء المرضى</h2>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                 <div className="flex gap-1 mb-3">
                   {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                 </div>
                 <p className="text-sm font-medium italic text-gray-800 leading-relaxed mb-4">
                   &quot;د. {user?.full_name?.split(' ')[0]} طبيب متميز يعطيك وقته ويشرح كل شيء بوضوح. أنصح به بشدة.&quot;
                 </p>
                 <div className="flex items-center gap-3">
                   <UserCircle className="h-8 w-8 text-gray-300" />
                   <p className="text-xs font-semibold text-gray-500">— مريض موثق</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column: Queue + Reservations */}
          <div className="lg:col-span-2 space-y-4">
             {/* Live Queue Card */}
             <div className="rounded-[2rem] bg-blue-50/50 p-8 shadow-sm ring-1 ring-gray-100">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">حالة الطابور مباشرة</span>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-gray-400 border border-gray-100 shadow-sm">
                    الآن
                  </div>
               </div>

               <div className="text-center py-6">
                 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">يتم خدمته الآن</p>
                 <h2 className="text-7xl font-black tracking-tighter text-blue-600">
                   {currentServingText}
                 </h2>
               </div>

               <div className="grid grid-cols-3 gap-3 mt-8 mb-8">
                 <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                   <p className="text-2xl font-bold text-gray-900">{waitingCount}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">في الطابور</p>
                 </div>
                 <div className="bg-green-50 rounded-2xl p-4 text-center shadow-sm border border-green-100">
                   <p className="text-2xl font-bold text-green-700">{atClinicCount}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-green-400 mt-1">في العيادة</p>
                 </div>
                 <div className="bg-blue-50 rounded-2xl p-4 text-center shadow-sm border border-blue-100">
                   <p className="text-2xl font-bold text-blue-700">~{estimatedWait}<span className="text-sm font-medium"> د</span></p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mt-1">وقت الانتظار</p>
                 </div>
               </div>

               {/* Next ticket number preview */}
               {isOpen && (
                 <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 text-center shadow-sm">
                   <p className="text-xs font-bold text-gray-400 mb-1">رقم تذكرتك بعد الحجز</p>
                   <p className="text-3xl font-black text-gray-900">رقم #{nextTicketNumber}</p>
                 </div>
               )}

               {queue && (
                 <div className="mt-4">
                   <JoinQueueButton
                     queueId={queue.id}
                     disabled={!canJoin}
                     disabledReason={disabledReason}
                   />
                 </div>
               )}
               <p className="text-[10px] text-center text-gray-400 mt-4 px-4 leading-relaxed">
                 احجز مكانك وستصلك إشعار عند اقتراب دورك.
               </p>
             </div>

             {/* ===== FUTURE RESERVATIONS SECTION ===== */}
             <div className="rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-5">
                 <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                   <CalendarDays className="h-5 w-5 text-white" />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">حجز مسبق</h3>
                   <p className="text-xs text-gray-400 mt-0.5">احجز موعدك في الأيام القادمة</p>
                 </div>
               </div>

               {/* My existing reservation for this doctor */}
               {myDoctorReservations.length > 0 && (
                 <div className="mb-5 space-y-3">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">حجوزاتك</p>
                   {myDoctorReservations.map(r => (
                     <MyReservationCard
                       key={r.id}
                       reservation={r}
                       doctorName={`د. ${user?.full_name}`}
                       specialty={specialty?.name}
                     />
                   ))}
                 </div>
               )}

               {availableDays.length > 0 ? (
                 <AvailableDaysPicker
                   providerId={providerId}
                   availableDays={availableDays}
                 />
               ) : (
                 <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
                   <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                   <p className="text-sm font-semibold text-gray-500">الحجز المسبق غير متاح حالياً</p>
                   <p className="text-xs text-gray-400 mt-1">تابع الطابور المباشر أعلاه</p>
                 </div>
               )}
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}

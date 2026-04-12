// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Navbar from "@/components/queue/Navbar"
import JoinQueueButton from "@/components/queue/JoinQueueButton"
import { MapPin, Star, GraduationCap, Globe, Award, UserCircle } from "lucide-react"

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
  let activeCount = 0
  let servedCount = 0
  if (queue) {
    const { count: wc } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .eq("status", "waiting")
    waitingCount = wc || 0

    const { count: ac } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .in("status", ["waiting", "called", "in_progress"])
    activeCount = ac || 0
  }

  const schedule = queue?.doctor_schedules
  const maxActive = schedule?.max_active || 33
  const estimatedWait = waitingCount * (queue?.avg_duration || 10)
  const isFull = activeCount >= maxActive
  const isOpen = queue?.status === "open"

  const { data: { user: authUser } } = await supabase.auth.getUser()

  let canJoin = isOpen && !isFull && !!authUser
  let disabledReason = ""
  if (!authUser) disabledReason = "Sign in to join the queue"
  else if (!queue) disabledReason = "No queue open today"
  else if (queue.status === "paused") disabledReason = "Queue is on break"
  else if (queue.status === "closed") disabledReason = "Queue is closed"
  else if (isFull) disabledReason = "Queue is full"

  // Placeholder logic for the new UI pieces
  const placeholderImg = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop"
  const currentServingText = queue?.current_serving ? `#${queue.current_serving}` : "N/A"

  return (
    <div className="bg-white min-h-screen pb-24">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-6 pt-12">
        <div className="grid gap-16 lg:grid-cols-5">
          
          {/* Left Column: Profile (Takes up 3/5 cols) */}
          <div className="lg:col-span-3 space-y-12">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row gap-8 items-start">
               <div className="h-32 w-32 shrink-0 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                 <img src={user?.avatar_url || placeholderImg} alt="Doctor profile" className="h-full w-full object-cover" />
               </div>
               <div className="mt-2">
                 <div className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 mb-3">
                   <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                     {specialty?.name || "Specialist"}
                   </span>
                 </div>
                 <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                   Dr. {user?.full_name}
                 </h1>
                 <p className="flex items-center gap-2 mt-3 text-sm text-gray-500 font-medium">
                   <MapPin className="h-4 w-4" /> {provider.clinic_address || provider.city || "Clinic Location"}
                 </p>
               </div>
            </div>

            {/* Clinical Background */}
            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Clinical Background</h2>
              <p className="text-[15px] leading-relaxed text-gray-600">
                {provider.bio || `Dr. ${user?.full_name} is a highly experienced practitioner with over ${provider.years_of_experience} years of expertise. Their practice emphasizes a collaborative approach between practitioner and patient to ensure long-term health outcomes using the latest clinical precision.`}
              </p>
            </div>

            {/* Info Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-gray-50 rounded-2xl p-5">
                 <GraduationCap className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Education</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">Medical Board Certified</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-5">
                 <Globe className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Languages</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">English, Regional Arabic</p>
               </div>
               <div className="bg-gray-50 rounded-2xl p-5">
                 <Award className="h-5 w-5 text-blue-600 mb-3" />
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Experience</p>
                 <p className="font-semibold text-sm text-gray-900 mt-1">{provider.years_of_experience}+ Years Active</p>
               </div>
            </div>

            {/* Patient Feedback */}
            <div className="pt-8 border-t border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Patient Feedback</h2>
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                 <div className="flex gap-1 mb-3">
                   {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                 </div>
                 <p className="text-sm font-medium italic text-gray-800 leading-relaxed mb-4">
                   "Dr. {user?.full_name?.split(' ')[0]} is incredibly thorough. They took the time to explain every detail without rushing the consultation. Would highly recommend to anyone seeking expert care."
                 </p>
                 <div className="flex items-center gap-3">
                   <UserCircle className="h-8 w-8 text-gray-300" />
                   <p className="text-xs font-semibold text-gray-500">— Verified Patient</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column: Queue Interface (Takes up 2/5 cols) */}
          <div className="lg:col-span-2 space-y-4">
             {/* Main Tracker Card */}
             <div className="rounded-[2rem] bg-blue-50/50 p-8 shadow-sm ring-1 ring-gray-100">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-700">Live Queue Status</span>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-gray-400 border border-gray-100 shadow-sm">
                    Update: Just now
                  </div>
               </div>

               <div className="text-center py-6">
                 <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Now Serving</p>
                 <h2 className="text-7xl font-black tracking-tighter text-blue-600">
                   {currentServingText}
                 </h2>
               </div>

               <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                 <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                   <p className="text-2xl font-bold text-gray-900">{waitingCount}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">People Waiting</p>
                 </div>
                 <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                   <p className="text-2xl font-bold text-gray-900">~{estimatedWait} <span className="text-sm font-medium">min</span></p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Est. Wait Time</p>
                 </div>
               </div>

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
                 Joining the queue will reserve your spot and notify you 15 minutes before your turn via SMS.
               </p>
             </div>

             {/* Secondary Actions */}
             <div className="rounded-2xl border border-gray-100 bg-white p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition shadow-sm">
               <span className="text-sm font-bold text-gray-900 flex items-center gap-3">
                 Schedule for later
               </span>
               <span className="text-gray-400">›</span>
             </div>
             
             <div className="rounded-2xl border border-gray-100 bg-white p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition shadow-sm">
               <span className="text-sm font-bold text-gray-900 flex items-center gap-3">
                 Pre-consultation chat
               </span>
               <span className="text-gray-400">›</span>
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}

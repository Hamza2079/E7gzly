// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MapPin, MessageSquare, Calendar, Trash2 } from "lucide-react"

export const metadata = {
  title: "My Ticket | E7gzly",
}

export default async function MyQueuePage() {
  const supabase = await createServer()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // 2. Fetch the user's active queue entry (waiting or called or in_progress)
  const today = new Date().toISOString().split("T")[0]
  const { data: entry } = await supabase
    .from("queue_entries")
    .select(`
      *,
      queues (
        id,
        current_serving,
        status,
        avg_duration,
        providers (
          id,
          clinic_name,
          clinic_address,
          city,
          users (full_name)
        )
      )
    `)
    .eq("patient_id", user.id)
    .in("status", ["waiting", "called", "in_progress"])
    .eq("date", today)
    .maybeSingle()

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Calendar className="h-10 w-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">No Active Tickets</h2>
        <p className="mt-2 max-w-sm text-gray-500">
          You are not currently waiting in any clinic queues. Find a doctor to book your spot.
        </p>
        <Link
          href="/doctors"
          className="mt-8 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          Find a Doctor
        </Link>
      </div>
    )
  }

  const queue = entry.queues
  const provider = queue.providers
  const doctorName = provider.users.full_name

  const isCalled = entry.status === "called"
  const isInProgress = entry.status === "in_progress"

  // Position calculation
  const currentServingNum = queue.current_serving || 0
  const userNum = entry.queue_number
  const position = Math.max(0, userNum - currentServingNum)
  
  const estimatedWaitStr = position > 0 
    ? `${position * (queue.avg_duration || 10)} min wait`
    : "It's your turn!"

  // Progress Bar calculation (mocking the total queue timeline)
  // Let's assume if position is 0, progress is 100%. If position is 10, progress is 10%.
  const maxWaitPxls = 20; // arbitrary max position for UI scale
  const progressPercent = Math.min(100, Math.max(5, 100 - ((position / maxWaitPxls) * 100)))

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="space-y-6">
        
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gray-900 h-48 md:h-64 shadow-lg group">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173ff9e8eb4?w=1200&h=400&fit=crop" 
            alt="Medical Facility" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
             <div>
               <p className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1">Current Status</p>
               <h1 className="text-3xl font-bold text-white sm:text-4xl">
                 {isCalled ? "Your turn is here" : position <= 2 ? "Your turn is approaching" : "You are in the queue"}
               </h1>
             </div>
             <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
               <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Live Tracking
             </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
           
           {/* Left: User Ticket */}
           <div className="rounded-[2rem] bg-white p-8 sm:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
               <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Queue Ticket</p>
               <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase">General</div>
             </div>
             <h2 className="text-6xl font-black tracking-tighter text-blue-600 mb-8 sm:text-7xl">
               #{String(userNum).padStart(3, '0')}
             </h2>
             
             <div className="flex justify-between items-end mb-4">
                <p className="text-sm font-semibold text-gray-900">
                  {position === 0 ? "You are next in line" : `You are ${position} in line`}
                </p>
                <p className="text-sm font-bold text-blue-600">{estimatedWaitStr}</p>
             </div>

             {/* Progress Bar Timeline */}
             <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-2 mb-3">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
             </div>
             
             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
               <span>Checked In</span>
               <span className="text-blue-600">Your Position</span>
               <span>Consultation</span>
             </div>
           </div>

           {/* Right: Now Serving Slate Card */}
           <div className="rounded-[2rem] bg-gray-900 p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-[80px]" />
              
              <div>
                <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-4">Now Serving</p>
                <h2 className="text-6xl font-black tracking-tighter text-white mb-6 sm:text-7xl">
                  #{String(currentServingNum).padStart(3, '0')}
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed max-w-sm">
                  {isCalled 
                    ? `Please proceed to the doctor. Dr. ${doctorName} is ready to see you.`
                    : `Please wait in the common area. Your number will be called shortly.`}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Est. Start</p>
                   {/* Mocking start time for UI design compliance since we don't store time per ticket */}
                   <p className="text-lg font-bold text-white">Soon</p>
                 </div>
                 <div>
                   <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Provider</p>
                   <p className="text-sm font-bold text-white">Dr. {doctorName.split(' ')[0]}</p>
                 </div>
              </div>
           </div>

           {/* Bottom Left: Location info */}
           <div className="rounded-3xl bg-gray-50 p-6 flex items-center gap-4 border border-gray-100">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{provider.clinic_name || `Dr. ${doctorName}'s Clinic`}</p>
                <p className="text-xs text-gray-500 mt-1">{provider.clinic_address || provider.city || "Head to the main reception area."}</p>
              </div>
           </div>

           {/* Bottom Right: Help / Actions */}
           <div className="rounded-3xl bg-gray-50 p-6 sm:p-8 border border-gray-100 flex flex-col justify-center">
              <p className="text-sm font-bold text-gray-900 mb-4">Need help?</p>
              
              <div className="space-y-3">
                <button className="w-full flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                  <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-600" /> Message Clinic</span>
                  <span className="text-gray-400">›</span>
                </button>

                <form action="/auth/queue/leave" method="post">
                  <input type="hidden" name="entryId" value={entry.id} />
                  <button type="submit" className="w-full mt-4 text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-700 transition flex items-center justify-center gap-2">
                    <Trash2 className="h-3.5 w-3.5" /> Cancel Queue
                  </button>
                </form>
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}

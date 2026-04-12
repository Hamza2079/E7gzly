// @ts-nocheck
import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import Navbar from "@/components/queue/Navbar"
import { MapPin, SlidersHorizontal, MonitorSmartphone } from "lucide-react"

export const metadata = {
  title: "Directory | E7gzly",
}

export default async function DoctorsPage() {
  const supabase = await createServer()
  const today = new Date().toISOString().split("T")[0]

  // Fetch verified providers
  const { data: providers } = await supabase
    .from("providers")
    .select(`
      id,
      user_id,
      city,
      consultation_fee,
      rating_avg,
      users(full_name, avatar_url),
      specialties(name)
    `)
    .eq("is_verified", true)

  // Fetch today's queues for all providers
  const { data: queues } = await supabase
    .from("queues")
    .select("id, provider_id, status, avg_duration")
    .eq("date", today)

  // Map queues and calculate waits
  const queueMap = new Map()
  if (queues) {
    for (const q of queues) {
      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", q.id)
        .in("status", ["waiting", "in_progress"])
        
      const waitingCount = count || 0
      queueMap.set(q.provider_id, {
        status: q.status,
        waitMins: waitingCount * (q.avg_duration || 10)
      })
    }
  }

  // Define placeholder images since real avatars don't exist yet
  const placeholders = [
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1594824436998-d40d995c255c?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop"
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Find Your <span className="text-blue-600">Specialist</span>
            </h1>
            <p className="mt-2 text-gray-500">
              Book appointments with top-rated medical professionals.<br />
              Real-time queue status and clinical availability.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition">
               <SlidersHorizontal className="h-4 w-4" /> Filters
             </button>
             <button className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-full shadow-sm hover:bg-blue-700 transition">
               All Doctors
             </button>
             <button className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition">
               Available Now
             </button>
          </div>
        </div>

        {/* Grid Layer */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          
          {(!providers || providers.length === 0) ? (
            <div className="col-span-full py-20 text-center text-gray-400">
              No doctors found matching criteria.
            </div>
          ) : (
            providers.map((provider, index) => {
              const queue = queueMap.get(provider.id)
              const status = queue?.status || "closed"
              const waitTime = queue ? `${queue.waitMins} mins` : "Unavailable"
              const placeholderImg = placeholders[index % placeholders.length]

              return (
                <div key={provider.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md flex flex-col">
                  {/* Global Image Asset Layer */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img 
                      src={provider.users?.avatar_url || placeholderImg} 
                      alt="Doctor" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Floating Status Pill */}
                    <div className="absolute top-4 right-4">
                      {status === "open" && (
                        <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-opacity-90">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> OPEN
                        </div>
                      )}
                      {status === "paused" && (
                        <div className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-opacity-90">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> PAUSED
                        </div>
                      )}
                      {status === "closed" && (
                        <div className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md bg-opacity-90">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> CLOSED
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Datapoints Layer */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] font-bold tracking-widest text-blue-500 uppercase mb-1">
                      {provider.specialties?.name || "General Practice"}
                    </p>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Dr. {provider.users?.full_name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 mb-5">
                      <MapPin className="h-3.5 w-3.5" /> {provider.city || "Clinic Location"}
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Est. Wait</p>
                        <p className="text-sm font-bold text-gray-900">{waitTime}</p>
                      </div>
                      <Link 
                        href={`/doctors/${provider.id}`}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${
                          status === "open" || status === "paused" 
                            ? "bg-blue-600 text-white shadow hover:bg-blue-700" 
                            : "bg-gray-100 text-gray-400 pointer-events-none"
                        }`}
                      >
                        {status === "closed" ? "Closed Today" : "Book Now"}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Marketing Card (Span 2) */}
          <div className="col-span-1 lg:col-span-2 rounded-3xl bg-blue-600 p-8 flex flex-col justify-between relative overflow-hidden text-white shadow-xl">
             <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
                <MonitorSmartphone className="h-64 w-64" />
             </div>
             <div className="relative z-10 w-3/4">
               <h3 className="text-2xl font-bold mb-2">Can't wait?</h3>
               <p className="text-sm text-blue-100 leading-relaxed">
                 Book a virtual consultation with our on-call specialists right now and get diagnosed within minutes.
               </p>
             </div>
             <div className="relative z-10 mt-6 lg:mt-0 pt-4">
               <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition shadow-sm">
                 <MonitorSmartphone className="h-4 w-4" /> Instant Virtual Care
               </button>
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}

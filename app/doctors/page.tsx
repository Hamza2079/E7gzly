// @ts-nocheck
import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import Navbar from "@/components/queue/Navbar"
import DoctorFilters from "@/components/directory/DoctorFilters"
import FavoriteButton from "@/components/directory/FavoriteButton"
import { MapPin, Users, Clock, SlidersHorizontal, MonitorSmartphone } from "lucide-react"

export const metadata = {
  title: "الأطباء | إحجزلي",
}

type SearchParams = Promise<{ [key: string]: string | undefined }>

export default async function DoctorsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createServer()
  const today = new Date().toISOString().split("T")[0]

  const resolvedParams = await searchParams;
  const qStr = resolvedParams?.q || "";
  const cityStr = resolvedParams?.city || "";
  const specStr = resolvedParams?.spec || "";
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Fetch verified providers with average rating from reviews
  let query = supabase
    .from("providers")
    .select(`
      id,
      user_id,
      city,
      rating_avg,
      users!inner(full_name, avatar_url),
      specialties!inner(name),
      doctor_schedules(start_time, end_time, day_of_week)
    `)
    .eq("is_verified", true)
    .eq("doctor_schedules.day_of_week", dayOfWeek)

  if (qStr) query = query.ilike("users.full_name", `%${qStr}%`)
  if (cityStr) query = query.ilike("city", `%${cityStr}%`)
  if (specStr) query = query.ilike("specialties.name", `%${specStr}%`)

  const { data: providers } = await query
  const { data: { user } } = await supabase.auth.getUser()

  let favorites = new Set<string>()
  if (user) {
    const { data: favs } = await supabase.from("patient_favorites").select("provider_id").eq("patient_id", user.id)
    if (favs) favorites = new Set(favs.map(f => f.provider_id))
  }

  // Fetch real average ratings from reviews table for each provider
  const { data: allReviews } = await supabase.from("reviews").select("provider_id, rating")
  const ratingMap = new Map()
  if (allReviews) {
    const totals = new Map()
    const counts = new Map()
    allReviews.forEach(r => {
      totals.set(r.provider_id, (totals.get(r.provider_id) || 0) + r.rating)
      counts.set(r.provider_id, (counts.get(r.provider_id) || 0) + 1)
    })
    totals.forEach((sum, id) => {
      ratingMap.set(id, (sum / counts.get(id)).toFixed(1))
    })
  }

  // Fetch today's queues for all providers
  const { data: queues } = await supabase
    .from("queues")
    .select("id, provider_id, status, avg_duration, current_number")
    .eq("date", today)

  // Map queues and calculate waits
  const queueMap = new Map()
  if (queues) {
    for (const q of queues) {
      // Count active patients (waiting to be served)
      const { count: totalActive } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", q.id)
        .in("status", ["not_ready", "ready", "called", "in_progress"])

      const waiting = totalActive || 0
      const waitMins = waiting * (q.avg_duration || 10)
      const nextNumber = (q.current_number || 0) + 1

      queueMap.set(q.provider_id, {
        status: q.status,
        waitMins,
        waiting,
        nextNumber,
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
              ابحث عن <span className="text-blue-600">طبيبك المناسب</span>
            </h1>
            <p className="mt-2 text-gray-500">
              احجز موعدك مع أفضل الأطباء المتخصصين.<br />
              حالة الطابور مباشرة وتوفر العيادة الآن.
            </p>
          </div>
          <div className="flex-1 flex justify-end">
             <DoctorFilters />
          </div>
        </div>

        {/* Grid Layer */}
        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {(!providers || providers.length === 0) ? (
            <div className="col-span-full py-20 text-center text-gray-400 font-bold">
              لا يوجد أطباء يطابقون معايير البحث.
            </div>
          ) : (
            providers.map((provider, index) => {
              const queue = queueMap.get(provider.id)
              const schedule = Array.isArray(provider.doctor_schedules) ? provider.doctor_schedules[0] : provider.doctor_schedules
              const startTime = schedule?.start_time?.substring(0, 5)
              const endTime = schedule?.end_time?.substring(0, 5)
              
              // Auto-close logic: if current time > endTime (in Cairo timezone), status is closed for patients
              const nowInCairo = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
              const currentTimeStr = `${String(nowInCairo.getHours()).padStart(2, '0')}:${String(nowInCairo.getMinutes()).padStart(2, '0')}`
              
              let status = queue?.status || "closed"
              if (endTime && currentTimeStr > endTime) {
                status = "closed"
              }

              const waitMins = queue?.waitMins ?? null
              const waiting = queue?.waiting ?? null
              const placeholderImg = placeholders[index % placeholders.length]
              const u = Array.isArray(provider.users) ? provider.users[0] : provider.users;
              const isFavorite = favorites.has(provider.id);
              const realRating = ratingMap.get(provider.id) || provider.rating_avg || "5.0";

              return (
                <div key={provider.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                  {/* Image & Status */}
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img 
                      src={u?.avatar_url || placeholderImg} 
                      alt="Doctor" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Favorite button */}
                    <div className="absolute top-4 right-4 z-10">
                      {user && <FavoriteButton providerId={provider.id} initialFavorite={isFavorite} />}
                    </div>
                    
                    {/* Status Pill */}
                    <div className="absolute top-4 left-4">
                      {status === "open" && (
                        <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> متاح الآن
                        </div>
                      )}
                      {status === "paused" && (
                        <div className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-amber-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" /> استراحة
                        </div>
                      )}
                      {status === "closed" && (
                        <div className="bg-gray-700 text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-gray-700/30">
                           مغلق
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                        {provider.specialties?.name || "طب عام"}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg">
                        ⭐ {realRating}
                      </div>
                    </div>
                    
                    <h3 className="font-black text-gray-900 text-xl mb-1">
                      د. {u?.full_name}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> {provider.city || "موقع العيادة"}
                      </div>
                      {startTime && endTime && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                          <Clock className="h-3.5 w-3.5 text-blue-500" /> متاح {startTime} - {endTime}
                        </div>
                      )}
                    </div>

                    {/* Compact Queue Info */}
                    {status === "open" && waiting !== null ? (
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                           {[1,2,3].map(i => (
                             <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${provider.id}${i}`} alt="" />
                             </div>
                           ))}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">
                          <span className="text-gray-900">{waiting}</span> مرضى في الانتظار
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 h-[22px]" /> // Spacer
                    )}
                    
                    <div className="mt-auto pt-6 flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter mb-0.5">وقت الانتظار التقريبي</p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <p className="text-lg font-black text-gray-900">
                            {status === "open" && waitMins !== null ? `${waitMins} د` : "--"}
                          </p>
                        </div>
                      </div>
                      
                      <Link 
                        href={`/doctors/${provider.id}`}
                        className={`h-12 px-6 rounded-2xl text-sm font-black transition-all flex items-center justify-center ${
                          status === "open" || status === "paused" 
                            ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02]" 
                            : "bg-gray-100 text-gray-400 pointer-events-none"
                        }`}
                      >
                        {status === "closed" ? "مغلق" : "حجز"}
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Premium Marketing Card */}
          <div className="col-span-1 lg:col-span-2 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-8 flex flex-col justify-between relative overflow-hidden text-white shadow-2xl shadow-blue-600/30">
             <div className="absolute -left-10 -bottom-10 opacity-10 pointer-events-none">
                <MonitorSmartphone className="h-72 w-72" />
             </div>
             <div className="relative z-10 w-full sm:w-3/4">
                <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold mb-4 uppercase tracking-widest">ميزة جديدة</div>
                <h3 className="text-3xl font-black mb-3 leading-tight">لا داعي للانتظار في العيادة بعد اليوم</h3>
                <p className="text-sm text-blue-100 leading-relaxed font-medium">
                  احجز دورك من المنزل، وتابع مكانك في الطابور مباشرة من هاتفك. سنقوم بتنبيهك عندما يحين وقت تحركك للعيادة.
                </p>
             </div>
             <div className="relative z-10 mt-8">
               <button className="w-full sm:w-auto bg-white text-blue-700 px-8 py-4 rounded-[1.25rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-xl">
                 <MonitorSmartphone className="h-5 w-5" /> ابدأ الاستخدام الآن
               </button>
             </div>
          </div>

        </div>
      </main>
    </div>
  )
}

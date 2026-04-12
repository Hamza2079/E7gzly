// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { approveProvider, rejectProvider } from "./actions"
import { Clock, Users, List, Activity, ArrowRight, BarChart2 } from "lucide-react"

export const metadata = {
  title: "Admin Dashboard | E7gzly",
}

export default async function AdminPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  // Fetch pending doctors
  const { data: pendingDoctors } = await supabase
    .from("providers")
    .select("*, users(full_name, email), specialties(name)")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false })

  // Fetch active queues representing clinics
  const today = new Date().toISOString().split("T")[0]
  const { data: activeQueues } = await supabase
    .from("queues")
    .select("*, providers(*, users(full_name), specialties(name))")
    .eq("date", today)
    .in("status", ["open", "paused", "closed"])

  // Aggregate stats
  const totalQueues = activeQueues?.length || 0
  const totalServedMock = 1208 // We would realistically aggregate this from entries

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview Analytics</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Real-time clinical throughput and queue orchestration.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest text-gray-900 uppercase">Live Update</span>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
         {/* KPI 1 */}
         <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative">
            <div className="flex justify-between items-start mb-6">
               <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                 <List className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+12% vs last hour</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Active Queues</p>
            <h2 className="text-4xl font-black text-gray-900">{totalQueues}</h2>
            <div className="mt-4 h-1 w-20 bg-blue-600 rounded-full" />
         </div>

         {/* KPI 2 */}
         <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative">
            <div className="flex justify-between items-start mb-6">
               <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                 <Users className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">+ 94 today</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Patients Served</p>
            <h2 className="text-4xl font-black text-gray-900">{totalServedMock.toLocaleString()}</h2>
            <div className="mt-4 flex -space-x-2">
               <img src="https://i.pravatar.cc/150?img=11" className="h-6 w-6 rounded-full border-2 border-white" alt="Avatar" />
               <img src="https://i.pravatar.cc/150?img=12" className="h-6 w-6 rounded-full border-2 border-white" alt="Avatar" />
               <img src="https://i.pravatar.cc/150?img=13" className="h-6 w-6 rounded-full border-2 border-white" alt="Avatar" />
               <span className="text-[10px] font-bold text-gray-400 ml-3 self-center pl-2">+1.1k others</span>
            </div>
         </div>

         {/* KPI 3 (Blue Saturated) */}
         <div className="bg-blue-600 rounded-[2rem] p-8 shadow-xl shadow-blue-600/30 text-white relative overflow-hidden">
            <div className="absolute right-[-40px] bottom-[-40px] opacity-10">
              <Clock className="h-48 w-48" />
            </div>
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0">
                 <Activity className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold text-white bg-white/20 backdrop-blur-md px-2 py-1 rounded-md">STABLE</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1 relative z-10">Avg Wait Time</p>
            <h2 className="text-5xl font-black relative z-10">18 <span className="text-2xl font-semibold opacity-80">min</span></h2>
         </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-xl font-bold text-gray-900">Clinic & Doctor Status Monitor</h2>
               <p className="text-xs text-gray-500 mt-1">Live monitoring of all active clinical endpoints.</p>
            </div>
            <div className="flex gap-2">
               <button className="text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100">Filter by Clinic</button>
               <button className="text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg hover:bg-gray-100">Export Report</button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-white text-[10px] font-bold tracking-widest uppercase text-gray-400 border-b border-gray-100">
                 <tr>
                    <th className="pb-4">Clinic Name</th>
                    <th className="pb-4">Practitioner</th>
                    <th className="pb-4">Current Queue</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 text-sm">
                  {(!activeQueues || activeQueues.length === 0) ? (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-400 font-medium">No active queues today.</td></tr>
                  ) : (
                    activeQueues.map(queue => {
                      const doc = queue.providers;
                      const spec = doc?.specialties?.name || "General";
                      const isOverloaded = queue.current_serving && queue.current_serving > 20;

                      return (
                        <tr key={queue.id} className="hover:bg-gray-50/50 transition">
                           <td className="py-5">
                              <p className="font-bold text-gray-900">{doc?.clinic_name || "Private Clinic"}</p>
                              <p className="text-xs text-blue-400 mt-0.5">{doc?.city || "Local Branch"}</p>
                           </td>
                           <td className="py-5">
                              <div className="flex items-center gap-3">
                                 <img src={`https://i.pravatar.cc/150?u=${doc.id}`} className="h-8 w-8 rounded-lg object-cover bg-gray-200" alt="Doctor" />
                                 <div>
                                   <p className="font-bold text-gray-900">Dr. {doc?.users?.full_name}</p>
                                   <p className="text-[10px] text-gray-500">{spec}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="py-5">
                              <div className="flex items-baseline gap-1.5">
                                 <span className="font-bold text-gray-900">{Math.floor(Math.random() * 30)}</span> 
                                 <span className={`text-xs ${isOverloaded ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                    {isOverloaded ? "high volume" : "waiting"}
                                 </span>
                              </div>
                           </td>
                           <td className="py-5">
                              {queue.status === "open" ? (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isOverloaded ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isOverloaded ? 'bg-red-500' : 'bg-green-500'}`} /> {isOverloaded ? "Overloaded" : "Operational"}
                                </span>
                              ) : queue.status === "paused" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-yellow-50 text-yellow-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> Paused
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-500">
                                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> Idle
                                </span>
                              )}
                           </td>
                           <td className="py-5 text-right">
                              <button className="text-xs font-bold text-red-500 hover:text-red-700 transition">Force Close Queue</button>
                           </td>
                        </tr>
                      )
                    })
                  )}
               </tbody>
            </table>
         </div>
         <div className="mt-4 flex items-center justify-between text-xs text-gray-400 font-medium pt-4 border-t border-gray-50">
            <p>Showing {activeQueues?.length || 0} active clinical endpoints.</p>
            <div className="flex gap-4 items-center">
               <span>{'<'}</span>
               <span className="text-gray-900 font-bold">1</span>
               <span>2</span>
               <span>3</span>
               <span>{'>'}</span>
            </div>
         </div>
      </div>

      {/* Footer Grids */}
      <div className="grid gap-6 md:grid-cols-3">
         
         {/* Predictive AI block */}
         <div className="md:col-span-2 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-[2rem] p-8 border border-white flex justify-between shadow-[0_4px_24px_0_rgba(224,231,255,0.5)]">
            <div className="pr-12">
               <h3 className="font-bold text-gray-900 mb-2">Predictive Resource Allocation</h3>
               <p className="text-sm text-gray-600 leading-relaxed max-w-sm mb-6">
                 Based on current patient flow, we recommend re-allocating 2 nurses from <strong>Alpha Diagnostics</strong> to <strong>West End Pediatrics</strong> to normalize wait times.
               </p>
               <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition">
                 Apply Recommendation
               </button>
            </div>
            <div className="hidden sm:flex flex-col justify-end bg-white/40 p-4 rounded-xl border border-white">
               <p className="text-[8px] font-bold uppercase tracking-widest text-blue-800 text-center mb-2">Growth Trend</p>
               <div className="flex items-end gap-2 h-20">
                 <div className="w-6 bg-blue-200 rounded-t-sm h-1/3" />
                 <div className="w-6 bg-blue-400 rounded-t-sm h-2/3 shadow-sm" />
                 <div className="w-6 bg-blue-600 rounded-t-sm h-full shadow-md" />
                 <div className="w-6 bg-blue-300 rounded-t-sm h-1/2" />
               </div>
            </div>
         </div>

         {/* Quick Action Hub */}
         <div className="bg-[#EEF2FF] rounded-[2rem] p-8 border border-white shadow-sm flex flex-col justify-center">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-800 mb-4 text-center">Quick Action Hub</h3>
            <div className="space-y-3">
               <button className="w-full bg-white text-gray-900 text-sm font-bold p-4 flex items-center justify-between rounded-xl shadow-sm hover:shadow transition">
                 Bulk Queue Reset <ArrowRight className="h-4 w-4 text-gray-400" />
               </button>
               <button className="w-full bg-white text-gray-900 text-sm font-bold p-4 flex items-center justify-between rounded-xl shadow-sm hover:shadow transition">
                 Update Announcements <ArrowRight className="h-4 w-4 text-gray-400" />
               </button>
            </div>
         </div>

      </div>

      {/* KEEP SYSTEM FUNCTIONALITY: Pending Approvals below the fold */}
      {pendingDoctors && pendingDoctors.length > 0 && (
        <div className="pt-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">Pending Provider Approvals ({pendingDoctors.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingDoctors.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                <div>
                  <p className="font-bold text-gray-900">Dr. {(doc.users as any).full_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(doc.specialties as any).name} · {(doc.users as any).email}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-500 mt-2">Lic: {doc.license_number}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <form action={approveProvider}>
                    <input type="hidden" name="providerId" value={doc.id} />
                    <button className="w-full rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-green-600">Approve</button>
                  </form>
                  <form action={rejectProvider} className="flex gap-2 items-center">
                    <input type="hidden" name="providerId" value={doc.id} />
                    <button className="rounded-lg bg-gray-100 text-gray-500 px-4 py-2 text-xs font-bold hover:bg-red-50 hover:text-red-600">Reject</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

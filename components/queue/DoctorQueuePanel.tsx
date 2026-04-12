"use client"

import { useQueueRealtime } from "@/hooks/use-queue-realtime"
import { callNextPatient, startConsultation, completePatient, skipPatient, openQueue, closeQueue } from "@/actions/queue"
import { useTransition } from "react"
import { Play, CheckCircle, SkipForward, Users, Activity, Clock, LogOut, FileText, Check } from "lucide-react"

interface DoctorQueuePanelProps {
  queueId: string | null
  providerId: string
  doctorName: string
  specialty: string
  todayServed: number
  todayNoShows: number
}

export default function DoctorQueuePanel({ queueId, providerId, doctorName, specialty, todayServed, todayNoShows }: DoctorQueuePanelProps) {
  const { queueData, waitingEntries, currentPatient } = useQueueRealtime(queueId)
  const [isPending, startTransition] = useTransition()

  const calledPatient = currentPatient?.status === "called" ? currentPatient : null
  const inProgressPatient = currentPatient?.status === "in_progress" ? currentPatient : null
  
  const activePatient = inProgressPatient || calledPatient

  const handleAction = (action: () => Promise<unknown>) => {
    startTransition(async () => { await action() })
  }

  if (!queueId || !queueData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
        <div className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6">
          <Users className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Queue is Offline</h2>
        <p className="mt-2 max-w-sm text-gray-500">Open your clinical queue to start accepting and managing patients today.</p>
        <button
          onClick={() => handleAction(openQueue)}
          disabled={isPending}
          className="mt-8 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? "Connecting..." : "Open Queue Session"}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
         <div>
           <h1 className="text-2xl font-bold text-gray-900">Queue Management</h1>
           <p className="text-sm text-gray-500 mt-1">Dr. {doctorName} • {specialty}</p>
         </div>
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
            <button 
              disabled={queueData.status === "open"}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${queueData.status === "open" ? "bg-green-600 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
            >
               {queueData.status === "open" && <span className="h-1.5 w-1.5 rounded-full bg-white" />} Open
            </button>
            <button 
              className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${queueData.status === "paused" ? "bg-yellow-500 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
            >
               Pause
            </button>
            <button 
              onClick={() => handleAction(() => closeQueue(queueId!))}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition ${queueData.status === "closed" ? "bg-red-500 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
            >
               Close
            </button>
         </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
         
         {/* Left Column (Main Queue Controls) */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* ACTIVE PATIENT CARD */}
            <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-gray-100 relative overflow-hidden">
               {/* Abstract background shape */}
               <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-50/50 rounded-l-[100px] -z-10" />
               
               <div className="flex items-center gap-6">
                 {/* Giant Number Badge */}
                 <div className="h-28 w-28 shrink-0 rounded-[1.5rem] bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <span className="text-4xl font-black tracking-tighter">#{activePatient ? String(activePatient.queue_number).padStart(3, '0') : "---"}</span>
                 </div>
                 
                 <div>
                   <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Currently Serving</p>
                   <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                     {activePatient ? (activePatient as any).users?.full_name || "Walk-in Patient" : "Standby"}
                   </h2>
                   <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                     <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Check-up & Consultation</span>
                   </div>
                 </div>
               </div>

               <div className="flex flex-col gap-3 min-w-[140px]">
                 {activePatient ? (
                   inProgressPatient ? (
                     <button
                        onClick={() => handleAction(() => completePatient(inProgressPatient.id))}
                        disabled={isPending}
                        className="bg-blue-600 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
                     >
                       <CheckCircle className="h-4 w-4" /> Complete
                     </button>
                   ) : (
                     <button
                        onClick={() => handleAction(() => startConsultation(calledPatient!.id))}
                        disabled={isPending}
                        className="bg-yellow-500 text-white rounded-xl py-3 px-4 font-bold text-sm shadow-sm hover:bg-yellow-600 transition flex items-center justify-center gap-2"
                     >
                       <Play className="h-4 w-4" /> Begin
                     </button>
                   )
                 ) : (
                     <button
                        onClick={() => handleAction(() => callNextPatient(queueId!))}
                        disabled={isPending || waitingEntries.length === 0}
                        className="bg-blue-600 text-white rounded-xl py-3 px-6 font-bold text-sm shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-300"
                     >
                       <FileText className="h-4 w-4" /> Call Next
                     </button>
                 )}
                 {activePatient && (
                   <button
                      onClick={() => handleAction(() => skipPatient(activePatient.id))}
                      disabled={isPending}
                      className="bg-white text-gray-700 border border-gray-200 rounded-xl py-2 px-4 font-bold text-sm hover:bg-gray-50 transition"
                   >
                     Skip
                   </button>
                 )}
               </div>
            </div>

            {/* WAITING LIST HEADER */}
            <div className="flex items-center justify-between mt-8 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Waiting List</h3>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {waitingEntries.length} Patients waiting
              </div>
            </div>

            {/* WAITING LIST TABLE */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50/50 text-xs uppercase text-gray-400 font-bold tracking-wider">
                     <tr>
                       <th className="px-6 py-4">Queue #</th>
                       <th className="px-6 py-4">Patient Name</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {waitingEntries.length === 0 ? (
                       <tr><td colSpan={4} className="text-center py-12 text-gray-400">No patients waiting in queue.</td></tr>
                     ) : (
                       waitingEntries.map((entry, idx) => (
                         <tr key={entry.id} className="hover:bg-gray-50/50 transition">
                            <td className="px-6 py-4">
                              <span className="font-bold text-blue-600">#{String(entry.queue_number).padStart(3, '0')}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                   <img src={`https://i.pravatar.cc/150?u=${entry.id}`} alt="Patient" />
                                 </div>
                                 <span className="font-semibold text-gray-900">{(entry as any).users?.full_name || "Walk-in"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               {idx === 0 ? (
                                 <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Next In Line</span>
                               ) : entry.source === "walk_in" ? (
                                 <span className="inline-flex items-center bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">Walk-in</span>
                               ) : (
                                 <span className="inline-flex items-center bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">Waiting</span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {idx === 0 && !activePatient && (
                                  <button onClick={() => handleAction(() => callNextPatient(queueId!))} disabled={isPending} className="text-xs font-bold text-blue-600 hover:text-blue-800">Call Next</button>
                                )}
                                <button onClick={() => handleAction(() => skipPatient(entry.id))} disabled={isPending} className="text-xs font-bold text-gray-400 hover:text-red-600">Skip</button>
                              </div>
                            </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
         </div>

         {/* Right Column (Metrics & Tools) */}
         <div className="space-y-6">
            
            {/* TODAY'S PULSE */}
            <div className="bg-blue-50/30 rounded-3xl p-6 border border-blue-100 shadow-sm">
               <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Today's Pulse</h3>
               <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Users className="h-5 w-5" /></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Served</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{todayServed}</span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0"><Activity className="h-5 w-5" /></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Avg Server</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{queueData.avgDuration} <span className="text-xs text-gray-400 font-medium">min</span></span>
                  </div>

                  <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><LogOut className="h-5 w-5" /></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">No Shows</span>
                    </div>
                    <span className="text-xl font-black text-gray-900">{String(todayNoShows).padStart(2, '0')}</span>
                  </div>
               </div>
            </div>

            {/* AD BANNER */}
            <div className="rounded-3xl bg-blue-900 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
               <div className="absolute right-0 bottom-0 opacity-10"><Activity className="h-32 w-32" /></div>
               <div className="relative z-10">
                 <h3 className="text-white font-bold text-lg mb-1">Review Patient Reports</h3>
                 <p className="text-blue-200 text-xs leading-relaxed mb-4">You have pending medical reports to sign for today's completed visits.</p>
                 <button className="bg-white/20 hover:bg-white/30 transition text-white px-4 py-2 rounded-lg text-xs font-bold backdrop-blur-md">
                   Open Reports
                 </button>
               </div>
            </div>

         </div>

      </div>
    </div>
  )
}

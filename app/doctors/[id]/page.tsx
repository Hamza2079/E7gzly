// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Navbar from "@/components/queue/Navbar"
import JoinQueueButton from "@/components/queue/JoinQueueButton"
import { MapPin, Star, Clock, Users, Briefcase, Shield } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Doctor Profile`, description: `View queue status and join.` }
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
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

  const user = provider.users as { full_name: string; avatar_url: string | null; email: string }
  const specialty = provider.specialties as { name: string }

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

    const { count: sc } = await supabase
      .from("queue_entries")
      .select("*", { count: "exact", head: true })
      .eq("queue_id", queue.id)
      .eq("status", "completed")
    servedCount = sc || 0
  }

  const schedule = queue?.doctor_schedules as { max_active: number; end_time: string; break_start: string | null; break_end: string | null } | null
  const maxActive = schedule?.max_active || 33
  const estimatedWait = waitingCount * (queue?.avg_duration || 10)
  const isFull = activeCount >= maxActive
  const isOpen = queue?.status === "open"

  // Check if the current user is logged in
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Determine if the user can join
  let canJoin = isOpen && !isFull && !!authUser
  let disabledReason = ""
  if (!authUser) disabledReason = "Sign in to join the queue"
  else if (!queue) disabledReason = "No queue open today"
  else if (queue.status === "paused") disabledReason = "Queue is on break"
  else if (queue.status === "closed") disabledReason = "Queue is closed"
  else if (isFull) disabledReason = "Queue is full"

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Profile */}
          <div className="space-y-6 lg:col-span-2">
            {/* Header */}
            <div className="flex items-start gap-5 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-3xl font-bold text-blue-600">
                {user}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dr. {user}</h1>
                <p className="text-blue-600">{specialty.name}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {provider.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> {provider.years_of_experience} years
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" /> {provider.rating_avg.toFixed(1)} ({provider.total_reviews} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-500" /> Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {provider.bio && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">About</h2>
                <p className="text-sm leading-relaxed text-gray-600">{provider.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Consultation Fee</p>
                  <p className="text-lg font-bold text-gray-900">EGP {provider.consultation_fee}</p>
                </div>
                {provider.clinic_name && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Clinic</p>
                    <p className="text-sm font-medium text-gray-900">{provider.clinic_name}</p>
                  </div>
                )}
                {provider.clinic_address && (
                  <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="text-sm font-medium text-gray-900">{provider.clinic_address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Queue Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Queue Status</h2>

              {!queue ? (
                <div className="rounded-xl bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">No queue open today.</p>
                  {schedule?.end_time && (
                    <p className="mt-1 text-xs text-gray-400">
                      Check back during working hours
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Status badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      queue.status === "open" ? "bg-green-500 animate-pulse" :
                      queue.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <span className="text-sm font-medium text-gray-700">
                      {queue.status === "open" ? "Accepting Patients" :
                       queue.status === "paused" ? `On Break${schedule?.break_end ? ` — resumes ${schedule.break_end}` : ""}` :
                       "Closed"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <p className="text-xs text-blue-600">Now Serving</p>
                      <p className="text-xl font-bold text-blue-700">
                        #{queue.current_serving || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3 text-center">
                      <p className="text-xs text-orange-600">Waiting</p>
                      <p className="text-xl font-bold text-orange-700">{waitingCount}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <p className="text-xs text-green-600">Served Today</p>
                      <p className="text-xl font-bold text-green-700">{servedCount}</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-3 text-center">
                      <p className="text-xs text-purple-600">Est. Wait</p>
                      <p className="text-xl font-bold text-purple-700">~{estimatedWait}m</p>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Capacity</span>
                      <span>{activeCount}/{maxActive}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull ? "bg-red-500" : activeCount > maxActive * 0.8 ? "bg-yellow-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, (activeCount / maxActive) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Closes at */}
                  {schedule?.end_time && (
                    <p className="mt-3 text-center text-xs text-gray-400">
                      Queue closes at {schedule.end_time}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Join Button */}
            {queue && (
              <JoinQueueButton
                queueId={queue.id}
                disabled={!canJoin}
                disabledReason={disabledReason}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

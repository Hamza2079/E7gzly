// @ts-nocheck — Remove after regenerating types
import Link from "next/link"
import { createServer } from "@/lib/supabase/server"
import Navbar from "@/components/queue/Navbar"
import { MapPin, Star, Users } from "lucide-react"

export const metadata = {
  title: "Doctors",
  description: "Browse verified doctors and join their queue.",
}

export default async function DoctorsPage() {
  const supabase = await createServer()
  const today = new Date().toISOString().split("T")[0]

  // Fetch verified providers with their user info, specialty, and today's queue
  const { data: providers } = await supabase
    .from("providers")
    .select(`
      id,
      user_id,
      bio,
      city,
      consultation_fee,
      years_of_experience,
      rating_avg,
      total_reviews,
      users(full_name, avatar_url),
      specialties(name, icon)
    `)
    .eq("is_verified", true)

  // Fetch today's queues for all providers
  const { data: queues } = await supabase
    .from("queues")
    .select("id, provider_id, status, current_number, current_serving, avg_duration")
    .eq("date", today)

  // Fetch waiting counts per queue
  const queueMap = new Map<string, { status: string; waitingCount: number; queueId: string }>()
  if (queues) {
    for (const q of queues) {
      const { count } = await supabase
        .from("queue_entries")
        .select("*", { count: "exact", head: true })
        .eq("queue_id", q.id)
        .eq("status", "waiting")

      queueMap.set(q.provider_id, {
        status: q.status,
        waitingCount: count || 0,
        queueId: q.id,
      })
    }
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="mt-1 text-gray-500">Browse verified doctors and join their queue online.</p>
        </div>

        {(!providers || providers.length === 0) ? (
          <div className="py-20 text-center text-gray-400">
            No verified doctors found. Check back soon!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const user = provider.users as { full_name: string; avatar_url: string | null } | null
              const specialty = provider.specialties as { name: string; icon: string | null } | null
              const queue = queueMap.get(provider.id)

              return (
                <Link
                  key={provider.id}
                  href={`/doctors/${provider.id}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                >
                  {/* Queue Badge */}
                  <div className="mb-4">
                    {queue ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        queue.status === "open"
                          ? "bg-green-50 text-green-700"
                          : queue.status === "paused"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          queue.status === "open" ? "bg-green-500" :
                          queue.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                        }`} />
                        {queue.status === "open"
                          ? `Open — ${queue.waitingCount} waiting`
                          : queue.status === "paused"
                          ? "On Break"
                          : "Closed"
                        }
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        No queue today
                      </span>
                    )}
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                      {user?.full_name?.charAt(0) || "D"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                        Dr. {user?.full_name || "Unknown"}
                      </h3>
                      <p className="text-sm text-blue-600">{specialty?.name || "General"}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {provider.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400" /> {provider.rating_avg.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-gray-500">{provider.years_of_experience} yrs exp</span>
                    <span className="text-sm font-semibold text-gray-900">
                      EGP {provider.consultation_fee}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { approveProvider, rejectProvider } from "./actions"
import AdminQueueMonitor from "./AdminQueueMonitor"

export const metadata = {
  title: "Admin Dashboard",
  description: "Manage doctors and monitor queues.",
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

  // Fetch rejected doctors
  const { data: rejectedDoctors } = await supabase
    .from("providers")
    .select("*, users(full_name, email), specialties(name)")
    .eq("verification_status", "rejected")
    .order("updated_at", { ascending: false })
    .limit(5)

  // Fetch today's queues for monitoring
  const today = new Date().toISOString().split("T")[0]
  const { data: activeQueues } = await supabase
    .from("queues")
    .select("*, providers(*, users(full_name), specialties(name))")
    .eq("date", today)
    .in("status", ["open", "paused", "closed"])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-gray-500">Manage doctors and monitor queue activity.</p>

      {/* Tabs */}
      <div className="mt-6 space-y-8">
        {/* Active Queues */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Active Queues Today ({activeQueues?.length || 0})
          </h2>
          <AdminQueueMonitor queues={activeQueues || []} />
        </section>

        {/* Pending Approvals */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Pending Approvals ({pendingDoctors?.length || 0})
          </h2>
          {(!pendingDoctors || pendingDoctors.length === 0) ? (
            <div className="rounded-xl bg-white p-8 text-center text-gray-400 shadow-sm">
              No pending approvals.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.map((doc) => {
                const docUser = doc.users as { full_name: string; email: string }
                const docSpec = doc.specialties as { name: string }
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
                    <div>
                      <p className="font-semibold text-gray-900">Dr. {docUser.full_name}</p>
                      <p className="text-sm text-gray-500">{docSpec.name} · {docUser.email}</p>
                      <p className="text-xs text-gray-400">License: {doc.license_number}</p>
                    </div>
                    <div className="flex gap-2">
                      <form action={approveProvider}>
                        <input type="hidden" name="providerId" value={doc.id} />
                        <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                          Approve
                        </button>
                      </form>
                      <form action={rejectProvider} className="flex gap-2">
                        <input type="hidden" name="providerId" value={doc.id} />
                        <input
                          name="rejectionReason"
                          placeholder="Reason..."
                          className="w-40 rounded-lg border px-3 py-2 text-sm"
                        />
                        <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recently Rejected */}
        {rejectedDoctors && rejectedDoctors.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Recently Rejected</h2>
            <div className="space-y-2">
              {rejectedDoctors.map((doc) => {
                const docUser = doc.users as { full_name: string; email: string }
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dr. {docUser.full_name}</p>
                      <p className="text-xs text-gray-400">{docUser.email}</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                      {doc.rejection_reason || "Rejected"}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

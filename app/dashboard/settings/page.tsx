// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ScheduleForm from "@/components/queue/ScheduleForm"

export const metadata = {
  title: "Schedule Settings",
  description: "Configure your weekly working hours and queue settings.",
}

export default async function DoctorSettingsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: provider } = await supabase
    .from("providers")
    .select("id, is_verified")
    .eq("user_id", user.id)
    .single()

  if (!provider || !provider.is_verified) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-500">Your account must be verified.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure your weekly working hours. Your queue will auto-open and close based on this schedule.
        </p>
      </div>

      <ScheduleForm providerId={provider.id} />
    </div>
  )
}

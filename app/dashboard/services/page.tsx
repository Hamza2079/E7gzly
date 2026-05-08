import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ServiceManager from "@/components/services/ServiceManager"
import { getServicesForProvider } from "@/actions/services"

export const metadata = {
  title: "Service Manager",
  description: "Manage your clinic services and pricing.",
}

export default async function ServicesPage() {
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

  const services = await getServicesForProvider(provider.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services & Pricing</h1>
        <p className="mt-1 text-gray-500">
          Manage your clinic's services. These will be available for you to assign to patients after their consultation.
        </p>
      </div>

      <ServiceManager initialServices={services} />
    </div>
  )
}

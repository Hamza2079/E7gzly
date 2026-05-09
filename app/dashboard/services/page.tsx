import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ServiceManager from "@/components/services/ServiceManager"
import { getServicesForProvider } from "@/actions/services"

export const metadata = {
  title: "إدارة الخدمات",
  description: "إدارة خدمات عيادتك وأسعارها.",
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
      <div className="py-20 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-900">غير مصرح بالوصول</h2>
        <p className="mt-2 text-gray-500">يجب أن يكون حسابك موثّقاً للوصول إلى هذه الصفحة.</p>
      </div>
    )
  }

  const services = await getServicesForProvider(provider.id)

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الخدمات والأسعار</h1>
        <p className="mt-1 text-gray-500">
          إدارة خدمات عيادتك. ستكون هذه الخدمات متاحة لتعيينها للمرضى بعد الكشف.
        </p>
      </div>

      <ServiceManager initialServices={services} />
    </div>
  )
}

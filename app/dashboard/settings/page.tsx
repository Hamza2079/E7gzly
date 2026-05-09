// @ts-nocheck — Remove after regenerating types
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ScheduleForm from "@/components/queue/ScheduleForm"

export const metadata = {
  title: "إعدادات الجدول الزمني",
  description: "قم بتهيئة ساعات عملك الأسبوعية وإعدادات الطابور.",
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
      <div className="py-20 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-900">غير مصرح بالوصول</h2>
        <p className="mt-2 text-gray-500">يجب أن يكون حسابك موثّقاً للوصول إلى هذه الصفحة.</p>
      </div>
    )
  }

  const { data: limits } = await supabase
    .from("queue_day_limits")
    .select("*")
    .eq("provider_id", provider.id)

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إعدادات الجدول الزمني</h1>
        <p className="mt-1 text-gray-500">
          قم بتهيئة ساعات عملك الأسبوعية وحدود الحجز المسبق. سيفتح طابورك ويُغلق تلقائياً بناءً على هذا الجدول.
        </p>
      </div>

      <ScheduleForm providerId={provider.id} />
    </div>
  )
}

import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Bell, CheckCircle } from "lucide-react"

export const metadata = {
  title: "Notifications",
}

export default async function NotificationsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: notifications } = await (supabase as any)
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-gray-500">Your recent updates and alerts.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        {(!notifications || notifications.length === 0) ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">All caught up!</h3>
            <p className="mt-2 text-sm text-gray-500">You have no new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif: any) => (
              <div key={notif.id} className={`flex gap-4 p-5 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/50' : ''}`}>
                <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

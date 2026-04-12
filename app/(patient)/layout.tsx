import Navbar from "@/components/queue/Navbar"
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        {children}
      </main>
    </div>
  )
}

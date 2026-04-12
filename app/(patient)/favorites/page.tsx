// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Heart, Stethoscope, ArrowRight, Trash2 } from "lucide-react"

export const metadata = {
  title: "Saved Doctors",
}

export default async function FavoritesPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: favorites } = await supabase
    .from("patient_favorites")
    .select("*, providers(*, users(full_name, avatar_url), specialties(name))")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Doctors</h1>
        <p className="mt-1 text-gray-500">Quickly book queues with your favorite providers.</p>
      </div>

      {(!favorites || favorites.length === 0) ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No saved doctors yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            When you find a doctor you like, tap the heart icon to save them here for quick access later.
          </p>
          <Link
            href="/doctors"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Browse Doctors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {favorites.map((fav: any) => {
            const provider = fav.providers
            const doctorName = provider?.users?.full_name || "Unknown"
            const specialty = provider?.specialties?.name || "General"

            return (
              <div key={fav.id} className="group relative flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1">Dr. {doctorName}</h3>
                    <p className="text-sm font-medium text-blue-600">{specialty}</p>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {provider?.clinic_address ? provider.clinic_address : "No address provided"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-5 flex items-center justify-between border-t border-gray-50 pt-4">
                   <p className="text-sm font-semibold text-gray-900">{provider?.consultation_fee ? `${provider.consultation_fee} EGP` : "N/A"}</p>
                   <Link
                    href={`/doctors/${provider.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                   >
                     Book Turn
                   </Link>
                </div>
                {/* 
                  Note: A server action client button could be placed here to remove favorite, 
                  but linking to the doctor page where the favorite button is located is an easy alternative.
                */}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

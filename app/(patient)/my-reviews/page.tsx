// @ts-nocheck
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Star, MessageSquare } from "lucide-react"

export const metadata = {
  title: "My Reviews",
}

export default async function MyReviewsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, providers(users(full_name))")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="mt-1 text-gray-500">Feedback you've provided for your past clinic visits.</p>
      </div>

      <div className="space-y-4">
        {(!reviews || reviews.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No reviews yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              After completing a visit, you can leave a review to help others find great doctors.
            </p>
          </div>
        ) : (
          reviews.map((review: any) => (
            <div key={review.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div>
                  <h3 className="font-bold text-gray-900">Dr. {review.providers?.users?.full_name || "Unknown"}</h3>
                  <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-700">{review.comment || "No comment provided."}</p>
              </div>
              
              {review.provider_response && (
                <div className="mt-4 rounded-xl bg-blue-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <p className="text-xs font-bold text-blue-900">Doctor's Response</p>
                  </div>
                  <p className="mt-1 text-sm text-blue-800">{review.provider_response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

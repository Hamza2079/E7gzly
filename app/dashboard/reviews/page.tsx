import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Star, MessageCircle, Reply } from "lucide-react"
import { replyToReview } from "./actions"

export const metadata = {
  title: "Reviews Dashboard",
}

export default async function DoctorReviewsPage() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: provider } = await (supabase as any)
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!provider) redirect("/login")

  const { data: reviews } = await (supabase as any)
    .from("reviews")
    .select("*, users!reviews_patient_id_fkey(full_name)")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false })

  const totalReviews = reviews?.length || 0
  const avgRating = totalReviews > 0 
    ? (reviews!.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patient Reviews</h1>
        <p className="mt-2 text-gray-500">Monitor your feedback and build trust with your patients.</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Average Rating</p>
            <p className="text-2xl font-bold text-gray-900">{avgRating} <span className="text-sm font-normal text-gray-400">/ 5.0</span></p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
          </div>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {(!reviews || reviews.length === 0) ? (
           <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
             <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
             <h3 className="mt-4 text-lg font-semibold text-gray-900">No reviews yet</h3>
             <p className="mt-2 text-sm text-gray-500">When patients leave feedback, it will appear here.</p>
           </div>
        ) : (
          reviews.map((review: any) => {
            const patientName = review.users?.full_name || "Anonymous Patient"
            
            return (
              <div key={review.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{patientName}</h3>
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
                
                <div className="py-4">
                  <p className="text-sm text-gray-700">{review.comment || "No written feedback provided."}</p>
                </div>

                {review.provider_response ? (
                  <div className="mt-2 rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-bold text-blue-900 mb-1">Your Public Response:</p>
                    <p className="text-sm text-blue-800">{review.provider_response}</p>
                  </div>
                ) : (
                  <form action={replyToReview} className="mt-4 pt-4 border-t border-gray-50">
                    <input type="hidden" name="reviewId" value={review.id} />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        name="providerResponse"
                        placeholder="Write a public reply..."
                        required
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Reply className="h-4 w-4" /> Reply
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

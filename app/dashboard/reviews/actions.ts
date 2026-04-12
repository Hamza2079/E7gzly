"use server"

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function replyToReview(formData: FormData) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Must be logged in")

  const reviewId = formData.get("reviewId") as string
  const providerResponse = formData.get("providerResponse") as string

  if (!reviewId || !providerResponse) return

  // We rely on RLS policies to ensure the user actually owns this review's provider profile
  const { error } = await (supabase as any)
    .from("reviews")
    .update({ 
      provider_response: providerResponse 
    })
    .eq("id", reviewId)

  if (error) {
    console.error("Failed to post provider response", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/reviews")
}

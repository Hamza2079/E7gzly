"use server"

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Patient submits a review after their consultation is completed.
 */
export async function submitReview(
  entryId: string,
  providerId: string,
  rating: number,
  comment?: string
) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Validate rating
  if (rating < 1 || rating > 5) return { error: "Rating must be between 1 and 5" }

  // Verify the entry belongs to this patient and is completed
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("id, queue_id, patient_id, status")
    .eq("id", entryId)
    .eq("patient_id", user.id)
    .eq("status", "completed")
    .single()

  if (!entry) return { error: "Completed queue entry not found" }

  // Check if already reviewed
  const { data: existing } = await (supabase as any)
    .from("reviews")
    .select("id")
    .eq("queue_entry_id", entryId)
    .eq("patient_id", user.id)
    .maybeSingle()

  if (existing) return { error: "You have already reviewed this visit" }

  // Insert review
  const { error } = await (supabase as any)
    .from("reviews")
    .insert({
      patient_id: user.id,
      provider_id: providerId,
      queue_entry_id: entryId,
      rating,
      comment: comment?.trim() || null,
    })

  if (error) return { error: error.message }

  revalidatePath("/my-reviews")
  revalidatePath("/doctors")
  return { success: true }
}

"use server"

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(providerId: string, isFavorite: boolean) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Must be logged in to favorite doctors")

  if (isFavorite) {
    // Remove from favorites
    await (supabase as any).from("patient_favorites").delete().match({ patient_id: user.id, provider_id: providerId })
  } else {
    // Add to favorites
    await (supabase as any).from("patient_favorites").insert({ patient_id: user.id, provider_id: providerId })
  }

  revalidatePath("/favorites")
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${providerId}`)
}

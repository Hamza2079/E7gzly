"use server"

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updatePatientProfile(formData: FormData) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be logged in")
  }

  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const gender = formData.get("gender") as string
  const dob = formData.get("dateOfBirth") as string
  
  // Medical History
  const bloodType = formData.get("bloodType") as string
  const chronicDiseases = formData.get("chronicDiseases") as string
  const pastSurgeries = formData.get("pastSurgeries") as string
  const allergies = formData.get("allergies") as string
  const currentMedications = formData.get("currentMedications") as string

  const { error } = await (supabase as any)
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: dob || null,
      blood_type: bloodType || null,
      chronic_diseases: chronicDiseases || null,
      past_surgeries: pastSurgeries || null,
      allergies: allergies || null,
      current_medications: currentMedications || null,
    })
    .eq("id", user.id)

  if (error) {
    console.error("Profile update error", error)
    throw new Error(error.message)
  }

  revalidatePath("/profile")
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not logged in" }

  const { error } = await (supabase as any)
    .from("users")
    .update({ avatar_url: url })
    .eq("id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/profile")
  return { success: true }
}

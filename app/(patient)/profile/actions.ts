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

  const { error } = await (supabase as any)
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: dob || null,
    })
    .eq("id", user.id)

  if (error) {
    console.error("Profile update error", error)
    throw new Error(error.message)
  }

  revalidatePath("/profile")
}

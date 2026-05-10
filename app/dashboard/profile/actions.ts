"use server"

import { createServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateDoctorProfile(formData: FormData) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Must be logged in")

  // Extract Users Info
  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const gender = formData.get("gender") as string
  const dob = formData.get("dateOfBirth") as string

  // Extract Provider Info
  const licenseNumber = formData.get("licenseNumber") as string
  const bio = formData.get("bio") as string
  const yearsExpStr = formData.get("yearsOfExperience")
  const yearsOfExperience = yearsExpStr ? parseInt(yearsExpStr as string) : 0
  const clinicName = formData.get("clinicName") as string
  const clinicAddress = formData.get("clinicAddress") as string

  // 1. Update users table
  const { error: userError } = await (supabase as any)
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: dob || null,
    })
    .eq("id", user.id)

  if (userError) {
    console.error("Failed to update user metrics", userError)
    throw new Error(userError.message)
  }

  // 2. Update providers table
  const { error: providerError } = await (supabase as any)
    .from("providers")
    .update({
      license_number: licenseNumber,
      bio: bio || null,
      years_of_experience: yearsOfExperience,
      clinic_name: clinicName || null,
      clinic_address: clinicAddress || null,
    })
    .eq("user_id", user.id)

  if (providerError) {
    console.error("Failed to update provider metrics", providerError)
    throw new Error(providerError.message)
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/doctors")
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Must be logged in")

  const file = formData.get("file") as File
  if (!file) throw new Error("No file uploaded")

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/${Math.random()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", user.id)

  if (updateError) throw new Error(updateError.message)

  revalidatePath("/dashboard/profile")
  revalidatePath("/profile")
  revalidatePath("/doctors")
}

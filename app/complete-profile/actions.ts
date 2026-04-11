// @ts-nocheck — Remove after regenerating types
"use server"

import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase/server"

export async function completeProfile(formData: FormData) {
  const supabase = await createServer()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const role = formData.get("role") as string
  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const gender = formData.get("gender") as string
  const dateOfBirth = formData.get("dateOfBirth") as string

  // Update the user profile (using upsert so missing users are created)
  const { error: updateError } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: dateOfBirth || null,
      role: role === "doctor" ? "provider" : "patient",
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })

  if (updateError) {
    console.error("Profile update failed:", updateError)
    redirect("/complete-profile?error=" + encodeURIComponent(updateError.message))
  }

  // If doctor, create or update the providers row
  if (role === "doctor") {
    const specialtyId = formData.get("specialtyId") as string
    const licenseNumber = formData.get("licenseNumber") as string
    const bio = formData.get("bio") as string
    const yearsOfExperience = parseInt(formData.get("yearsOfExperience") as string) || 0
    const consultationFee = parseFloat(formData.get("consultationFee") as string) || 0
    const clinicName = formData.get("clinicName") as string
    const clinicAddress = formData.get("clinicAddress") as string
    const city = formData.get("city") as string

    const providerData = {
      user_id: user.id,
      specialty_id: specialtyId,
      license_number: licenseNumber,
      bio: bio || null,
      years_of_experience: yearsOfExperience,
      consultation_fee: consultationFee,
      clinic_name: clinicName || null,
      clinic_address: clinicAddress || null,
      city: city,
      is_verified: false,
      verification_status: "pending" as const,
      rejection_reason: null,
      slot_duration: 30,
    }

    // Check if a provider row already exists (re-application)
    const { data: existing } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .single()

    let error
    if (existing) {
      // Update existing row
      ;({ error } = await supabase
        .from("providers")
        .update(providerData)
        .eq("id", existing.id))
    } else {
      // Insert new row
      ;({ error } = await supabase
        .from("providers")
        .insert(providerData))
    }

    if (error) {
      console.error("Error saving provider:", error)
      redirect("/complete-profile?error=" + encodeURIComponent(error.message))
    }

    redirect("/pending-approval")
  }

  // Patient → go to dashboard
  redirect("/dashboard")
}

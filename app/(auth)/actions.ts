// @ts-nocheck — Remove after regenerating types with supabase gen types
"use server"

import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function signUpWithCredentials(formData: FormData) {
  const supabase = await createServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as string
  const gender = formData.get("gender") as string
  const dateOfBirth = formData.get("dateOfBirth") as string

  const specialtyId = formData.get("specialtyId") as string
  const licenseNumber = formData.get("licenseNumber") as string
  const bio = formData.get("bio") as string
  const yearsOfExperience = parseInt(formData.get("yearsOfExperience") as string) || 0
  const clinicName = formData.get("clinicName") as string
  const clinicAddress = formData.get("clinicAddress") as string
  const city = formData.get("city") as string

  // Medical History (for patients)
  const bloodType = formData.get("bloodType") as string
  const allergies = formData.get("allergies") as string
  const chronicDiseases = formData.get("chronicDiseases") as string
  const currentMedications = formData.get("currentMedications") as string

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role === "provider" ? "provider" : "patient",
        phone: phone || null,
        gender: gender || null,
        date_of_birth: dateOfBirth || null,
        // Provider specific fields
        specialty_id: specialtyId || null,
        license_number: licenseNumber || null,
        bio: bio || null,
        years_of_experience: yearsOfExperience || 0,
        consultation_fee: 0,
        clinic_name: clinicName || null,
        clinic_address: clinicAddress || null,
        city: city || null,
        // Patient specific fields
        blood_type: bloodType || null,
        allergies: allergies || null,
        chronic_diseases: chronicDiseases || null,
        current_medications: currentMedications || null,
      },
    },
  })

  if (error) {
    console.error("Sign up error:", error.message)
    redirect("/register?error=" + encodeURIComponent(error.message))
  }

  // Insert services using admin client
  if (role === "provider" && authData?.user) {
    const servicesStr = formData.get("services") as string
    if (servicesStr) {
      try {
        const servicesArr = JSON.parse(servicesStr)
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )
        const { data: provider } = await adminSupabase
          .from("providers")
          .select("id")
          .eq("user_id", authData.user.id)
          .single()
        
        if (provider) {
          await adminSupabase.from("services").insert(
            servicesArr.map((s: any) => ({
              provider_id: provider.id,
              name_en: s.name,
              name_ar: s.name,
              price: parseFloat(s.price),
              is_active: true
            }))
          )
        }
      } catch (e) {
        console.error("Failed to insert services", e)
      }
    }
  }

  // If doctor, redirect and show wait for admin message
  if (role === "provider") {
    redirect("/login?message=Account created! Check your email, then wait for admin approval.")
  }

  redirect("/login?message=Check your email to confirm your account")
}


export async function signInWithCredentials(formData: FormData) {
  const supabase = await createServer()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error.message)
    redirect("/login?error=" + encodeURIComponent(error.message))
  }

  // Check role to redirect properly
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") {
      redirect("/admin")
    }
  }

  redirect("/dashboard")
}

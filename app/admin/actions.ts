// @ts-nocheck — Remove after regenerating types
"use server"

import { revalidatePath } from "next/cache"
import { createServer } from "@/lib/supabase/server"

async function verifyAdmin() {
  const supabase = await createServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: adminUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (adminUser?.role !== "admin") return null

  return supabase
}

export async function approveProvider(formData: FormData) {
  const supabase = await verifyAdmin()
  if (!supabase) return

  const providerId = formData.get("providerId") as string

  await supabase
    .from("providers")
    .update({
      is_verified: true,
      verification_status: "approved",
      rejection_reason: null,
    })
    .eq("id", providerId)

  revalidatePath("/admin")
}

export async function rejectProvider(formData: FormData) {
  const supabase = await verifyAdmin()
  if (!supabase) return

  const providerId = formData.get("providerId") as string
  const reason = formData.get("reason") as string

  await supabase
    .from("providers")
    .update({
      is_verified: false,
      verification_status: "rejected",
      rejection_reason: reason || "No reason provided",
    })
    .eq("id", providerId)

  revalidatePath("/admin")
}

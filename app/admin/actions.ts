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

export async function softDeleteUser(formData: FormData) {
  const supabase = await verifyAdmin()
  if (!supabase) return

  const userId = formData.get("userId") as string
  const role = formData.get("role") as string

  // Mark the user as deleted in `users` table
  await supabase
    .from("users")
    .update({ is_deleted: true })
    .eq("id", userId)

  // If doctor, also mark in `providers` table
  if (role === "provider") {
    await supabase
      .from("providers")
      .update({ is_deleted: true })
      .eq("user_id", userId)
  }

  // To truly block login, we would also need to suspend the user in Auth
  // This requires the service role key to call supabase.auth.admin.updateUserById()
  // which can be implemented as needed.

  revalidatePath("/admin")
}

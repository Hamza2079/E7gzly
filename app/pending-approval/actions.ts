// @ts-nocheck — Remove after regenerating types
"use server"

import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase/server"

export async function reapplyAsDoctor() {
  const supabase = await createServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Reset the provider status back to pending
  await supabase
    .from("providers")
    .update({
      verification_status: "pending",
      rejection_reason: null,
    })
    .eq("user_id", user.id)

  // Send them to complete-profile to update their info
  // Reset profile_completed so they can edit
  await supabase
    .from("users")
    .update({ profile_completed: false })
    .eq("id", user.id)

  redirect("/complete-profile")
}

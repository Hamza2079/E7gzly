// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { createServer, createAdminClient } from "@/lib/supabase/server"

// ============================================================
// RECEPTIONIST QUEUE ACTIONS
// ============================================================

export async function receptionistAddWalkIn(sessionToken: string, patientName: string) {
  const supabase = await createServer()

  // Verify token using admin client to bypass RLS since receptionist is not logged in
  const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: queue } = await adminSupabase
    .from("queues")
    .select("id, current_number, provider_id, status, session_expires_at")
    .eq("session_token", sessionToken)
    .single()

  if (!queue) return { error: "Invalid session token" }
  if (queue.status !== "open") return { error: "Queue is not open" }
  
  if (queue.session_expires_at && new Date(queue.session_expires_at) < new Date()) {
    return { error: "Session has expired" }
  }

  const newNumber = queue.current_number + 1
  
  // Securely update queue number using admin client or standard service role if possible
  // Using standard supabase client for now, assuming RLS allows updates based on session token?
  // We need to bypass RLS here because receptionist is unauthenticated.
  // We use service_role for receptionist operations since token is the secret auth.
  
  // Update queue
  await adminSupabase
    .from("queues")
    .update({ current_number: newNumber })
    .eq("id", queue.id)

  // Get doctor user_id to use as proxy patient
  const { data: provider } = await adminSupabase
    .from("providers")
    .select("user_id")
    .eq("id", queue.provider_id)
    .single()

  // Insert entry
  const { error } = await adminSupabase
    .from("queue_entries")
    .insert({
      queue_id: queue.id,
      patient_id: provider?.user_id || "00000000-0000-0000-0000-000000000000", // proxy
      queue_number: newNumber,
      status: "ready",
      last_ready_at: new Date().toISOString(),
      visit_reason: `Walk-in: ${patientName}`,
      travel_category: "here",
      source: "walk_in",
    })

  if (error) return { error: error.message }
  revalidatePath(`/clinic/session/${sessionToken}`)
  return { queueNumber: newNumber }
}

export async function receptionistMarkPatientReady(sessionToken: string, entryId: string) {
  const supabase = await createServer()

  // Verify token using admin client
  const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: queue } = await adminSupabase
    .from("queues")
    .select("id, status, session_expires_at")
    .eq("session_token", sessionToken)
    .single()

  if (!queue) return { error: "Invalid session token" }
  if (queue.status !== "open") return { error: "Queue is not open" }
  if (queue.session_expires_at && new Date(queue.session_expires_at) < new Date()) {
    return { error: "Session has expired" }
  }

  // Update entry
  const { error } = await adminSupabase
    .from("queue_entries")
    .update({
      status: "ready",
      last_ready_at: new Date().toISOString(),
      travel_category: "here",
    })
    .eq("id", entryId)
    .eq("queue_id", queue.id) // Ensure entry belongs to this queue

  if (error) return { error: error.message }
  revalidatePath(`/clinic/session/${sessionToken}`)
  return { success: true }
}

export async function regenerateReceptionistSession(queueId: string) {
  // Doctor action (authenticated)
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from("queues")
    .update({
      session_token: crypto.randomUUID(),
      session_expires_at: endOfDay.toISOString()
    })
    .eq("id", queueId)
    .select("session_token")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { token: data.session_token }
}

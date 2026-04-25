/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — Remove after running migration 015 and regenerating types
"use server"

import { revalidatePath } from "next/cache"
import { createServer } from "@/lib/supabase/server"
import { TRAVEL_DURATIONS, type TravelCategory } from "@/types"

// ============================================================
// HELPERS
// ============================================================

async function getAuthUser() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

async function getOwnEntry(supabase: any, entryId: string, userId: string) {
  const { data } = await supabase
    .from("queue_entries")
    .select("id, queue_id, patient_id, status, travel_category")
    .eq("id", entryId)
    .eq("patient_id", userId)
    .in("status", ["ready", "not_ready", "waiting", "called", "in_progress"])
    .single()

  if (!data) throw new Error("Queue entry not found or not yours")
  return data
}

// ============================================================
// PATIENT SYNC ACTIONS
// ============================================================

/**
 * Patient updates their travel status and optional ETA.
 * Doctor sees travel indicator + ETA per patient in their queue panel.
 */
export async function updateTravelStatus(
  entryId: string,
  travelCategory: TravelCategory,
  etaMinutes?: number
) {
  const { supabase, user } = await getAuthUser()
  await getOwnEntry(supabase, entryId, user.id)

  // Calculate ETA timestamp from minutes if provided,
  // otherwise estimate from travel category
  const minutes = etaMinutes ?? TRAVEL_DURATIONS[travelCategory] ?? 0
  const patientEta = minutes > 0
    ? new Date(Date.now() + minutes * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from("queue_entries")
    .update({
      travel_category: travelCategory,
      patient_eta: patientEta,
      is_checked_in: travelCategory === "here",
      travel_updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * Patient confirms they are physically at the clinic.
 * Doctor sees ✅ badge on the waiting list.
 */
export async function checkInAtClinic(entryId: string) {
  const { supabase, user } = await getAuthUser()
  await getOwnEntry(supabase, entryId, user.id)

  const { error } = await supabase
    .from("queue_entries")
    .update({
      is_checked_in: true,
      travel_category: "here",
      patient_eta: null, // already here, no ETA needed
      travel_updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * Patient sends a quick message to the clinic.
 * e.g. "Running 5 min late, please don't skip me"
 * Doctor sees the message on the patient's row.
 */
export async function sendPatientMessage(entryId: string, message: string) {
  const { supabase, user } = await getAuthUser()
  await getOwnEntry(supabase, entryId, user.id)

  const trimmed = message.trim().slice(0, 200) // Cap at 200 chars
  if (!trimmed) return { error: "Message cannot be empty" }

  const { error } = await supabase
    .from("queue_entries")
    .update({ patient_message: trimmed })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * Clear patient message (after doctor has seen it or patient wants to remove).
 */
export async function clearPatientMessage(entryId: string) {
  const { supabase, user } = await getAuthUser()
  await getOwnEntry(supabase, entryId, user.id)

  const { error } = await supabase
    .from("queue_entries")
    .update({ patient_message: null })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * When a patient is called, they respond with:
 * - "coming" → confirms they're heading in
 * - "need_time" → asks for a grace extension with a message
 * 
 * Doctor sees the response and decides whether to wait or skip.
 */
export async function respondToCall(
  entryId: string,
  response: "coming" | "need_time",
  message?: string
) {
  const { supabase, user } = await getAuthUser()
  const entry = await getOwnEntry(supabase, entryId, user.id)

  if (entry.status !== "called") {
    return { error: "You can only respond when you've been called" }
  }

  if (response === "coming") {
    // Patient confirms they're on their way in
    const { error } = await supabase
      .from("queue_entries")
      .update({
        patient_message: "✅ On my way in!",
        is_checked_in: false, // will check in when they arrive
        travel_category: "here",
        travel_updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)

    if (error) return { error: error.message }
  } else {
    // Patient needs more time — sends a message to doctor
    const msg = message?.trim().slice(0, 200) || "I need a few more minutes"
    const { error } = await supabase
      .from("queue_entries")
      .update({
        patient_message: `⏳ ${msg}`,
        travel_updated_at: new Date().toISOString(),
      })
      .eq("id", entryId)

    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/queue")
  return { success: true, response }
}

/**
 * Patient requests more grace time when they've been called.
 * Doctor sees the request and can choose to extend or skip.
 */
export async function requestGraceExtension(
  entryId: string,
  extraMinutes: number = 3
) {
  const { supabase, user } = await getAuthUser()
  const entry = await getOwnEntry(supabase, entryId, user.id)

  if (entry.status !== "called") {
    return { error: "Can only request extension when called" }
  }

  // Cap at 10 min extension request
  const capped = Math.min(extraMinutes, 10)

  const { error } = await supabase
    .from("queue_entries")
    .update({
      patient_message: `🙏 Requesting ${capped} more min — please wait!`,
      travel_updated_at: new Date().toISOString(),
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true, requestedMinutes: capped }
}

/**
 * Patient marks themselves as ready to join the active queue line.
 */
export async function markReady(entryId: string) {
  const { supabase, user } = await getAuthUser()
  const entry = await getOwnEntry(supabase, entryId, user.id)

  if (entry.status !== "not_ready") {
    return { error: "You are already in the active queue" }
  }

  const { error } = await supabase
    .from("queue_entries")
    .update({
      status: "ready",
      last_ready_at: new Date().toISOString(),
      travel_category: "here", // Assuming they are nearby/here if they mark ready
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

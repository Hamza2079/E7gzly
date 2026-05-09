"use server"

import { revalidatePath } from "next/cache"
import { createServer } from "@/lib/supabase/server"
import type { VisitNote, PatientVisitSummary } from "@/types"

// ============================================================
// HELPERS
// ============================================================

async function getAuthUser() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

// ============================================================
// DOCTOR — WRITE / UPDATE VISIT NOTE
// ============================================================

/**
 * Doctor creates or updates the visit note for a queue entry.
 * Internal fields (chief_complaint, internal_notes) are never
 * exposed to the patient. Patient sees only prescription +
 * follow_up_instructions via the patient_visit_summaries view.
 */
export async function upsertVisitNote(
  entryId: string,
  noteData: {
    chiefComplaint?: string
    internalNotes?: string
    prescription?: string
    followUpInstructions?: string
  }
) {
  const { supabase, user } = await getAuthUser()

  // Resolve provider from this doctor's user
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_verified", true)
    .single()

  if (!provider) return { error: "غير مصرح لك بكتابة ملاحظات" }

  // Get the queue_entry to resolve patient_id
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("patient_id, queue_id")
    .eq("id", entryId)
    .single()

  if (!entry) return { error: "المريض غير موجود" }

  // Verify the entry belongs to this doctor's queue
  const { data: queue } = await supabase
    .from("queues")
    .select("provider_id")
    .eq("id", entry.queue_id)
    .single()

  if (!queue || queue.provider_id !== provider.id) {
    return { error: "لا يمكنك كتابة ملاحظات لهذه الزيارة" }
  }

  const { error } = await supabase
    .from("visit_notes")
    .upsert(
      {
        entry_id: entryId,
        patient_id: entry.patient_id,
        provider_id: provider.id,
        chief_complaint: noteData.chiefComplaint?.trim() || null,
        internal_notes: noteData.internalNotes?.trim() || null,
        prescription: noteData.prescription?.trim() || null,
        follow_up_instructions: noteData.followUpInstructions?.trim() || null,
      },
      { onConflict: "entry_id" }
    )

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

// ============================================================
// DOCTOR — READ FULL VISIT NOTE (internal access)
// ============================================================

export async function getVisitNote(entryId: string): Promise<VisitNote | null> {
  const supabase = await createServer()

  const { data } = await supabase
    .from("visit_notes")
    .select("*")
    .eq("entry_id", entryId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    entryId: data.entry_id,
    patientId: data.patient_id,
    providerId: data.provider_id,
    chiefComplaint: data.chief_complaint ?? undefined,
    internalNotes: data.internal_notes ?? undefined,
    prescription: data.prescription ?? undefined,
    followUpInstructions: data.follow_up_instructions ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ============================================================
// DOCTOR — PATIENT VISIT HISTORY (same doctor, same patient)
// ============================================================

/**
 * Returns the last N visits a patient has had with this doctor.
 * Used in the doctor dashboard history panel before/during consultation.
 * Returns full internal notes (provider-only context).
 */
export async function getPatientHistoryForDoctor(
  patientId: string,
  providerId: string,
  limit = 5
): Promise<VisitNote[]> {
  const supabase = await createServer()

  const { data } = await supabase
    .from("visit_notes")
    .select("*")
    .eq("patient_id", patientId)
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data || []).map((d) => ({
    id: d.id,
    entryId: d.entry_id,
    patientId: d.patient_id,
    providerId: d.provider_id,
    chiefComplaint: d.chief_complaint ?? undefined,
    internalNotes: d.internal_notes ?? undefined,
    prescription: d.prescription ?? undefined,
    followUpInstructions: d.follow_up_instructions ?? undefined,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }))
}

/**
 * Returns the patient's medical profile for the doctor dashboard.
 */
export async function getPatientMedicalProfile(patientId: string) {
  const supabase = await createServer()
  const { data } = await supabase
    .from("users")
    .select("blood_type, chronic_diseases, past_surgeries, allergies, current_medications")
    .eq("id", patientId)
    .single()
  return data || null
}

// ============================================================
// PATIENT — READ VISIT SUMMARY (via secure view)
// ============================================================

/**
 * Returns patient-visible summaries via the patient_visit_summaries view.
 * Contains ONLY: prescription, follow_up_instructions, services (receipt), total.
 * Internal notes are NEVER returned here.
 */
export async function getMyVisitSummaries(limit = 10): Promise<PatientVisitSummary[]> {
  const { supabase } = await getAuthUser()

  const { data } = await supabase
    .from("patient_visit_summaries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((d: any) => ({
    id: d.id as string,
    entryId: d.entry_id as string,
    patientId: d.patient_id as string,
    providerId: d.provider_id as string,
    prescription: d.prescription ?? undefined,
    followUpInstructions: d.follow_up_instructions ?? undefined,
    createdAt: d.created_at as string,
    services: d.services || [],
    totalAmount: d.total_amount || 0,
  }))
}

/**
 * Returns the patient-visible summary for a single visit entry.
 */
export async function getMyVisitSummary(entryId: string): Promise<PatientVisitSummary | null> {
  const { supabase } = await getAuthUser()

  const { data } = await supabase
    .from("patient_visit_summaries")
    .select("*")
    .eq("entry_id", entryId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id as string,
    entryId: data.entry_id as string,
    patientId: data.patient_id as string,
    providerId: data.provider_id as string,
    prescription: data.prescription ?? undefined,
    followUpInstructions: data.follow_up_instructions ?? undefined,
    createdAt: data.created_at as string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services: ((data.services as any[]) || []).map((s: any) => ({
      nameAr: s.name_ar,
      nameEn: s.name_en ?? undefined,
      quantity: s.quantity,
      price: s.price,
      subtotal: s.subtotal,
    })),
    totalAmount: data.total_amount || 0,
  }
}

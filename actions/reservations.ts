"use server"

import { revalidatePath } from "next/cache"
import { createServer } from "@/lib/supabase/server"
import type { DayAvailability, Reservation, ReservationStatus } from "@/types"

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
// AVAILABILITY — Browse upcoming days
// ============================================================

/**
 * Returns the next N available days for a given provider,
 * computing crowd level and whether the patient already has a reservation.
 *
 * "Available" means:
 *  - doctor_schedules has an active entry for that day-of-week
 *  - The date is within the provider's advance_days window
 *  - The date is not in the past
 */
export async function getAvailableDays(
  providerId: string,
  daysAhead = 14
): Promise<DayAvailability[]> {
  const supabase = await createServer()

  // Get current user (optional — they may not be logged in yet)
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Fetch doctor's schedules
  const { data: schedules } = await supabase
    .from("doctor_schedules")
    .select("day_of_week, start_time, end_time, is_active")
    .eq("provider_id", providerId)
    .eq("is_active", true)

  if (!schedules || schedules.length === 0) return []

  // 2. Fetch day limits for this provider
  const { data: limits } = await supabase
    .from("queue_day_limits")
    .select("day_of_week, max_reservations, advance_days, is_active")
    .eq("provider_id", providerId)

  const limitsMap = new Map(
    (limits || []).map((l) => [l.day_of_week, l])
  )
  const schedulesMap = new Map(
    schedules.map((s) => [s.day_of_week, s])
  )

  // 3. Build date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const results: DayAvailability[] = []

  for (let offset = 1; offset <= daysAhead; offset++) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    const dayOfWeek = date.getDay()
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const schedule = schedulesMap.get(dayOfWeek)
    if (!schedule) continue

    const limit = limitsMap.get(dayOfWeek)
    const maxReservations = limit?.max_reservations ?? 20
    const advanceDays = limit?.advance_days ?? 7
    const limitActive = limit?.is_active ?? true

    // Skip if day limit config is disabled or date is beyond advance window
    if (!limitActive) continue
    if (offset > advanceDays) continue

    results.push({
      date: dateStr,
      dayOfWeek,
      scheduleStart: schedule.start_time,
      scheduleEnd: schedule.end_time,
      reservationCount: 0, // will fill in bulk below
      maxReservations,
      isFull: false,
      crowdLevel: "low",
    })
  }

  if (results.length === 0) return []

  // 4. Bulk-fetch reservation counts for all dates
  const dates = results.map((r) => r.date)
  const { data: reservationRows } = await supabase
    .from("queue_reservations")
    .select("reserved_date")
    .eq("provider_id", providerId)
    .in("reserved_date", dates)
    .in("status", ["pending", "confirmed"])

  const countMap = new Map<string, number>()
  for (const row of reservationRows || []) {
    countMap.set(row.reserved_date, (countMap.get(row.reserved_date) || 0) + 1)
  }

  // 5. Fetch current user's reservations if logged in
  let myReservationMap = new Map<string, Reservation>()
  if (user) {
    const { data: myRows } = await supabase
      .from("queue_reservations")
      .select("*")
      .eq("provider_id", providerId)
      .eq("patient_id", user.id)
      .in("reserved_date", dates)
      .in("status", ["pending", "confirmed"])

    for (const r of myRows || []) {
      myReservationMap.set(r.reserved_date, {
        id: r.id,
        providerId: r.provider_id,
        patientId: r.patient_id,
        reservedDate: r.reserved_date,
        reservationNumber: r.reservation_number,
        status: r.status as ReservationStatus,
        visitReason: r.visit_reason ?? undefined,
        notes: r.notes ?? undefined,
        convertedEntryId: r.converted_entry_id ?? undefined,
        cancelledAt: r.cancelled_at ?? undefined,
        createdAt: r.created_at,
      })
    }
  }

  // 6. Compute crowd level and fill counts
  return results.map((day) => {
    const count = countMap.get(day.date) || 0
    const ratio = count / day.maxReservations
    const isFull = count >= day.maxReservations
    const crowdLevel: DayAvailability["crowdLevel"] = isFull
      ? "full"
      : ratio >= 0.75
      ? "high"
      : ratio >= 0.4
      ? "moderate"
      : "low"

    return {
      ...day,
      reservationCount: count,
      isFull,
      crowdLevel,
      myReservation: myReservationMap.get(day.date),
    }
  })
}

// ============================================================
// CREATE RESERVATION
// ============================================================

/**
 * Patient books a future spot.
 * Validates capacity, checks for duplicate, assigns reservation_number.
 * Uses optimistic retry loop (same as joinQueue) to handle race conditions.
 */
export async function createReservation(
  providerId: string,
  reservedDate: string,
  visitReason?: string,
  notes?: string
) {
  const { supabase, user } = await getAuthUser()

  // 1. Validate the date is in the future
  const todayDate = new Date()
  const year = todayDate.getFullYear()
  const month = String(todayDate.getMonth() + 1).padStart(2, '0')
  const day = String(todayDate.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  if (reservedDate <= todayStr) {
    return { error: "يجب اختيار يوم مستقبلي للحجز" }
  }

  // 2. Check the doctor has a schedule for this day
  const dayOfWeek = new Date(reservedDate + "T12:00:00").getDay()
  const { data: schedule } = await supabase
    .from("doctor_schedules")
    .select("id")
    .eq("provider_id", providerId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  if (!schedule) {
    return { error: "الطبيب لا يعمل في هذا اليوم" }
  }

  // 3. Check capacity
  const { data: limitRow } = await supabase
    .from("queue_day_limits")
    .select("max_reservations, advance_days, is_active")
    .eq("provider_id", providerId)
    .eq("day_of_week", dayOfWeek)
    .maybeSingle()

  const maxReservations = limitRow?.max_reservations ?? 20
  const advanceDays = limitRow?.advance_days ?? 7
  const limitActive = limitRow?.is_active ?? true

  if (!limitActive) {
    return { error: "الحجز المسبق غير متاح لهذا اليوم" }
  }

  // Check advance window
  const diffDays = Math.ceil(
    (new Date(reservedDate + "T12:00:00").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays > advanceDays) {
    return { error: `لا يمكن الحجز أكثر من ${advanceDays} يوم مسبقاً` }
  }

  // 4. Check current count vs. capacity
  const { count: currentCount } = await supabase
    .from("queue_reservations")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("reserved_date", reservedDate)
    .in("status", ["pending", "confirmed"])

  if ((currentCount || 0) >= maxReservations) {
    return { error: "هذا اليوم ممتلئ. جرب يوماً آخر" }
  }

  // 5. Check if patient already has an active reservation for this day
  const { data: existing } = await supabase
    .from("queue_reservations")
    .select("id")
    .eq("provider_id", providerId)
    .eq("patient_id", user.id)
    .eq("reserved_date", reservedDate)
    .in("status", ["pending", "confirmed"])
    .maybeSingle()

  if (existing) {
    return { error: "لديك حجز مسبق لهذا اليوم بالفعل", reservationId: existing.id }
  }

  // 6. Atomically assign reservation_number with retry loop
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { data: maxRow } = await supabase
      .from("queue_reservations")
      .select("reservation_number")
      .eq("provider_id", providerId)
      .eq("reserved_date", reservedDate)
      .order("reservation_number", { ascending: false })
      .limit(1)
      .maybeSingle()

    const newNumber = (maxRow?.reservation_number || 0) + 1

    const { data: reservation, error } = await supabase
      .from("queue_reservations")
      .insert({
        provider_id: providerId,
        patient_id: user.id,
        reserved_date: reservedDate,
        reservation_number: newNumber,
        status: "pending",
        visit_reason: visitReason || null,
        notes: notes || null,
      })
      .select("id, reservation_number")
      .single()

    if (!error) {
      revalidatePath(`/doctors/${providerId}`)
      return {
        reservationId: reservation.id,
        reservationNumber: reservation.reservation_number,
      }
    }

    // Unique constraint violation — retry
    if (error.code !== "23505" || attempt === MAX_RETRIES - 1) {
      return { error: error.message }
    }
  }

  return { error: "الطلب مزدحم حالياً، حاول مجدداً" }
}

// ============================================================
// CANCEL RESERVATION
// ============================================================

/**
 * Patient cancels a future reservation.
 * Q3 rule: only allowed BEFORE the queue is opened for that day.
 */
export async function cancelReservation(reservationId: string) {
  const { supabase, user } = await getAuthUser()

  // Fetch the reservation
  const { data: reservation } = await supabase
    .from("queue_reservations")
    .select("id, provider_id, reserved_date, patient_id, status")
    .eq("id", reservationId)
    .eq("patient_id", user.id)
    .single()

  if (!reservation) {
    return { error: "الحجز غير موجود" }
  }

  if (reservation.status === "cancelled") {
    return { error: "الحجز ملغى بالفعل" }
  }

  if (reservation.status === "converted") {
    return { error: "تم تفعيل حجزك في قائمة الانتظار، لا يمكن الإلغاء" }
  }

  // Q3: Check if the queue for this day is already open
  const { data: existingQueue } = await supabase
    .from("queues")
    .select("status")
    .eq("provider_id", reservation.provider_id)
    .eq("date", reservation.reserved_date)
    .maybeSingle()

  if (existingQueue && existingQueue.status === "open") {
    return { error: "بدأ الدكتور العيادة، لا يمكن الإلغاء بعد فتح القائمة" }
  }

  const { error } = await supabase
    .from("queue_reservations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("patient_id", user.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

// ============================================================
// GET PATIENT'S RESERVATIONS
// ============================================================

export async function getMyReservations(): Promise<Reservation[]> {
  const { supabase, user } = await getAuthUser()

  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("queue_reservations")
    .select("*")
    .eq("patient_id", user.id)
    .gte("reserved_date", today)
    .in("status", ["pending", "confirmed"])
    .order("reserved_date", { ascending: true })

  return (data || []).map((r) => ({
    id: r.id,
    providerId: r.provider_id,
    patientId: r.patient_id,
    reservedDate: r.reserved_date,
    reservationNumber: r.reservation_number,
    status: r.status as ReservationStatus,
    visitReason: r.visit_reason ?? undefined,
    notes: r.notes ?? undefined,
    convertedEntryId: r.converted_entry_id ?? undefined,
    cancelledAt: r.cancelled_at ?? undefined,
    createdAt: r.created_at,
  }))
}

// ============================================================
// GET DOCTOR'S RESERVATIONS FOR A DAY
// ============================================================

export async function getReservationsForDay(
  providerId: string,
  date: string
): Promise<Reservation[]> {
  const supabase = await createServer()

  const { data } = await supabase
    .from("queue_reservations")
    .select("*, users!patient_id(id, full_name, phone)")
    .eq("provider_id", providerId)
    .eq("reserved_date", date)
    .in("status", ["pending", "confirmed"])
    .order("reservation_number", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((r: any) => ({
    id: r.id,
    providerId: r.provider_id,
    patientId: r.patient_id,
    reservedDate: r.reserved_date,
    reservationNumber: r.reservation_number,
    status: r.status as ReservationStatus,
    visitReason: r.visit_reason ?? undefined,
    notes: r.notes ?? undefined,
    convertedEntryId: r.converted_entry_id ?? undefined,
    cancelledAt: r.cancelled_at ?? undefined,
    createdAt: r.created_at,
    patient: r.users
      ? {
          id: r.users.id,
          fullName: r.users.full_name,
          phone: r.users.phone,
        }
      : undefined,
  }) as Reservation)
}

// ============================================================
// CONVERT RESERVATIONS → QUEUE ENTRIES (called by openQueue)
// ============================================================

/**
 * Called automatically inside openQueue() when the doctor starts the day.
 * Converts all pending/confirmed reservations for today into real queue_entries
 * with status='not_ready'. Preserves reservation order for queue_number assignment.
 *
 * Patients must still tap "I'm here" (ready) when they arrive.
 */
export async function convertReservationsToQueue(
  queueId: string,
  providerId: string,
  date: string
) {
  const supabase = await createServer()

  // Get all pending/confirmed reservations for this day, ordered by number
  const { data: reservations } = await supabase
    .from("queue_reservations")
    .select("*")
    .eq("provider_id", providerId)
    .eq("reserved_date", date)
    .in("status", ["pending", "confirmed"])
    .order("reservation_number", { ascending: true })

  if (!reservations || reservations.length === 0) return { converted: 0 }

  // Get the current max queue_number to continue numbering
  const { data: maxEntry } = await supabase
    .from("queue_entries")
    .select("queue_number")
    .eq("queue_id", queueId)
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  let nextNumber = (maxEntry?.queue_number || 0) + 1
  let converted = 0

  for (const reservation of reservations) {
    // Check if this patient already has an active entry in this queue
    const { data: existingEntry } = await supabase
      .from("queue_entries")
      .select("id")
      .eq("queue_id", queueId)
      .eq("patient_id", reservation.patient_id)
      .in("status", ["ready", "not_ready", "called", "in_progress"])
      .maybeSingle()

    if (existingEntry) {
      // Already in queue — just mark reservation as converted
      await supabase
        .from("queue_reservations")
        .update({
          status: "converted",
          converted_entry_id: existingEntry.id,
        })
        .eq("id", reservation.id)
      continue
    }

    // Insert queue_entry
    const { data: entry, error } = await supabase
      .from("queue_entries")
      .insert({
        queue_id: queueId,
        patient_id: reservation.patient_id,
        queue_number: nextNumber,
        status: "not_ready",  // Q2: patient must check in physically
        visit_reason: reservation.visit_reason || null,
        travel_category: "nearby",
        source: "app",
      })
      .select("id")
      .single()

    if (!error && entry) {
      // Mark reservation as converted
      await supabase
        .from("queue_reservations")
        .update({
          status: "converted",
          converted_entry_id: entry.id,
        })
        .eq("id", reservation.id)

      nextNumber++
      converted++
    }
  }

  // Update queue's current_number
  if (converted > 0) {
    await supabase
      .from("queues")
      .update({ current_number: nextNumber - 1 })
      .eq("id", queueId)
  }

  return { converted }
}

// ============================================================
// UPSERT DAY LIMIT (doctor settings)
// ============================================================

export async function upsertDayLimit(formData: FormData) {
  const { supabase, user } = await getAuthUser()

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!provider) return { error: "Provider not found" }

  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string)
  const maxReservations = parseInt(formData.get("maxReservations") as string) || 20
  const advanceDays = parseInt(formData.get("advanceDays") as string) || 7
  const isActive = formData.get("isActive") !== "false"

  const { error } = await supabase
    .from("queue_day_limits")
    .upsert(
      {
        provider_id: provider.id,
        day_of_week: dayOfWeek,
        max_reservations: maxReservations,
        advance_days: advanceDays,
        is_active: isActive,
      },
      { onConflict: "provider_id,day_of_week" }
    )

  if (error) return { error: error.message }
  revalidatePath("/dashboard/settings")
  return { success: true }
}

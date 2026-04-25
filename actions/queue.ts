/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — Remove this after running migration 010 and regenerating types
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// ============================================================
// HELPERS
// ============================================================

async function getAuthUser() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

async function getProviderForUser(supabase: Awaited<ReturnType<typeof createServer>>, userId: string) {
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", userId)
    .eq("is_verified", true)
    .single()
  if (!data) throw new Error("Not a verified provider")
  return data
}

// ============================================================
// DOCTOR SCHEDULE ACTIONS
// ============================================================

export async function upsertSchedule(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string)
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const breakStart = (formData.get("breakStart") as string) || null
  const breakEnd = (formData.get("breakEnd") as string) || null
  const maxActive = parseInt(formData.get("maxActive") as string) || 33
  const queueWindow = parseInt(formData.get("queueWindow") as string) || 10
  const gracePeriod = parseInt(formData.get("gracePeriod") as string) || 3
  const isActive = formData.get("isActive") === "true"

  const { error } = await supabase
    .from("doctor_schedules")
    .upsert({
      provider_id: provider.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      break_start: breakStart,
      break_end: breakEnd,
      max_active: maxActive,
      queue_window: queueWindow,
      grace_period: gracePeriod,
      is_active: isActive,
    }, {
      onConflict: "provider_id,day_of_week",
    })

  if (error) throw new Error(error.message)
  revalidatePath("/dashboard/settings")
}

export async function getSchedules(providerId: string) {
  const supabase = await createServer()
  const { data } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("provider_id", providerId)
    .order("day_of_week")
  return data || []
}

// ============================================================
// QUEUE LIFECYCLE ACTIONS
// ============================================================

export async function openQueue() {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  const today = new Date().toISOString().split("T")[0]
  const dayOfWeek = new Date().getDay()

  // Get schedule for today
  const { data: schedule } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("provider_id", provider.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .single()

  const { data: existing } = await supabase
    .from("queues")
    .select("id, status")
    .eq("provider_id", provider.id)
    .eq("date", today)
    .single()

  if (existing) {
    if (existing.status === "completed") {
      return { error: "Today's queue is already completed" }
    }
    // Reopen if closed/paused
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)
    await supabase
      .from("queues")
      .update({ 
        status: "open", 
        paused_at: null,
        session_expires_at: endOfDay.toISOString() 
      })
      .eq("id", existing.id)
    revalidatePath("/dashboard/queue")
    return { queueId: existing.id }
  }

  const { data: queue, error } = await supabase
    .from("queues")
    .insert({
      provider_id: provider.id,
      schedule_id: schedule?.id || null,
      date: today,
      status: "open",
      started_at: new Date().toISOString(),
      session_expires_at: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { queueId: queue.id }
}

export async function pauseQueue(queueId: string, breakMinutes?: number) {
  const { supabase } = await getAuthUser()
  
  // Calculate break_until if breakMinutes provided
  const breakUntil = breakMinutes
    ? new Date(Date.now() + breakMinutes * 60 * 1000).toISOString()
    : null

  const { error } = await supabase
    .from("queues")
    .update({
      status: "paused",
      paused_at: new Date().toISOString(),
      break_until: breakUntil,
    })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
}

export async function resumeQueue(queueId: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({
      status: "open",
      paused_at: null,
      break_until: null, // Clear break info
    })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
}

export async function closeQueue(queueId: string, reason?: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      break_until: null,
      doctor_message: reason || null,
      session_expires_at: new Date().toISOString() // Expire session instantly
    })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
}

// ============================================================
// DOCTOR SYNC ACTIONS (messages & break)
// ============================================================

/**
 * Doctor broadcasts a message to all waiting patients.
 * Patients see this as a banner on their ticket.
 * e.g. "Running 15 min late" or "Taking a long case"
 */
export async function sendDoctorMessage(queueId: string, message: string) {
  const { supabase } = await getAuthUser()
  const trimmed = message.trim().slice(0, 300)
  if (!trimmed) return { error: "Message cannot be empty" }

  const { error } = await supabase
    .from("queues")
    .update({ doctor_message: trimmed })
    .eq("id", queueId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * Clear the doctor's broadcast message.
 */
export async function clearDoctorMessage(queueId: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({ doctor_message: null })
    .eq("id", queueId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

/**
 * Doctor extends a called patient's grace period.
 * Used when patient says "I'm 5 min away" and doctor decides to wait.
 */
export async function extendGracePeriod(entryId: string, extraMinutes: number = 3) {
  const { supabase } = await getAuthUser()

  const capped = Math.min(extraMinutes, 10)
  const newDeadline = new Date(Date.now() + capped * 60 * 1000).toISOString()

  const { error } = await supabase
    .from("queue_entries")
    .update({
      grace_deadline: newDeadline,
      patient_message: null, // Clear the request since doctor acted
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

// ============================================================
// PATIENT QUEUE ACTIONS
// ============================================================

export async function joinQueue(
  queueId: string,
  visitReason?: string,
  travelCategory: string = "here"
) {
  const { supabase, user } = await getAuthUser()

  // 1. Get queue info
  const { data: queue } = await supabase
    .from("queues")
    .select("*, providers!inner(id)")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }
  if (queue.status !== "open") return { error: "Queue is not open" }

  // Look up the LIVE schedule directly — not through the foreign key
  // This ensures any changes the doctor just made take effect immediately
  const dayOfWeek = new Date().getDay()
  const { data: scheduleRow } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("provider_id", (queue.providers as { id: string }).id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  const schedule = scheduleRow as {
    max_active: number
    start_time: string
    end_time: string
    queue_window: number
    grace_period: number
    break_start: string | null
    break_end: string | null
  } | null

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // 2. Enforce start_time — can't join before clinic opens
  if (schedule?.start_time) {
    const [startH, startM] = schedule.start_time.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    if (currentMinutes < startMinutes) {
      return { error: `Queue opens at ${schedule.start_time}. Please come back later.` }
    }
  }

  // 3. Enforce end_time — can't join if estimated wait exceeds remaining time
  const { count: waitingAhead } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["ready", "called"])

  const estimatedWait = (waitingAhead || 0) * queue.avg_duration

  if (schedule?.end_time) {
    const [endH, endM] = schedule.end_time.split(":").map(Number)
    const endMinutes = endH * 60 + endM
    const remaining = endMinutes - currentMinutes
    if (remaining <= 0) {
      return { error: "Clinic hours are over for today." }
    }
    if (estimatedWait > remaining) {
      return { error: "Doctor may not be able to see you today. Estimated wait exceeds remaining work time." }
    }
  }

  // 4. Enforce queue_window — only accept patients within a booking window
  // queue_window defines how many patients can be in line at once
  if (schedule?.queue_window) {
    if ((waitingAhead || 0) >= schedule.queue_window) {
      return { error: `Queue window is full (max ${schedule.queue_window} waiting). Please try again shortly.` }
    }
  }

  // 5. Enforce max_active — rolling capacity cap
  const maxActive = schedule?.max_active || 33

  const { count: activeCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["ready", "not_ready", "called", "in_progress"])

  if ((activeCount || 0) >= maxActive) {
    return { error: "Queue is full. Please try again later." }
  }

  // 4. Check if already in queue
  const { data: existingEntry } = await supabase
    .from("queue_entries")
    .select("id")
    .eq("queue_id", queueId)
    .eq("patient_id", user.id)
    .in("status", ["ready", "not_ready", "called", "in_progress"])
    .maybeSingle()

  if (existingEntry) {
    return { error: "You are already in this queue", entryId: existingEntry.id }
  }

  // 5. Atomically increment queue number and insert
  // Calculate true next number directly from actual queue entries to guarantee sequence safety
  const { data: maxEntry } = await supabase
    .from("queue_entries")
    .select("queue_number")
    .eq("queue_id", queueId)
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const newNumber = Math.max((maxEntry?.queue_number || 0) + 1, queue.current_number + 1)

  // Use admin client securely to bypass patient RLS blocking on the queues table updates
  const adminSupabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  
  await adminSupabase
    .from("queues")
    .update({ current_number: newNumber })
    .eq("id", queueId)


  // Determine initial readiness
  const isReady = travelCategory === "here"
  
  // Insert the entry
  const { data: entry, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      patient_id: user.id,
      queue_number: newNumber,
      status: isReady ? "ready" : "not_ready",
      last_ready_at: isReady ? new Date().toISOString() : null,
      visit_reason: visitReason || null,
      travel_category: travelCategory,
      source: "app",
    })
    .select("id, queue_number")
    .single()

  if (error) return { error: error.message }

  return {
    entryId: entry.id,
    queueNumber: entry.queue_number,
    position: (waitingAhead || 0) + 1,
    estimatedWait,
  }
}

export async function leaveQueue(entryId: string) {
  const { supabase, user } = await getAuthUser()

  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "cancelled" })
    .eq("id", entryId)
    .eq("patient_id", user.id)
    .in("status", ["ready", "not_ready", "called"])

  if (error) return { error: error.message }
  revalidatePath("/dashboard")
  return { success: true }
}

// ============================================================
// DOCTOR QUEUE MANAGEMENT ACTIONS
// ============================================================

export async function callNextPatient(queueId: string) {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  // Get the queue
  const { data: queue } = await supabase
    .from("queues")
    .select("*")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }

  // Look up the LIVE schedule directly for the current grace_period
  const dayOfWeek = new Date().getDay()
  const { data: scheduleRow } = await supabase
    .from("doctor_schedules")
    .select("grace_period")
    .eq("provider_id", provider.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  const gracePeriod = scheduleRow?.grace_period || 3

  // Find next READY patient strictly ordered by last_ready_at ASC, with queue_number as tie-breaker
  const { data: nextEntry } = await supabase
    .from("queue_entries")
    .select("*, users(full_name, phone)")
    .eq("queue_id", queueId)
    .eq("status", "ready")
    .order("last_ready_at", { ascending: true })
    .order("queue_number", { ascending: true })
    .limit(1)
    .single()

  if (!nextEntry) return { error: "No ready patients" }

  // Set grace deadline
  const graceDeadline = new Date(Date.now() + gracePeriod * 60 * 1000).toISOString()

  await supabase
    .from("queue_entries")
    .update({
      status: "called",
      called_at: new Date().toISOString(),
      grace_deadline: graceDeadline,
    })
    .eq("id", nextEntry.id)

  // Update current serving
  await supabase
    .from("queues")
    .update({ current_serving: nextEntry.queue_number })
    .eq("id", queueId)

  revalidatePath("/dashboard/queue")
  return { entry: nextEntry, graceDeadline }
}

export async function callNextNotReadyPatient(queueId: string) {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  // Get the queue
  const { data: queue } = await supabase
    .from("queues")
    .select("*")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }

  // Look up the LIVE schedule directly for the current grace_period
  const dayOfWeek = new Date().getDay()
  const { data: scheduleRow } = await supabase
    .from("doctor_schedules")
    .select("grace_period")
    .eq("provider_id", provider.id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  const gracePeriod = scheduleRow?.grace_period || 3

  // Find next NOT_READY patient (ordered by creation time, then queue number)
  const { data: nextEntry } = await supabase
    .from("queue_entries")
    .select("*, users(full_name, phone)")
    .eq("queue_id", queueId)
    .eq("status", "not_ready")
    .order("joined_at", { ascending: true })
    .order("queue_number", { ascending: true })
    .limit(1)
    .single()

  if (!nextEntry) return { error: "No not-ready patients" }

  // Set grace deadline
  const graceDeadline = new Date(Date.now() + gracePeriod * 60 * 1000).toISOString()

  await supabase
    .from("queue_entries")
    .update({
      status: "called",
      called_at: new Date().toISOString(),
      grace_deadline: graceDeadline,
    })
    .eq("id", nextEntry.id)

  // Update current serving
  await supabase
    .from("queues")
    .update({ current_serving: nextEntry.queue_number })
    .eq("id", queueId)

  revalidatePath("/dashboard/queue")
  return { entry: nextEntry, graceDeadline }
}

export async function startConsultation(entryId: string) {
  const { supabase } = await getAuthUser()

  const { error } = await supabase
    .from("queue_entries")
    .update({
      status: "in_progress",
      grace_deadline: null, // Cancel auto-skip
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { success: true }
}

export async function completePatient(entryId: string, autoAdvance: boolean = true) {
  const { supabase } = await getAuthUser()

  const now = new Date().toISOString()

  // Get entry to calculate duration
  const { data: entry } = await supabase
    .from("queue_entries")
    .select("queue_id, called_at")
    .eq("id", entryId)
    .single()

  if (!entry) return { error: "Entry not found" }

  // Mark as completed
  await supabase
    .from("queue_entries")
    .update({ status: "completed", completed_at: now })
    .eq("id", entryId)

  // Recalculate avg_duration from last 20 completions
  const { data: recentEntries } = await supabase
    .from("queue_entries")
    .select("called_at, completed_at")
    .eq("queue_id", entry.queue_id)
    .eq("status", "completed")
    .not("called_at", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(20)

  let newAvg = 10
  if (recentEntries && recentEntries.length > 0) {
    const totalMinutes = recentEntries.reduce((sum, e) => {
      const dur = (new Date(e.completed_at!).getTime() - new Date(e.called_at!).getTime()) / 60000
      return sum + Math.max(dur, 1) // minimum 1 minute
    }, 0)
    newAvg = Math.max(Math.round(totalMinutes / recentEntries.length), 1)
  }

  // Calculate delay_minutes: compare actual avg vs schedule slot_duration
  const { data: queueWithSchedule } = await supabase
    .from("queues")
    .select("doctor_schedules(*)")
    .eq("id", entry.queue_id)
    .single()

  let delayMinutes = 0
  // If avg is significantly higher than expected, there's a delay
  // We use a simple heuristic: count waiting patients × (actual_avg - expected_avg)
  const { count: waitingCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", entry.queue_id)
    .in("status", ["ready", "not_ready"])

  if (waitingCount && waitingCount > 0 && newAvg > 10) {
    // Simple delay estimate
    delayMinutes = Math.max(0, Math.round((newAvg - 10) * waitingCount * 0.3))
  }

  await supabase
    .from("queues")
    .update({
      avg_duration: newAvg,
      delay_minutes: delayMinutes,
    })
    .eq("id", entry.queue_id)

  // Auto-advance: call the next patient automatically
  let nextEntry = null
  if (autoAdvance) {
    const result = await callNextPatient(entry.queue_id)
    if (result && "entry" in result) {
      nextEntry = result.entry
    }
  }

  revalidatePath("/dashboard/queue")
  return { success: true, nextEntry }
}

export async function skipPatient(entryId: string) {
  const { supabase } = await getAuthUser()

  const { data: entry } = await supabase
    .from("queue_entries")
    .select("defer_count, queue_id")
    .eq("id", entryId)
    .single()

  if (!entry) return { error: "Entry not found" }

  const currentDeferCount = entry.defer_count || 0

  if (currentDeferCount < 1) {
    // Penalty Deferral: move back to not_ready, increment defer_count
    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "not_ready",
        defer_count: currentDeferCount + 1,
        grace_deadline: null,
      })
      .eq("id", entryId)

    if (error) return { error: error.message }
  } else {
    // Elimination: 2nd strike, mark as no_show
    const { error } = await supabase
      .from("queue_entries")
      .update({
        status: "no_show",
        grace_deadline: null,
      })
      .eq("id", entryId)

    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/queue")
  return { success: true }
}

export async function addWalkIn(queueId: string, patientName: string) {
  const { supabase, user } = await getAuthUser()

  // Get current number
  const { data: queue } = await supabase
    .from("queues")
    .select("current_number")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }

  const newNumber = queue.current_number + 1
  await supabase
    .from("queues")
    .update({ current_number: newNumber })
    .eq("id", queueId)

  // For walk-in, we use the doctor's own user_id as patient placeholder
  // In a real system you'd have a walk-in registration flow
  const { error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      patient_id: user.id, // doctor acts as proxy
      queue_number: newNumber,
      status: "ready",
      last_ready_at: new Date().toISOString(),
      visit_reason: `Walk-in: ${patientName}`,
      travel_category: "here",
      source: "walk_in",
    })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { queueNumber: newNumber }
}

// ============================================================
// QUEUE STATUS (read-only)
// ============================================================

export async function getQueueStatus(queueId: string) {
  const supabase = await createServer()

  const { data: queue } = await supabase
    .from("queues")
    .select("*, providers(*, users(full_name), specialties(name))")
    .eq("id", queueId)
    .single()

  if (!queue) return null

  const { count: waitingCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "ready")

  const { count: activeCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["ready", "not_ready", "called", "in_progress"])

  const { count: servedCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "completed")

  const dayOfWeek = new Date().getDay()
  const { data: scheduleRow } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("provider_id", queue.provider_id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle()

  const schedule = scheduleRow as {
    max_active: number
    start_time: string
    end_time: string
    queue_window: number
    grace_period: number
  } | null

  return {
    queue,
    waitingCount: waitingCount || 0,
    activeCount: activeCount || 0,
    servedCount: servedCount || 0,
    maxActive: schedule?.max_active || 33,
    estimatedWait: (waitingCount || 0) * queue.avg_duration,
    opensAt: schedule?.start_time || null,
    closesAt: schedule?.end_time || null,
    gracePeriod: schedule?.grace_period || 3,
    queueWindow: schedule?.queue_window || 10,
    breakUntil: queue.break_until || null,
    delayMinutes: queue.delay_minutes || 0,
    doctorMessage: queue.doctor_message || null,
  }
}

export async function getQueueEntries(queueId: string) {
  const supabase = await createServer()

  const { data } = await supabase
    .from("queue_entries")
    .select("*, users(full_name, phone)")
    .eq("queue_id", queueId)
    .in("status", ["ready", "not_ready", "called", "in_progress"])
    .order("queue_number", { ascending: true })

  // Return entries with full sync fields visible to doctor
  return (data || []).map((entry: any) => ({
    ...entry,
    // Ensure sync fields are always present
    travel_category: entry.travel_category || "here",
    patient_eta: entry.patient_eta || null,
    patient_message: entry.patient_message || null,
    is_checked_in: entry.is_checked_in ?? false,
    travel_updated_at: entry.travel_updated_at || null,
  }))
}

export async function getMyActiveEntry(queueId: string) {
  const { supabase, user } = await getAuthUser()

  const { data } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("queue_id", queueId)
    .eq("patient_id", user.id)
    .in("status", ["ready", "not_ready", "called", "in_progress"])
    .maybeSingle()

  return data
}

export async function getTodayQueue(providerId: string) {
  const supabase = await createServer()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("queues")
    .select("*")
    .eq("provider_id", providerId)
    .eq("date", today)
    .maybeSingle()

  return data
}

export async function getMyActiveTicket() {
  const { supabase, user } = await getAuthUser()

  const { data } = await supabase
    .from("queue_entries")
    .select("*, queues(*, providers(*, users(full_name), specialties(name)))")
    .eq("patient_id", user.id)
    .in("status", ["ready", "not_ready", "called", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

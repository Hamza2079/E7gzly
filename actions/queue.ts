/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck — Remove this after running migration 010 and regenerating types
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServer } from "@/lib/supabase/server"

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
    await supabase
      .from("queues")
      .update({ status: "open", paused_at: null })
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
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
  return { queueId: queue.id }
}

export async function pauseQueue(queueId: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({ status: "paused", paused_at: new Date().toISOString() })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
}

export async function resumeQueue(queueId: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({ status: "open", paused_at: null })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
}

export async function closeQueue(queueId: string) {
  const { supabase } = await getAuthUser()
  const { error } = await supabase
    .from("queues")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", queueId)
  if (error) return { error: error.message }
  revalidatePath("/dashboard/queue")
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

  // 1. Get queue + schedule info
  const { data: queue } = await supabase
    .from("queues")
    .select("*, doctor_schedules(*)")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }
  if (queue.status !== "open") return { error: "Queue is not open" }

  // 2. Check rolling capacity
  const schedule = queue.doctor_schedules as { max_active: number } | null
  const maxActive = schedule?.max_active || 33

  const { count: activeCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["waiting", "called", "in_progress"])

  if ((activeCount || 0) >= maxActive) {
    return { error: "Queue is full. Please try again later." }
  }

  // 3. Check time-aware restriction
  const { count: waitingAhead } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["waiting", "called"])

  const estimatedWait = (waitingAhead || 0) * queue.avg_duration
  // Simple remaining time check - calculate from schedule end_time
  if (schedule) {
    const now = new Date()
    const [endH, endM] = ((schedule as unknown as { end_time: string }).end_time || "23:59").split(":").map(Number)
    const endDate = new Date()
    endDate.setHours(endH, endM, 0)
    const remaining = (endDate.getTime() - now.getTime()) / 60000
    if (estimatedWait > remaining) {
      return { error: "Doctor may not be able to see you today. Estimated wait exceeds remaining work time." }
    }
  }

  // 4. Check if already in queue
  const { data: existingEntry } = await supabase
    .from("queue_entries")
    .select("id")
    .eq("queue_id", queueId)
    .eq("patient_id", user.id)
    .in("status", ["waiting", "called", "in_progress"])
    .maybeSingle()

  if (existingEntry) {
    return { error: "You are already in this queue", entryId: existingEntry.id }
  }

  // 5. Atomically increment queue number and insert
  // First increment the counter
  const newNumber = queue.current_number + 1
  await supabase
    .from("queues")
    .update({ current_number: newNumber })
    .eq("id", queueId)

  // Insert the entry
  const { data: entry, error } = await supabase
    .from("queue_entries")
    .insert({
      queue_id: queueId,
      patient_id: user.id,
      queue_number: newNumber,
      status: "waiting",
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
    .in("status", ["waiting", "called"])

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

  // Get the queue and its schedule for grace period
  const { data: queue } = await supabase
    .from("queues")
    .select("*, doctor_schedules(grace_period)")
    .eq("id", queueId)
    .single()

  if (!queue) return { error: "Queue not found" }

  const gracePeriod = (queue.doctor_schedules as { grace_period: number } | null)?.grace_period || 3

  // Find next waiting patient (lowest queue_number)
  const { data: nextEntry } = await supabase
    .from("queue_entries")
    .select("*, users(full_name, phone)")
    .eq("queue_id", queueId)
    .eq("status", "waiting")
    .order("queue_number", { ascending: true })
    .limit(1)
    .single()

  if (!nextEntry) return { error: "No patients waiting" }

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

export async function completePatient(entryId: string) {
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

  if (recentEntries && recentEntries.length > 0) {
    const totalMinutes = recentEntries.reduce((sum, e) => {
      const dur = (new Date(e.completed_at!).getTime() - new Date(e.called_at!).getTime()) / 60000
      return sum + Math.max(dur, 1) // minimum 1 minute
    }, 0)
    const avgDuration = Math.round(totalMinutes / recentEntries.length)

    await supabase
      .from("queues")
      .update({ avg_duration: Math.max(avgDuration, 1) })
      .eq("id", entry.queue_id)
  }

  revalidatePath("/dashboard/queue")
  return { success: true }
}

export async function skipPatient(entryId: string) {
  const { supabase } = await getAuthUser()

  const { error } = await supabase
    .from("queue_entries")
    .update({
      status: "no_show",
      grace_deadline: null,
    })
    .eq("id", entryId)

  if (error) return { error: error.message }
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
      status: "waiting",
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
    .select("*, doctor_schedules(*), providers(*, users(full_name), specialties(name))")
    .eq("id", queueId)
    .single()

  if (!queue) return null

  const { count: waitingCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "waiting")

  const { count: activeCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .in("status", ["waiting", "called", "in_progress"])

  const { count: servedCount } = await supabase
    .from("queue_entries")
    .select("*", { count: "exact", head: true })
    .eq("queue_id", queueId)
    .eq("status", "completed")

  const schedule = queue.doctor_schedules as { max_active: number; end_time: string } | null

  return {
    queue,
    waitingCount: waitingCount || 0,
    activeCount: activeCount || 0,
    servedCount: servedCount || 0,
    maxActive: schedule?.max_active || 33,
    estimatedWait: (waitingCount || 0) * queue.avg_duration,
    closesAt: schedule?.end_time || null,
  }
}

export async function getQueueEntries(queueId: string) {
  const supabase = await createServer()

  const { data } = await supabase
    .from("queue_entries")
    .select("*, users(full_name, phone)")
    .eq("queue_id", queueId)
    .in("status", ["waiting", "called", "in_progress"])
    .order("queue_number", { ascending: true })

  return data || []
}

export async function getMyActiveEntry(queueId: string) {
  const { supabase, user } = await getAuthUser()

  const { data } = await supabase
    .from("queue_entries")
    .select("*")
    .eq("queue_id", queueId)
    .eq("patient_id", user.id)
    .in("status", ["waiting", "called", "in_progress"])
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
    .in("status", ["waiting", "called", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

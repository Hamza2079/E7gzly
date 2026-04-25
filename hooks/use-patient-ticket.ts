// @ts-nocheck — Remove after running migration 015 and regenerating types
"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useQueueRealtime, useGraceCountdown, useBreakCountdown } from "./use-queue-realtime"
import type { QueueEntryData } from "./use-queue-realtime"

// ============================================================
// Hook: Patient ticket — computed real-time state
// Wraps useQueueRealtime with patient-specific calculations
// ============================================================

export type DoctorStatusLabel =
  | "active"        // Seeing patients
  | "on_break"      // Break with return time
  | "paused"        // Paused without return time
  | "closed"        // No new patients
  | "completed"     // Day done
  | "offline"       // No queue today

export interface PatientTicketState {
  // Core ticket info
  position: number
  estimatedWaitMinutes: number
  estimatedCallTime: string | null // "11:05 AM"

  // Doctor transparency
  doctorStatus: DoctorStatusLabel
  breakReturnsAt: string | null // formatted: "1:30 PM"
  breakRemainingSeconds: number | null
  delayMinutes: number
  doctorMessage: string | null

  // Patient flags
  isNextInLine: boolean
  isAlmostReady: boolean // position <= 2

  // Entry status
  entryStatus: string
  graceRemainingSeconds: number | null

  // Queue stats
  currentServing: number | null
  waitingCount: number
  avgDuration: number
  queueStatus: string

  // Live entry data (for sync updates)
  liveEntry: QueueEntryData | null

  // Connection
  isConnected: boolean
}

export function usePatientTicket(
  queueId: string,
  entryId: string,
  queueNumber: number,
  initialStatus: string
) {
  const {
    queueData,
    waitingEntries,
    entries,
    currentPatient,
    isConnected,
    doctorStatus: rawDoctorStatus,
  } = useQueueRealtime(queueId)

  // Subscribe to the specific entry for direct status updates
  const [liveEntry, setLiveEntry] = useState<{
    status: string
    grace_deadline: string | null
    travel_category: string
    patient_message: string | null
    is_checked_in: boolean
    last_ready_at: string | null
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    supabase
      .from("queue_entries")
      .select("status, grace_deadline, travel_category, patient_message, is_checked_in, last_ready_at")
      .eq("id", entryId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLiveEntry(data)
      })

    // Subscribe to this specific entry
    const channel = supabase
      .channel(`patient-entry:${entryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queue_entries",
          filter: `id=eq.${entryId}`,
        },
        (payload) => {
          const entry = payload.new as Record<string, unknown>
          setLiveEntry({
            status: entry.status as string,
            grace_deadline: (entry.grace_deadline as string) || null,
            travel_category: (entry.travel_category as string) || "here",
            patient_message: (entry.patient_message as string) || null,
            is_checked_in: (entry.is_checked_in as boolean) ?? false,
            last_ready_at: (entry.last_ready_at as string) || null,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entryId])

  // Resolve the most up-to-date status
  const myEntryFromList = entries.find((e) => e.id === entryId)
  const entryStatus = liveEntry?.status || myEntryFromList?.status || initialStatus

  // Grace countdown
  const graceDeadline =
    entryStatus === "called"
      ? liveEntry?.grace_deadline || myEntryFromList?.grace_deadline || null
      : null
  const graceRemainingSeconds = useGraceCountdown(graceDeadline)

  // Break countdown
  const breakRemainingSeconds = useBreakCountdown(queueData?.breakUntil || null)

  // Computed values
  const state = useMemo<PatientTicketState>(() => {
    const avgDuration = queueData?.avgDuration || 10

    // Position: count how many READY entries have an earlier last_ready_at
    // Or if last_ready_at is identical, tie-break by queue_number
    let position = 0
    if (entryStatus === "ready" && (liveEntry?.last_ready_at || myEntryFromList?.last_ready_at)) {
      const myReadyAt = liveEntry?.last_ready_at || myEntryFromList?.last_ready_at
      const myDate = myReadyAt ? new Date(myReadyAt).getTime() : 0
      
      const readyEntries = waitingEntries.filter(e => e.status === "ready" && e.last_ready_at)
      const peopleAhead = readyEntries.filter(e => {
        const theirDate = new Date(e.last_ready_at!).getTime()
        if (theirDate < myDate) return true
        if (theirDate === myDate && e.queue_number < queueNumber) return true
        return false
      })
      position = peopleAhead.length + 1
    }

    // Estimated wait in minutes
    const estimatedWaitMinutes = position * avgDuration

    // Estimated call time as a clock string
    let estimatedCallTime: string | null = null
    if (position > 0 && estimatedWaitMinutes > 0) {
      const callDate = new Date(Date.now() + estimatedWaitMinutes * 60 * 1000)
      // Add break time if doctor is currently on break
      if (breakRemainingSeconds && breakRemainingSeconds > 0) {
        callDate.setSeconds(callDate.getSeconds() + breakRemainingSeconds)
      }
      // Add delay buffer
      if (queueData?.delayMinutes && queueData.delayMinutes > 0) {
        callDate.setMinutes(callDate.getMinutes() + Math.round(queueData.delayMinutes * 0.5))
      }
      estimatedCallTime = callDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    // Break returns at — formatted time
    let breakReturnsAt: string | null = null
    if (queueData?.breakUntil) {
      breakReturnsAt = new Date(queueData.breakUntil).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    const doctorStatus = rawDoctorStatus as DoctorStatusLabel

    return {
      position,
      estimatedWaitMinutes,
      estimatedCallTime,
      doctorStatus,
      breakReturnsAt,
      breakRemainingSeconds: breakRemainingSeconds,
      delayMinutes: queueData?.delayMinutes || 0,
      doctorMessage: queueData?.doctorMessage || null,
      isNextInLine: position === 1,
      isAlmostReady: position <= 2 && position > 0,
      entryStatus,
      graceRemainingSeconds,
      currentServing: queueData?.currentServing || null,
      waitingCount: waitingEntries.length,
      avgDuration,
      queueStatus: queueData?.status || "unknown",
      liveEntry: myEntryFromList || null,
      isConnected,
    }
  }, [
    queueData,
    waitingEntries,
    entries,
    queueNumber,
    entryStatus,
    graceRemainingSeconds,
    breakRemainingSeconds,
    rawDoctorStatus,
    isConnected,
    myEntryFromList,
  ])

  return state
}

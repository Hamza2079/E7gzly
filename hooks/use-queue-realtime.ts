// @ts-nocheck — Remove after running migration 015 and regenerating types
"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ============================================================
// Hook: Subscribe to a queue's realtime updates
// Returns live queue data + entries with full sync fields
// ============================================================

export interface QueueRealtimeData {
  status: string
  currentServing: number | null
  currentNumber: number
  avgDuration: number
  breakUntil: string | null
  delayMinutes: number
  doctorMessage: string | null
  pausedAt: string | null
}

export interface QueueEntryData {
  id: string
  queue_number: number
  patient_id: string
  status: string
  called_at: string | null
  grace_deadline: string | null
  visit_reason: string | null
  source: string
  // Sync fields
  travel_category: string
  patient_eta: string | null
  patient_message: string | null
  is_checked_in: boolean
  travel_updated_at: string | null
  // Joined
  users?: { full_name: string; phone: string | null }
}

export function useQueueRealtime(queueId: string | null) {
  const [queueData, setQueueData] = useState<QueueRealtimeData | null>(null)
  const [entries, setEntries] = useState<QueueEntryData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const fetchInitialData = useCallback(async () => {
    if (!queueId) return
    const supabase = createClient()

    // Fetch queue with sync fields
    const { data: queue } = await supabase
      .from("queues")
      .select("status, current_serving, current_number, avg_duration, break_until, delay_minutes, doctor_message, paused_at")
      .eq("id", queueId)
      .single()

    if (queue) {
      setQueueData({
        status: queue.status,
        currentServing: queue.current_serving,
        currentNumber: queue.current_number,
        avgDuration: queue.avg_duration,
        breakUntil: queue.break_until || null,
        delayMinutes: queue.delay_minutes || 0,
        doctorMessage: queue.doctor_message || null,
        pausedAt: queue.paused_at || null,
      })
    }

    // Fetch active entries with sync fields
    const { data: queueEntries } = await supabase
      .from("queue_entries")
      .select("id, queue_number, patient_id, status, called_at, grace_deadline, visit_reason, source, travel_category, patient_eta, patient_message, is_checked_in, travel_updated_at, users(full_name, phone)")
      .eq("queue_id", queueId)
      .in("status", ["waiting", "called", "in_progress"])
      .order("queue_number", { ascending: true })

    if (queueEntries) setEntries(queueEntries as unknown as QueueEntryData[])
  }, [queueId])

  useEffect(() => {
    if (!queueId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    fetchInitialData()

    // Subscribe to changes
    channel = supabase
      .channel(`queue-realtime:${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `queue_id=eq.${queueId}`,
        },
        () => {
          // Refetch entries on any change (insert, update, delete)
          fetchInitialData()
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "queues",
          filter: `id=eq.${queueId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          setQueueData({
            status: updated.status as string,
            currentServing: updated.current_serving as number | null,
            currentNumber: updated.current_number as number,
            avgDuration: updated.avg_duration as number,
            breakUntil: (updated.break_until as string) || null,
            delayMinutes: (updated.delay_minutes as number) || 0,
            doctorMessage: (updated.doctor_message as string) || null,
            pausedAt: (updated.paused_at as string) || null,
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED")
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queueId, fetchInitialData])

  // Derived data
  const waitingEntries = entries.filter((e) => e.status === "waiting")
  const calledEntry = entries.find((e) => e.status === "called")
  const inProgressEntry = entries.find((e) => e.status === "in_progress")
  const currentPatient = inProgressEntry || calledEntry

  // Doctor status derived from queue data
  const doctorStatus = !queueData
    ? "offline"
    : queueData.status === "open"
    ? "active"
    : queueData.status === "paused"
    ? queueData.breakUntil
      ? "on_break"
      : "paused"
    : queueData.status === "closed"
    ? "closed"
    : "completed"

  return {
    queueData,
    entries,
    waitingEntries,
    calledEntry,
    inProgressEntry,
    currentPatient,
    isConnected,
    doctorStatus,
    refetch: fetchInitialData,
  }
}

// ============================================================
// Hook: Grace period countdown
// ============================================================

export function useGraceCountdown(graceDeadline: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!graceDeadline) {
      setRemaining(null)
      return
    }

    const update = () => {
      const diff = new Date(graceDeadline).getTime() - Date.now()
      setRemaining(Math.max(0, Math.floor(diff / 1000)))
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [graceDeadline])

  return remaining
}

// ============================================================
// Hook: Break countdown (time until doctor returns)
// ============================================================

export function useBreakCountdown(breakUntil: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!breakUntil) {
      setRemaining(null)
      return
    }

    const update = () => {
      const diff = new Date(breakUntil).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining(0)
      } else {
        setRemaining(Math.floor(diff / 1000))
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [breakUntil])

  return remaining
}

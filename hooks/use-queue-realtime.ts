// @ts-nocheck — Remove after regenerating types
"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// ============================================================
// Hook: Subscribe to a queue's realtime updates
// Returns live queue data + entries
// ============================================================

interface QueueRealtimeData {
  status: string
  currentServing: number | null
  currentNumber: number
  avgDuration: number
}

interface QueueEntryData {
  id: string
  queue_number: number
  patient_id: string
  status: string
  called_at: string | null
  grace_deadline: string | null
  visit_reason: string | null
  source: string
  users?: { full_name: string; phone: string | null }
}

export function useQueueRealtime(queueId: string | null) {
  const [queueData, setQueueData] = useState<QueueRealtimeData | null>(null)
  const [entries, setEntries] = useState<QueueEntryData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  const fetchInitialData = useCallback(async () => {
    if (!queueId) return
    const supabase = createClient()

    // Fetch queue
    const { data: queue } = await supabase
      .from("queues")
      .select("status, current_serving, current_number, avg_duration")
      .eq("id", queueId)
      .single()

    if (queue) {
      setQueueData({
        status: queue.status,
        currentServing: queue.current_serving,
        currentNumber: queue.current_number,
        avgDuration: queue.avg_duration,
      })
    }

    // Fetch active entries
    const { data: queueEntries } = await supabase
      .from("queue_entries")
      .select("id, queue_number, patient_id, status, called_at, grace_deadline, visit_reason, source, users(full_name, phone)")
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
          // Refetch entries on any change
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

  return {
    queueData,
    entries,
    waitingEntries,
    calledEntry,
    inProgressEntry,
    currentPatient,
    isConnected,
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

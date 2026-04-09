"use client";

import { useState, useCallback } from "react";
import type { TimeSlot } from "@/types";

/**
 * Hook for fetching provider availability slots for a given date.
 */
export function useAvailability(providerId: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    try {
      // TODO: Fetch from Supabase — get provider availability rules,
      // subtract already-booked appointments, return open slots
      console.log("Fetching slots for:", providerId, date);
      setSlots([]);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return { slots, loading, fetchSlots };
}

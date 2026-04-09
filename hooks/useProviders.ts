"use client";

import { useState, useCallback } from "react";
import type { Provider, ProviderFilters } from "@/types";

/**
 * Hook for searching and filtering providers.
 */
export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ProviderFilters>({});

  const fetchProviders = useCallback(async (newFilters?: ProviderFilters) => {
    setLoading(true);
    try {
      // TODO: Fetch from Supabase with filters
      console.log("Fetching providers with filters:", newFilters || filters);
      setProviders([]);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { providers, loading, filters, setFilters, fetchProviders };
}

import { supabase } from "@/lib/supabase/client";
import type { ProviderFilters } from "@/types/api.types";

/**
 * Provider service — search, filter, and fetch provider data.
 */
export const providerService = {
  async getProviders(filters: ProviderFilters = {}) {
    let query = supabase
      .from("providers")
      .select("*, users(*), specialties(*)");

    if (filters.specialty) query = query.eq("specialty_id", filters.specialty);
    if (filters.city) query = query.eq("city", filters.city);
    if (filters.minRating) query = query.gte("rating_avg", filters.minRating);
    if (filters.minFee) query = query.gte("consultation_fee", filters.minFee);
    if (filters.maxFee) query = query.lte("consultation_fee", filters.maxFee);

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  async getProviderById(id: string) {
    const { data, error } = await supabase
      .from("providers")
      .select("*, users(*), specialties(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getProviderAvailability(providerId: string, date: string) {
    // TODO: Fetch availability rules and subtract booked appointments
    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true);

    if (error) throw error;
    return data;
  },

  async getProviderReviews(providerId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from("reviews")
      .select("*, users(*)", { count: "exact" })
      .eq("provider_id", providerId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return { data, count };
  },
};

"use server"

import { revalidatePath } from "next/cache"
import { createServer } from "@/lib/supabase/server"
import type { Service, EntryService } from "@/types"

// ============================================================
// HELPERS
// ============================================================

async function getAuthUser() {
  const supabase = await createServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return { supabase, user }
}

async function getProviderForUser(
  supabase: Awaited<ReturnType<typeof createServer>>,
  userId: string
) {
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
// DOCTOR — SERVICE CATALOG MANAGEMENT
// ============================================================

/**
 * Create or update a service in the doctor's catalog.
 * Uses `id` field to distinguish insert vs. update.
 */
export async function upsertService(formData: FormData) {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  const id = (formData.get("id") as string) || undefined
  const nameAr = (formData.get("nameAr") as string).trim()
  const nameEn = (formData.get("nameEn") as string)?.trim() || null
  const price = parseFloat(formData.get("price") as string) || 0
  const estimatedDuration = parseInt(formData.get("estimatedDuration") as string) || 10
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0
  const isActive = formData.get("isActive") !== "false"

  if (!nameAr) return { error: "اسم الخدمة مطلوب" }
  if (price < 0) return { error: "السعر لا يمكن أن يكون سالباً" }

  if (id) {
    // Update
    const { error } = await supabase
      .from("services")
      .update({ name_ar: nameAr, name_en: nameEn, price, estimated_duration: estimatedDuration, sort_order: sortOrder, is_active: isActive })
      .eq("id", id)
      .eq("provider_id", provider.id) // RLS safety belt

    if (error) return { error: error.message }
  } else {
    // Insert
    const { error } = await supabase
      .from("services")
      .insert({ provider_id: provider.id, name_ar: nameAr, name_en: nameEn, price, estimated_duration: estimatedDuration, sort_order: sortOrder, is_active: isActive })

    if (error) return { error: error.message }
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteService(serviceId: string) {
  const { supabase, user } = await getAuthUser()
  const provider = await getProviderForUser(supabase, user.id)

  // Soft-delete: deactivate rather than hard-delete
  // so existing queue_entry_services records remain intact
  const { error } = await supabase
    .from("services")
    .update({ is_active: false })
    .eq("id", serviceId)
    .eq("provider_id", provider.id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function getServicesForProvider(providerId: string): Promise<Service[]> {
  const supabase = await createServer()

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", providerId)
    .order("sort_order", { ascending: true })
    .order("name_ar", { ascending: true })

  return (data || []).map((s) => ({
    id: s.id,
    providerId: s.provider_id,
    nameAr: s.name_ar,
    nameEn: s.name_en ?? undefined,
    price: s.price,
    estimatedDuration: s.estimated_duration,
    isActive: s.is_active,
    sortOrder: s.sort_order,
  }))
}

// ============================================================
// DOCTOR — POST-CONSULTATION SERVICE ASSIGNMENT
// ============================================================

/**
 * Assign services to a completed (or in-progress) queue entry.
 * Called by doctor from the post-consultation modal.
 *
 * `assignments` is an array of { serviceId, quantity, priceOverride? }
 * Passing an empty array clears all assigned services.
 */
export async function assignServicesToEntry(
  entryId: string,
  assignments: Array<{
    serviceId: string
    quantity?: number
    priceOverride?: number
  }>
) {
  const { supabase, user } = await getAuthUser()

  // Delete existing assignments for this entry (full replace pattern)
  const { error: deleteError } = await supabase
    .from("queue_entry_services")
    .delete()
    .eq("entry_id", entryId)

  if (deleteError) return { error: deleteError.message }

  if (assignments.length === 0) {
    revalidatePath("/dashboard/queue")
    revalidatePath("/dashboard/reports")
    return { success: true, total: 0 }
  }

  // Validate services belong to this doctor's provider
  const provider = await getProviderForUser(supabase, user.id)
  const serviceIds = assignments.map((a) => a.serviceId)
  const { data: validServices } = await supabase
    .from("services")
    .select("id, price")
    .eq("provider_id", provider.id)
    .in("id", serviceIds)

  const validIds = new Set((validServices || []).map((s) => s.id))
  const invalid = serviceIds.filter((id) => !validIds.has(id))
  if (invalid.length > 0) {
    return { error: "بعض الخدمات غير موجودة في قائمتك" }
  }

  // Insert all assignments
  const rows = assignments.map((a) => ({
    entry_id: entryId,
    service_id: a.serviceId,
    quantity: a.quantity || 1,
    price_override: a.priceOverride ?? null,
    assigned_by: user.id,
  }))

  const { error: insertError } = await supabase
    .from("queue_entry_services")
    .insert(rows)

  if (insertError) return { error: insertError.message }

  // Calculate total for return value
  const priceMap = new Map((validServices || []).map((s) => [s.id, s.price]))
  const total = assignments.reduce((sum, a) => {
    const basePrice = a.priceOverride ?? (priceMap.get(a.serviceId) || 0)
    return sum + basePrice * (a.quantity || 1)
  }, 0)

  revalidatePath("/dashboard/queue")
  revalidatePath("/dashboard/reports")
  return { success: true, total }
}

// ============================================================
// READ — ENTRY SERVICES (doctor + patient via RLS)
// ============================================================

export async function getEntryServices(entryId: string): Promise<EntryService[]> {
  const supabase = await createServer()

  const { data } = await supabase
    .from("queue_entry_services")
    .select("*, services(id, name_ar, name_en, price, estimated_duration, is_active, sort_order, provider_id)")
    .eq("entry_id", entryId)
    .order("assigned_at", { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((row: any) => {
    const effectivePrice = row.price_override ?? row.services?.price ?? 0
    return {
      id: row.id,
      entryId: row.entry_id,
      serviceId: row.service_id,
      quantity: row.quantity,
      priceOverride: row.price_override ?? undefined,
      assignedAt: row.assigned_at,
      assignedBy: row.assigned_by,
      service: row.services
        ? {
            id: row.services.id,
            providerId: row.services.provider_id,
            nameAr: row.services.name_ar,
            nameEn: row.services.name_en ?? undefined,
            price: row.services.price,
            estimatedDuration: row.services.estimated_duration,
            isActive: row.services.is_active,
            sortOrder: row.services.sort_order,
          }
        : undefined,
      effectivePrice,
      subtotal: effectivePrice * row.quantity,
    }
  })
}

// ============================================================
// ANALYTICS — Revenue per queue day
// ============================================================

export async function getQueueRevenue(queueId: string) {
  const supabase = await createServer()

  const { data } = await supabase
    .from("queue_entry_services")
    .select(`
      quantity,
      price_override,
      services(price),
      queue_entries!inner(queue_id)
    `)
    .eq("queue_entries.queue_id", queueId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = (data || []).reduce((sum, row: any) => {
    const price = row.price_override ?? row.services?.price ?? 0
    return sum + price * row.quantity
  }, 0)

  return { total, serviceCount: (data || []).length }
}

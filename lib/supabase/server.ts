import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client.
 * Use this in Server Components, Server Actions, and Route Handlers.
 * In production, integrate with cookies for session management.
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
}

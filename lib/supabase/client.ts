import type { Database } from "@/types/database.types";
import { createBrowserClient } from "@supabase/ssr";
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


export function createClient() {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
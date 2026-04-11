import type { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
/**
 * Server-side Supabase client.
 * Use this in Server Components, Server Actions, and Route Handlers.
 * In production, integrate with cookies for session management.
 */
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/client";
export async function createServer() {
    const cookieStore = await cookies();
    return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                  try{
                    cookiesToSet.forEach(({name, value, options}) => {
                      cookieStore.set(name, value, options);
                        })
                }catch(error){
                  console.error("Error setting cookies:", error);
                }
            },
        }
      }
        )
}

// @ts-nocheck — Remove after regenerating types
import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check user's role to redirect to the right place
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("role, profile_completed")
          .eq("id", user.id)
          .single()

        // New Google user → complete profile
        if (!profile || !profile.profile_completed) {
          return NextResponse.redirect(new URL("/complete-profile", request.url))
        }

        // Admin → admin dashboard
        if (profile.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url))
        }

        // Provider → check verification
        if (profile.role === "provider") {
          const { data: provider } = await supabase
            .from("providers")
            .select("verification_status")
            .eq("user_id", user.id)
            .single()

          if (provider && provider.verification_status !== "approved") {
            return NextResponse.redirect(new URL("/pending-approval", request.url))
          }
        }
      }

      // Default: patient → dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Something went wrong
  return NextResponse.redirect(new URL("/login", request.url))
}

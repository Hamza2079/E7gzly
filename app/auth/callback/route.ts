import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { homePathForRole } from "@/lib/auth/paths"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Missing auth code")}`)
  }

  // Session cookies must be written onto the response we actually return.
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options as Record<string, unknown> | undefined })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let redirectPath = homePathForRole("patient")

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, profile_completed")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile || !profile.profile_completed) {
      redirectPath = "/complete-profile"
    } else if (profile.role === "provider") {
      const { data: provider } = await supabase
        .from("providers")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle()

      redirectPath =
        provider && provider.verification_status !== "approved"
          ? "/pending-approval"
          : homePathForRole("provider")
    } else {
      redirectPath = homePathForRole(profile.role)
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`)
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  return response
}

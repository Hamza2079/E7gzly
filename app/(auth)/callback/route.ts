import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  // If Google sent back an auth code, exchange it for a session
  if (code) {
    const supabase = await createServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Success — redirect to dashboard
      const url = new URL("/dashboard", request.url)
      return NextResponse.redirect(url)
    }
  }

  // Something went wrong — redirect to login
  const url = new URL("/login", request.url)
  return NextResponse.redirect(url)
}
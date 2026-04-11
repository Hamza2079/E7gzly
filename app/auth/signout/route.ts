import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createServer()
  await supabase.auth.signOut()

  // Redirect to home page after signing out
  const url = new URL("/", request.url)
  return NextResponse.redirect(url)
}

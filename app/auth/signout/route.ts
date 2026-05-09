import { NextResponse } from "next/server"
import { createServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createServer()
  await supabase.auth.signOut()

  const url = new URL("/", request.url)
  return NextResponse.redirect(url)
}

export async function GET(request: Request) {
  const supabase = await createServer()
  await supabase.auth.signOut()

  const url = new URL("/login", request.url)
  return NextResponse.redirect(url)
}

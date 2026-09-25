import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

async function signOutAndRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  const response = NextResponse.redirect(url)

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
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request, "/")
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request, "/login")
}

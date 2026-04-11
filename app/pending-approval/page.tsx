// @ts-nocheck — Remove after regenerating types
import Link from "next/link"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { createServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { reapplyAsDoctor } from "./actions"

export default async function PendingApprovalPage() {
  const supabase = await createServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check the current verification status
  const { data: provider } = await supabase
    .from("providers")
    .select("verification_status, rejection_reason")
    .eq("user_id", user.id)
    .single()

  const status = provider?.verification_status || "pending"
  const rejectionReason = provider?.rejection_reason

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          E7gzly
        </Link>

        {status === "pending" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Application Under Review</h1>
            <p className="text-sm text-gray-500">
              Your doctor application has been submitted successfully. Our admin team will review
              your credentials and get back to you shortly.
            </p>
            <p className="text-xs text-gray-400">
              This usually takes 1–2 business days.
            </p>
          </>
        )}

        {status === "rejected" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Application Rejected</h1>
            <p className="text-sm text-gray-500">
              Unfortunately, your application was not approved.
            </p>
            {rejectionReason && (
              <div className="rounded-lg bg-red-50 p-4 text-left">
                <p className="text-xs font-medium text-red-800">Reason:</p>
                <p className="mt-1 text-sm text-red-700">{rejectionReason}</p>
              </div>
            )}
            <form action={reapplyAsDoctor}>
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Update & Re-apply
              </button>
            </form>
          </>
        )}

        {status === "approved" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">You&apos;re Approved!</h1>
            <p className="text-sm text-gray-500">
              Your account has been verified. You can now access your dashboard.
            </p>
            <Link
              href="/dashboard"
              className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

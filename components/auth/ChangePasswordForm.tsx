"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Lock, Loader2, CheckCircle2 } from "lucide-react"

export default function ChangePasswordForm({ userEmail }: { userEmail: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      setError("كلمات المرور غير متطابقة")
      return
    }

    if (newPassword.length < 6) {
      setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل")
      return
    }

    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      
      // Verify current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })

      if (signInError) {
        setError("كلمة المرور الحالية غير صحيحة")
        return
      }

      // If successful, update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        e.currentTarget.reset()
      }
    })
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">تغيير كلمة المرور</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> تم تحديث كلمة المرور بنجاح
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
            <input
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
            <input
              name="newPassword"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-left"
              dir="ltr"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "تحديث كلمة المرور"}
          </button>
        </div>
      </form>
    </div>
  )
}

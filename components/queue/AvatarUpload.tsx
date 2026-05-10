"use client"

import { useState, useTransition, useRef } from "react"
import { uploadAvatar } from "@/app/dashboard/profile/actions"
import { Camera, Loader2, User } from "lucide-react"

export default function AvatarUpload({ currentAvatarUrl }: { currentAvatarUrl?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار صورة صالحة")
      return
    }
    setError(null)

    // Show preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload
    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      try {
        await uploadAvatar(formData)
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء رفع الصورة")
      }
    })
  }

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 mb-6 border-b border-gray-100">
      <div className="relative group">
        <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-gray-400" />
          )}
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
      <div className="text-center sm:text-right pt-2">
        <h3 className="text-lg font-bold text-gray-900">الصورة الشخصية</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">يفضل أن تكون صورة واضحة بخلفية بسيطة. الحجم الأقصى 2 ميجابايت.</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  )
}

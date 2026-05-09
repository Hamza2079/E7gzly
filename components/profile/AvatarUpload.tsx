"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Camera, Loader2 } from "lucide-react"

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete
}: {
  userId: string
  currentAvatarUrl: string | null
  onUploadComplete: (url: string) => void
}) {
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Upload to storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update parent/DB
      onUploadComplete(publicUrl)
      
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative inline-block group">
      <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">
        {currentAvatarUrl ? (
          <img src={currentAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-300">
            <Camera className="h-8 w-8" />
          </div>
        )}
      </div>
      
      {/* Overlay & Upload Button */}
      <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  )
}

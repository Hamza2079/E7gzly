"use client"

import { useFormStatus } from "react-dom"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmitButtonProps {
  className?: string
  text?: string
  loadingText?: string
}

export default function SubmitButton({ 
  className, 
  text = "حفظ جميع التغييرات", 
  loadingText = "جاري الحفظ..." 
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "relative flex items-center justify-center gap-2 px-8 h-14 rounded-2xl font-black text-base transition-all duration-300",
        "bg-blue-600 text-white shadow-xl shadow-blue-500/25",
        "hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5",
        "active:scale-[0.98] active:translate-y-0",
        "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <Save className="h-5 w-5" />
          <span>{text}</span>
        </>
      )}
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

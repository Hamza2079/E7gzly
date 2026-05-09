import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full bg-blue-100/50"></div>
        {/* Spinner */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-900/5 ring-1 ring-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
      <h2 className="mt-6 text-lg font-bold text-gray-900">جاري التحميل...</h2>
      <p className="mt-2 text-sm text-gray-500">يرجى الانتظار لحظات</p>
    </div>
  )
}

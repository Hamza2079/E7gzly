"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, MapPin, Stethoscope } from "lucide-react"
import { useTransition } from "react"

export default function DoctorFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = formData.get("q") as string
    const city = formData.get("city") as string
    const spec = formData.get("spec") as string

    const params = new URLSearchParams(searchParams)
    if (q) params.set("q", q); else params.delete("q")
    if (city) params.set("city", city); else params.delete("city")
    if (spec) params.set("spec", spec); else params.delete("spec")

    startTransition(() => {
      router.push(`/doctors?${params.toString()}`)
    })
  }

  const handleClear = () => {
    startTransition(() => {
      router.push(`/doctors`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3 w-full max-w-3xl">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input 
          name="q"
          defaultValue={searchParams.get("q") || ""}
          placeholder="Search doctor name..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="flex w-full md:w-auto gap-3">
        <div className="relative w-full md:w-40">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select name="city" defaultValue={searchParams.get("city") || ""} className="w-full pl-9 pr-8 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none cursor-pointer">
            <option value="">All Cities</option>
            <option value="Cairo">Cairo</option>
            <option value="Alexandria">Alexandria</option>
            <option value="Mansoura">Mansoura</option>
            <option value="Giza">Giza</option>
          </select>
        </div>

        <div className="relative w-full md:w-48">
          <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select name="spec" defaultValue={searchParams.get("spec") || ""} className="w-full pl-9 pr-8 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm appearance-none cursor-pointer">
            <option value="">All Specialties</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Ophthalmology">Ophthalmology</option>
            <option value="Dental">Dental</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
        <button 
          type="submit" 
          disabled={isPending}
          className="flex-1 md:flex-none px-6 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl shadow-sm hover:bg-blue-700 transition"
        >
          {isPending ? "..." : "Filters"}
        </button>

        {(searchParams.has("q") || searchParams.has("city") || searchParams.has("spec")) && (
          <button 
            type="button"
            onClick={handleClear}
            disabled={isPending}
            className="px-4 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition shrink-0"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}

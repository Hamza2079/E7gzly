"use client"

import { useTransition, useState } from "react"
import { Heart } from "lucide-react"
import { toggleFavorite } from "@/app/(patient)/favorites/actions"

interface FavoriteButtonProps {
  providerId: string
  initialFavorite: boolean
}

export default function FavoriteButton({ providerId, initialFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating if it's inside a Link
    const newStatus = !isFavorite
    setIsFavorite(newStatus) // optimistic update
    
    startTransition(async () => {
      try {
        await toggleFavorite(providerId, !newStatus) // The action takes the OLD status to flip it
      } catch (error) {
        setIsFavorite(!newStatus) // revert on error
        console.error("Failed to toggle favorite:", error)
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`h-8 w-8 flex items-center justify-center rounded-full transition-all group-hover:scale-105 active:scale-95 shadow-sm
        ${isFavorite ? 'bg-red-50' : 'bg-white/90 hover:bg-white'} backdrop-blur-md`}
    >
      <Heart 
        className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} 
      />
    </button>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Job } from "@/lib/jobs"

interface FavoriteJob extends Job {
  favoriteId: string
  favoritedAt: string
}

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [favoriteJobIds, setFavoriteJobIds] = useState<Set<string>>(new Set())

  // Load favorites on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      loadFavorites()
    } else {
      setFavorites([])
      setFavoriteJobIds(new Set())
      setIsLoading(false)
    }
  }, [user?.id])

  const loadFavorites = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/favorites")

      if (!response.ok) {
        throw new Error("Failed to fetch favorites")
      }

      const favoritesData: FavoriteJob[] = await response.json()
      setFavorites(favoritesData)

      // Create a Set of job IDs for quick lookup
      const jobIds = new Set(favoritesData.map((fav) => fav.id))
      setFavoriteJobIds(jobIds)
    } catch (error) {
      console.error("Error loading favorites:", error)
      toast.error("Failed to load favorites")
    } finally {
      setIsLoading(false)
    }
  }

  const addFavorite = async (jobId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error("Please log in to save favorites")
      return false
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add favorite")
      }

      // Update local state
      setFavoriteJobIds((prev) => new Set([...prev, jobId]))

      // Reload favorites to get complete job data
      await loadFavorites()

      toast.success("Added to favorites!")
      return true
    } catch (error) {
      console.error("Error adding favorite:", error)
      toast.error("Failed to add favorite")
      return false
    }
  }

  const removeFavorite = async (jobId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error("Please log in to manage favorites")
      return false
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove favorite")
      }

      // Update local state
      setFavoriteJobIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })

      setFavorites((prev) => prev.filter((fav) => fav.id !== jobId))

      toast.success("Removed from favorites")
      return true
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast.error("Failed to remove favorite")
      return false
    }
  }

  const toggleFavorite = async (jobId: string): Promise<boolean> => {
    const isFavorited = favoriteJobIds.has(jobId)

    if (isFavorited) {
      return await removeFavorite(jobId)
    } else {
      return await addFavorite(jobId)
    }
  }

  const isFavorite = (jobId: string): boolean => {
    return favoriteJobIds.has(jobId)
  }

  const clearAllFavorites = async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error("Please log in to manage favorites")
      return false
    }

    try {
      // Remove all favorites one by one
      const promises = favorites.map((fav) => removeFavorite(fav.id))
      await Promise.all(promises)

      setFavorites([])
      setFavoriteJobIds(new Set())

      toast.success("All favorites cleared")
      return true
    } catch (error) {
      console.error("Error clearing favorites:", error)
      toast.error("Failed to clear favorites")
      return false
    }
  }

  return {
    favorites,
    isLoading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearAllFavorites,
    refreshFavorites: loadFavorites,
  }
}

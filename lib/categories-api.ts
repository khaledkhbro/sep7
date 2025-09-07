import { redis } from "./local-redis"

interface AdminService {
  id: string
  name: string
  description: string
  price: number
  deliveryTime: number
  deliveryUnit: string
  revisions: number
  unlimitedRevisions: boolean
  images: string[]
  videoUrl?: string
  sortOrder: number
}

interface AdminSubcategory {
  id: string
  name: string
  description: string
  services: AdminService[]
  sortOrder: number
}

interface AdminCategory {
  id: string
  name: string
  description: string
  logo: string
  subcategories: AdminSubcategory[]
  sortOrder: number
}

const CACHE_KEY = "marketplace:categories"
const CACHE_TTL = 3600 // 1 hour

export class CategoriesAPI {
  // Get categories with Redis caching
  static async getCategories(): Promise<AdminCategory[]> {
    try {
      // Try Redis cache first
      const cached = await redis.get(CACHE_KEY)
      if (cached) {
        console.log("[v0] Categories loaded from Redis cache")
        return JSON.parse(cached)
      }

      // Fallback to API call
      const response = await fetch("/api/marketplace/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }

      const data = await response.json()
      console.log("[v0] Categories loaded from API")
      return data.categories
    } catch (error) {
      console.error("[v0] Error loading categories:", error)

      // Final fallback to localStorage
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("marketplace_categories")
          if (stored) {
            console.log("[v0] Categories loaded from localStorage fallback")
            return JSON.parse(stored)
          }
        } catch (localError) {
          console.error("[v0] Error loading from localStorage:", localError)
        }
      }

      return []
    }
  }

  // Update categories and clear cache
  static async updateCategories(categories: AdminCategory[]): Promise<void> {
    try {
      // Update API
      const response = await fetch("/api/marketplace/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categories),
      })

      if (!response.ok) {
        throw new Error("Failed to update categories")
      }

      // Also update localStorage as backup
      if (typeof window !== "undefined") {
        localStorage.setItem("marketplace_categories", JSON.stringify(categories))
      }

      console.log("[v0] Categories updated successfully")
    } catch (error) {
      console.error("[v0] Error updating categories:", error)
      throw error
    }
  }

  // Clear cache
  static async clearCache(): Promise<void> {
    try {
      await redis.del(CACHE_KEY)
      console.log("[v0] Categories cache cleared")
    } catch (error) {
      console.error("[v0] Error clearing cache:", error)
    }
  }

  // Preload categories into cache
  static async preloadCache(): Promise<void> {
    try {
      await this.getCategories()
      console.log("[v0] Categories preloaded into cache")
    } catch (error) {
      console.error("[v0] Error preloading cache:", error)
    }
  }
}

// Utility functions for backward compatibility
export const getCategoriesFromCache = () => CategoriesAPI.getCategories()
export const updateCategoriesCache = (categories: AdminCategory[]) => CategoriesAPI.updateCategories(categories)
export const clearCategoriesCache = () => CategoriesAPI.clearCache()

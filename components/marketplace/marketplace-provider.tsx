"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react"

interface MarketplaceContextType {
  isInitialized: boolean
  isLoading: boolean
  categories: MarketplaceCategory[]
  isUserInVacationMode: (userId: string) => boolean
}

interface MarketplaceCategory {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  subcategories: MarketplaceSubcategory[]
}

interface MarketplaceSubcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  logo?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  services?: MarketplaceService[]
}

interface MarketplaceService {
  id: string
  subcategoryId: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  price?: number
  deliveryTime?: { value: number; unit: string }
  revisionsIncluded?: number
  images?: string[]
}

const MarketplaceContext = createContext<MarketplaceContextType>({
  isInitialized: false,
  isLoading: true,
  categories: [],
  isUserInVacationMode: () => false,
})

let globalInitializationPromise: Promise<void> | null = null
let globalInitialized = false

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(globalInitialized)
  const [isLoading, setIsLoading] = useState(!globalInitialized)
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const initializationRef = useRef(false)

  const isUserInVacationMode = useCallback((userId: string) => {
    if (typeof window === "undefined") return false
    const vacationMode = localStorage.getItem(`vacation_mode_${userId}`)
    return vacationMode === "true"
  }, [])

  const initializeData = useCallback(async () => {
    if (initializationRef.current || globalInitialized) {
      console.log("[v0] MarketplaceProvider already initialized, skipping...")
      return
    }

    if (globalInitializationPromise) {
      console.log("[v0] MarketplaceProvider initialization in progress, waiting...")
      await globalInitializationPromise
      return
    }

    initializationRef.current = true
    console.log("[v0] MarketplaceProvider initializing...")

    globalInitializationPromise = (async () => {
      try {
        if (typeof window !== "undefined") {
          try {
            // Clean up any invalid blob URLs first
            const categories = localStorage.getItem("marketplace_categories")
            if (categories) {
              const parsedCategories = JSON.parse(categories)
              console.log("[v0] Found categories in localStorage:", parsedCategories.length)
              const cleanedCategories = JSON.stringify(parsedCategories).replace(
                /blob:https?:\/\/[^"]+/g,
                '"/placeholder.svg"',
              )
              if (cleanedCategories !== categories) {
                localStorage.setItem("marketplace_categories", cleanedCategories)
                console.log("[v0] Cleaned invalid blob URLs from categories")
              }
            }

            const services = localStorage.getItem("marketplace_services")
            if (services) {
              const parsedServices = JSON.parse(services)
              const cleanedServices = JSON.stringify(parsedServices).replace(
                /blob:https?:\/\/[^"]+/g,
                '"/placeholder.svg"',
              )
              if (cleanedServices !== services) {
                localStorage.setItem("marketplace_services", cleanedServices)
                console.log("[v0] Cleaned invalid blob URLs from services")
              }
            }
          } catch (cleanupError) {
            console.warn("[v0] Error cleaning blob URLs:", cleanupError)
          }

          // Initialize categories if missing or invalid
          const hasCategories = localStorage.getItem("marketplace_categories")
          if (!hasCategories) {
            console.log("[v0] Initializing full marketplace categories structure...")
            initializeFullCategories()
          } else {
            try {
              const existingCategories = JSON.parse(hasCategories)
              const hasValidStructure =
                Array.isArray(existingCategories) &&
                existingCategories.length > 0 &&
                existingCategories[0].subcategories &&
                Array.isArray(existingCategories[0].subcategories)

              if (!hasValidStructure) {
                console.log("[v0] Upgrading categories to full structure...")
                initializeFullCategories()
              } else {
                setCategories(existingCategories)
                console.log("[v0] Loaded existing categories:", existingCategories.length)
              }
            } catch (error) {
              console.log("[v0] Invalid categories data, reinitializing...")
              initializeFullCategories()
            }
          }

          // Initialize services if missing
          const hasServices = localStorage.getItem("marketplace_services")
          if (!hasServices) {
            const { initializeSampleData } = await import("@/lib/local-storage")
            await new Promise((resolve) => {
              setTimeout(() => {
                try {
                  initializeSampleData()
                  resolve(void 0)
                } catch (initError) {
                  console.error("[v0] Error during sample data initialization:", initError)
                  resolve(void 0)
                }
              }, 100)
            })
          }
        }

        globalInitialized = true
        setIsInitialized(true)
        setIsLoading(false)
        console.log("[v0] MarketplaceProvider initialization complete")
      } catch (error) {
        console.error("[v0] Failed to initialize marketplace data:", error)
        setIsInitialized(true)
        setIsLoading(false)
        globalInitialized = true
      } finally {
        globalInitializationPromise = null
      }
    })()

    await globalInitializationPromise
  }, [])

  useEffect(() => {
    if (!globalInitialized && !initializationRef.current) {
      initializeData()
    } else if (globalInitialized) {
      const existingCategories = localStorage.getItem("marketplace_categories")
      if (existingCategories) {
        try {
          const parsedCategories = JSON.parse(existingCategories)
          setCategories(parsedCategories)
          setIsInitialized(true)
          setIsLoading(false)
        } catch (error) {
          console.error("[v0] Error loading existing categories:", error)
        }
      }
    }
  }, [initializeData])

  const initializeFullCategories = useCallback(() => {
    const defaultCategories = [
      {
        id: "graphics-design",
        name: "Graphics & Design",
        slug: "graphics-design",
        description: "Logo & Brand Identity, Art & Illustration, Web & App Design",
        logo: "/placeholder.svg?height=100&width=100&text=Graphics",
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        subcategories: [
          {
            id: "logo-design",
            categoryId: "graphics-design",
            name: "Logo Design",
            slug: "logo-design",
            description: "Professional logo design services",
            logo: "/placeholder.svg?height=100&width=100&text=Logo",
            sortOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            services: [
              {
                id: "logo-design-service",
                subcategoryId: "logo-design",
                name: "Logo Design",
                slug: "logo-design-service",
                description: "Custom logo design services",
                price: 150,
                deliveryTime: { value: 3, unit: "days" },
                revisionsIncluded: -1,
                images: ["/placeholder.svg?height=300&width=400&text=Logo+Design"],
                sortOrder: 1,
                isActive: true,
                createdAt: new Date().toISOString(),
              },
            ],
          },
          {
            id: "brand-identity",
            categoryId: "graphics-design",
            name: "Brand Identity & Guidelines",
            slug: "brand-identity",
            description: "Complete brand identity packages",
            logo: "/placeholder.svg?height=100&width=100&text=Brand",
            sortOrder: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            services: [
              {
                id: "brand-package",
                subcategoryId: "brand-identity",
                name: "Brand Package",
                slug: "brand-package",
                description: "Complete brand identity package",
                price: 500,
                deliveryTime: { value: 7, unit: "days" },
                revisionsIncluded: 3,
                images: ["/placeholder.svg?height=300&width=400&text=Brand+Package"],
                sortOrder: 1,
                isActive: true,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: "web-development",
        name: "Web Development",
        slug: "web-development",
        description: "Website Development, E-commerce, Mobile Apps",
        logo: "/placeholder.svg?height=100&width=100&text=Web",
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        subcategories: [
          {
            id: "website-development",
            categoryId: "web-development",
            name: "Website Development",
            slug: "website-development",
            description: "Custom website development services",
            logo: "/placeholder.svg?height=100&width=100&text=Website",
            sortOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            services: [
              {
                id: "react-website",
                subcategoryId: "website-development",
                name: "React Website",
                slug: "react-website",
                description: "Modern React website development",
                price: 800,
                deliveryTime: { value: 7, unit: "days" },
                revisionsIncluded: 3,
                images: ["/placeholder.svg?height=300&width=400&text=React+Website"],
                sortOrder: 1,
                isActive: true,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: "writing-translation",
        name: "Writing & Translation",
        slug: "writing-translation",
        description: "Content Writing, Copywriting, Translation Services",
        logo: "/placeholder.svg?height=100&width=100&text=Writing",
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        subcategories: [
          {
            id: "content-writing",
            categoryId: "writing-translation",
            name: "Content Writing",
            slug: "content-writing",
            description: "Blog posts, articles, and web content",
            logo: "/placeholder.svg?height=100&width=100&text=Content",
            sortOrder: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            services: [
              {
                id: "blog-writing",
                subcategoryId: "content-writing",
                name: "Blog Writing",
                slug: "blog-writing",
                description: "SEO-optimized blog posts and articles",
                price: 75,
                deliveryTime: { value: 2, unit: "days" },
                revisionsIncluded: 2,
                images: ["/placeholder.svg?height=300&width=400&text=Blog+Writing"],
                sortOrder: 1,
                isActive: true,
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ],
      },
    ]

    localStorage.setItem("marketplace_categories", JSON.stringify(defaultCategories))
    setCategories(defaultCategories)
    console.log("[v0] Successfully initialized full categories structure with subcategories")
  }, [])

  const contextValue = useMemo(() => {
    return {
      isInitialized,
      isLoading,
      categories,
      isUserInVacationMode,
    }
  }, [isInitialized, isLoading, categories, isUserInVacationMode])

  return <MarketplaceContext.Provider value={contextValue}>{children}</MarketplaceContext.Provider>
}

export const useMarketplace = () => useContext(MarketplaceContext)

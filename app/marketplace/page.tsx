"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, TrendingUp, Filter, ChevronRight, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { serviceStorage, type StorageService } from "@/lib/local-storage"
import { useMarketplace } from "@/components/marketplace/marketplace-provider"
import { CategoriesAPI } from "@/lib/categories-api"
import { SellerLevelManager } from "@/lib/seller-levels"

const ServiceCard = dynamic(
  () => import("@/components/marketplace/service-card").then((mod) => ({ default: mod.ServiceCard })),
  {
    loading: () => (
      <div className="flex-none w-80">
        <div className="bg-card rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-video bg-muted"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    ),
  },
)

const AdvancedServiceFilters = dynamic(
  () =>
    import("@/components/marketplace/advanced-service-filters").then((mod) => ({
      default: mod.AdvancedServiceFilters,
    })),
  {
    loading: () => <div className="h-16 bg-muted animate-pulse rounded"></div>,
  },
)

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

interface MarketplaceService {
  id: string
  title: string
  description: string
  price: number
  rating: number
  totalOrders: number
  viewsCount: number
  seller: {
    firstName: string
    lastName: string
    username: string
    isVerified: boolean
    sellerId: string
    sellerLevel: string
    isOnline: boolean
    hasInstantResponse: boolean
    location: string
    languages: string
  }
  images: string[]
  category: {
    name: string
    slug: string
  }
  subcategory: {
    name: string
    slug: string
  }
  deliveryTime: {
    value: number
    unit: string
  }
  tags: string[]
}

export default function MarketplacePage() {
  const [services, setServices] = useState<MarketplaceService[]>([])
  const [popularServices, setPopularServices] = useState<MarketplaceService[]>([])
  const [newServices, setNewServices] = useState<MarketplaceService[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [algorithmSettings, setAlgorithmSettings] = useState<any>(null)
  const [promotedServices, setPromotedServices] = useState<any[]>([])
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { isUserInVacationMode } = useMarketplace()

  const loadAlgorithmSettings = async () => {
    try {
      console.log("[v0] Loading marketplace algorithm settings...")
      const response = await fetch("/api/admin/marketplace-algorithm")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Loaded algorithm settings:", data)
        setAlgorithmSettings(data.settings)
        setPromotedServices(data.promotedServices || [])
        return data
      }
    } catch (error) {
      console.error("[v0] Failed to load algorithm settings:", error)
    }

    console.log("[v0] Using fallback algorithm settings")
    const fallbackSettings = [
      {
        setting_key: "algorithm_weights",
        setting_value: {
          popular: { enabled: true, weight: 25 },
          bought: { enabled: true, weight: 20 },
          clicked: { enabled: true, weight: 15 },
          viewed: { enabled: true, weight: 15 },
          reviewed: { enabled: true, weight: 15 },
          fast_delivery: { enabled: true, weight: 10 },
        },
      },
    ]
    setAlgorithmSettings(fallbackSettings)
    setPromotedServices([])
    return { settings: fallbackSettings, promotedServices: [] }
  }

  const loadCategoriesFromStorage = async () => {
    try {
      console.log("[v0] Loading categories from Redis cache...")
      const categories = await CategoriesAPI.getCategories()
      console.log("[v0] Loaded categories from cache:", categories.length)
      setCategories(categories)
      return categories
    } catch (error) {
      console.error("[v0] Failed to load categories from cache:", error)
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem("marketplace_categories")
        if (stored) {
          const parsedCategories = JSON.parse(stored) as AdminCategory[]
          console.log("[v0] Loaded categories from localStorage fallback:", parsedCategories.length)
          setCategories(parsedCategories)
          return parsedCategories
        }
      } catch (localError) {
        console.error("[v0] Failed to load categories from localStorage:", localError)
      }
      return []
    }
  }

  const convertAdminServicesToMarketplace = (adminCategories: AdminCategory[]): MarketplaceService[] => {
    const marketplaceServices: MarketplaceService[] = []

    if (!Array.isArray(adminCategories)) {
      console.warn("[v0] adminCategories is not an array:", adminCategories)
      return marketplaceServices
    }

    adminCategories.forEach((category) => {
      if (!category || !Array.isArray(category.subcategories)) {
        console.warn("[v0] Category missing or subcategories not an array:", category)
        return
      }

      category.subcategories.forEach((subcategory) => {
        if (!subcategory || !Array.isArray(subcategory.services)) {
          console.warn("[v0] Subcategory missing or services not an array:", subcategory)
          return
        }

        subcategory.services.forEach((service, index) => {
          if (!service || !service.id || !service.name) {
            console.warn("[v0] Service missing or invalid:", service)
            return
          }

          const sellerId = `seller_${service.id}_${index}`
          const sellerLevel = SellerLevelManager.getSellerLevel(sellerId)
          const isOnline = Math.random() > 0.3 // 70% chance of being online
          const hasInstantResponse = Math.random() > 0.5 // 50% chance of instant response
          const isVerified = Math.random() > 0.4 // 60% chance of being verified

          const marketplaceService: MarketplaceService = {
            id: service.id,
            title: service.name,
            description: service.description || "",
            price: service.price || 0,
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            totalOrders: Math.floor(Math.random() * 1000) + 50, // Random orders 50-1050
            viewsCount: Math.floor(Math.random() * 5000) + 100, // Random views 100-5100
            seller: {
              firstName: `Seller`,
              lastName: `${index + 1}`,
              username: `seller${index + 1}`,
              isVerified,
              sellerId,
              sellerLevel,
              isOnline,
              hasInstantResponse,
              location: ["United States", "United Kingdom", "Canada", "Australia", "Germany"][
                Math.floor(Math.random() * 5)
              ],
              languages: ["English", "Spanish", "French"][Math.floor(Math.random() * 3)],
            },
            images:
              Array.isArray(service.images) && service.images.length > 0
                ? service.images
                : [`/placeholder.svg?height=200&width=300&query=${encodeURIComponent(service.name)}`],
            category: {
              name: category.name || "Unknown Category",
              slug: category.id || "unknown",
            },
            subcategory: {
              name: subcategory.name || "Unknown Subcategory",
              slug: subcategory.id || "unknown",
            },
            deliveryTime: {
              value: service.deliveryTime || 1,
              unit: service.deliveryUnit || "day",
            },
            tags: [
              (category.name || "").toLowerCase(),
              (subcategory.name || "").toLowerCase(),
              (service.name || "").toLowerCase().split(" ")[0],
            ].filter(Boolean), // Filter out empty strings
          }
          marketplaceServices.push(marketplaceService)
        })
      })
    })

    console.log("[v0] Converted services:", marketplaceServices.length)
    return marketplaceServices
  }

  const convertUserServicesToMarketplace = (userServices: StorageService[]): MarketplaceService[] => {
    return userServices
      .filter((service) => service.status === "active") // Only show active services
      .filter((service) => !isUserInVacationMode(service.sellerId))
      .map((service) => {
        const sellerLevel = SellerLevelManager.getSellerLevel(service.sellerId)
        const isOnline = Math.random() > 0.3
        const hasInstantResponse = Math.random() > 0.5

        return {
          id: service.id,
          title: service.title,
          description: service.description,
          price: service.price,
          rating: service.rating,
          totalOrders: service.totalOrders,
          viewsCount: service.viewsCount,
          seller: {
            firstName: service.seller.firstName,
            lastName: service.seller.lastName,
            username: service.seller.username,
            isVerified: service.seller.isVerified,
            sellerId: service.sellerId,
            sellerLevel,
            isOnline,
            hasInstantResponse,
            location: "United States", // Default location
            languages: "English", // Default language
          },
          images: service.images,
          category: {
            name: service.category.name,
            slug: service.category.slug,
          },
          subcategory: {
            name: service.category.name, // Use category as subcategory for user services
            slug: service.category.slug,
          },
          deliveryTime: service.deliveryTime,
          tags: service.tags,
        }
      })
  }

  const applyFilters = (allServices: MarketplaceService[], currentFilters: any): MarketplaceService[] => {
    let filteredServices = [...allServices]

    // Category filter
    if (currentFilters.category && currentFilters.category !== "all") {
      filteredServices = filteredServices.filter((service) => service.category.slug === currentFilters.category)
    }

    // Subcategory filter
    if (currentFilters.subcategory && currentFilters.subcategory !== "all") {
      filteredServices = filteredServices.filter((service) => service.subcategory.slug === currentFilters.subcategory)
    }

    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase()
      filteredServices = filteredServices.filter(
        (service) =>
          service.title.toLowerCase().includes(searchLower) ||
          service.description.toLowerCase().includes(searchLower) ||
          service.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    // Price range filter
    if (currentFilters.priceMin !== undefined || currentFilters.priceMax !== undefined) {
      const minPrice = currentFilters.priceMin || 0
      const maxPrice = currentFilters.priceMax || Number.POSITIVE_INFINITY
      filteredServices = filteredServices.filter((service) => service.price >= minPrice && service.price <= maxPrice)
    }

    // Rating filter
    if (currentFilters.rating) {
      filteredServices = filteredServices.filter((service) => service.rating >= currentFilters.rating)
    }

    // Delivery time filter
    if (currentFilters.deliveryTime && currentFilters.deliveryTime.length > 0) {
      filteredServices = filteredServices.filter((service) =>
        currentFilters.deliveryTime.includes(service.deliveryTime.value.toString()),
      )
    }

    // Seller level filter
    if (currentFilters.sellerLevel && currentFilters.sellerLevel.length > 0) {
      filteredServices = filteredServices.filter((service) =>
        currentFilters.sellerLevel.includes(service.seller.sellerLevel),
      )
    }

    // Pro services filter (Level 1+ sellers)
    if (currentFilters.proServices) {
      filteredServices = filteredServices.filter((service) =>
        ["level1", "level2", "top"].includes(service.seller.sellerLevel),
      )
    }

    // Instant response filter
    if (currentFilters.instantResponse) {
      filteredServices = filteredServices.filter((service) => service.seller.hasInstantResponse)
    }

    // Online now filter
    if (currentFilters.onlineNow) {
      filteredServices = filteredServices.filter((service) => service.seller.isOnline)
    }

    // Verified sellers filter
    if (currentFilters.verifiedSellers) {
      filteredServices = filteredServices.filter((service) => service.seller.isVerified)
    }

    // New sellers filter
    if (currentFilters.newSellers) {
      filteredServices = filteredServices.filter((service) => service.seller.sellerLevel === "new")
    }

    // Location filter
    if (currentFilters.location && currentFilters.location.length > 0) {
      filteredServices = filteredServices.filter((service) => currentFilters.location.includes(service.seller.location))
    }

    // Languages filter
    if (currentFilters.languages && currentFilters.languages.length > 0) {
      filteredServices = filteredServices.filter((service) =>
        currentFilters.languages.includes(service.seller.languages),
      )
    }

    // Fast delivery filter
    if (currentFilters.fastDelivery) {
      filteredServices = filteredServices.filter((service) => service.deliveryTime.value <= 1)
    }

    // Revisions filter
    if (currentFilters.revisions) {
      filteredServices = filteredServices.filter(() => Math.random() > 0.3)
    }

    if (currentFilters.sortBy) {
      switch (currentFilters.sortBy) {
        case "price_low":
          filteredServices.sort((a, b) => a.price - b.price)
          break
        case "price_high":
          filteredServices.sort((a, b) => b.price - a.price)
          break
        case "rating":
          filteredServices.sort((a, b) => b.rating - a.rating)
          break
        case "bestselling":
          filteredServices.sort((a, b) => b.totalOrders - a.totalOrders)
          break
        case "newest":
          filteredServices.sort(() => Math.random() - 0.5)
          break
        case "most_reviews":
          filteredServices.sort((a, b) => b.totalOrders - a.totalOrders) // Using orders as proxy
          break
        case "fastest_delivery":
          filteredServices.sort((a, b) => a.deliveryTime.value - b.deliveryTime.value)
          break
        case "most_viewed":
          filteredServices.sort((a, b) => b.viewsCount - a.viewsCount)
          break
        default: // relevance - use algorithm weights
          if (algorithmSettings) {
            console.log("[v0] Applying algorithm weights for relevance sorting")
            filteredServices = applyAlgorithmWeights(filteredServices)
          }
          break
      }
    } else if (algorithmSettings) {
      console.log("[v0] Applying default algorithm weights")
      filteredServices = applyAlgorithmWeights(filteredServices)
    }

    if (promotedServices.length > 0) {
      filteredServices = applyPromotedServices(filteredServices)
    }

    return filteredServices
  }

  const applyAlgorithmWeights = (services: MarketplaceService[]): MarketplaceService[] => {
    if (!algorithmSettings || !Array.isArray(algorithmSettings)) {
      console.log("[v0] No algorithm settings available, using default sorting")
      return services.sort((a, b) => b.totalOrders - a.totalOrders) // Sort by popularity as fallback
    }

    const algorithmWeights = algorithmSettings.find((s: any) => s.setting_key === "algorithm_weights")?.setting_value
    if (!algorithmWeights) {
      console.log("[v0] No algorithm weights found, using default sorting")
      return services.sort((a, b) => b.totalOrders - a.totalOrders)
    }

    console.log("[v0] Applying algorithm weights:", algorithmWeights)

    return services.sort((a, b) => {
      let scoreA = 0
      let scoreB = 0

      // Popular weight (based on total orders)
      if (algorithmWeights.popular?.enabled) {
        const popularWeight = algorithmWeights.popular.weight / 100
        scoreA += (a.totalOrders / 1000) * popularWeight
        scoreB += (b.totalOrders / 1000) * popularWeight
      }

      // Most bought weight (same as popular for now)
      if (algorithmWeights.bought?.enabled) {
        const boughtWeight = algorithmWeights.bought.weight / 100
        scoreA += (a.totalOrders / 1000) * boughtWeight
        scoreB += (b.totalOrders / 1000) * boughtWeight
      }

      // Most clicked weight (based on views)
      if (algorithmWeights.clicked?.enabled) {
        const clickedWeight = algorithmWeights.clicked.weight / 100
        scoreA += (a.viewsCount / 5000) * clickedWeight
        scoreB += (b.viewsCount / 5000) * clickedWeight
      }

      // Most viewed weight
      if (algorithmWeights.viewed?.enabled) {
        const viewedWeight = algorithmWeights.viewed.weight / 100
        scoreA += (a.viewsCount / 5000) * viewedWeight
        scoreB += (b.viewsCount / 5000) * viewedWeight
      }

      // Most reviewed weight (using rating as proxy)
      if (algorithmWeights.reviewed?.enabled) {
        const reviewedWeight = algorithmWeights.reviewed.weight / 100
        scoreA += (a.rating / 5) * reviewedWeight
        scoreB += (b.rating / 5) * reviewedWeight
      }

      // Fast delivery weight
      if (algorithmWeights.fast_delivery?.enabled) {
        const fastDeliveryWeight = algorithmWeights.fast_delivery.weight / 100
        const deliveryScoreA = a.deliveryTime.value <= 1 ? 1 : 1 / a.deliveryTime.value
        const deliveryScoreB = b.deliveryTime.value <= 1 ? 1 : 1 / b.deliveryTime.value
        scoreA += deliveryScoreA * fastDeliveryWeight
        scoreB += deliveryScoreB * fastDeliveryWeight
      }

      return scoreB - scoreA // Higher score first
    })
  }

  const applyPromotedServices = (services: MarketplaceService[]): MarketplaceService[] => {
    if (!promotedServices.length) return services

    const now = new Date()
    const activePromoted = promotedServices.filter(
      (p) => p.enabled && new Date(p.start_date) <= now && new Date(p.end_date) >= now,
    )

    if (!activePromoted.length) return services

    console.log("[v0] Applying promoted services:", activePromoted.length)

    const result = [...services]

    // Insert promoted services at their specified positions
    activePromoted
      .sort((a, b) => a.position - b.position)
      .forEach((promoted) => {
        const serviceIndex = result.findIndex((s) => s.id === promoted.service_id.toString())
        if (serviceIndex !== -1) {
          const [promotedService] = result.splice(serviceIndex, 1)
          const insertPosition = Math.min(promoted.position - 1, result.length)
          result.splice(insertPosition, 0, promotedService)
        }
      })

    return result
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await loadAlgorithmSettings()

        const adminCategories = await loadCategoriesFromStorage()
        const adminServices = convertAdminServicesToMarketplace(adminCategories)

        const userServices = serviceStorage.getAll()
        console.log("[v0] Loaded user services:", userServices.length)
        const userMarketplaceServices = convertUserServicesToMarketplace(userServices)
        console.log("[v0] Converted user services:", userMarketplaceServices.length)

        const allServices = [...adminServices, ...userMarketplaceServices]
        console.log("[v0] Total combined services:", allServices.length)

        const filteredServices = applyFilters(allServices, filters)
        console.log("[v0] Final filtered services:", filteredServices.length)
        setServices(filteredServices)

        let shuffled = [...allServices]
        shuffled = applyAlgorithmWeights(shuffled)
        setPopularServices(shuffled.slice(0, 12))
        setNewServices(shuffled.slice(12, 24))

        console.log("[v0] Popular services set:", shuffled.slice(0, 12).length)
        console.log("[v0] New services set:", shuffled.slice(12, 24).length)
      } catch (error) {
        console.error("[v0] Failed to load marketplace data:", error)
      } finally {
        setLoading(false)
        console.log("[v0] Loading set to false")
      }
    }

    loadData()
  }, [filters]) // Removed algorithmSettings dependency to prevent infinite loops

  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === "marketplace_categories" || e.key === "marketplace_services") {
        console.log("[v0] Services updated, reloading from cache...")
        const adminCategories = await loadCategoriesFromStorage()
        const adminServices = convertAdminServicesToMarketplace(adminCategories)

        const userServices = serviceStorage.getAll()
        const userMarketplaceServices = convertUserServicesToMarketplace(userServices)

        const allServices = [...adminServices, ...userMarketplaceServices]
        setServices(allServices)

        const shuffled = [...allServices].sort(() => Math.random() - 0.5)
        setPopularServices(shuffled.slice(0, 12))
        setNewServices(shuffled.slice(12, 24))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleFiltersChange = (newFilters: any) => {
    console.log("[v0] Filters changed:", newFilters)
    setFilters(newFilters)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setFilters({ ...filters, search: searchQuery })
    }
  }

  const ServiceRow = ({
    title,
    services: rowServices,
    showAll = false,
  }: { title: string; services: MarketplaceService[]; showAll?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showAll && (
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            Show All <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {rowServices.slice(0, 6).map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )

  const checkScrollPosition = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      const newScrollLeft =
        categoryScrollRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount)
      categoryScrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" })
    }
  }

  const MegaMenu = ({ category }: { category: AdminCategory }) => (
    <div
      className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl z-[60] max-h-96 overflow-y-auto"
      onMouseEnter={() => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current)
          hoverTimeoutRef.current = null
        }
      }}
      onMouseLeave={() => {
        hoverTimeoutRef.current = setTimeout(() => {
          setActiveMegaMenu(null)
        }, 150)
      }}
    >
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {(category?.subcategories || []).map((subcategory) => (
            <div key={subcategory.id} className="space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm border-b border-gray-100 pb-2">{subcategory.name}</h3>
              <div className="space-y-1">
                {(subcategory?.services || []).slice(0, 8).map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      console.log("[v0] Service clicked:", service.name)
                      setFilters({ category: category.id, subcategory: subcategory.id, service: service.id })
                      setActiveMegaMenu(null)
                    }}
                    className="block text-sm text-gray-600 hover:text-primary transition-colors text-left w-full py-1 hover:bg-gray-50 px-2 rounded"
                  >
                    {service.name}
                  </button>
                ))}
                {(subcategory?.services || []).length > 8 && (
                  <button
                    onClick={() => {
                      console.log("[v0] View all clicked for subcategory:", subcategory.name)
                      setFilters({ category: category.id, subcategory: subcategory.id })
                      setActiveMegaMenu(null)
                    }}
                    className="text-sm text-primary hover:text-primary/80 font-medium py-1 px-2"
                  >
                    View all {(subcategory?.services || []).length} services →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Top Header */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-primary">
                Marketplace
              </Link>

              {/* Search Bar */}
              <div className="hidden md:flex items-center max-w-xl flex-1">
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="What service are you looking for today?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-4 pr-12 py-3 w-full border-2 focus:border-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="sm" className="absolute right-1 top-1 bottom-1 px-4">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/marketplace/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Navigation with Mega Menu */}
          <div className="relative z-50">
            <div className="flex items-center py-3 border-t">
              {canScrollLeft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollCategories("left")}
                  className="absolute left-0 z-10 bg-white shadow-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              <div
                ref={categoryScrollRef}
                className="flex items-center space-x-8 overflow-x-auto scrollbar-hide px-8"
                onScroll={checkScrollPosition}
              >
                <button className="flex items-center space-x-1 text-sm font-medium text-primary whitespace-nowrap">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current)
                        hoverTimeoutRef.current = null
                      }
                      console.log("[v0] Category hovered:", category.name)
                      setActiveMegaMenu(category.id)
                    }}
                    onMouseLeave={() => {
                      hoverTimeoutRef.current = setTimeout(() => {
                        setActiveMegaMenu(null)
                      }, 150)
                    }}
                    className={`text-sm font-medium whitespace-nowrap transition-colors py-3 px-2 rounded hover:bg-gray-50 ${
                      activeMegaMenu === category.id ? "text-primary bg-gray-50" : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {canScrollRight && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollCategories("right")}
                  className="absolute right-0 z-10 bg-white shadow-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {activeMegaMenu && categories.find((cat) => cat.id === activeMegaMenu) && (
              <MegaMenu category={categories.find((cat) => cat.id === activeMegaMenu)!} />
            )}
          </div>
        </div>
      </header>

      {/* Advanced Filters */}
      <AdvancedServiceFilters
        onFiltersChange={handleFiltersChange}
        totalResults={services.length}
        selectedCategory={filters.category}
      />

      {/* Mobile Search */}
      <div className="md:hidden bg-white border-b px-4 py-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="What service are you looking for today?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 py-3 w-full border-2 focus:border-primary"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} size="sm" className="absolute right-1 top-1 bottom-1 px-4">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Recommended Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">RECOMMENDED FOR YOU</h2>
                <p className="text-muted-foreground">Get tailored offers for your needs.</p>
              </div>
              <Button variant="outline">Get started</Button>
            </div>
          </div>
        </div>

        {/* Services you may like */}
        {!loading && services.length > 0 && (
          <div className="mb-12">
            <ServiceRow title="Services you may like" services={services} showAll />
          </div>
        )}

        {console.log("[v0] Render check - loading:", loading, "services.length:", services.length)}

        {/* Popular Services */}
        {!loading && popularServices.length > 0 && (
          <div className="mb-12">
            <ServiceRow title="Popular services" services={popularServices} showAll />
          </div>
        )}

        {/* Verified Pro Services */}
        {!loading && newServices.length > 0 && (
          <div className="mb-12">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Verified Pro services</h2>
                  <p className="text-muted-foreground">Hand-vetted talent for all your professional needs.</p>
                </div>
                <Button variant="ghost" className="text-primary hover:text-primary/80">
                  Show All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {newServices.slice(0, 6).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Most popular services by category */}
        {categories.map((category) => {
          const categoryServices = services.filter((s) => s.category.slug === category.id)
          if (categoryServices.length === 0) return null

          return (
            <div key={category.id} className="mb-12">
              <ServiceRow title={`Most popular services in ${category.name}`} services={categoryServices} showAll />
            </div>
          )
        })}

        {/* Loading State */}
        {loading && (
          <div className="space-y-12">
            {[1, 2, 3].map((section) => (
              <div key={section} className="space-y-4">
                <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
                <div className="flex gap-6 overflow-hidden">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex-none w-80">
                      <div className="bg-card rounded-lg overflow-hidden animate-pulse">
                        <div className="aspect-video bg-muted"></div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && services.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search terms</p>
            <Link href="/marketplace/new">
              <Button>Create the first service</Button>
            </Link>
          </div>
        )}
      </main>

      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="fixed right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                ×
              </Button>
            </div>
            {/* <ServiceFilters onFiltersChange={handleFiltersChange} /> */}
          </div>
        </div>
      )}

      {/* Floating Filter Button */}
      <Button className="fixed bottom-6 right-6 lg:hidden shadow-lg" onClick={() => setShowFilters(true)}>
        <Filter className="mr-2 h-4 w-4" />
        Filters
      </Button>
    </div>
  )
}

export interface StorageService {
  id: string
  sellerId: string
  categoryId: string
  title: string
  description: string
  shortDescription: string
  price: number
  deliveryTime: {
    value: number
    unit: "instant" | "minutes" | "hours" | "days"
  }
  revisionsIncluded: number // 0 = no revisions, -1 = unlimited
  images: string[] // Required - at least 1 image
  videoThumbnail?: {
    type: "youtube" | "vimeo" | "direct"
    url: string
  }
  tags: string[]
  requirements?: string
  status: "active" | "paused" | "draft"
  rating: number
  totalOrders: number
  viewsCount: number
  createdAt: string
  updatedAt: string
  category: {
    id: string
    name: string
    slug: string
  }
  seller: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
    rating: number
    totalReviews: number
    isVerified: boolean
  }
  serviceTiers?: {
    id: string
    name: string
    price: number
    deliveryTime: number
    revisions: number | "unlimited"
    features: string[]
    description?: string
  }[]
  addOns?: {
    id: string
    name: string
    price: number
    deliveryTime?: number
    description: string
  }[]
}

export interface StorageOrder {
  id: string
  marketplaceItemId: string
  buyerId: string
  sellerId: string
  amount: number
  status: "pending" | "in_progress" | "delivered" | "completed" | "cancelled" | "disputed"
  requirementsProvided?: string
  deliveryDate?: string
  deliveredAt?: string
  completedAt?: string
  createdAt: string
  service: {
    title: string
    deliveryTime: number
  }
  buyer: {
    firstName: string
    lastName: string
    username: string
  }
  seller: {
    firstName: string
    lastName: string
    username: string
  }
}

export interface StorageUser {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatar?: string
  bio?: string
  skills: string[]
  rating: number
  totalReviews: number
  isVerified: boolean
  joinedAt: string
  location?: string
  languages: string[]
}

export interface StorageFavorite {
  id: string
  userId: string
  serviceId: string
  createdAt: string
}

// Local Storage Keys
const STORAGE_KEYS = {
  SERVICES: "marketplace_services",
  ORDERS: "marketplace_orders",
  USERS: "marketplace_users",
  FAVORITES: "marketplace_favorites",
  CATEGORIES: "marketplace_categories",
} as const

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "design-creative", name: "Design & Creative", slug: "design-creative" },
  { id: "web-development", name: "Web Development", slug: "web-development" },
  { id: "writing-translation", name: "Writing & Translation", slug: "writing-translation" },
  { id: "video-animation", name: "Video & Animation", slug: "video-animation" },
  { id: "digital-marketing", name: "Digital Marketing", slug: "digital-marketing" },
  { id: "data-analytics", name: "Data & Analytics", slug: "data-analytics" },
]

// Sample data for initial setup
const SAMPLE_SERVICES: StorageService[] = [
  {
    id: "1",
    sellerId: "seller1",
    categoryId: "design-creative",
    title: "I will create a professional logo design for your business",
    description:
      "Looking for a professional logo that represents your brand perfectly? You've come to the right place! I'm a professional graphic designer with 5+ years of experience creating memorable logos for businesses worldwide.\n\nWhat you'll get:\n• 3 unique logo concepts\n• Unlimited revisions until you're 100% satisfied\n• High-resolution files (PNG, JPG, PDF)\n• Vector files (AI, EPS)\n• Brand guidelines document\n• Commercial usage rights",
    shortDescription: "Professional logo design with unlimited revisions and all file formats included",
    price: 150,
    deliveryTime: { value: 3, unit: "days" },
    revisionsIncluded: -1, // unlimited
    images: ["/logo-design-portfolio.png"],
    tags: ["logo design", "branding", "graphic design", "business logo", "modern design"],
    requirements:
      "Please provide:\n• Business name and tagline\n• Industry/business type\n• Color preferences\n• Style preferences (modern, vintage, etc.)\n• Any existing brand materials",
    status: "active",
    rating: 4.9,
    totalOrders: 47,
    viewsCount: 1240,
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-05T10:00:00Z",
    category: {
      id: "design-creative",
      name: "Design & Creative",
      slug: "design-creative",
    },
    seller: {
      id: "seller1",
      firstName: "Emma",
      lastName: "Wilson",
      username: "emmaw_design",
      rating: 4.9,
      totalReviews: 156,
      isVerified: true,
    },
    serviceTiers: [
      {
        id: "tier1",
        name: "Basic",
        price: 100,
        deliveryTime: 5,
        revisions: 2,
        features: ["3 logo concepts", "2 revisions"],
        description:
          "Perfect for startups and small businesses looking for a simple, clean logo design with essential features.",
      },
      {
        id: "tier2",
        name: "Standard",
        price: 150,
        deliveryTime: 3,
        revisions: "unlimited",
        features: ["3 logo concepts", "Unlimited revisions"],
        description:
          "Ideal for established businesses wanting a professional logo with unlimited revisions and faster delivery.",
      },
    ],
    addOns: [
      {
        id: "addon1",
        name: "Additional Color Options",
        price: 50,
        description: "Get more color options for your logo design",
      },
    ],
  },
  {
    id: "2",
    sellerId: "seller2",
    categoryId: "web-development",
    title: "I will build a responsive React website with modern design",
    description:
      "Need a modern, responsive website built with React? I'm a full-stack developer with expertise in creating high-performance web applications that look great on all devices.\n\nWhat's included:\n• Fully responsive design\n• Modern React components\n• Clean, semantic HTML/CSS\n• Cross-browser compatibility\n• SEO optimization\n• Performance optimization\n• 30 days of free support",
    shortDescription: "Custom React website with responsive design and modern features",
    price: 800,
    deliveryTime: { value: 7, unit: "days" },
    revisionsIncluded: 3,
    images: ["/modern-website-design.png"],
    tags: ["react", "website development", "responsive design", "modern web", "frontend"],
    requirements:
      "Please provide:\n• Website purpose and goals\n• Design preferences or examples\n• Content (text, images, etc.)\n• Any specific functionality needed\n• Hosting preferences",
    status: "active",
    rating: 5.0,
    totalOrders: 23,
    viewsCount: 890,
    createdAt: "2024-01-03T14:30:00Z",
    updatedAt: "2024-01-03T14:30:00Z",
    category: {
      id: "web-development",
      name: "Web Development",
      slug: "web-development",
    },
    seller: {
      id: "seller2",
      firstName: "David",
      lastName: "Chen",
      username: "davidc_dev",
      rating: 4.8,
      totalReviews: 89,
      isVerified: true,
    },
  },
  {
    id: "3",
    sellerId: "seller3",
    categoryId: "writing-translation",
    title: "I will write engaging blog posts and articles for your website",
    description:
      "Boost your website's traffic and engagement with professionally written blog posts and articles! As a content marketing specialist with 4+ years of experience, I create compelling content that ranks well in search engines and converts readers into customers.",
    shortDescription: "SEO-optimized blog posts and articles that drive traffic and engagement",
    price: 75,
    deliveryTime: { value: 2, unit: "days" },
    revisionsIncluded: 2,
    images: ["/content-writer.png"],
    tags: ["content writing", "blog posts", "SEO", "copywriting", "articles"],
    requirements:
      "Please provide:\n• Topic or keywords to target\n• Target audience information\n• Desired word count (500-2000 words)\n• Tone and style preferences\n• Any specific points to cover",
    status: "active",
    rating: 4.8,
    totalOrders: 134,
    viewsCount: 567,
    createdAt: "2024-01-01T09:15:00Z",
    updatedAt: "2024-01-01T09:15:00Z",
    category: {
      id: "writing-translation",
      name: "Writing & Translation",
      slug: "writing-translation",
    },
    seller: {
      id: "seller3",
      firstName: "Sarah",
      lastName: "Martinez",
      username: "sarahm_writer",
      rating: 4.8,
      totalReviews: 201,
      isVerified: true,
    },
  },
  {
    id: "4",
    sellerId: "seller4",
    categoryId: "video-animation",
    title: "I will create stunning motion graphics and animations",
    description:
      "Transform your ideas into captivating visual stories with professional motion graphics and animations. Perfect for marketing videos, explainer content, and brand presentations.",
    shortDescription: "Professional motion graphics and animation services",
    price: 250,
    deliveryTime: { value: 5, unit: "days" },
    revisionsIncluded: 2,
    images: ["/video-animation-motion-graphics.png"],
    videoThumbnail: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    tags: ["motion graphics", "animation", "video editing", "after effects", "visual effects"],
    requirements:
      "Please provide:\n• Project concept and goals\n• Style references\n• Duration requirements\n• Brand assets if applicable\n• Specific animation requirements",
    status: "active",
    rating: 4.7,
    totalOrders: 67,
    viewsCount: 432,
    createdAt: "2024-01-02T16:20:00Z",
    updatedAt: "2024-01-02T16:20:00Z",
    category: {
      id: "video-animation",
      name: "Video & Animation",
      slug: "video-animation",
    },
    seller: {
      id: "seller4",
      firstName: "Alex",
      lastName: "Rodriguez",
      username: "alexr_motion",
      rating: 4.7,
      totalReviews: 98,
      isVerified: true,
    },
  },
]

// Utility functions for localStorage operations
class LocalStorageManager<T> {
  constructor(private key: string) {}

  getAll(): T[] {
    if (typeof window === "undefined") return []
    try {
      const data = localStorage.getItem(this.key)
      return safeParseJSON(data, [])
    } catch (error) {
      console.error(`Error reading ${this.key} from localStorage:`, error)
      return []
    }
  }

  getById(id: string): T | null {
    const items = this.getAll()
    return items.find((item: any) => item.id === id) || null
  }

  create(item: Omit<T, "id" | "createdAt">): T {
    const items = this.getAll()
    const newItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    } as T

    items.push(newItem)
    this.saveAll(items)
    return newItem
  }

  update(id: string, updates: Partial<T>): T | null {
    const items = this.getAll()
    const index = items.findIndex((item: any) => item.id === id)

    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    } as T

    items[index] = updatedItem
    this.saveAll(items)
    return updatedItem
  }

  delete(id: string): boolean {
    const items = this.getAll()
    const filteredItems = items.filter((item: any) => item.id !== id)

    if (filteredItems.length === items.length) return false

    this.saveAll(filteredItems)
    return true
  }

  private saveAll(items: T[]): void {
    if (typeof window === "undefined") return
    try {
      const cleanedItems = this.cleanBlobUrls(items)
      localStorage.setItem(this.key, JSON.stringify(cleanedItems))
    } catch (error) {
      console.error(`Error saving ${this.key} to localStorage:`, error)
    }
  }

  private cleanBlobUrls(items: T[]): T[] {
    return JSON.parse(
      JSON.stringify(items, (key, value) => {
        if (typeof value === "string" && value.startsWith("blob:")) {
          return "/placeholder.svg"
        }
        return value
      }),
    )
  }

  clear(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.key)
  }
}

class CachedLocalStorageManager<T> extends LocalStorageManager<T> {
  private cache: T[] | null = null
  private cacheTimestamp = 0
  private readonly CACHE_DURATION = 5000 // 5 seconds

  getAll(): T[] {
    if (typeof window === "undefined") return []

    const now = Date.now()

    // Return cached data if still valid
    if (this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache
    }

    try {
      const data = localStorage.getItem(this.key)
      const parsed = safeParseJSON(data, [])

      // Update cache
      this.cache = parsed
      this.cacheTimestamp = now

      return parsed
    } catch (error) {
      console.error(`Error reading ${this.key} from localStorage:`, error)
      return []
    }
  }

  private saveAll(items: T[]): void {
    if (typeof window === "undefined") return
    try {
      const cleanedItems = this.cleanBlobUrls(items)
      localStorage.setItem(this.key, JSON.stringify(cleanedItems))
      // Invalidate cache
      this.cache = cleanedItems
      this.cacheTimestamp = Date.now()
    } catch (error) {
      console.error(`Error saving ${this.key} to localStorage:`, error)
    }
  }

  private cleanBlobUrls(items: T[]): T[] {
    return JSON.parse(
      JSON.stringify(items, (key, value) => {
        if (typeof value === "string" && value.startsWith("blob:")) {
          return "/placeholder.svg"
        }
        return value
      }),
    )
  }

  clear(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.key)
    // Clear cache
    this.cache = null
    this.cacheTimestamp = 0
  }
}

// Service-specific storage manager
class ServiceStorageManager extends CachedLocalStorageManager<StorageService> {
  search(filters: {
    category?: string
    priceMin?: number
    priceMax?: number
    deliveryTime?: number
    search?: string
  }): StorageService[] {
    let services = this.getAll()

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      services = services.filter(
        (service) =>
          service.title.toLowerCase().includes(searchTerm) ||
          service.description.toLowerCase().includes(searchTerm) ||
          service.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      )
    }

    if (filters.category) {
      services = services.filter((service) => service.category.slug === filters.category)
    }

    if (filters.priceMin !== undefined) {
      services = services.filter((service) => service.price >= filters.priceMin!)
    }

    if (filters.priceMax !== undefined) {
      services = services.filter((service) => service.price <= filters.priceMax!)
    }

    if (filters.deliveryTime !== undefined) {
      services = services.filter((service) => service.deliveryTime.value <= filters.deliveryTime!)
    }

    return services
  }

  getByCategory(categorySlug: string): StorageService[] {
    return this.getAll().filter((service) => service.category.slug === categorySlug)
  }

  getBySeller(sellerId: string): StorageService[] {
    return this.getAll().filter((service) => service.sellerId === sellerId)
  }
}

// Order-specific storage manager
class OrderStorageManager extends CachedLocalStorageManager<StorageOrder> {
  getUserOrders(userId: string): StorageOrder[] {
    return this.getAll().filter((order) => order.buyerId === userId || order.sellerId === userId)
  }

  getBuyerOrders(buyerId: string): StorageOrder[] {
    return this.getAll().filter((order) => order.buyerId === buyerId)
  }

  getSellerOrders(sellerId: string): StorageOrder[] {
    return this.getAll().filter((order) => order.sellerId === sellerId)
  }
}

// Favorites storage manager
class FavoritesStorageManager extends CachedLocalStorageManager<StorageFavorite> {
  getUserFavorites(userId: string): StorageFavorite[] {
    return this.getAll().filter((fav) => fav.userId === userId)
  }

  isFavorite(userId: string, serviceId: string): boolean {
    return this.getAll().some((fav) => fav.userId === userId && fav.serviceId === serviceId)
  }

  toggleFavorite(userId: string, serviceId: string): boolean {
    const existing = this.getAll().find((fav) => fav.userId === userId && fav.serviceId === serviceId)

    if (existing) {
      this.delete(existing.id)
      return false
    } else {
      this.create({
        userId,
        serviceId,
      } as Omit<StorageFavorite, "id" | "createdAt">)
      return true
    }
  }
}

// Initialize storage managers
export const serviceStorage = new ServiceStorageManager(STORAGE_KEYS.SERVICES)
export const orderStorage = new OrderStorageManager(STORAGE_KEYS.ORDERS)
export const userStorage = new CachedLocalStorageManager<StorageUser>(STORAGE_KEYS.USERS)
export const favoritesStorage = new FavoritesStorageManager(STORAGE_KEYS.FAVORITES)

// Initialize sample data if not exists
export async function initializeSampleData(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    await cleanupInvalidBlobUrls()

    // Check if data already exists to avoid unnecessary work
    const hasCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
    const hasServices = localStorage.getItem(STORAGE_KEYS.SERVICES)
    const hasOrders = localStorage.getItem(STORAGE_KEYS.ORDERS)
    const hasUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    const hasFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES)

    // Only initialize missing data
    if (!hasCategories) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES))
    }

    if (!hasServices) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(SAMPLE_SERVICES))
    }

    if (!hasOrders) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]))
    }

    if (!hasUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
    }

    if (!hasFavorites) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]))
    }

    console.log("[v0] ✅ Sample data initialized successfully")
  } catch (error) {
    console.error("[v0] ❌ Failed to initialize sample data:", error)
  }
}

async function cleanupInvalidBlobUrls(): Promise<void> {
  if (typeof window === "undefined") return

  const keysToClean = [
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.SERVICES,
    STORAGE_KEYS.ORDERS,
    STORAGE_KEYS.USERS,
    "marketplace_categories", // Legacy key
    "thumbnailStorage", // From admin categories
  ]

  for (const key of keysToClean) {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        // Replace any blob URLs with placeholder images
        const cleanedData = data.replace(/blob:https?:\/\/[^"'\s,}]+/g, '"/placeholder.svg"')
        if (cleanedData !== data) {
          localStorage.setItem(key, cleanedData)
          console.log(`[v0] Cleaned invalid blob URLs from ${key}`)
        }
      }
    } catch (error) {
      console.warn(`[v0] Error cleaning blob URLs from ${key}:`, error)
      // If data is completely corrupted, remove it
      try {
        localStorage.removeItem(key)
        console.log(`[v0] Removed corrupted data from ${key}`)
      } catch (removeError) {
        console.error(`[v0] Failed to remove corrupted data from ${key}:`, removeError)
      }
    }
  }
}

function safeParseJSON<T>(data: string | null, fallback: T): T {
  if (!data) return fallback

  try {
    const parsed = JSON.parse(data)
    return cleanBlobUrlsFromData(parsed)
  } catch (error) {
    console.warn("[v0] Failed to parse JSON from localStorage:", error)
    return fallback
  }
}

function cleanBlobUrlsFromData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "string" && value.startsWith("blob:")) {
        return "/placeholder.svg"
      }
      return value
    }),
  )
}

export function getCategories() {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
  return safeParseJSON(data, DEFAULT_CATEGORIES)
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

// Removed auto-initialization to prevent blocking
// Auto-initialization is now handled by MarketplaceProvider

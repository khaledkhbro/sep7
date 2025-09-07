export interface SellerMetrics {
  totalOrders: number
  totalEarnings: number
  averageRating: number
  onTimeDeliveryRate: number
  responseRate: number
  orderCompletionRate: number
  accountAge: number // days since account creation
  policyViolations: number
  lastUpdated: string
}

export interface LevelRequirements {
  id: string
  name: string
  displayName: string
  maxGigs: number
  requirements: {
    minOrders?: number
    minEarnings?: number
    minRating?: number
    minOnTimeDelivery?: number
    minResponseRate?: number
    minOrderCompletion?: number
    minAccountAge?: number
    maxPolicyViolations?: number
    evaluationPeriod?: number // days to look back for metrics
  }
  benefits: string[]
  color: string
  badge?: string
}

export const DEFAULT_LEVEL_REQUIREMENTS: LevelRequirements[] = [
  {
    id: "new",
    name: "new",
    displayName: "New Seller",
    maxGigs: 5,
    requirements: {},
    benefits: ["Create up to 5 gigs", "Start building your reputation", "Access to basic seller tools"],
    color: "gray",
  },
  {
    id: "level1",
    name: "level1",
    displayName: "Level 1 Seller",
    maxGigs: 10,
    requirements: {
      minOrders: 10,
      minEarnings: 400,
      minRating: 4.7,
      minOnTimeDelivery: 90,
      minResponseRate: 90,
      maxPolicyViolations: 0,
      evaluationPeriod: 30,
    },
    benefits: [
      "Create up to 10 gigs",
      "Add extras to your gigs",
      "Priority placement over new sellers",
      "Enhanced seller tools",
    ],
    color: "blue",
  },
  {
    id: "level2",
    name: "level2",
    displayName: "Level 2 Seller",
    maxGigs: 20,
    requirements: {
      minOrders: 50,
      minEarnings: 2000,
      minRating: 4.7,
      minOnTimeDelivery: 90,
      minResponseRate: 90,
      minOrderCompletion: 90,
      maxPolicyViolations: 0,
      evaluationPeriod: 60,
    },
    benefits: [
      "Create up to 20 gigs",
      "Higher ranking in search results",
      "Access to more buyer requests",
      "Priority customer support",
    ],
    color: "green",
  },
  {
    id: "top",
    name: "top",
    displayName: "Top Rated Seller",
    maxGigs: 30,
    requirements: {
      minOrders: 100,
      minEarnings: 20000,
      minRating: 4.7,
      minOnTimeDelivery: 90,
      minResponseRate: 90,
      minOrderCompletion: 90,
      minAccountAge: 180,
      maxPolicyViolations: 0,
      evaluationPeriod: 60,
    },
    benefits: [
      "Create up to 30 gigs",
      '"Top Rated" badge with high trust factor',
      "Priority in search results",
      "VIP customer support",
      "Special promotions and invitations",
    ],
    color: "yellow",
    badge: "⭐",
  },
]

export class SellerLevelManager {
  private static readonly STORAGE_KEYS = {
    LEVEL_REQUIREMENTS: "seller_level_requirements",
    SELLER_METRICS: "seller_metrics",
    SELLER_LEVELS: "seller_levels",
    MANUAL_OVERRIDES: "seller_manual_overrides",
  }

  // Admin functions
  static getLevelRequirements(): LevelRequirements[] {
    if (typeof window === "undefined") return DEFAULT_LEVEL_REQUIREMENTS

    const stored = localStorage.getItem(this.STORAGE_KEYS.LEVEL_REQUIREMENTS)
    return stored ? JSON.parse(stored) : DEFAULT_LEVEL_REQUIREMENTS
  }

  static updateLevelRequirements(requirements: LevelRequirements[]): void {
    if (typeof window === "undefined") return

    localStorage.setItem(this.STORAGE_KEYS.LEVEL_REQUIREMENTS, JSON.stringify(requirements))
  }

  static resetToDefaults(): void {
    if (typeof window === "undefined") return

    localStorage.setItem(this.STORAGE_KEYS.LEVEL_REQUIREMENTS, JSON.stringify(DEFAULT_LEVEL_REQUIREMENTS))
  }

  // Seller metrics management
  static getSellerMetrics(sellerId: string): SellerMetrics | null {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem(this.STORAGE_KEYS.SELLER_METRICS)
    const allMetrics = stored ? JSON.parse(stored) : {}
    return allMetrics[sellerId] || null
  }

  static updateSellerMetrics(sellerId: string, metrics: SellerMetrics): void {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(this.STORAGE_KEYS.SELLER_METRICS)
    const allMetrics = stored ? JSON.parse(stored) : {}

    allMetrics[sellerId] = {
      ...metrics,
      lastUpdated: new Date().toISOString(),
    }

    localStorage.setItem(this.STORAGE_KEYS.SELLER_METRICS, JSON.stringify(allMetrics))

    // Recalculate level after metrics update
    this.calculateSellerLevel(sellerId)
  }

  // Level calculation
  static calculateSellerLevel(sellerId: string): string {
    if (typeof window === "undefined") return "new"

    // Check for manual override first
    const overrides = this.getManualOverrides()
    if (overrides[sellerId]) {
      return overrides[sellerId]
    }

    const metrics = this.getSellerMetrics(sellerId)
    if (!metrics) return "new"

    const requirements = this.getLevelRequirements()

    // Check levels from highest to lowest
    for (let i = requirements.length - 1; i >= 0; i--) {
      const level = requirements[i]
      if (this.meetsRequirements(metrics, level.requirements)) {
        this.setSellerLevel(sellerId, level.id)
        return level.id
      }
    }

    // Default to new seller
    this.setSellerLevel(sellerId, "new")
    return "new"
  }

  private static meetsRequirements(metrics: SellerMetrics, requirements: LevelRequirements["requirements"]): boolean {
    if (requirements.minOrders && metrics.totalOrders < requirements.minOrders) return false
    if (requirements.minEarnings && metrics.totalEarnings < requirements.minEarnings) return false
    if (requirements.minRating && metrics.averageRating < requirements.minRating) return false
    if (requirements.minOnTimeDelivery && metrics.onTimeDeliveryRate < requirements.minOnTimeDelivery) return false
    if (requirements.minResponseRate && metrics.responseRate < requirements.minResponseRate) return false
    if (requirements.minOrderCompletion && metrics.orderCompletionRate < requirements.minOrderCompletion) return false
    if (requirements.minAccountAge && metrics.accountAge < requirements.minAccountAge) return false
    if (requirements.maxPolicyViolations !== undefined && metrics.policyViolations > requirements.maxPolicyViolations)
      return false

    return true
  }

  // Manual overrides (admin only)
  static getManualOverrides(): Record<string, string> {
    if (typeof window === "undefined") return {}

    const stored = localStorage.getItem(this.STORAGE_KEYS.MANUAL_OVERRIDES)
    return stored ? JSON.parse(stored) : {}
  }

  static setManualOverride(sellerId: string, levelId: string): void {
    if (typeof window === "undefined") return

    const overrides = this.getManualOverrides()
    overrides[sellerId] = levelId

    localStorage.setItem(this.STORAGE_KEYS.MANUAL_OVERRIDES, JSON.stringify(overrides))
    this.setSellerLevel(sellerId, levelId)
  }

  static removeManualOverride(sellerId: string): void {
    if (typeof window === "undefined") return

    const overrides = this.getManualOverrides()
    delete overrides[sellerId]

    localStorage.setItem(this.STORAGE_KEYS.MANUAL_OVERRIDES, JSON.stringify(overrides))

    // Recalculate level based on metrics
    this.calculateSellerLevel(sellerId)
  }

  // Current seller level
  static getSellerLevel(sellerId: string): string {
    if (typeof window === "undefined") return "new"

    const stored = localStorage.getItem(this.STORAGE_KEYS.SELLER_LEVELS)
    const allLevels = stored ? JSON.parse(stored) : {}
    return allLevels[sellerId] || "new"
  }

  private static setSellerLevel(sellerId: string, levelId: string): void {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(this.STORAGE_KEYS.SELLER_LEVELS)
    const allLevels = stored ? JSON.parse(stored) : {}

    allLevels[sellerId] = levelId
    localStorage.setItem(this.STORAGE_KEYS.SELLER_LEVELS, JSON.stringify(allLevels))
  }

  // Helper functions
  static getLevelInfo(levelId: string): LevelRequirements | null {
    const requirements = this.getLevelRequirements()
    return requirements.find((level) => level.id === levelId) || null
  }

  static getNextLevel(currentLevelId: string): LevelRequirements | null {
    const requirements = this.getLevelRequirements()
    const currentIndex = requirements.findIndex((level) => level.id === currentLevelId)

    if (currentIndex === -1 || currentIndex === requirements.length - 1) {
      return null // Already at top level or level not found
    }

    return requirements[currentIndex + 1]
  }

  static getProgressToNextLevel(sellerId: string): {
    currentLevel: LevelRequirements
    nextLevel: LevelRequirements | null
    progress: Record<string, { current: number; required: number; percentage: number }>
  } | null {
    const currentLevelId = this.getSellerLevel(sellerId)
    const currentLevel = this.getLevelInfo(currentLevelId)
    const nextLevel = this.getNextLevel(currentLevelId)
    const metrics = this.getSellerMetrics(sellerId)

    if (!currentLevel || !metrics) return null

    const progress: Record<string, { current: number; required: number; percentage: number }> = {}

    if (nextLevel) {
      const req = nextLevel.requirements

      if (req.minOrders) {
        progress.orders = {
          current: metrics.totalOrders,
          required: req.minOrders,
          percentage: Math.min(100, (metrics.totalOrders / req.minOrders) * 100),
        }
      }

      if (req.minEarnings) {
        progress.earnings = {
          current: metrics.totalEarnings,
          required: req.minEarnings,
          percentage: Math.min(100, (metrics.totalEarnings / req.minEarnings) * 100),
        }
      }

      if (req.minRating) {
        progress.rating = {
          current: metrics.averageRating,
          required: req.minRating,
          percentage: Math.min(100, (metrics.averageRating / req.minRating) * 100),
        }
      }

      if (req.minOnTimeDelivery) {
        progress.onTimeDelivery = {
          current: metrics.onTimeDeliveryRate,
          required: req.minOnTimeDelivery,
          percentage: Math.min(100, (metrics.onTimeDeliveryRate / req.minOnTimeDelivery) * 100),
        }
      }

      if (req.minResponseRate) {
        progress.responseRate = {
          current: metrics.responseRate,
          required: req.minResponseRate,
          percentage: Math.min(100, (metrics.responseRate / req.minResponseRate) * 100),
        }
      }

      if (req.minAccountAge) {
        progress.accountAge = {
          current: metrics.accountAge,
          required: req.minAccountAge,
          percentage: Math.min(100, (metrics.accountAge / req.minAccountAge) * 100),
        }
      }
    }

    return { currentLevel, nextLevel, progress }
  }

  // Initialize seller with default metrics
  static initializeSeller(sellerId: string): void {
    const existingMetrics = this.getSellerMetrics(sellerId)
    if (!existingMetrics) {
      const defaultMetrics: SellerMetrics = {
        totalOrders: 0,
        totalEarnings: 0,
        averageRating: 5.0,
        onTimeDeliveryRate: 100,
        responseRate: 100,
        orderCompletionRate: 100,
        accountAge: 0,
        policyViolations: 0,
        lastUpdated: new Date().toISOString(),
      }

      this.updateSellerMetrics(sellerId, defaultMetrics)
    }
  }
}

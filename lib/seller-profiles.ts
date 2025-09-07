export interface SellerProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  bio: string
  location: string
  country: string
  languages: string[]
  timezone: string
  sellerType: "Individual" | "Business"
  isVerified: boolean
  isOnline: boolean
  lastSeen: string
  joinedAt: string

  // Statistics
  completedOrders: number
  onTimeDeliveryRate: number
  averageResponseTime: string
  lastDelivery: string
  totalEarnings: number

  // Professional Info
  sellerLevel: number
  sellerBadge: string
  skills: string[]
  certifications: string[]

  // Contact & Availability
  availableForConsultation: boolean
  workingHours: {
    start: string
    end: string
    timezone: string
  }

  // Profile customization
  profileImage?: string
  coverImage?: string
  portfolioItems: {
    id: string
    title: string
    description: string
    imageUrl: string
    tags: string[]
    createdAt: string
  }[]

  // Reviews & Ratings
  rating: number
  totalReviews: number

  createdAt: string
  updatedAt: string
}

class SellerProfileStorage {
  private storageKey = "seller_profiles"

  getAll(): SellerProfile[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading seller profiles:", error)
      return []
    }
  }

  getById(id: string): SellerProfile | null {
    const profiles = this.getAll()
    return profiles.find((profile) => profile.id === id) || null
  }

  getByUsername(username: string): SellerProfile | null {
    const profiles = this.getAll()
    return profiles.find((profile) => profile.username === username) || null
  }

  save(profile: SellerProfile): void {
    try {
      const profiles = this.getAll()
      const existingIndex = profiles.findIndex((p) => p.id === profile.id)

      profile.updatedAt = new Date().toISOString()

      if (existingIndex >= 0) {
        profiles[existingIndex] = profile
      } else {
        profiles.push(profile)
      }

      localStorage.setItem(this.storageKey, JSON.stringify(profiles))
    } catch (error) {
      console.error("Error saving seller profile:", error)
    }
  }

  createDefaultProfile(userId: string, userData: Partial<SellerProfile>): SellerProfile {
    const now = new Date().toISOString()

    const defaultProfile: SellerProfile = {
      id: userId,
      username: userData.username || `user${userId.slice(0, 8)}`,
      firstName: userData.firstName || "Current",
      lastName: userData.lastName || "User",
      email: userData.email || "",
      bio:
        userData.bio ||
        "Professional service provider ready to help with your projects. Let's work together to bring your vision to life!",
      location: userData.location || "United States",
      country: userData.country || "US",
      languages: userData.languages || ["English", "Spanish"],
      timezone: userData.timezone || "America/New_York",
      sellerType: userData.sellerType || "Individual",
      isVerified: userData.isVerified || false,
      isOnline: true,
      lastSeen: now,
      joinedAt: userData.joinedAt || now,

      // Statistics
      completedOrders: userData.completedOrders || 0,
      onTimeDeliveryRate: userData.onTimeDeliveryRate || 100,
      averageResponseTime: userData.averageResponseTime || "2 hours",
      lastDelivery: userData.lastDelivery || "about 6 hours",
      totalEarnings: userData.totalEarnings || 0,

      // Professional Info
      sellerLevel: userData.sellerLevel || 1,
      sellerBadge: userData.sellerBadge || "New Seller",
      skills: userData.skills || [],
      certifications: userData.certifications || [],

      // Contact & Availability
      availableForConsultation: userData.availableForConsultation || true,
      workingHours: userData.workingHours || {
        start: "09:00",
        end: "17:00",
        timezone: "America/New_York",
      },

      portfolioItems: userData.portfolioItems || [],

      // Reviews & Ratings
      rating: userData.rating || 5.0,
      totalReviews: userData.totalReviews || 0,

      createdAt: now,
      updatedAt: now,
    }

    this.save(defaultProfile)
    return defaultProfile
  }

  updateStats(
    userId: string,
    stats: Partial<Pick<SellerProfile, "completedOrders" | "totalEarnings" | "lastDelivery" | "onTimeDeliveryRate">>,
  ) {
    const profile = this.getById(userId)
    if (profile) {
      Object.assign(profile, stats)
      this.save(profile)
    }
  }

  updateOnlineStatus(userId: string, isOnline: boolean) {
    const profile = this.getById(userId)
    if (profile) {
      profile.isOnline = isOnline
      profile.lastSeen = new Date().toISOString()
      this.save(profile)
    }
  }
}

export const sellerProfileStorage = new SellerProfileStorage()

// Helper function to get current user's profile
export function getCurrentUserProfile(): SellerProfile {
  const currentUserId = "current-user" // This should match your user system
  let profile = sellerProfileStorage.getById(currentUserId)

  if (!profile) {
    // Create default profile for current user
    profile = sellerProfileStorage.createDefaultProfile(currentUserId, {
      username: "currentuser",
      firstName: "Current",
      lastName: "User",
    })
  }

  return profile
}

// Helper function to format local time
export function formatLocalTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date())
  } catch (error) {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }
}

// Helper function to get country flag emoji
export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    UK: "🇬🇧",
    CA: "🇨🇦",
    AU: "🇦🇺",
    DE: "🇩🇪",
    FR: "🇫���",
    ES: "🇪🇸",
    IT: "🇮🇹",
    BR: "🇧🇷",
    IN: "🇮🇳",
    ID: "🇮🇩",
    PH: "🇵🇭",
    PK: "🇵🇰",
    BD: "🇧🇩",
    NG: "🇳🇬",
    EG: "🇪🇬",
    ZA: "🇿🇦",
    JP: "🇯🇵",
    KR: "🇰🇷",
    CN: "🇨🇳",
    RU: "🇷🇺",
    MX: "🇲🇽",
    AR: "🇦🇷",
    CL: "🇨🇱",
    CO: "🇨🇴",
  }
  return flags[countryCode] || "🌍"
}

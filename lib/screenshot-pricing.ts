// Screenshot pricing management functions - localStorage based
export interface ScreenshotPricingTier {
  id: number
  screenshot_number: number
  percentage_fee: number
  is_free: boolean
  is_active: boolean
}

export interface ScreenshotPricingSettings {
  max_screenshots_allowed: number
  default_screenshot_fee: number
  enable_percentage_pricing: boolean
  platform_screenshot_fee: number
}

export interface ScreenshotPricingCalculation {
  screenshotCount: number
  totalJobCost: number
  screenshotCosts: Array<{
    screenshotNumber: number
    cost: number
    percentage: number
    isFree: boolean
  }>
  totalScreenshotCost: number
  breakdown: string
}

// localStorage keys
const STORAGE_KEYS = {
  SETTINGS: "screenshot_pricing_settings",
  TIERS: "screenshot_pricing_tiers",
}

// Default settings
const DEFAULT_SETTINGS: ScreenshotPricingSettings = {
  max_screenshots_allowed: 5,
  default_screenshot_fee: 0.05,
  enable_percentage_pricing: true,
  platform_screenshot_fee: 0,
}

// Default tiers
const DEFAULT_TIERS: ScreenshotPricingTier[] = [
  { id: 1, screenshot_number: 1, percentage_fee: 0, is_free: true, is_active: true },
  { id: 2, screenshot_number: 2, percentage_fee: 3, is_free: false, is_active: true },
  { id: 3, screenshot_number: 3, percentage_fee: 3, is_free: false, is_active: true },
  { id: 4, screenshot_number: 4, percentage_fee: 5, is_free: false, is_active: true },
  { id: 5, screenshot_number: 5, percentage_fee: 5, is_free: false, is_active: true },
]

// Initialize default data if not exists
function initializeDefaultData() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS))
  }

  if (!localStorage.getItem(STORAGE_KEYS.TIERS)) {
    localStorage.setItem(STORAGE_KEYS.TIERS, JSON.stringify(DEFAULT_TIERS))
  }
}

// Get screenshot pricing tiers from localStorage
export async function getScreenshotPricingTiers(): Promise<ScreenshotPricingTier[]> {
  try {
    if (typeof window === "undefined") return DEFAULT_TIERS

    initializeDefaultData()

    const stored = localStorage.getItem(STORAGE_KEYS.TIERS)
    if (stored) {
      const tiers = JSON.parse(stored) as ScreenshotPricingTier[]
      return tiers.filter((tier) => tier.is_active).sort((a, b) => a.screenshot_number - b.screenshot_number)
    }

    return DEFAULT_TIERS
  } catch (error) {
    console.error("Error in getScreenshotPricingTiers:", error)
    return DEFAULT_TIERS
  }
}

// Get screenshot pricing settings from localStorage
export async function getScreenshotPricingSettings(): Promise<ScreenshotPricingSettings> {
  try {
    if (typeof window === "undefined") return DEFAULT_SETTINGS

    initializeDefaultData()

    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (stored) {
      return JSON.parse(stored) as ScreenshotPricingSettings
    }

    return DEFAULT_SETTINGS
  } catch (error) {
    console.error("Error in getScreenshotPricingSettings:", error)
    return DEFAULT_SETTINGS
  }
}

// Calculate screenshot costs based on job cost and screenshot count
export async function calculateScreenshotCosts(
  screenshotCount: number,
  totalJobCost: number,
): Promise<ScreenshotPricingCalculation> {
  try {
    const [tiers, settings] = await Promise.all([getScreenshotPricingTiers(), getScreenshotPricingSettings()])

    const screenshotCosts: Array<{
      screenshotNumber: number
      cost: number
      percentage: number
      isFree: boolean
    }> = []

    let totalScreenshotCost = 0

    for (let i = 1; i <= Math.min(screenshotCount, settings.max_screenshots_allowed); i++) {
      const tier = tiers.find((t) => t.screenshot_number === i)

      if (tier) {
        const isFree = tier.is_free
        const percentage = tier.percentage_fee
        const cost = isFree ? 0 : (totalJobCost * percentage) / 100

        screenshotCosts.push({
          screenshotNumber: i,
          cost,
          percentage,
          isFree,
        })

        totalScreenshotCost += cost
      } else {
        // Fallback to default pricing if tier not found
        const cost = settings.enable_percentage_pricing ? 0 : settings.default_screenshot_fee
        screenshotCosts.push({
          screenshotNumber: i,
          cost,
          percentage: 0,
          isFree: false,
        })
        totalScreenshotCost += cost
      }
    }

    // Generate breakdown text
    const breakdown = screenshotCosts
      .map((sc) => {
        if (sc.isFree) {
          return `Screenshot ${sc.screenshotNumber}: Free`
        } else if (sc.percentage > 0) {
          return `Screenshot ${sc.screenshotNumber}: ${sc.percentage}% ($${sc.cost.toFixed(2)})`
        } else {
          return `Screenshot ${sc.screenshotNumber}: $${sc.cost.toFixed(2)}`
        }
      })
      .join(", ")

    return {
      screenshotCount: Math.min(screenshotCount, settings.max_screenshots_allowed),
      totalJobCost,
      screenshotCosts,
      totalScreenshotCost,
      breakdown,
    }
  } catch (error) {
    console.error("Error calculating screenshot costs:", error)
    // Fallback calculation
    const fallbackCost = screenshotCount * 0.05
    return {
      screenshotCount,
      totalJobCost,
      screenshotCosts: [],
      totalScreenshotCost: fallbackCost,
      breakdown: `${screenshotCount} screenshots �� $0.05 = $${fallbackCost.toFixed(2)}`,
    }
  }
}

// Update screenshot pricing tier (admin function)
export async function updateScreenshotPricingTier(
  tierId: number,
  updates: Partial<ScreenshotPricingTier>,
): Promise<void> {
  try {
    if (typeof window === "undefined") return

    const tiers = await getScreenshotPricingTiers()
    const allTiers = JSON.parse(localStorage.getItem(STORAGE_KEYS.TIERS) || "[]") as ScreenshotPricingTier[]

    const updatedTiers = allTiers.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier))

    localStorage.setItem(STORAGE_KEYS.TIERS, JSON.stringify(updatedTiers))
  } catch (error) {
    console.error("Error in updateScreenshotPricingTier:", error)
    throw error
  }
}

// Update screenshot pricing setting (admin function)
export async function updateScreenshotPricingSetting(settingName: string, settingValue: number): Promise<void> {
  try {
    if (typeof window === "undefined") return

    const settings = await getScreenshotPricingSettings()
    const updatedSettings = {
      ...settings,
      [settingName]: settingValue,
    }

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings))
  } catch (error) {
    console.error("Error in updateScreenshotPricingSetting:", error)
    throw error
  }
}

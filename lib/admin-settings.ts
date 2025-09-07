// Admin settings for revision system
export interface RevisionSettings {
  maxRevisionRequests: number
  revisionRequestTimeoutValue: number
  revisionRequestTimeoutUnit: "minutes" | "hours" | "days"
  rejectionResponseTimeoutValue: number
  rejectionResponseTimeoutUnit: "minutes" | "hours" | "days"
  enableAutomaticRefunds: boolean
  refundOnRevisionTimeout: boolean
  refundOnRejectionTimeout: boolean
  enableRevisionWarnings: boolean
  revisionPenaltyEnabled: boolean
  revisionPenaltyAmount: number
}

export const getRevisionSettingsFromAPI = async (): Promise<RevisionSettings> => {
  try {
    console.log("[v0] Fetching revision settings from API...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch("/api/admin/revision-settings", {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    })

    clearTimeout(timeoutId)
    console.log("[v0] API response status:", response.status, response.statusText)

    if (response.ok) {
      const settings = await response.json()
      console.log("[v0] Loaded revision settings from API:", settings)

      if (settings && typeof settings === "object" && typeof settings.enableAutomaticRefunds === "boolean") {
        return settings
      } else {
        console.warn("[v0] Invalid settings structure from API, using defaults")
      }
    } else {
      const errorText = await response.text()
      console.error(
        `[v0] Failed to load revision settings from API. Status: ${response.status} ${response.statusText}. Response: ${errorText}`,
      )
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[v0] API request timeout - using default settings")
    } else {
      console.error("[v0] Error loading revision settings from API:", error)
      console.error("[v0] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }

  console.log("[v0] Using default revision settings due to API failure")
  return {
    maxRevisionRequests: 2,
    revisionRequestTimeoutValue: 24,
    revisionRequestTimeoutUnit: "hours",
    rejectionResponseTimeoutValue: 1,
    rejectionResponseTimeoutUnit: "minutes",
    enableAutomaticRefunds: true,
    refundOnRevisionTimeout: true,
    refundOnRejectionTimeout: true,
    enableRevisionWarnings: true,
    revisionPenaltyEnabled: false,
    revisionPenaltyAmount: 0,
  }
}

const REVISION_SETTINGS_KEY = "admin_revision_settings"

export const getRevisionSettings = (): RevisionSettings => {
  console.warn("[DEPRECATED] getRevisionSettings() uses localStorage. Use getRevisionSettingsFromAPI() instead.")

  if (typeof window === "undefined") {
    return {
      maxRevisionRequests: 2,
      revisionRequestTimeoutValue: 24,
      revisionRequestTimeoutUnit: "hours",
      rejectionResponseTimeoutValue: 1,
      rejectionResponseTimeoutUnit: "minutes",
      enableAutomaticRefunds: true,
      refundOnRevisionTimeout: true,
      refundOnRejectionTimeout: true,
      enableRevisionWarnings: true,
      revisionPenaltyEnabled: false,
      revisionPenaltyAmount: 0,
    }
  }

  try {
    const stored = localStorage.getItem(REVISION_SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.workerResponseTimeoutHours && !parsed.revisionRequestTimeoutValue) {
        return {
          ...parsed,
          revisionRequestTimeoutValue: parsed.workerResponseTimeoutHours || 24,
          revisionRequestTimeoutUnit: "hours",
          rejectionResponseTimeoutValue: parsed.workerResponseTimeoutHours || 1,
          rejectionResponseTimeoutUnit: "minutes",
          enableAutomaticRefunds: parsed.enableAutomaticRefunds ?? true,
          refundOnRevisionTimeout: parsed.refundOnRevisionTimeout ?? true,
          refundOnRejectionTimeout: parsed.refundOnRejectionTimeout ?? true,
        }
      }
      return {
        maxRevisionRequests: 2,
        revisionRequestTimeoutValue: 24,
        revisionRequestTimeoutUnit: "hours",
        rejectionResponseTimeoutValue: 1,
        rejectionResponseTimeoutUnit: "minutes",
        enableAutomaticRefunds: true,
        refundOnRevisionTimeout: true,
        refundOnRejectionTimeout: true,
        enableRevisionWarnings: true,
        revisionPenaltyEnabled: false,
        revisionPenaltyAmount: 0,
        ...parsed,
      }
    }
  } catch (error) {
    console.error("Failed to load revision settings:", error)
  }

  return {
    maxRevisionRequests: 2,
    revisionRequestTimeoutValue: 24,
    revisionRequestTimeoutUnit: "hours",
    rejectionResponseTimeoutValue: 1,
    rejectionResponseTimeoutUnit: "minutes",
    enableAutomaticRefunds: true,
    refundOnRevisionTimeout: true,
    refundOnRejectionTimeout: true,
    enableRevisionWarnings: true,
    revisionPenaltyEnabled: false,
    revisionPenaltyAmount: 0,
  }
}

export const updateRevisionSettings = (settings: RevisionSettings): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(REVISION_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("Failed to save revision settings:", error)
  }
}

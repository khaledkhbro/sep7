import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function GET() {
  try {
    const defaultSettings = {
      maxRevisionRequests: 2,
      revisionRequestTimeoutValue: 24,
      revisionRequestTimeoutUnit: "hours",
      rejectionResponseTimeoutValue: 24,
      rejectionResponseTimeoutUnit: "hours",
      enableAutomaticRefunds: true,
      refundOnRevisionTimeout: true,
      refundOnRejectionTimeout: true,
      enableRevisionWarnings: true,
      revisionPenaltyEnabled: false,
      revisionPenaltyAmount: 0,
    }

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("admin_revision_settings")
        if (stored) {
          const storedSettings = JSON.parse(stored)
          const mergedSettings = {
            ...defaultSettings,
            ...storedSettings,
          }
          console.log("[v0] Revision settings API: Successfully loaded from localStorage")
          return NextResponse.json(mergedSettings)
        }
      }

      console.log("[v0] Revision settings not found in localStorage, using defaults")
      return NextResponse.json(defaultSettings)
    } catch (error) {
      console.log("[v0] Error loading revision settings from localStorage, using defaults:", error)
      return NextResponse.json(defaultSettings)
    }
  } catch (error) {
    console.error("Error in revision settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const settings = await request.json()

    console.log("[v0] API: Saving revision settings for user:", user.id, settings)

    // Validate settings structure
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    const settingsWithTimestamp = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_revision_settings", JSON.stringify(settingsWithTimestamp))
      }
      console.log("[v0] API: Successfully saved revision settings to localStorage")
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("[v0] Error saving revision settings to localStorage:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error saving revision settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

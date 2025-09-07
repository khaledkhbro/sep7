import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { promises as fs } from "fs"
import path from "path"

const SETTINGS_DIR = path.join(process.cwd(), "data", "admin-settings")
const FEATURE_SETTINGS_FILE = path.join(SETTINGS_DIR, "feature-settings.json")

async function ensureSettingsDir() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await ensureSettingsDir()

    const defaultSettings = {
      enableMicrojobs: true,
      enableMarketplace: true,
      enableWallet: true,
      enableReferrals: true,
      enableReviews: true,
      enableChat: false,
    }

    try {
      const fileContent = await fs.readFile(FEATURE_SETTINGS_FILE, "utf-8")
      const settings = JSON.parse(fileContent)
      console.log("[v0] Feature settings API: Successfully loaded local settings")
      return NextResponse.json(settings)
    } catch (error) {
      console.log("[v0] Feature settings file not found, using defaults")
      return NextResponse.json(defaultSettings)
    }
  } catch (error) {
    console.error("Error in feature settings GET:", error)
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

    console.log("[v0] API: Saving feature settings for user:", user.id, settings)

    // Validate settings structure
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    await ensureSettingsDir()

    const settingsWithTimestamp = {
      ...settings,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(FEATURE_SETTINGS_FILE, JSON.stringify(settingsWithTimestamp, null, 2))

    console.log("[v0] API: Successfully saved feature settings to local file")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving feature settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

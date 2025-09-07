import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { promises as fs } from "fs"
import path from "path"

const SETTINGS_DIR = path.join(process.cwd(), "data", "admin-settings")
const FIREBASE_SETTINGS_FILE = path.join(SETTINGS_DIR, "firebase-settings.json")

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
      fcm_enabled: false,
      firebase_project_id: "",
      firebase_private_key: "",
      firebase_client_email: "",
      fcm_web_config: "",
      fcm_default_icon: "/icon-192x192.png",
      fcm_default_badge: "/badge-72x72.png",
    }

    try {
      const fileContent = await fs.readFile(FIREBASE_SETTINGS_FILE, "utf-8")
      const settings = JSON.parse(fileContent)
      console.log("[v0] Firebase settings API: Successfully loaded local settings")
      return NextResponse.json(settings)
    } catch (error) {
      console.log("[v0] Firebase settings file not found, using defaults")
      return NextResponse.json(defaultSettings)
    }
  } catch (error) {
    console.error("Error in Firebase settings GET:", error)
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

    console.log("[v0] API: Saving Firebase settings for user:", user.id)

    // Validate settings structure
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 })
    }

    // Validate required fields if FCM is enabled
    if (settings.fcm_enabled) {
      if (!settings.firebase_project_id || !settings.firebase_client_email) {
        return NextResponse.json(
          { error: "Project ID and Client Email are required when FCM is enabled" },
          { status: 400 },
        )
      }

      if (settings.fcm_web_config && settings.fcm_web_config.trim()) {
        try {
          JSON.parse(settings.fcm_web_config)
        } catch {
          return NextResponse.json({ error: "Invalid Firebase web configuration JSON" }, { status: 400 })
        }
      }
    }

    await ensureSettingsDir()

    const settingsWithTimestamp = {
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    await fs.writeFile(FIREBASE_SETTINGS_FILE, JSON.stringify(settingsWithTimestamp, null, 2))

    console.log("[v0] API: Successfully saved Firebase settings to local file")
    return NextResponse.json({ success: true, message: "Firebase settings saved successfully" })
  } catch (error) {
    console.error("Error saving Firebase settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

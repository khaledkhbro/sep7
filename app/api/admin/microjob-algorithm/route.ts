import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching microjob algorithm settings...")

    const settings = await sql`
      SELECT * FROM microjob_algorithm_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (settings.length === 0) {
      console.log("[v0] No settings found, returning defaults")
      // Return default settings if none exist
      const defaultSettings = {
        id: 1,
        algorithm_type: "newest_first",
        is_enabled: true,
        rotation_hours: 8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json(defaultSettings)
    }

    console.log("[v0] Settings found:", settings[0])
    return NextResponse.json(settings[0])
  } catch (error) {
    console.error("[v0] Error fetching microjob algorithm settings:", error)
    return NextResponse.json({ error: "Failed to fetch algorithm settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Updating microjob algorithm settings...")

    const body = await request.json()
    const { algorithm_type, is_enabled, rotation_hours } = body

    console.log("[v0] Update request body:", body)

    // Validate input
    if (algorithm_type && !["newest_first", "time_rotation"].includes(algorithm_type)) {
      return NextResponse.json({ error: "Invalid algorithm type" }, { status: 400 })
    }

    if (rotation_hours && (rotation_hours < 1 || rotation_hours > 24)) {
      return NextResponse.json({ error: "Rotation hours must be between 1 and 24" }, { status: 400 })
    }

    // First, try to get existing settings
    const existing = await sql`
      SELECT id FROM microjob_algorithm_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    let updatedSettings

    if (existing.length > 0) {
      // Update existing record
      updatedSettings = await sql`
        UPDATE microjob_algorithm_settings 
        SET 
          algorithm_type = ${algorithm_type || "newest_first"}, 
          is_enabled = ${is_enabled !== undefined ? is_enabled : true}, 
          rotation_hours = ${rotation_hours || 8}, 
          updated_at = NOW()
        WHERE id = ${existing[0].id}
        RETURNING *
      `
    } else {
      // Insert new record
      updatedSettings = await sql`
        INSERT INTO microjob_algorithm_settings (algorithm_type, is_enabled, rotation_hours, updated_at)
        VALUES (
          ${algorithm_type || "newest_first"}, 
          ${is_enabled !== undefined ? is_enabled : true}, 
          ${rotation_hours || 8}, 
          NOW()
        )
        RETURNING *
      `
    }

    // If switching to time rotation, initialize tracking for existing microjobs
    if (algorithm_type === "time_rotation") {
      console.log("[v0] Initializing rotation tracking for existing microjobs...")
      await sql`
        INSERT INTO microjob_rotation_tracking (job_id, last_front_page_at, rotation_cycle)
        SELECT id::integer, NOW() - INTERVAL '1 hour', 1
        FROM microjobs 
        WHERE status = 'open'
        ON CONFLICT (job_id) DO NOTHING
      `
    }

    console.log("[v0] Settings updated successfully:", updatedSettings[0])
    return NextResponse.json(updatedSettings[0])
  } catch (error) {
    console.error("[v0] Error updating microjob algorithm settings:", error)
    return NextResponse.json({ error: "Failed to update algorithm settings" }, { status: 500 })
  }
}

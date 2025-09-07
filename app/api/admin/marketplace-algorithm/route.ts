import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const settings = await sql`
      SELECT * FROM microjob_algorithm_settings
      ORDER BY created_at DESC
      LIMIT 1
    `

    return NextResponse.json({
      settings: settings[0] || {
        algorithm_type: "newest_first",
        is_enabled: true,
        rotation_hours: 8,
      },
      promotedServices: [],
    })
  } catch (error) {
    console.error("Error fetching algorithm settings:", error)
    return NextResponse.json({ error: "Failed to fetch algorithm settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { algorithmSettings, promotedServices, pageSettings } = await request.json()

    const result = await sql`
      INSERT INTO microjob_algorithm_settings (algorithm_type, is_enabled, rotation_hours, updated_at)
      VALUES (${algorithmSettings.algorithm_type || "newest_first"}, ${algorithmSettings.is_enabled || true}, ${algorithmSettings.rotation_hours || 8}, NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        algorithm_type = ${algorithmSettings.algorithm_type || "newest_first"},
        is_enabled = ${algorithmSettings.is_enabled || true},
        rotation_hours = ${algorithmSettings.rotation_hours || 8},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving algorithm settings:", error)
    return NextResponse.json({ error: "Failed to save algorithm settings" }, { status: 500 })
  }
}

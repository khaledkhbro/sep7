import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const placements = await sql`
      SELECT * FROM ad_placement_settings 
      WHERE is_enabled = true 
      ORDER BY priority ASC
    `

    return NextResponse.json(placements || [])
  } catch (error) {
    console.error("Error in ad placements API:", error)
    return NextResponse.json({ placements: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { placement_name, is_enabled, priority } = body

    if (!placement_name) {
      return NextResponse.json({ error: "Placement name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO ad_placement_settings (placement_name, is_enabled, priority, updated_at)
      VALUES (${placement_name}, ${is_enabled}, ${priority}, NOW())
      ON CONFLICT (placement_name) 
      DO UPDATE SET 
        is_enabled = ${is_enabled},
        priority = ${priority},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true, updated: result[0] })
  } catch (error) {
    console.error("Error in ad placements POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const networks = await sql`
      SELECT * FROM ad_network_settings 
      WHERE is_enabled = true 
      ORDER BY network_name ASC
    `

    return NextResponse.json(networks || [])
  } catch (error) {
    console.error("Error in ad networks API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { network_name, is_enabled, publisher_id, site_id, zone_id, api_key, script_code, auto_ads_code } = body

    if (!network_name) {
      return NextResponse.json({ error: "Network name is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO ad_network_settings (
        network_name, is_enabled, publisher_id, site_id, zone_id, 
        api_key, script_code, auto_ads_code, updated_at
      )
      VALUES (
        ${network_name}, ${is_enabled}, ${publisher_id}, ${site_id}, ${zone_id},
        ${api_key}, ${script_code}, ${auto_ads_code}, NOW()
      )
      ON CONFLICT (network_name) 
      DO UPDATE SET 
        is_enabled = ${is_enabled},
        publisher_id = ${publisher_id},
        site_id = ${site_id},
        zone_id = ${zone_id},
        api_key = ${api_key},
        script_code = ${script_code},
        auto_ads_code = ${auto_ads_code},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ success: true, updated: result[0] })
  } catch (error) {
    console.error("Error in ad networks POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

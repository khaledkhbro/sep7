import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const networks = await sql`
      SELECT * FROM ad_network_settings 
      ORDER BY network_name ASC
    `

    const placements = await sql`
      SELECT * FROM ad_placement_settings 
      ORDER BY priority ASC
    `

    return NextResponse.json({
      networks: networks || [],
      placements: placements || [],
    })
  } catch (error) {
    console.error("Error in admin ad settings API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { networks, placements } = body

    if (networks) {
      for (const network of networks) {
        await sql`
          INSERT INTO ad_network_settings (
            network_name, is_enabled, publisher_id, site_id, zone_id,
            api_key, script_code, auto_ads_code, updated_at
          )
          VALUES (
            ${network.network_name}, ${network.is_enabled}, ${network.publisher_id}, 
            ${network.site_id}, ${network.zone_id}, ${network.api_key}, 
            ${network.script_code}, ${network.auto_ads_code}, NOW()
          )
          ON CONFLICT (network_name) 
          DO UPDATE SET 
            is_enabled = ${network.is_enabled},
            publisher_id = ${network.publisher_id},
            site_id = ${network.site_id},
            zone_id = ${network.zone_id},
            api_key = ${network.api_key},
            script_code = ${network.script_code},
            auto_ads_code = ${network.auto_ads_code},
            updated_at = NOW()
        `
      }
    }

    if (placements) {
      for (const placement of placements) {
        await sql`
          INSERT INTO ad_placement_settings (placement_name, is_enabled, priority, updated_at)
          VALUES (${placement.placement_name}, ${placement.is_enabled}, ${placement.priority}, NOW())
          ON CONFLICT (placement_name) 
          DO UPDATE SET 
            is_enabled = ${placement.is_enabled},
            priority = ${placement.priority},
            updated_at = NOW()
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin ad settings POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

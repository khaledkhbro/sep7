import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("[v0] Fetching microjob rotation stats...")

    // Get algorithm settings
    const settings = await sql`
      SELECT * FROM microjob_algorithm_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const currentSettings = settings[0] || { rotation_hours: 8 }
    console.log("[v0] Current algorithm settings:", currentSettings)

    // Get rotation stats from microjobs table
    const stats = await sql`
      SELECT 
        COUNT(*) as total_jobs,
        AVG(front_page_duration_minutes) as avg_front_page_time,
        MAX(rotation_cycle) as current_cycle
      FROM microjob_rotation_tracking mrt
      JOIN microjobs m ON mrt.job_id = m.id::integer
      WHERE m.status = 'open'
    `

    console.log("[v0] Raw rotation stats:", stats[0])

    // Calculate next rotation time
    const rotationMs = currentSettings.rotation_hours * 60 * 60 * 1000
    const now = Date.now()

    // Get the most recent front page update
    const lastUpdate = await sql`
      SELECT last_front_page_at 
      FROM microjob_rotation_tracking 
      ORDER BY last_front_page_at DESC 
      LIMIT 1
    `

    let nextRotationIn = 0
    if (lastUpdate.length > 0) {
      const lastUpdateTime = new Date(lastUpdate[0].last_front_page_at).getTime()
      const timeSinceUpdate = now - lastUpdateTime
      nextRotationIn = Math.max(0, rotationMs - timeSinceUpdate)
      console.log("[v0] Last update time:", lastUpdate[0].last_front_page_at)
      console.log("[v0] Time since update (ms):", timeSinceUpdate)
      console.log("[v0] Next rotation in (ms):", nextRotationIn)
    }

    const totalMicrojobs = await sql`
      SELECT COUNT(*) as total_microjobs
      FROM microjobs 
      WHERE status = 'open'
    `

    const result = {
      totalJobs: Number.parseInt(stats[0]?.total_jobs || "0"),
      totalMicrojobs: Number.parseInt(totalMicrojobs[0]?.total_microjobs || "0"),
      averageFrontPageTime: Number.parseFloat(stats[0]?.avg_front_page_time || "0"),
      currentCycle: Number.parseInt(stats[0]?.current_cycle || "1"),
      nextRotationIn: Math.round(nextRotationIn / (1000 * 60)), // Convert to minutes
    }

    console.log("[v0] Returning stats:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching microjob rotation stats:", error)
    return NextResponse.json({ error: "Failed to fetch rotation stats" }, { status: 500 })
  }
}

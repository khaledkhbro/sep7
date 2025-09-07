import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const stats = await sql`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as jobs_last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as jobs_last_week
      FROM microjobs
    `

    const rotationStats = await sql`
      SELECT 
        COUNT(*) as total_rotations,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as rotations_last_24h
      FROM microjob_rotation_tracking
    `

    return NextResponse.json({
      totalJobs: Number.parseInt(stats[0]?.total_jobs || "0"),
      jobsLast24h: Number.parseInt(stats[0]?.jobs_last_24h || "0"),
      jobsLastWeek: Number.parseInt(stats[0]?.jobs_last_week || "0"),
      totalRotations: Number.parseInt(rotationStats[0]?.total_rotations || "0"),
      rotationsLast24h: Number.parseInt(rotationStats[0]?.rotations_last_24h || "0"),
    })
  } catch (error) {
    console.error("Error fetching rotation stats:", error)
    return NextResponse.json({ error: "Failed to fetch rotation stats" }, { status: 500 })
  }
}

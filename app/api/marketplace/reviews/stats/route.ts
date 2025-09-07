import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const revieweeId = searchParams.get("revieweeId")
    const reviewerType = searchParams.get("reviewerType")

    // Build WHERE clause
    const whereConditions = ["is_deleted = FALSE"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (revieweeId) {
      whereConditions.push(`reviewee_id = $${paramIndex}`)
      queryParams.push(revieweeId)
      paramIndex++
    }

    if (reviewerType) {
      whereConditions.push(`reviewer_type = $${paramIndex}`)
      queryParams.push(reviewerType)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get review statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::DECIMAL(3,2) as avg_rating,
        AVG(communication_rating)::DECIMAL(3,2) as avg_communication,
        AVG(quality_rating)::DECIMAL(3,2) as avg_quality,
        AVG(value_rating)::DECIMAL(3,2) as avg_value,
        AVG(delivery_time_rating)::DECIMAL(3,2) as avg_delivery_time,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
      FROM marketplace_reviews 
      ${whereClause}
    `

    const [stats] = await sql(statsQuery, queryParams)

    // Convert string numbers to actual numbers
    const formattedStats = {
      total_reviews: Number.parseInt(stats.total_reviews) || 0,
      avg_rating: Number.parseFloat(stats.avg_rating) || 0,
      avg_communication: Number.parseFloat(stats.avg_communication) || 0,
      avg_quality: Number.parseFloat(stats.avg_quality) || 0,
      avg_value: Number.parseFloat(stats.avg_value) || 0,
      avg_delivery_time: Number.parseFloat(stats.avg_delivery_time) || 0,
      five_star_count: Number.parseInt(stats.five_star_count) || 0,
      four_star_count: Number.parseInt(stats.four_star_count) || 0,
      three_star_count: Number.parseInt(stats.three_star_count) || 0,
      two_star_count: Number.parseInt(stats.two_star_count) || 0,
      one_star_count: Number.parseInt(stats.one_star_count) || 0,
    }

    return NextResponse.json(formattedStats)
  } catch (error) {
    console.error("Error fetching review stats:", error)
    return NextResponse.json({ error: "Failed to fetch review statistics" }, { status: 500 })
  }
}

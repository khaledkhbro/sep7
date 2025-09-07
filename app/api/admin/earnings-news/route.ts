import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 10
    const offset = (page - 1) * limit

    // Get all earnings news for admin
    const newsResult = await sql`
      SELECT * FROM get_all_earnings_news_admin(${offset}, ${limit})
    `

    // Get total count for pagination
    const countResult = await sql`
      SELECT get_all_earnings_news_count_admin() as total
    `

    const total = countResult[0]?.total || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: newsResult,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching admin earnings news:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch earnings news" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, thumbnail, description, money, countries, status = true } = body

    // Validate required fields
    if (!title || !thumbnail || !description || money === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO earnings_news (title, thumbnail, description, money, countries, status)
      VALUES (${title}, ${thumbnail}, ${description}, ${money}, ${countries}, ${status})
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Earnings news created successfully",
    })
  } catch (error) {
    console.error("Error creating earnings news:", error)
    return NextResponse.json({ success: false, error: "Failed to create earnings news" }, { status: 500 })
  }
}

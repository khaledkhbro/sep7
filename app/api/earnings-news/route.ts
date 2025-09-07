import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Earnings News API: Starting request")

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error("[v0] Earnings News API: DATABASE_URL not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country") || null
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = 5
    const offset = (page - 1) * limit

    console.log(`[v0] Earnings News API: Fetching news for country: ${country}, page: ${page}`)

    // Get earnings news for user with country filtering
    let newsResult, countResult

    try {
      newsResult = await sql`
        SELECT * FROM get_earnings_news_for_user(${country}, ${offset}, ${limit})
      `
      console.log(`[v0] Earnings News API: Found ${newsResult.length} news items`)
    } catch (dbError) {
      console.error("[v0] Earnings News API: Error calling get_earnings_news_for_user:", dbError)

      // If function doesn't exist, try direct query as fallback
      console.log("[v0] Earnings News API: Trying fallback query")
      newsResult = await sql`
        SELECT 
          id,
          title,
          thumbnail,
          description,
          money,
          countries,
          created_at
        FROM earnings_news 
        WHERE status = true
        AND (
          countries IS NULL 
          OR ${country} IS NULL 
          OR ${country} = ANY(countries)
        )
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      console.log(`[v0] Earnings News API: Fallback query returned ${newsResult.length} items`)
    }

    try {
      countResult = await sql`
        SELECT get_earnings_news_count_for_user(${country}) as total
      `
    } catch (dbError) {
      console.error("[v0] Earnings News API: Error calling get_earnings_news_count_for_user:", dbError)

      // Fallback count query
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM earnings_news 
        WHERE status = true
        AND (
          countries IS NULL 
          OR ${country} IS NULL 
          OR ${country} = ANY(countries)
        )
      `
    }

    const total = Number(countResult[0]?.total) || 0
    const totalPages = Math.ceil(total / limit)

    console.log(`[v0] Earnings News API: Total items: ${total}, pages: ${totalPages}`)

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
    console.error("[v0] Earnings News API: Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch earnings news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

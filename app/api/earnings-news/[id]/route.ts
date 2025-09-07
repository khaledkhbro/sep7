import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await sql`
      SELECT id, title, thumbnail, description, money, countries, created_at
      FROM earnings_news 
      WHERE id = ${id} AND status = true
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Earnings news not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error("Error fetching earnings news details:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch earnings news details" }, { status: 500 })
  }
}

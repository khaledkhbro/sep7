import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await sql`
      SELECT * FROM earnings_news WHERE id = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Earnings news not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error("Error fetching earnings news:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch earnings news" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, thumbnail, description, money, countries, status } = body

    const result = await sql`
      UPDATE earnings_news 
      SET 
        title = ${title},
        thumbnail = ${thumbnail},
        description = ${description},
        money = ${money},
        countries = ${countries},
        status = ${status}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Earnings news not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result[0],
      message: "Earnings news updated successfully",
    })
  } catch (error) {
    console.error("Error updating earnings news:", error)
    return NextResponse.json({ success: false, error: "Failed to update earnings news" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const result = await sql`
      DELETE FROM earnings_news WHERE id = ${id} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Earnings news not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Earnings news deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting earnings news:", error)
    return NextResponse.json({ success: false, error: "Failed to delete earnings news" }, { status: 500 })
  }
}

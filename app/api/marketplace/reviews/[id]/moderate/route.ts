import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviewId = Number.parseInt(params.id)
    const body = await request.json()
    const { action } = body // 'hide' or 'show'

    if (!action || !["hide", "show"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'hide' or 'show'" }, { status: 400 })
    }

    // Check if review exists
    const existingReview = await sql("SELECT id FROM marketplace_reviews WHERE id = $1 AND is_deleted = FALSE", [
      reviewId,
    ])

    if (existingReview.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    // Update review visibility
    const isHidden = action === "hide"
    const [updatedReview] = await sql(
      `
      UPDATE marketplace_reviews 
      SET 
        is_hidden = $1,
        updated_at = NOW()
      WHERE id = $2 AND is_deleted = FALSE
      RETURNING *
      `,
      [isHidden, reviewId],
    )

    return NextResponse.json({
      message: `Review ${action === "hide" ? "hidden" : "shown"} successfully`,
      review: updatedReview,
    })
  } catch (error) {
    console.error("Error moderating review:", error)
    return NextResponse.json({ error: "Failed to moderate review" }, { status: 500 })
  }
}

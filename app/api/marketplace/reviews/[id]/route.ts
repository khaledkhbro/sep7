import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviewId = Number.parseInt(params.id)
    const body = await request.json()
    const {
      rating,
      title,
      comment,
      communication_rating,
      quality_rating,
      value_rating,
      delivery_time_rating,
      reviewer_id, // For authorization
    } = body

    // Validate required fields
    if (!rating || !title || !comment || !reviewer_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if review exists and belongs to the reviewer
    const existingReview = await sql(
      "SELECT id, reviewer_id FROM marketplace_reviews WHERE id = $1 AND is_deleted = FALSE",
      [reviewId],
    )

    if (existingReview.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview[0].reviewer_id !== reviewer_id) {
      return NextResponse.json({ error: "Unauthorized to edit this review" }, { status: 403 })
    }

    // Update review
    const [updatedReview] = await sql(
      `
      UPDATE marketplace_reviews 
      SET 
        rating = $1,
        title = $2,
        comment = $3,
        communication_rating = $4,
        quality_rating = $5,
        value_rating = $6,
        delivery_time_rating = $7,
        updated_at = NOW()
      WHERE id = $8 AND is_deleted = FALSE
      RETURNING *
    `,
      [
        rating,
        title,
        comment,
        communication_rating || rating,
        quality_rating || rating,
        value_rating || rating,
        delivery_time_rating || rating,
        reviewId,
      ],
    )

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reviewId = Number.parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const reviewerId = searchParams.get("reviewerId")

    if (!reviewerId) {
      return NextResponse.json({ error: "Reviewer ID required" }, { status: 400 })
    }

    // Check if review exists and belongs to the reviewer
    const existingReview = await sql(
      "SELECT id, reviewer_id FROM marketplace_reviews WHERE id = $1 AND is_deleted = FALSE",
      [reviewId],
    )

    if (existingReview.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview[0].reviewer_id !== reviewerId) {
      return NextResponse.json({ error: "Unauthorized to delete this review" }, { status: 403 })
    }

    // Soft delete review
    await sql(
      `
      UPDATE marketplace_reviews 
      SET is_deleted = TRUE, deleted_at = NOW()
      WHERE id = $1
    `,
      [reviewId],
    )

    return NextResponse.json({ message: "Review deleted successfully" })
  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}

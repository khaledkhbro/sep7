import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "5")
    const search = searchParams.get("search") || ""
    const rating = searchParams.get("rating")
    const sortBy = searchParams.get("sortBy") || "newest"
    const revieweeId = searchParams.get("revieweeId")

    const offset = (page - 1) * limit

    // Build WHERE clause
    const whereConditions = ["is_deleted = FALSE"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR comment ILIKE $${paramIndex} OR reviewer_id ILIKE $${paramIndex})`,
      )
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (rating && rating !== "all") {
      whereConditions.push(`rating = $${paramIndex}`)
      queryParams.push(Number.parseInt(rating))
      paramIndex++
    }

    if (revieweeId) {
      whereConditions.push(`reviewee_id = $${paramIndex}`)
      queryParams.push(revieweeId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Build ORDER BY clause
    let orderBy = "created_at DESC"
    switch (sortBy) {
      case "oldest":
        orderBy = "created_at ASC"
        break
      case "highest":
        orderBy = "rating DESC, created_at DESC"
        break
      case "lowest":
        orderBy = "rating ASC, created_at DESC"
        break
      default:
        orderBy = "created_at DESC"
    }

    // Get reviews with pagination
    const reviewsQuery = `
      SELECT 
        id, order_id, reviewer_id, reviewee_id, reviewer_type, rating, title, comment,
        communication_rating, quality_rating, value_rating, delivery_time_rating,
        created_at, updated_at
      FROM marketplace_reviews 
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const reviews = await sql(reviewsQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM marketplace_reviews 
      ${whereClause}
    `
    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const [{ total }] = await sql(countQuery, countParams)

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: Number.parseInt(total),
        totalPages: Math.ceil(Number.parseInt(total) / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_id,
      reviewer_id,
      reviewee_id,
      reviewer_type,
      rating,
      title,
      comment,
      communication_rating,
      quality_rating,
      value_rating,
      delivery_time_rating,
    } = body

    // Validate required fields
    if (!order_id || !reviewer_id || !reviewee_id || !reviewer_type || !rating || !title || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if review already exists for this order and reviewer
    const existingReview = await sql(
      "SELECT id FROM marketplace_reviews WHERE order_id = $1 AND reviewer_id = $2 AND is_deleted = FALSE",
      [order_id, reviewer_id],
    )

    if (existingReview.length > 0) {
      return NextResponse.json({ error: "Review already exists for this order" }, { status: 409 })
    }

    // Insert new review
    const [newReview] = await sql(
      `
      INSERT INTO marketplace_reviews (
        order_id, reviewer_id, reviewee_id, reviewer_type, rating, title, comment,
        communication_rating, quality_rating, value_rating, delivery_time_rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,
      [
        order_id,
        reviewer_id,
        reviewee_id,
        reviewer_type,
        rating,
        title,
        comment,
        communication_rating || rating,
        quality_rating || rating,
        value_rating || rating,
        delivery_time_rating || rating,
      ],
    )

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

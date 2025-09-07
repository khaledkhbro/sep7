import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const userId = "02" // Default user for now

    const favorites = await sql`
      SELECT 
        uf.id,
        uf.created_at,
        m.id as job_id,
        m.title,
        m.description,
        m.budget_min,
        m.budget_max,
        m.deadline,
        m.location,
        m.is_remote,
        m.status,
        m.created_at as job_created_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug
      FROM user_favorites uf
      LEFT JOIN microjobs m ON uf.job_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE uf.user_id = ${userId}
      ORDER BY uf.created_at DESC
    `

    const transformedFavorites = favorites.map((fav) => ({
      id: fav.job_id,
      title: fav.title,
      description: fav.description,
      budget_min: fav.budget_min,
      budget_max: fav.budget_max,
      deadline: fav.deadline,
      location: fav.location,
      is_remote: fav.is_remote,
      status: fav.status,
      created_at: fav.job_created_at,
      favoriteId: fav.id,
      favoritedAt: fav.created_at,
      users: {
        id: fav.user_id,
        first_name: fav.first_name,
        last_name: fav.last_name,
        username: fav.username,
        avatar_url: fav.avatar_url,
      },
      categories: {
        id: fav.category_id,
        name: fav.category_name,
        slug: fav.category_slug,
      },
    }))

    return NextResponse.json(transformedFavorites)
  } catch (error) {
    console.error("Error in favorites GET:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = "02" // Default user for now

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO user_favorites (user_id, job_id, created_at)
      VALUES (${userId}, ${jobId}, NOW())
      ON CONFLICT (user_id, job_id) DO NOTHING
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Job already in favorites" }, { status: 409 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error in favorites POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = "02" // Default user for now

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM user_favorites 
      WHERE user_id = ${userId} AND job_id = ${jobId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in favorites DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

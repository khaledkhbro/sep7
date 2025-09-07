import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, achievementId, vipReferralsCount } = body

    const result = await query(
      `
      INSERT INTO achievement_requests (user_id, achievement_id, vip_referrals_count, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING *
    `,
      [userId, achievementId, vipReferralsCount],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error creating achievement request:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}

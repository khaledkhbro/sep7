import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") // Get from session/auth

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check if required tables exist
    try {
      await query("SELECT 1 FROM users LIMIT 1")
      await query("SELECT 1 FROM referrals LIMIT 1")
      await query("SELECT 1 FROM achievements LIMIT 1")
      await query("SELECT 1 FROM achievement_requests LIMIT 1")
    } catch (tableError) {
      console.error("Database tables missing:", tableError)
      return NextResponse.json(
        {
          error: "Database tables not found. Please run the referrals system setup script first.",
          details: "Required tables: users, referrals, achievements, achievement_requests",
        },
        { status: 500 },
      )
    }

    // Get user's referral code
    const userResult = await query(
      `
      SELECT referral_code FROM users WHERE id = $1
    `,
      [userId],
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const referralCode = userResult.rows[0].referral_code

    // Get referral statistics
    const statsResult = await query(
      `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN is_vip = true THEN 1 END) as vip
      FROM referrals 
      WHERE referrer_id = $1
    `,
      [userId],
    )

    // Get referred users
    const referralsResult = await query(
      `
      SELECT 
        r.id,
        r.created_at as joining_date,
        u.id as user_id,
        COALESCE(u.first_name || ' ' || u.last_name, u.username, 'Unknown User') as full_name,
        u.email,
        u.country,
        r.status,
        r.is_vip,
        r.vip_method,
        r.vip_achieved_at
      FROM referrals r
      JOIN users u ON r.referred_user_id = u.id
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
    `,
      [userId],
    )

    // Get achievements
    const achievementsResult = await query(`
      SELECT * FROM achievements WHERE is_active = true ORDER BY referral_requirement ASC
    `)

    // Get user's achievement requests
    const requestsResult = await query(
      `
      SELECT * FROM achievement_requests WHERE user_id = $1 ORDER BY requested_at DESC
    `,
      [userId],
    )

    return NextResponse.json({
      referralCode,
      statistics: statsResult.rows[0] || { total: 0, completed: 0, pending: 0, vip: 0 },
      referrals: referralsResult.rows,
      achievements: achievementsResult.rows,
      userRequests: requestsResult.rows,
    })
  } catch (error) {
    console.error("Error fetching referral data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch referral data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  try {
    // Get current user and verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: userData } = await supabase.from("users").select("user_type").eq("id", user.id).single()

    if (userData?.user_type !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all achievement requests with user and achievement details
    const { data: requests, error: requestsError } = await supabase
      .from("user_achievement_requests")
      .select(`
        *,
        user:users!user_achievement_requests_user_id_fkey (
          first_name,
          last_name,
          email
        ),
        achievement:referral_achievements!user_achievement_requests_achievement_id_fkey (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (requestsError) {
      console.error("Error fetching achievement requests:", requestsError)
      return NextResponse.json({ error: "Failed to fetch achievement requests" }, { status: 500 })
    }

    // Format the data for the frontend
    const formattedRequests =
      requests?.map((request) => ({
        id: request.id,
        userId: request.user_id,
        userName: `${request.user.first_name} ${request.user.last_name}`,
        userEmail: request.user.email,
        achievementId: request.achievement_id,
        achievementName: request.achievement.name,
        vipReferralsCount: request.vip_referrals_count,
        status: request.status,
        createdAt: request.created_at,
        processedAt: request.processed_at,
        processedBy: request.processed_by,
      })) || []

    return NextResponse.json({
      requests: formattedRequests,
    })
  } catch (error) {
    console.error("Error in admin achievement requests API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

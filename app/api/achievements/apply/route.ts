import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { achievementId } = await request.json()

    if (!achievementId) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }

    // Get the achievement details
    const { data: achievement, error: achievementError } = await supabase
      .from("referral_achievements")
      .select("*")
      .eq("id", achievementId)
      .eq("is_active", true)
      .single()

    if (achievementError || !achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 404 })
    }

    // Check if user already has a request for this achievement
    const { data: existingRequest, error: existingError } = await supabase
      .from("user_achievement_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("achievement_id", achievementId)
      .single()

    if (existingRequest) {
      return NextResponse.json({ error: "You have already applied for this achievement" }, { status: 400 })
    }

    // Get user's current VIP referral count
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", user.id)
      .eq("is_vip", true)

    if (referralsError) {
      console.error("Error fetching VIP referrals:", referralsError)
      return NextResponse.json({ error: "Failed to verify VIP referrals" }, { status: 500 })
    }

    const vipReferralsCount = referrals?.length || 0

    // Check if user meets the requirement
    if (vipReferralsCount < achievement.vip_requirement) {
      return NextResponse.json(
        {
          error: `You need ${achievement.vip_requirement} VIP referrals but only have ${vipReferralsCount}`,
        },
        { status: 400 },
      )
    }

    // Create achievement request
    const { data: newRequest, error: insertError } = await supabase
      .from("user_achievement_requests")
      .insert({
        user_id: user.id,
        achievement_id: achievementId,
        vip_referrals_count: vipReferralsCount,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating achievement request:", insertError)
      return NextResponse.json({ error: "Failed to create achievement request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: "Achievement application submitted successfully. Admin will review your request.",
    })
  } catch (error) {
    console.error("Error in achievement apply API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

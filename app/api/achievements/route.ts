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
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from("referral_achievements")
      .select("*")
      .eq("is_active", true)
      .order("vip_requirement", { ascending: true })

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError)
      return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
    }

    // Get user's achievement requests
    const { data: userRequests, error: requestsError } = await supabase
      .from("user_achievement_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (requestsError) {
      console.error("Error fetching user requests:", requestsError)
      return NextResponse.json({ error: "Failed to fetch user requests" }, { status: 500 })
    }

    return NextResponse.json({
      achievements: achievements || [],
      userRequests: userRequests || [],
    })
  } catch (error) {
    console.error("Error in achievements API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

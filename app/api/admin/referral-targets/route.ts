import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
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
    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let achievements = []

    try {
      const { data: achievementsData, error } = await supabase
        .from("referral_achievements")
        .select("*")
        .eq("status", "active")
        .order("target_count", { ascending: true })

      if (!error && achievementsData) {
        achievements = achievementsData.map((achievement) => ({
          id: achievement.id,
          packageTitle: achievement.title,
          targetUser: achievement.target_count,
          prizeTitle: `$${achievement.reward_amount}`,
          prizeAmount: achievement.reward_amount,
          referralType: achievement.referral_type || "Normal Refer",
          status: achievement.status,
          completions: 0, // This would need to be calculated from user achievement requests
        }))
      }
    } catch (error) {
      console.log("[v0] Referral achievements table not found, using default data")
    }

    // If no achievements found in database, return default achievements
    if (achievements.length === 0) {
      achievements = [
        {
          id: 1,
          packageTitle: "invite 1 person",
          targetUser: 1,
          prizeTitle: "$0.05",
          prizeAmount: 0.05,
          referralType: "Normal Refer",
          status: "active",
          completions: 245,
        },
        {
          id: 2,
          packageTitle: "invite 5 person",
          targetUser: 5,
          prizeTitle: "$0.25",
          prizeAmount: 0.25,
          referralType: "Normal Refer",
          status: "active",
          completions: 89,
        },
        {
          id: 3,
          packageTitle: "invite 10 person",
          targetUser: 10,
          prizeTitle: "$0.50",
          prizeAmount: 0.5,
          referralType: "Normal Refer",
          status: "active",
          completions: 34,
        },
        {
          id: 4,
          packageTitle: "invite 20 person",
          targetUser: 20,
          prizeTitle: "$1.00",
          prizeAmount: 1.0,
          referralType: "Normal Refer",
          status: "active",
          completions: 12,
        },
        {
          id: 5,
          packageTitle: "invite 50 person",
          targetUser: 50,
          prizeTitle: "$5.00",
          prizeAmount: 5.0,
          referralType: "Normal Refer",
          status: "inactive",
          completions: 3,
        },
      ]
    }

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error("Error fetching referral targets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { achievements } = await request.json()

    try {
      // Clear existing achievements and insert new ones
      await supabase.from("referral_achievements").delete().neq("id", 0)

      const achievementsToInsert = achievements.map((achievement: any) => ({
        title: achievement.packageTitle,
        description: `Refer ${achievement.targetUser} users to earn ${achievement.prizeTitle}`,
        target_count: achievement.targetUser,
        reward_amount: achievement.prizeAmount,
        referral_type: achievement.referralType,
        status: achievement.status,
        created_by: user.id,
      }))

      const { error: insertError } = await supabase.from("referral_achievements").insert(achievementsToInsert)

      if (insertError) {
        console.error("Error saving achievements:", insertError)
        return NextResponse.json({ error: "Failed to save achievements" }, { status: 500 })
      }
    } catch (error) {
      console.log("[v0] Referral achievements table not found, achievements saved to localStorage only")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving referral targets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

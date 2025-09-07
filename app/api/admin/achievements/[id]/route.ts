import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { isActive } = await request.json()
    const achievementId = params.id

    // Update achievement status
    const { data: updatedAchievement, error: updateError } = await supabase
      .from("referral_achievements")
      .update({ is_active: isActive })
      .eq("id", achievementId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating achievement:", updateError)
      return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 })
    }

    const formattedAchievement = {
      id: updatedAchievement.id,
      name: updatedAchievement.name,
      description: updatedAchievement.description,
      referralType: updatedAchievement.referral_type,
      referralRequirement: updatedAchievement.referral_requirement,
      rewardAmount: updatedAchievement.reward_amount,
      isActive: updatedAchievement.is_active,
      createdAt: updatedAchievement.created_at,
    }

    return NextResponse.json(formattedAchievement)
  } catch (error) {
    console.error("Error in update achievement API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { requestId, action } = await request.json()

    if (!requestId || !["approve", "reject", "pay"].includes(action)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Get the achievement request
    const { data: achievementRequest, error: requestError } = await supabase
      .from("user_achievement_requests")
      .select(`
        *,
        achievement:referral_achievements!user_achievement_requests_achievement_id_fkey (
          reward_amount
        )
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !achievementRequest) {
      return NextResponse.json({ error: "Achievement request not found" }, { status: 404 })
    }

    let newStatus = achievementRequest.status
    const updateData: any = {
      processed_at: new Date().toISOString(),
      processed_by: user.id,
    }

    if (action === "approve") {
      if (achievementRequest.status !== "pending") {
        return NextResponse.json({ error: "Can only approve pending requests" }, { status: 400 })
      }
      newStatus = "approved"
      updateData.status = "approved"
    } else if (action === "reject") {
      if (achievementRequest.status !== "pending") {
        return NextResponse.json({ error: "Can only reject pending requests" }, { status: 400 })
      }
      newStatus = "rejected"
      updateData.status = "rejected"
    } else if (action === "pay") {
      if (achievementRequest.status !== "approved") {
        return NextResponse.json({ error: "Can only pay approved requests" }, { status: 400 })
      }
      newStatus = "paid"
      updateData.status = "paid"

      // Add reward to user's earnings balance
      const rewardAmount = achievementRequest.achievement.reward_amount
      const { error: walletError } = await supabase.rpc("add_to_earnings_balance", {
        user_id: achievementRequest.user_id,
        amount: rewardAmount,
      })

      if (walletError) {
        console.error("Error adding reward to wallet:", walletError)
        return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
      }
    }

    // Update the achievement request
    const { data: updatedRequest, error: updateError } = await supabase
      .from("user_achievement_requests")
      .update(updateData)
      .eq("id", requestId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating achievement request:", updateError)
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Request ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error in process achievement request API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

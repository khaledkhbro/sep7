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
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let referralCode = null
    let referrals = []

    try {
      // Try to get user's referral code
      const { data: codeData } = await supabase.from("referral_codes").select("code").eq("user_id", user.id).single()
      referralCode = codeData?.code || null
    } catch (error) {
      console.log("[v0] Referral codes table not found, using fallback")
      // Generate a simple referral code as fallback
      referralCode = `REF${user.id.slice(-6).toUpperCase()}`
    }

    try {
      // Try to get referrals
      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select(`
          id,
          status,
          is_vip,
          vip_method,
          vip_achieved_at,
          created_at,
          referred:users!referrals_referred_id_fkey (
            id,
            first_name,
            last_name,
            email,
            created_at,
            location
          )
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })

      if (!referralsError && referralsData) {
        referrals = referralsData
      }
    } catch (error) {
      console.log("[v0] Referrals table not found, using empty array")
      referrals = []
    }

    // Get referral statistics
    const totalReferrals = referrals?.length || 0
    const completedReferrals = referrals?.filter((r) => r.status === "completed").length || 0
    const pendingReferrals = referrals?.filter((r) => r.status === "pending").length || 0
    const vipReferrals = referrals?.filter((r) => r.is_vip === true).length || 0

    return NextResponse.json({
      referralCode,
      statistics: {
        total: totalReferrals,
        completed: completedReferrals,
        pending: pendingReferrals,
        vip: vipReferrals,
      },
      referrals:
        referrals?.map((referral) => ({
          id: referral.id,
          userId: referral.referred.id,
          fullName: `${referral.referred.first_name} ${referral.referred.last_name}`,
          email: referral.referred.email,
          country: referral.referred.location || "Not specified",
          joiningDate: referral.referred.created_at,
          status: referral.status,
          type: referral.is_vip ? "VIP" : "Regular",
          vipMethod: referral.vip_method,
          vipAchievedAt: referral.vip_achieved_at,
        })) || [],
    })
  } catch (error) {
    console.error("Error in referrals API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

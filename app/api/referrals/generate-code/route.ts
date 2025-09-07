import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has a referral code
    const { data: existingCode } = await supabase.from("referral_codes").select("code").eq("user_id", user.id).single()

    if (existingCode) {
      return NextResponse.json({ code: existingCode.code })
    }

    // Generate new referral code
    let code = generateReferralCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure code is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase.from("referral_codes").select("id").eq("code", code).single()

      if (!existing) break

      code = generateReferralCode()
      attempts++
    }

    // Insert new referral code
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        user_id: user.id,
        code: code,
        uses_count: 0,
        max_uses: 100,
        is_active: true,
      })
      .select("code")
      .single()

    if (error) {
      console.error("Error creating referral code:", error)
      return NextResponse.json({ error: "Failed to create referral code" }, { status: 500 })
    }

    return NextResponse.json({ code: data.code })
  } catch (error) {
    console.error("Error in generate referral code API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

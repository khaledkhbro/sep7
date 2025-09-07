import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user settings from database
    const { data: settings, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching user settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      language: "en",
      timezone: "UTC",
      currency: "USD",
      twoFactorEnabled: false,
      emailNotifications: true,
      jobAlerts: true,
      messageNotifications: true,
      marketingEmails: false,
      weeklyDigest: true,
      pushNotifications: true, // Default to true
      pushJobUpdates: true,
      pushMessages: true,
      pushPayments: true,
      pushReferrals: true,
      pushSystemAlerts: true,
      pushMarketing: false,
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      allowDirectMessages: true,
    }

    return NextResponse.json(settings || defaultSettings)
  } catch (error) {
    console.error("Error in settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { section, settings } = body

    console.log(`[v0] Saving ${section} settings for user:`, user.id)
    console.log("[v0] Settings data:", settings)

    // Upsert user settings
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving user settings:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    console.log("[v0] Settings saved successfully:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

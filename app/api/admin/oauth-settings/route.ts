import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get OAuth provider settings
    const { data: settings, error } = await supabase.from("oauth_provider_settings").select("*").order("provider")

    if (error) {
      console.error("Error fetching OAuth settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("OAuth settings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get current user and verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { provider, enabled, clientId, clientSecret, redirectUrl } = body

    if (!provider || !clientId) {
      return NextResponse.json({ error: "Provider and client ID are required" }, { status: 400 })
    }

    // Upsert OAuth provider settings
    const { data, error } = await supabase
      .from("oauth_provider_settings")
      .upsert(
        {
          provider,
          enabled: enabled || false,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_url: redirectUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "provider",
        },
      )
      .select()

    if (error) {
      console.error("Error saving OAuth settings:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("OAuth settings save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

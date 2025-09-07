import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest, { params }: { params: { provider: string } }) {
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

    const { provider } = params

    // Delete OAuth provider settings
    const { error } = await supabase.from("oauth_provider_settings").delete().eq("provider", provider)

    if (error) {
      console.error("Error deleting OAuth settings:", error)
      return NextResponse.json({ error: "Failed to delete settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("OAuth settings delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { provider: string } }) {
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

    const { provider } = params
    const body = await request.json()
    const { enabled } = body

    // Update OAuth provider enabled status
    const { data, error } = await supabase
      .from("oauth_provider_settings")
      .update({
        enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .select()

    if (error) {
      console.error("Error updating OAuth settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("OAuth settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

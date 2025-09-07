import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { userId, serviceId, actionType, sessionId } = await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Track user behavior
    const { error } = await supabase.from("user_behavior_tracking").insert({
      user_id: userId,
      service_id: serviceId,
      action_type: actionType,
      session_id: sessionId,
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
    })

    if (error) throw error

    // Update analytics
    const today = new Date().toISOString().split("T")[0]

    if (actionType === "view") {
      await supabase.rpc("increment_service_views", {
        p_service_id: serviceId,
        p_date: today,
      })
    } else if (actionType === "click") {
      await supabase.rpc("increment_service_clicks", {
        p_service_id: serviceId,
        p_date: today,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking behavior:", error)
    return NextResponse.json({ error: "Failed to track behavior" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    })

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const endDate = new Date()

    const { data, error } = await supabase.rpc("get_ad_performance_stats", {
      p_start_date: startDate.toISOString().split("T")[0],
      p_end_date: endDate.toISOString().split("T")[0],
    })

    if (error) {
      console.error("Error fetching ad performance:", error)
      return NextResponse.json({ error: "Failed to fetch ad performance" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in ad performance API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

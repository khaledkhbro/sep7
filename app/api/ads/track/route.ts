import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { network, placement, event, revenue = 0 } = body

    if (!network || !placement || !event) {
      return NextResponse.json({ error: "Network, placement, and event are required" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get() {
          return undefined
        },
        set() {},
        remove() {},
      },
    })

    let impressions = 0
    let clicks = 0

    if (event === "impression") {
      impressions = 1
    } else if (event === "click") {
      clicks = 1
    }

    const { data, error } = await supabase.rpc("record_ad_performance", {
      p_network_name: network,
      p_placement_name: placement,
      p_impressions: impressions,
      p_clicks: clicks,
      p_revenue: revenue,
    })

    if (error) {
      console.error("Error recording ad performance:", error)
      return NextResponse.json({ error: "Failed to record ad performance" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in ad tracking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

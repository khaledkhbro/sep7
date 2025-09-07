import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
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
    console.log("[v0] VIP jobs API: Starting GET request")

    // Get current user and verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] VIP jobs API: Authentication failed", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] VIP jobs API: User authenticated", user.id)

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.log("[v0] VIP jobs API: Error fetching user data", userError)
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
    }

    if (userData?.user_type !== "admin") {
      console.log("[v0] VIP jobs API: User is not admin", userData?.user_type)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("[v0] VIP jobs API: Admin verified, fetching VIP jobs")

    const { data: vipJobs, error } = await supabase.from("vip_jobs").select("job_id").eq("is_vip", true)

    if (error) {
      console.error("[v0] VIP jobs API: Database error", error)

      if (error.message?.includes('relation "public.vip_jobs" does not exist')) {
        console.log("[v0] VIP jobs API: vip_jobs table doesn't exist yet, returning empty array")
        return NextResponse.json({ vipJobIds: [] })
      }

      return NextResponse.json({ error: "Failed to fetch VIP jobs" }, { status: 500 })
    }

    const vipJobIds = vipJobs?.map((job) => job.job_id) || []
    console.log("[v0] VIP jobs API: Successfully fetched VIP jobs", vipJobIds.length)

    return NextResponse.json({ vipJobIds })
  } catch (error) {
    console.error("[v0] VIP jobs API: Unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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
    console.log("[v0] VIP jobs API: Starting POST request")

    // Get current user and verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] VIP jobs API: Authentication failed", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.log("[v0] VIP jobs API: Error fetching user data", userError)
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
    }

    if (userData?.user_type !== "admin") {
      console.log("[v0] VIP jobs API: User is not admin", userData?.user_type)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { jobId, isVip } = await request.json()
    console.log("[v0] VIP jobs API: Processing request", { jobId, isVip })

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    if (isVip) {
      const { error } = await supabase.from("vip_jobs").upsert({
        job_id: jobId,
        is_vip: true,
        created_by: user.id,
      })

      if (error) {
        console.error("[v0] VIP jobs API: Error adding VIP job", error)

        if (error.message?.includes('relation "public.vip_jobs" does not exist')) {
          return NextResponse.json(
            {
              error: "VIP jobs table not found. Please run the database migration script first.",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({ error: "Failed to add VIP job" }, { status: 500 })
      }
    } else {
      const { error } = await supabase.from("vip_jobs").delete().eq("job_id", jobId)

      if (error) {
        console.error("[v0] VIP jobs API: Error removing VIP job", error)

        if (error.message?.includes('relation "public.vip_jobs" does not exist')) {
          return NextResponse.json(
            {
              error: "VIP jobs table not found. Please run the database migration script first.",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({ error: "Failed to remove VIP job" }, { status: 500 })
      }
    }

    console.log("[v0] VIP jobs API: Successfully processed request")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] VIP jobs API: Unexpected error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

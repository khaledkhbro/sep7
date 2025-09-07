import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  // For now, we'll skip the Supabase auth check since the admin system uses localStorage
  // TODO: Implement proper session-based authentication when database is fully set up

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
    const { data: achievements, error: achievementsError } = await supabase
      .from("referral_achievements")
      .select("*")
      .order("created_at", { ascending: false })

    if (achievementsError) {
      console.error("Error fetching achievements:", achievementsError)
      if (
        achievementsError.message?.includes('relation "referral_achievements" does not exist') ||
        achievementsError.message?.includes("Could not find the table")
      ) {
        return NextResponse.json(
          {
            error: "Database tables not found. Please run the database setup scripts first.",
            details:
              "The 'referral_achievements' table does not exist. Run the SQL scripts to create the required tables.",
            missingTable: "referral_achievements",
          },
          { status: 500 },
        )
      }
      return NextResponse.json(
        { error: "Failed to fetch achievements", details: achievementsError.message },
        { status: 500 },
      )
    }

    const { data: requests, error: requestsError } = await supabase
      .from("achievement_requests")
      .select("*")
      .order("requested_at", { ascending: false })

    if (requestsError) {
      console.error("Error fetching achievement requests:", requestsError)
      if (
        requestsError.message?.includes('relation "achievement_requests" does not exist') ||
        requestsError.message?.includes("Could not find the table")
      ) {
        return NextResponse.json(
          {
            error: "Database tables not found. Please run the database setup scripts first.",
            details:
              "The 'achievement_requests' table does not exist. Run the SQL scripts to create the required tables.",
            missingTable: "achievement_requests",
          },
          { status: 500 },
        )
      }
      return NextResponse.json(
        { error: "Failed to fetch achievement requests", details: requestsError.message },
        { status: 500 },
      )
    }

    const formattedRequests =
      requests?.map((request) => ({
        id: request.id,
        userId: request.user_id,
        userName: `User ${request.user_id}`,
        userEmail: `user${request.user_id}@example.com`,
        achievementId: request.achievement_id,
        achievementName: achievements?.find((a) => a.id === request.achievement_id)?.title || "Unknown Achievement",
        progress: request.progress,
        status: request.status,
        createdAt: request.requested_at,
        processedAt: request.processed_at,
        notes: request.notes,
      })) || []

    return NextResponse.json({
      achievements: achievements || [],
      requests: formattedRequests,
    })
  } catch (error) {
    console.error("Error in admin achievements API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  // For now, we'll skip the Supabase auth check since the admin system uses localStorage
  // TODO: Implement proper session-based authentication when database is fully set up

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
    const { name, description, referralType, referralRequirement, rewardAmount, isActive } = await request.json()

    if (!name || !description || referralRequirement < 1 || rewardAmount <= 0) {
      return NextResponse.json({ error: "Invalid achievement data" }, { status: 400 })
    }

    const { data: newAchievement, error: insertError } = await supabase
      .from("referral_achievements")
      .insert({
        title: name,
        description,
        type: referralType || "referral",
        target_count: referralRequirement,
        reward_amount: rewardAmount,
        reward_type: "cash",
        is_active: isActive,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error creating achievement:", insertError)
      if (
        insertError.message?.includes('relation "referral_achievements" does not exist') ||
        insertError.message?.includes("Could not find the table")
      ) {
        return NextResponse.json(
          {
            error: "Database tables not found. Please run the database setup scripts first.",
            details:
              "The 'referral_achievements' table does not exist. Run the SQL scripts to create the required tables.",
            missingTable: "referral_achievements",
          },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: "Failed to create achievement", details: insertError.message }, { status: 500 })
    }

    const formattedAchievement = {
      id: newAchievement.id,
      name: newAchievement.title,
      description: newAchievement.description,
      referralType: newAchievement.type,
      referralRequirement: newAchievement.target_count,
      rewardAmount: newAchievement.reward_amount,
      isActive: newAchievement.is_active,
      createdAt: newAchievement.created_at,
    }

    return NextResponse.json(formattedAchievement)
  } catch (error) {
    console.error("Error in create achievement API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

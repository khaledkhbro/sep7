import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verify this is a legitimate cron request (you can add auth headers here)
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CRON] Starting reservation expiry cleanup...")

    // Get all active reservations that have expired
    const { data: expiredReservations, error: fetchError } = await supabase
      .from("job_reservations")
      .select(`
        id,
        job_id,
        user_id,
        expires_at,
        microjobs (
          title,
          budget_max
        )
      `)
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString())

    if (fetchError) {
      console.error("[CRON] Error fetching expired reservations:", fetchError)
      return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 })
    }

    if (!expiredReservations || expiredReservations.length === 0) {
      console.log("[CRON] No expired reservations found")
      return NextResponse.json({
        success: true,
        message: "No expired reservations found",
        processed: 0,
      })
    }

    console.log(`[CRON] Found ${expiredReservations.length} expired reservations`)

    // Update expired reservations
    const { error: updateReservationsError } = await supabase
      .from("job_reservations")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        expiredReservations.map((r) => r.id),
      )

    if (updateReservationsError) {
      console.error("[CRON] Error updating reservations:", updateReservationsError)
      return NextResponse.json({ error: "Failed to update reservations" }, { status: 500 })
    }

    // Update microjobs to remove reservation status
    const jobIds = expiredReservations.map((r) => r.job_id)
    const { error: updateJobsError } = await supabase
      .from("microjobs")
      .update({
        is_reserved: false,
        reserved_by: null,
        reserved_until: null,
        updated_at: new Date().toISOString(),
      })
      .in("id", jobIds)

    if (updateJobsError) {
      console.error("[CRON] Error updating jobs:", updateJobsError)
      return NextResponse.json({ error: "Failed to update jobs" }, { status: 500 })
    }

    // Track users with multiple expired reservations for admin notifications
    const userExpirationCounts = expiredReservations.reduce(
      (acc, reservation) => {
        acc[reservation.user_id] = (acc[reservation.user_id] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get notification threshold from settings
    const { data: settings } = await supabase.from("reservation_settings").select("notification_threshold").single()

    const notificationThreshold = settings?.notification_threshold || 3

    // Create violation records for users exceeding threshold
    const violationPromises = Object.entries(userExpirationCounts)
      .filter(([_, count]) => count >= notificationThreshold)
      .map(([userId, count]) =>
        supabase.from("reservation_violations").insert({
          user_id: userId,
          violation_type: "multiple_expired",
          violation_count: count,
          details: {
            expired_jobs: expiredReservations
              .filter((r) => r.user_id === userId)
              .map((r) => ({
                job_id: r.job_id,
                job_title: r.microjobs?.title,
                expired_at: r.expires_at,
              })),
            date: new Date().toISOString(),
          },
          is_resolved: false,
        }),
      )

    if (violationPromises.length > 0) {
      await Promise.all(violationPromises)
      console.log(`[CRON] Created ${violationPromises.length} violation records`)
    }

    console.log(`[CRON] Successfully processed ${expiredReservations.length} expired reservations`)

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredReservations.length} expired reservations`,
      processed: expiredReservations.length,
      violations: violationPromises.length,
    })
  } catch (error) {
    console.error("[CRON] Reservation expiry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

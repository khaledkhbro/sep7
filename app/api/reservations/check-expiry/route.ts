import { type NextRequest, NextResponse } from "next/server"
import { checkReservationStatus, cleanupExpiredReservations } from "@/lib/local-reservation-utils"

export async function POST(request: NextRequest) {
  try {
    const { jobIds } = await request.json()

    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json({ error: "Invalid job IDs provided" }, { status: 400 })
    }

    cleanupExpiredReservations()

    const updates = []

    for (const jobId of jobIds) {
      const status = await checkReservationStatus(jobId)

      if (status.expired) {
        updates.push({
          jobId,
          expired: true,
        })
      } else if (status.isReserved && status.timeLeft) {
        updates.push({
          jobId,
          expired: false,
          timeLeft: status.timeLeft,
        })
      } else {
        updates.push({
          jobId,
          expired: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      updates,
    })
  } catch (error) {
    console.error("Reservation check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

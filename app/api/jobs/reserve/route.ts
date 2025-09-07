import { type NextRequest, NextResponse } from "next/server"
import { createReservation, getReservationSettings } from "@/lib/local-reservation-utils"

export async function POST(request: NextRequest) {
  try {
    const { jobId, reservationMinutes, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 })
    }

    const settings = getReservationSettings()

    if (!settings.isEnabled) {
      return NextResponse.json({ error: "Job reservation is currently disabled" }, { status: 400 })
    }

    const reservation = createReservation(jobId, userId, reservationMinutes || settings.defaultReservationMinutes)

    if (!reservation) {
      return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reservation,
      expiresAt: reservation.expiresAt,
    })
  } catch (error) {
    console.error("Reservation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

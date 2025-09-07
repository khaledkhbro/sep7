import { type NextRequest, NextResponse } from "next/server"
import { cancelReservation } from "@/lib/local-reservation-utils"

export async function POST(request: NextRequest) {
  try {
    const { reservationId } = await request.json()

    if (!reservationId) {
      return NextResponse.json({ error: "Reservation ID required" }, { status: 400 })
    }

    const success = cancelReservation(reservationId)

    if (!success) {
      return NextResponse.json({ error: "Failed to cancel reservation" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Reservation cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling reservation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

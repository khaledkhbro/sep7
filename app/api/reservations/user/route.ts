import { type NextRequest, NextResponse } from "next/server"
import { getUserReservations } from "@/lib/local-reservation-utils"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const reservations = getUserReservations(userId)

    return NextResponse.json({
      success: true,
      reservations,
    })
  } catch (error) {
    console.error("Error fetching user reservations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

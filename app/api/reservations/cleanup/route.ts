import { type NextRequest, NextResponse } from "next/server"
import { cleanupExpiredReservations } from "@/lib/local-reservation-utils"

export async function POST(request: NextRequest) {
  try {
    const expiredReservations = cleanupExpiredReservations()

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${expiredReservations.length} expired reservations`,
      processed: expiredReservations.length,
      expiredReservations,
    })
  } catch (error) {
    console.error("Cleanup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}

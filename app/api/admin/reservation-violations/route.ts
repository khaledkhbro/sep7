import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { getLocalReservations, getLocalReservationViolations } from "@/lib/local-reservation-utils"
import { getAllUsers } from "@/lib/auth"
import { getStoredJobs } from "@/lib/jobs"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "active") {
      const reservations = getLocalReservations()
      const users = getAllUsers()
      const jobs = getStoredJobs()

      const activeReservations = reservations
        .filter((reservation) => {
          const now = new Date()
          const expires = new Date(reservation.expiresAt)
          return expires > now // Only active (not expired) reservations
        })
        .map((reservation) => {
          const now = new Date()
          const expires = new Date(reservation.expiresAt)
          const timeLeft = expires.getTime() - now.getTime()

          let timeRemaining = "Expired"
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60))
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
            timeRemaining = `${hours}h ${minutes}m`
          }

          const user = users.find((u) => u.id === reservation.userId)
          const job = jobs.find((j) => j.id === reservation.jobId)

          return {
            id: reservation.id,
            jobId: reservation.jobId,
            jobTitle: job?.title || "Unknown Job",
            userId: reservation.userId,
            userEmail: user?.email || "Unknown",
            userName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown User",
            reservedAt: reservation.reservedAt,
            expiresAt: reservation.expiresAt,
            timeRemaining,
            status: timeLeft <= 0 ? "expired" : timeLeft <= 10 * 60 * 1000 ? "expiring" : "active",
          }
        })
        .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())

      return NextResponse.json({ activeReservations })
    }

    const violations = getLocalReservationViolations()
    const users = getAllUsers()

    const userViolations = violations
      .map((violation) => {
        const user = users.find((u) => u.id === violation.userId)

        return {
          id: violation.id,
          userId: violation.userId,
          userEmail: user?.email || "Unknown",
          userName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown User",
          violationCount: violation.violationCount,
          lastViolationAt: violation.lastViolationAt,
          totalReservations: violation.totalReservations,
          expiredReservations: violation.expiredReservations,
          violationRate:
            violation.totalReservations > 0 ? violation.expiredReservations / violation.totalReservations : 0,
        }
      })
      .sort((a, b) => b.violationCount - a.violationCount)

    return NextResponse.json({ violations: userViolations })
  } catch (error) {
    console.error("Error fetching reservation violations:", error)
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    const violations = getLocalReservationViolations()
    const updatedViolations = violations.filter((v) => v.userId !== userId)

    if (typeof window !== "undefined") {
      localStorage.setItem("reservation_violations", JSON.stringify(updatedViolations))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting user violations:", error)
    return NextResponse.json({ error: "Failed to reset violations" }, { status: 500 })
  }
}

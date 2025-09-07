import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    console.log(`[v0] 📅 API: Fetching upcoming payments for user: ${userId}`)

    // Mock upcoming payments
    const mockUpcomingPayments = [
      {
        id: `up_${userId}_1`,
        userId: userId,
        amount: 150.0,
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        description: "Scheduled payment for job #456",
        referenceId: "job_456",
        referenceType: "job_completion",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
      {
        id: `up_${userId}_2`,
        userId: userId,
        amount: 75.0,
        scheduledDate: new Date(Date.now() + 259200000).toISOString(), // 3 days
        description: "Milestone payment for project #789",
        referenceId: "project_789",
        referenceType: "milestone",
        status: "scheduled",
        createdAt: new Date().toISOString(),
      },
    ]

    console.log(`[v0] ✅ API: Returning ${mockUpcomingPayments.length} upcoming payments`)
    return NextResponse.json(mockUpcomingPayments)
  } catch (error) {
    console.error("[v0] ❌ API: Error fetching upcoming payments:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming payments" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    console.log(`[v0] 💰 API: Fetching wallet for user: ${userId}`)

    // Mock wallet data based on user ID
    const mockWallet = {
      id: `wallet_${userId}`,
      userId: userId,
      balance: userId === "02" ? 1500.75 : userId === "03" ? 850.5 : 250.0, // Legacy field
      depositBalance: userId === "02" ? 1000.0 : userId === "03" ? 500.0 : 150.0,
      earningsBalance: userId === "02" ? 500.75 : userId === "03" ? 350.5 : 100.0,
      pendingBalance: userId === "02" ? 150.0 : userId === "03" ? 75.0 : 25.0,
      totalEarned: userId === "02" ? 2500.0 : userId === "03" ? 1200.0 : 400.0,
      totalSpent: userId === "02" ? 800.0 : userId === "03" ? 450.0 : 150.0,
      upcomingPayments: userId === "02" ? 200.0 : userId === "03" ? 100.0 : 50.0,
      pendingPayments: userId === "02" ? 75.0 : userId === "03" ? 50.0 : 25.0,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
    }

    console.log(`[v0] ✅ API: Returning wallet data for user ${userId}`)
    return NextResponse.json(mockWallet)
  } catch (error) {
    console.error("[v0] ❌ API: Error fetching wallet:", error)
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
  }
}

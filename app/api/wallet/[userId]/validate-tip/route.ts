import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const { amount } = await request.json()

    console.log(`[v0] 🎁 API: Validating tip balance for user: ${userId}, amount: ${amount}`)

    // Mock validation - assume user has sufficient balance if amount <= 500
    const hasBalance = amount <= 500
    const validation = {
      valid: hasBalance,
      error: hasBalance ? undefined : "Insufficient balance for tip amount",
    }

    console.log(`[v0] ✅ API: Tip validation result:`, validation)
    return NextResponse.json(validation)
  } catch (error) {
    console.error("[v0] ❌ API: Error validating tip:", error)
    return NextResponse.json({ error: "Failed to validate tip" }, { status: 500 })
  }
}

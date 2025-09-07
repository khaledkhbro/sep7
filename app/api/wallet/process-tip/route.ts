import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employerId, workerId, amount, description, referenceId } = body

    console.log(`[v0] 🎁 API: Processing tip payment: ${amount} from ${employerId} to ${workerId}`)

    // Mock tip processing
    const transactions = [
      {
        id: `tx_${employerId}_tip_${Date.now()}`,
        walletId: `wallet_${employerId}`,
        type: "payment",
        amount: -amount,
        feeAmount: 0,
        netAmount: -amount,
        balanceType: "deposit",
        description: `Tip sent: ${description}`,
        referenceId: referenceId,
        referenceType: "tip",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
      {
        id: `tx_${workerId}_tip_${Date.now()}`,
        walletId: `wallet_${workerId}`,
        type: "earning",
        amount: amount,
        feeAmount: 0,
        netAmount: amount,
        balanceType: "earnings",
        description: `Tip received: ${description}`,
        referenceId: referenceId,
        referenceType: "tip",
        status: "completed",
        createdAt: new Date().toISOString(),
      },
    ]

    const result = {
      success: true,
      transactions: transactions,
    }

    console.log(`[v0] ✅ API: Tip processed successfully`)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] ❌ API: Error processing tip:", error)
    return NextResponse.json({ error: "Failed to process tip" }, { status: 500 })
  }
}

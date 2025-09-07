import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")

    console.log(`[v0] 💰 API: Fetching transactions for user: ${userId}`)
    console.log(`[v0] 💰 API: Filters - type: ${type}, status: ${status}, limit: ${limit}`)

    // Mock transaction data
    const mockTransactions = [
      {
        id: `tx_${userId}_1`,
        walletId: `wallet_${userId}`,
        type: "earning",
        amount: 150.0,
        feeAmount: 7.5,
        netAmount: 142.5,
        balanceType: "earnings",
        description: "Payment for completed job #123",
        referenceId: "job_123",
        referenceType: "job_completion",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      },
      {
        id: `tx_${userId}_2`,
        walletId: `wallet_${userId}`,
        type: "deposit",
        amount: 500.0,
        feeAmount: 12.5,
        netAmount: 487.5,
        balanceType: "deposit",
        description: "Account deposit via credit card",
        referenceId: "dep_456",
        referenceType: "deposit",
        status: "completed",
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        id: `tx_${userId}_3`,
        walletId: `wallet_${userId}`,
        type: "payment",
        amount: -75.0,
        feeAmount: 2.25,
        netAmount: -77.25,
        balanceType: "deposit",
        description: "Payment for job posting #789",
        referenceId: "job_789",
        referenceType: "job_payment",
        status: "completed",
        createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      },
      {
        id: `tx_${userId}_4`,
        walletId: `wallet_${userId}`,
        type: "withdrawal",
        amount: -200.0,
        feeAmount: 5.0,
        netAmount: -205.0,
        balanceType: "earnings",
        description: "Withdrawal to bank account",
        referenceId: "wd_101",
        referenceType: "withdrawal",
        status: status === "pending" ? "pending" : "completed",
        createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      },
    ]

    // Apply filters
    let filteredTransactions = mockTransactions

    if (type) {
      filteredTransactions = filteredTransactions.filter((tx) => tx.type === type)
    }

    if (status) {
      filteredTransactions = filteredTransactions.filter((tx) => tx.status === status)
    }

    if (limit) {
      filteredTransactions = filteredTransactions.slice(0, Number.parseInt(limit))
    }

    console.log(`[v0] ✅ API: Returning ${filteredTransactions.length} transactions for user ${userId}`)
    return NextResponse.json(filteredTransactions)
  } catch (error) {
    console.error("[v0] ❌ API: Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()

    console.log(`[v0] 💰 API: Creating transaction for user: ${userId}`)
    console.log(`[v0] 💰 API: Transaction data:`, body)

    // Create mock transaction
    const newTransaction = {
      id: `tx_${userId}_${Date.now()}`,
      walletId: `wallet_${userId}`,
      type: body.type,
      amount: body.amount,
      feeAmount: Math.round(body.amount * 0.025 * 100) / 100, // 2.5% fee
      netAmount: body.amount - Math.round(body.amount * 0.025 * 100) / 100,
      balanceType: body.balanceType || "deposit",
      description: body.description,
      referenceId: body.referenceId,
      referenceType: body.referenceType,
      status: "completed",
      createdAt: new Date().toISOString(),
    }

    console.log(`[v0] ✅ API: Created transaction: ${newTransaction.id}`)
    return NextResponse.json(newTransaction)
  } catch (error) {
    console.error("[v0] ❌ API: Error creating transaction:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

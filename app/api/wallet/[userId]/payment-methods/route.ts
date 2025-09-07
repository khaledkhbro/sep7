import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    console.log(`[v0] 💳 API: Fetching payment methods for user: ${userId}`)

    // Mock payment methods
    const mockPaymentMethods = [
      {
        id: `pm_${userId}_1`,
        userId: userId,
        type: "card",
        last4: "4242",
        brand: "visa",
        isDefault: true,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: `pm_${userId}_2`,
        userId: userId,
        type: "paypal",
        isDefault: false,
        createdAt: "2024-01-15T00:00:00Z",
      },
    ]

    console.log(`[v0] ✅ API: Returning ${mockPaymentMethods.length} payment methods`)
    return NextResponse.json(mockPaymentMethods)
  } catch (error) {
    console.error("[v0] ❌ API: Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()

    console.log(`[v0] 💳 API: Adding payment method for user: ${userId}`)

    const newPaymentMethod = {
      id: `pm_${userId}_${Date.now()}`,
      userId: userId,
      type: body.type,
      last4: body.last4,
      brand: body.brand,
      isDefault: body.isDefault || false,
      createdAt: new Date().toISOString(),
    }

    console.log(`[v0] ✅ API: Added payment method: ${newPaymentMethod.id}`)
    return NextResponse.json(newPaymentMethod)
  } catch (error) {
    console.error("[v0] ❌ API: Error adding payment method:", error)
    return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 })
  }
}

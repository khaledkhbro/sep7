import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { proofId, rejectionReason } = await request.json()

    if (!proofId || !rejectionReason) {
      return NextResponse.json({ error: "Missing proof ID or rejection reason" }, { status: 400 })
    }

    console.log("[v0] 🚀 API: Starting work proof rejection for:", proofId)
    console.log("[v0] 👤 API: Rejecting user:", user.id)

    // Import the rejection function
    const { rejectWorkProof } = await import("@/lib/work-proofs")

    // Reject the work proof
    const rejectedProof = await rejectWorkProof(proofId, rejectionReason)

    console.log("[v0] ✅ API: Work proof rejected successfully")

    try {
      const { triggerSellerOrdersNotification, triggerWalletNotification } = await import(
        "@/components/notifications/notification-helpers"
      )

      // Trigger seller orders notification for work rejection
      console.log("[v0] 🔔 API: Triggering seller orders notification for work rejection")
      triggerSellerOrdersNotification()

      // Trigger wallet notification for refund processing
      console.log("[v0] 🔔 API: Triggering wallet notification for refund")
      triggerWalletNotification()

      console.log("[v0] ✅ API: Real-time notification badges triggered for work rejection")
    } catch (error) {
      console.error("[v0] ❌ API: Error triggering notification badges:", error)
    }

    return NextResponse.json({
      success: true,
      proof: rejectedProof,
      message: "Work rejected. Payment has been refunded.",
    })
  } catch (error) {
    console.error("[v0] ❌ API ERROR: Failed to reject work proof:", error)
    return NextResponse.json(
      {
        error: "Failed to reject work proof",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

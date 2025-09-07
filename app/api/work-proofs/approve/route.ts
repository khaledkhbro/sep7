import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { proofId, reviewNotes, tipAmount } = await request.json()

    if (!proofId) {
      return NextResponse.json({ error: "Missing proof ID" }, { status: 400 })
    }

    console.log("[v0] 🚀 API: Starting work proof approval for:", proofId)
    console.log("[v0] 👤 API: Approving user:", user.id)
    console.log("[v0] 🎁 API: Tip amount:", tipAmount)

    // Import the approval function
    const { approveWorkProof } = await import("@/lib/work-proofs")
    const { processTipPayment } = await import("@/lib/wallet")

    // Approve the work proof
    const approvedProof = await approveWorkProof(proofId, reviewNotes)

    console.log("[v0] ✅ API: Work proof approved successfully")
    console.log("[v0] 💰 API: Payment amount processed:", approvedProof.paymentAmount)

    if (tipAmount && Number.parseFloat(tipAmount) > 0) {
      const tipValue = Number.parseFloat(tipAmount)
      console.log("[v0] 🎁 API: Processing tip with balance validation:", tipValue)

      const tipResult = await processTipPayment({
        employerId: user.id,
        workerId: approvedProof.workerId,
        tipAmount: tipValue,
        description: `Tip for excellent work: ${approvedProof.title}`,
        referenceId: proofId,
      })

      if (!tipResult.success) {
        console.log("[v0] ❌ API: Tip processing failed:", tipResult.error)
        return NextResponse.json(
          {
            error: tipResult.error,
            proof: approvedProof,
          },
          { status: 400 },
        )
      }

      console.log("[v0] ✅ API: Tip processed successfully with balance validation")
    }

    try {
      const { triggerWalletNotification, triggerSellerOrdersNotification } = await import(
        "@/components/notifications/notification-helpers"
      )

      // Trigger wallet notification for the worker (they received payment)
      console.log("[v0] 🔔 API: Triggering wallet notification for work approval")
      triggerWalletNotification()

      // Trigger seller orders notification for completed work
      console.log("[v0] 🔔 API: Triggering seller orders notification for work completion")
      triggerSellerOrdersNotification()

      console.log("[v0] ✅ API: Real-time notification badges triggered for work approval")
    } catch (error) {
      console.error("[v0] ❌ API: Error triggering notification badges:", error)
    }

    return NextResponse.json({
      success: true,
      proof: approvedProof,
      message: `Work approved! Payment of $${approvedProof.paymentAmount}${tipAmount ? ` + $${tipAmount} tip` : ""} released to worker.`,
    })
  } catch (error) {
    console.error("[v0] ❌ API ERROR: Failed to approve work proof:", error)
    return NextResponse.json(
      {
        error: "Failed to approve work proof",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

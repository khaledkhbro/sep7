import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { proofId, reviewNotes } = await request.json()

    if (!proofId || !reviewNotes) {
      return NextResponse.json({ error: "Missing proof ID or review notes" }, { status: 400 })
    }

    console.log("[v0] 🚀 API: Starting revision request for:", proofId)
    console.log("[v0] 👤 API: Requesting user:", user.id)

    // Import the revision function
    const { requestRevision } = await import("@/lib/work-proofs")

    // Request revision
    const updatedProof = await requestRevision(proofId, reviewNotes)

    console.log("[v0] ✅ API: Revision requested successfully")

    return NextResponse.json({
      success: true,
      proof: updatedProof,
      message: "Revision requested successfully.",
    })
  } catch (error) {
    console.error("[v0] ❌ API ERROR: Failed to request revision:", error)
    return NextResponse.json(
      {
        error: "Failed to request revision",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

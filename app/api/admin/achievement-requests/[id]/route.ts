import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action } = body

    let status: string
    if (action === "approve") status = "approved"
    else if (action === "reject") status = "rejected"
    else if (action === "pay") status = "paid"
    else throw new Error("Invalid action")

    const result = await query(
      `
      UPDATE achievement_requests 
      SET status = $1, processed_at = NOW(), processed_by = 'admin'
      WHERE id = $2
      RETURNING *
    `,
      [status, params.id],
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating achievement request:", error)
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getApprovalSettingsLocal, updateApprovalSettingsLocal, type ApprovalSettings } from "@/lib/local-storage"

export async function GET() {
  try {
    console.log("[v0] Approval settings API: Starting GET request")

    const settings = await getApprovalSettingsLocal()
    console.log("[v0] Approval settings API: Successfully fetched local settings:", settings)

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[v0] Approval settings API: Error fetching settings:", error)

    // Return default settings if there's an error
    const defaultSettings: ApprovalSettings = {
      id: "default",
      allowManualApprovalTimeSelection: true,
      defaultManualApprovalDays: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(defaultSettings)
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Approval settings API: Starting PUT request")

    const body = await request.json()
    console.log("[v0] Approval settings API: Request body:", body)

    // Validate the request body
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    // Prepare update data with explicit checks for boolean and number values
    const updateData: Partial<ApprovalSettings> = {}

    if (body.allowManualApprovalTimeSelection !== undefined) {
      updateData.allowManualApprovalTimeSelection = Boolean(body.allowManualApprovalTimeSelection)
    }

    if (body.defaultManualApprovalDays !== undefined) {
      const days = Number(body.defaultManualApprovalDays)
      if (!isNaN(days) && days >= 0.000694 && days <= 7) {
        updateData.defaultManualApprovalDays = days
      }
    }

    console.log("[v0] Approval settings API: Update data:", updateData)

    const updatedSettings = await updateApprovalSettingsLocal(updateData)
    console.log("[v0] Approval settings API: Successfully updated local settings:", updatedSettings)

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error("[v0] Approval settings API: Error updating settings:", error)

    return NextResponse.json({ error: "Failed to update approval settings" }, { status: 500 })
  }
}

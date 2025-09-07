import { type NextRequest, NextResponse } from "next/server"
import { getPlatformFeeSettingsLocal, updatePlatformFeeSettingsLocal } from "@/lib/local-storage"

const DEFAULT_SETTINGS = {
  id: "default",
  enabled: true,
  percentage: 5.0,
  fixed_fee: 0.0,
  minimum_fee: 0.0,
  maximum_fee: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export async function GET() {
  try {
    console.log("[v0] Platform fee API: Starting GET request (local storage)")

    const settings = await getPlatformFeeSettingsLocal()

    const mappedSettings = {
      ...settings,
      isActive: settings.enabled,
      feePercentage: settings.percentage,
      feeFixed: settings.fixed_fee,
      minimumFee: settings.minimum_fee,
      maximumFee: settings.maximum_fee,
    }

    console.log("[v0] Platform fee API: Successfully fetched local settings:", mappedSettings)
    return NextResponse.json({ settings: mappedSettings })
  } catch (error) {
    console.error("[v0] Platform fee API: Error in GET:", error instanceof Error ? error.message : "Unknown error")
    const mappedDefaults = {
      ...DEFAULT_SETTINGS,
      isActive: DEFAULT_SETTINGS.enabled,
      feePercentage: DEFAULT_SETTINGS.percentage,
      feeFixed: DEFAULT_SETTINGS.fixed_fee,
      minimumFee: DEFAULT_SETTINGS.minimum_fee,
      maximumFee: DEFAULT_SETTINGS.maximum_fee,
    }
    return NextResponse.json({ settings: mappedDefaults })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[v0] Platform fee API: Starting PUT request (local storage)")

    const body = await request.json()
    console.log("[v0] Platform fee API: Received body:", body)

    const updateData = {
      enabled: body.isActive !== undefined ? body.isActive : true,
      percentage: body.feePercentage !== undefined ? body.feePercentage : 5.0,
      fixed_fee: body.feeFixed !== undefined ? body.feeFixed : 0,
      minimum_fee: body.minimumFee !== undefined ? body.minimumFee : 0,
      maximum_fee: body.maximumFee !== undefined ? body.maximumFee : 0,
    }

    console.log("[v0] Platform fee API: Update data:", updateData)

    const settings = await updatePlatformFeeSettingsLocal(updateData)

    const mappedSettings = {
      ...settings,
      isActive: settings.enabled,
      feePercentage: settings.percentage,
      feeFixed: settings.fixed_fee,
      minimumFee: settings.minimum_fee,
      maximumFee: settings.maximum_fee,
    }

    console.log("[v0] Platform fee API: Successfully updated local settings:", mappedSettings)
    return NextResponse.json({ settings: mappedSettings })
  } catch (error) {
    console.error("[v0] Platform fee API: Error in PUT:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update platform fee settings" }, { status: 500 })
  }
}

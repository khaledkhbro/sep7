import { type NextRequest, NextResponse } from "next/server"
import { getReservationSettings, updateReservationSettings } from "@/lib/local-reservation-utils"

export async function GET() {
  try {
    const settings = getReservationSettings()

    return NextResponse.json({
      isEnabled: settings.isEnabled,
      defaultReservationHours: Math.round(settings.defaultReservationMinutes / 60),
      defaultReservationMinutes: settings.defaultReservationMinutes,
      maxReservationHours: Math.round(settings.maxReservationMinutes / 60),
      maxReservationMinutes: settings.maxReservationMinutes,
      maxConcurrentReservations: settings.maxConcurrentReservations,
    })
  } catch (error) {
    console.error("Error in reservation settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json()

    const settingsUpdate: any = {}

    if (updates.isEnabled !== undefined) {
      settingsUpdate.isEnabled = updates.isEnabled
    }

    if (updates.defaultReservationHours !== undefined) {
      settingsUpdate.defaultReservationMinutes = updates.defaultReservationHours * 60
    }

    if (updates.defaultReservationMinutes !== undefined) {
      settingsUpdate.defaultReservationMinutes = updates.defaultReservationMinutes
    }

    if (updates.maxReservationHours !== undefined) {
      settingsUpdate.maxReservationMinutes = updates.maxReservationHours * 60
    }

    if (updates.maxReservationMinutes !== undefined) {
      settingsUpdate.maxReservationMinutes = updates.maxReservationMinutes
    }

    if (updates.maxConcurrentReservations !== undefined) {
      settingsUpdate.maxConcurrentReservations = updates.maxConcurrentReservations
    }

    const updatedSettings = updateReservationSettings(settingsUpdate)

    return NextResponse.json({
      isEnabled: updatedSettings.isEnabled,
      defaultReservationHours: Math.round(updatedSettings.defaultReservationMinutes / 60),
      defaultReservationMinutes: updatedSettings.defaultReservationMinutes,
      maxReservationHours: Math.round(updatedSettings.maxReservationMinutes / 60),
      maxReservationMinutes: updatedSettings.maxReservationMinutes,
      maxConcurrentReservations: updatedSettings.maxConcurrentReservations,
    })
  } catch (error) {
    console.error("Error in reservation settings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "test-secret"

    console.log("[v0] Testing cron endpoint with secret:", cronSecret ? "Present" : "Missing")

    const response = await fetch(`${request.nextUrl.origin}/api/cron/process-work-proof-timeouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    console.log("[v0] Cron endpoint response:", response.status, result)

    return NextResponse.json({
      success: true,
      cronEndpointStatus: response.status,
      cronResponse: result,
      secretConfigured: !!cronSecret,
    })
  } catch (error) {
    console.error("[v0] Cron test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

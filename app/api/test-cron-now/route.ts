import { type NextRequest, NextResponse } from "next/server"
import { processExpiredWorkProofs } from "@/lib/work-proofs"

export async function GET(request: NextRequest) {
  console.log("[v0] Manual cron test triggered")

  try {
    process.env.CRON_PROCESSING = "true"

    console.log("[v0] Starting manual processing of expired work proofs...")
    const result = await processExpiredWorkProofs()

    console.log("[v0] Manual processing completed:", result)

    return NextResponse.json({
      success: true,
      message: "Manual cron processing completed",
      result: result,
    })
  } catch (error) {
    console.error("[v0] Manual cron processing failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    delete process.env.CRON_PROCESSING
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

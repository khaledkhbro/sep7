import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[CRON] 🚀 Cron job endpoint called at:", new Date().toISOString())
    console.log("[CRON] Request headers:", Object.fromEntries(request.headers.entries()))

    const authHeader = request.headers.get("authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (!process.env.CRON_SECRET) {
      console.error("[CRON] CRON_SECRET environment variable is not set!")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (authHeader !== expectedAuth) {
      console.error("[CRON] Unauthorized request. Expected:", expectedAuth, "Got:", authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CRON] ✅ Authorization successful, starting processing...")
    console.log("[CRON] Environment check - NODE_ENV:", process.env.NODE_ENV)

    process.env.CRON_PROCESSING = "true"
    console.log("[CRON] 🔧 Set CRON_PROCESSING environment variable to:", process.env.CRON_PROCESSING)

    // Import the timeout processing function
    const { processExpiredWorkProofs } = await import("@/lib/work-proofs")
    const { getRevisionSettingsFromAPI } = await import("@/lib/admin-settings")

    let revisionSettings
    try {
      revisionSettings = await getRevisionSettingsFromAPI()
      console.log("[CRON] Admin refund settings loaded successfully:", {
        enableAutomaticRefunds: revisionSettings.enableAutomaticRefunds,
        refundOnRevisionTimeout: revisionSettings.refundOnRevisionTimeout,
        refundOnRejectionTimeout: revisionSettings.refundOnRejectionTimeout,
        revisionTimeout: `${revisionSettings.revisionRequestTimeoutValue} ${revisionSettings.revisionRequestTimeoutUnit}`,
        rejectionTimeout: `${revisionSettings.rejectionResponseTimeoutValue} ${revisionSettings.rejectionResponseTimeoutUnit}`,
      })
    } catch (error) {
      console.error("[CRON] Failed to load admin settings, using safe defaults:", error)
      revisionSettings = {
        maxRevisionRequests: 2,
        revisionRequestTimeoutValue: 24,
        revisionRequestTimeoutUnit: "hours" as const,
        rejectionResponseTimeoutValue: 24,
        rejectionResponseTimeoutUnit: "hours" as const,
        enableAutomaticRefunds: true,
        refundOnRevisionTimeout: true,
        refundOnRejectionTimeout: true,
        enableRevisionWarnings: true,
        revisionPenaltyEnabled: false,
        revisionPenaltyAmount: 0,
      }
    }

    console.log("[CRON] 🎯 About to call processExpiredWorkProofs with CRON_PROCESSING =", process.env.CRON_PROCESSING)

    // Process expired work proof deadlines
    const processedCount = await processExpiredWorkProofs()

    delete process.env.CRON_PROCESSING
    console.log("[CRON] 🧹 Cleaned up CRON_PROCESSING environment variable")

    console.log("[CRON] Work proof timeout processing completed successfully")
    console.log("[CRON] Processed", processedCount, "expired deadlines")

    return NextResponse.json({
      success: true,
      message: "Work proof timeout processing completed",
      processedCount,
      timestamp: new Date().toISOString(),
      settings: {
        automaticRefundsEnabled: revisionSettings.enableAutomaticRefunds,
        refundOnRevisionTimeout: revisionSettings.refundOnRevisionTimeout,
        refundOnRejectionTimeout: revisionSettings.refundOnRejectionTimeout,
      },
    })
  } catch (error) {
    delete process.env.CRON_PROCESSING
    console.log("[CRON] 🧹 Cleaned up CRON_PROCESSING on error")

    console.error("[CRON] Work proof timeout processing error:", error)
    console.error("[CRON] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Also allow POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

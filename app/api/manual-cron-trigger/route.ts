import { processExpiredWorkProofs } from "@/lib/work-proofs"

export async function POST(request: Request) {
  try {
    console.log("[v0] 🔧 Manual cron trigger called")

    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Set environment variable to indicate cron processing
    process.env.CRON_PROCESSING = "true"
    console.log("[v0] ✅ Manual trigger - Set CRON_PROCESSING=true")

    const result = await processExpiredWorkProofs()

    console.log("[v0] 🎯 Manual cron trigger completed:", result)

    return Response.json({
      success: true,
      message: "Manual cron trigger executed successfully",
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] ❌ Manual cron trigger failed:", error)
    return Response.json(
      {
        error: "Failed to execute manual cron trigger",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    delete process.env.CRON_PROCESSING
    console.log("[v0] 🧹 Manual trigger - Cleaned up CRON_PROCESSING")
  }
}

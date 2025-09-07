import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"
    const hours = Number.parseInt(searchParams.get("hours") || "24")
    const interval = searchParams.get("interval") || "1h" // 1h, 30m, 15m, 5m

    // Validate hours parameter
    if (hours < 1 || hours > 168) {
      // Max 7 days
      return NextResponse.json({ error: "Hours must be between 1 and 168" }, { status: 400 })
    }

    // Get historical metrics with aggregation based on interval
    let intervalMinutes = 60
    switch (interval) {
      case "5m":
        intervalMinutes = 5
        break
      case "15m":
        intervalMinutes = 15
        break
      case "30m":
        intervalMinutes = 30
        break
      case "1h":
        intervalMinutes = 60
        break
      default:
        intervalMinutes = 60
    }

    const metrics = await sql`
      SELECT 
        DATE_TRUNC('hour', timestamp) + 
        INTERVAL '${intervalMinutes} minutes' * 
        FLOOR(EXTRACT(MINUTE FROM timestamp) / ${intervalMinutes}) as time_bucket,
        AVG(cpu_usage_percent) as cpu_usage,
        AVG(memory_usage_percent) as memory_usage,
        AVG(disk_usage_percent) as disk_usage,
        AVG(network_upload_mbps + network_download_mbps) as network_total
      FROM server_metrics
      WHERE server_id = ${serverId}
        AND timestamp >= NOW() - INTERVAL '${hours} hours'
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `

    const formattedData = metrics.map((row) => ({
      timestamp: row.time_bucket,
      cpu: Number(row.cpu_usage?.toFixed(1)) || 0,
      memory: Number(row.memory_usage?.toFixed(1)) || 0,
      disk: Number(row.disk_usage?.toFixed(1)) || 0,
      network: Number(row.network_total?.toFixed(1)) || 0,
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      meta: {
        serverId,
        hours,
        interval,
        dataPoints: formattedData.length,
      },
    })
  } catch (error) {
    console.error("Error fetching historical metrics:", error)
    return NextResponse.json({ error: "Failed to fetch historical metrics" }, { status: 500 })
  }
}

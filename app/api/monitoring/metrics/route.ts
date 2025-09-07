import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"

    // Get latest server metrics
    const metrics = await sql`
      SELECT * FROM get_latest_server_metrics(${serverId})
    `

    if (metrics.length === 0) {
      return NextResponse.json({ error: "No metrics found for server" }, { status: 404 })
    }

    const latestMetrics = metrics[0]

    return NextResponse.json({
      success: true,
      data: {
        cpu: {
          usage: Number(latestMetrics.cpu_usage),
          cores: latestMetrics.cpu_cores,
          temperature: Number(latestMetrics.cpu_temperature) || 0,
        },
        memory: {
          used: Number(latestMetrics.memory_used_gb),
          total: Number(latestMetrics.memory_total_gb),
          percentage: Number(latestMetrics.memory_usage_percent),
        },
        disk: {
          used: Number(latestMetrics.disk_used_gb),
          total: Number(latestMetrics.disk_total_gb),
          percentage: Number(latestMetrics.disk_usage_percent),
        },
        network: {
          upload: Number(latestMetrics.network_upload_mbps),
          download: Number(latestMetrics.network_download_mbps),
        },
        uptime: Number(latestMetrics.uptime_seconds),
        loadAverage: [
          Number(latestMetrics.load_average_1m) || 0,
          Number(latestMetrics.load_average_5m) || 0,
          Number(latestMetrics.load_average_15m) || 0,
        ],
        lastUpdated: latestMetrics.last_updated,
      },
    })
  } catch (error) {
    console.error("Error fetching server metrics:", error)
    return NextResponse.json({ error: "Failed to fetch server metrics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      server_id = "main-server",
      cpu_usage,
      cpu_cores,
      cpu_temperature,
      load_average,
      memory_total,
      memory_used,
      memory_free,
      disk_total,
      disk_used,
      disk_free,
      network_upload,
      network_download,
      uptime,
      process_count = 0,
    } = body

    // Validate required fields
    if (!cpu_usage || !memory_total || !memory_used || !disk_total || !disk_used) {
      return NextResponse.json({ error: "Missing required metrics fields" }, { status: 400 })
    }

    // Insert new metrics
    const result = await sql`
      SELECT insert_server_metrics(
        ${server_id},
        ${cpu_usage},
        ${cpu_cores || 1},
        ${cpu_temperature || 0},
        ${load_average?.[0] || 0},
        ${load_average?.[1] || 0},
        ${load_average?.[2] || 0},
        ${memory_total},
        ${memory_used},
        ${memory_free},
        ${disk_total},
        ${disk_used},
        ${disk_free},
        ${network_upload || 0},
        ${network_download || 0},
        ${uptime || 0},
        ${process_count}
      ) as id
    `

    // Check for alerts
    await sql`SELECT check_monitoring_alerts(${server_id})`

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
    })
  } catch (error) {
    console.error("Error inserting server metrics:", error)
    return NextResponse.json({ error: "Failed to insert server metrics" }, { status: 500 })
  }
}

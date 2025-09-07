import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"

    // Get server status
    const status = await sql`
      SELECT * FROM get_server_status(${serverId})
    `

    if (status.length === 0) {
      return NextResponse.json({ error: "No status found for server" }, { status: 404 })
    }

    const serverStatus = status[0]

    return NextResponse.json({
      success: true,
      data: {
        database: {
          status: serverStatus.database_status,
          connections: {
            active: serverStatus.db_connections_active,
            max: serverStatus.db_connections_max,
          },
          size: Number(serverStatus.db_size_gb),
          version: serverStatus.db_version,
        },
        application: {
          status: serverStatus.application_status,
          activeUsers: serverStatus.active_users,
          responseTime: serverStatus.response_time_ms,
          errorRate: Number(serverStatus.error_rate_percent),
          requestsPerMinute: serverStatus.requests_per_minute,
        },
        webServer: {
          status: serverStatus.web_server_status,
        },
        lastUpdated: serverStatus.last_updated,
      },
    })
  } catch (error) {
    console.error("Error fetching server status:", error)
    return NextResponse.json({ error: "Failed to fetch server status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      server_id = "main-server",
      database_status = "unknown",
      web_server_status = "unknown",
      application_status = "unknown",
      db_connections_active = 0,
      db_connections_max = 100,
      db_size_gb = 0,
      db_version = null,
      active_users = 0,
      response_time_ms = 0,
      error_rate_percent = 0,
      requests_per_minute = 0,
    } = body

    // Insert server status
    const result = await sql`
      INSERT INTO server_status (
        server_id, database_status, web_server_status, application_status,
        db_connections_active, db_connections_max, db_size_gb, db_version,
        active_users, response_time_ms, error_rate_percent, requests_per_minute
      ) VALUES (
        ${server_id}, ${database_status}, ${web_server_status}, ${application_status},
        ${db_connections_active}, ${db_connections_max}, ${db_size_gb}, ${db_version},
        ${active_users}, ${response_time_ms}, ${error_rate_percent}, ${requests_per_minute}
      ) RETURNING id
    `

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
    })
  } catch (error) {
    console.error("Error inserting server status:", error)
    return NextResponse.json({ error: "Failed to insert server status" }, { status: 500 })
  }
}

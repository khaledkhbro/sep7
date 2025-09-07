import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get("server_id") || "main-server"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const unreadOnly = searchParams.get("unread") === "true"

    let whereClause = "WHERE mn.server_id = $1"
    const params = [serverId]

    if (unreadOnly) {
      whereClause += " AND mn.resolved_at IS NULL"
    }

    const notifications = await sql`
      SELECT 
        mn.*,
        ma.alert_name,
        ma.alert_type,
        ma.severity
      FROM monitoring_notifications mn
      JOIN monitoring_alerts ma ON mn.alert_id = ma.id
      ${sql.unsafe(whereClause)}
      ORDER BY mn.created_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json({
      success: true,
      data: notifications.map((notification) => ({
        id: notification.id,
        alertId: notification.alert_id,
        alertName: notification.alert_name,
        alertType: notification.alert_type,
        message: notification.alert_message,
        severity: notification.severity,
        metricValue: Number(notification.metric_value),
        thresholdValue: Number(notification.threshold_value),
        notificationSent: notification.notification_sent,
        notificationMethod: notification.notification_method,
        resolvedAt: notification.resolved_at,
        createdAt: notification.created_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notification_ids, action } = body

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json({ error: "notification_ids must be an array" }, { status: 400 })
    }

    if (action === "resolve") {
      await sql`
        UPDATE monitoring_notifications 
        SET resolved_at = NOW()
        WHERE id = ANY(${notification_ids})
          AND resolved_at IS NULL
      `
    } else if (action === "mark_sent") {
      await sql`
        UPDATE monitoring_notifications 
        SET notification_sent = true
        WHERE id = ANY(${notification_ids})
      `
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'resolve' or 'mark_sent'" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Notifications ${action}d successfully`,
    })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

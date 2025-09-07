import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"

    let query
    if (activeOnly) {
      query = sql`
        SELECT 
          ma.*,
          COUNT(mn.id) as notification_count,
          MAX(mn.created_at) as last_notification
        FROM monitoring_alerts ma
        LEFT JOIN monitoring_notifications mn ON ma.id = mn.alert_id
          AND mn.resolved_at IS NULL
        WHERE ma.is_enabled = true
        GROUP BY ma.id
        ORDER BY ma.severity DESC, ma.alert_name ASC
      `
    } else {
      query = sql`
        SELECT 
          ma.*,
          COUNT(mn.id) as notification_count,
          MAX(mn.created_at) as last_notification
        FROM monitoring_alerts ma
        LEFT JOIN monitoring_notifications mn ON ma.id = mn.alert_id
        GROUP BY ma.id
        ORDER BY ma.created_at DESC
      `
    }

    const alerts = await query

    return NextResponse.json({
      success: true,
      data: alerts.map((alert) => ({
        id: alert.id,
        name: alert.alert_name,
        type: alert.alert_type,
        threshold: {
          value: Number(alert.threshold_value),
          operator: alert.threshold_operator,
        },
        severity: alert.severity,
        isEnabled: alert.is_enabled,
        notifications: {
          email: alert.notification_email,
          webhook: alert.notification_webhook,
        },
        cooldownMinutes: alert.cooldown_minutes,
        stats: {
          triggerCount: alert.trigger_count,
          lastTriggered: alert.last_triggered_at,
          notificationCount: Number(alert.notification_count),
          lastNotification: alert.last_notification,
        },
        createdAt: alert.created_at,
        updatedAt: alert.updated_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching monitoring alerts:", error)
    return NextResponse.json({ error: "Failed to fetch monitoring alerts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      alert_name,
      alert_type,
      threshold_value,
      threshold_operator,
      severity = "warning",
      notification_email,
      notification_webhook,
      cooldown_minutes = 15,
      is_enabled = true,
    } = body

    // Validate required fields
    if (!alert_name || !alert_type || !threshold_value || !threshold_operator) {
      return NextResponse.json({ error: "Missing required alert fields" }, { status: 400 })
    }

    // Validate alert type
    const validTypes = ["cpu", "memory", "disk", "network", "service"]
    if (!validTypes.includes(alert_type)) {
      return NextResponse.json({ error: "Invalid alert type" }, { status: 400 })
    }

    // Validate threshold operator
    const validOperators = [">", ">=", "<", "<=", "="]
    if (!validOperators.includes(threshold_operator)) {
      return NextResponse.json({ error: "Invalid threshold operator" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO monitoring_alerts (
        alert_name, alert_type, threshold_value, threshold_operator,
        severity, notification_email, notification_webhook,
        cooldown_minutes, is_enabled
      ) VALUES (
        ${alert_name}, ${alert_type}, ${threshold_value}, ${threshold_operator},
        ${severity}, ${notification_email}, ${notification_webhook},
        ${cooldown_minutes}, ${is_enabled}
      ) RETURNING id
    `

    return NextResponse.json({
      success: true,
      data: { id: result[0].id },
    })
  } catch (error) {
    console.error("Error creating monitoring alert:", error)
    return NextResponse.json({ error: "Failed to create monitoring alert" }, { status: 500 })
  }
}

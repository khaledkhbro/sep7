interface NotificationData {
  type: "reservation_violation" | "system_alert"
  userId?: string
  userEmail?: string
  userName?: string
  violationCount?: number
  violationRate?: number
  message: string
  timestamp: string
}

export async function sendAdminNotification(data: NotificationData) {
  const notifications = []

  // Console notification (always enabled for debugging)
  console.log(`[ADMIN NOTIFICATION] ${data.type.toUpperCase()}:`, data)

  // Email notification
  if (process.env.ENABLE_EMAIL_NOTIFICATIONS === "true" && process.env.ADMIN_EMAIL) {
    try {
      // In a real implementation, you would integrate with an email service like SendGrid, Resend, etc.
      console.log(`[EMAIL] Would send notification to ${process.env.ADMIN_EMAIL}:`, data.message)
      notifications.push("email")
    } catch (error) {
      console.error("Failed to send email notification:", error)
    }
  }

  // Webhook notification
  if (process.env.ENABLE_WEBHOOK_NOTIFICATIONS === "true" && process.env.ADMIN_WEBHOOK_URL) {
    try {
      const response = await fetch(process.env.ADMIN_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `🚨 Admin Alert: ${data.message}`,
          attachments: [
            {
              color: data.type === "reservation_violation" ? "warning" : "danger",
              fields: [
                {
                  title: "Type",
                  value: data.type,
                  short: true,
                },
                {
                  title: "Timestamp",
                  value: data.timestamp,
                  short: true,
                },
                ...(data.userId
                  ? [
                      {
                        title: "User",
                        value: `${data.userName} (${data.userEmail})`,
                        short: false,
                      },
                    ]
                  : []),
                ...(data.violationCount
                  ? [
                      {
                        title: "Violation Details",
                        value: `Count: ${data.violationCount}, Rate: ${((data.violationRate || 0) * 100).toFixed(1)}%`,
                        short: false,
                      },
                    ]
                  : []),
              ],
            },
          ],
        }),
      })

      if (response.ok) {
        notifications.push("webhook")
      } else {
        console.error("Webhook notification failed:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to send webhook notification:", error)
    }
  }

  return notifications
}

export async function notifyReservationViolation(
  userId: string,
  userEmail: string,
  userName: string,
  violationCount: number,
  violationRate: number,
) {
  const severity = violationRate >= 0.8 ? "CRITICAL" : violationRate >= 0.5 ? "HIGH" : "MEDIUM"

  await sendAdminNotification({
    type: "reservation_violation",
    userId,
    userEmail,
    userName,
    violationCount,
    violationRate,
    message: `${severity} reservation violation: User ${userName} has ${violationCount} violations with ${(violationRate * 100).toFixed(1)}% violation rate`,
    timestamp: new Date().toISOString(),
  })
}

export async function notifySystemAlert(message: string) {
  await sendAdminNotification({
    type: "system_alert",
    message,
    timestamp: new Date().toISOString(),
  })
}

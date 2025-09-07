import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const [stats] = await sql`
      SELECT 
        COALESCE(SUM(emails_sent), 0) as total_sent,
        COALESCE(SUM(emails_delivered), 0) as total_delivered,
        COALESCE(SUM(emails_opened), 0) as total_opened,
        COALESCE(SUM(emails_clicked), 0) as total_clicked,
        CASE 
          WHEN SUM(emails_sent) > 0 
          THEN ROUND((SUM(emails_delivered)::DECIMAL / SUM(emails_sent)) * 100, 1)
          ELSE 0 
        END as delivery_rate,
        CASE 
          WHEN SUM(emails_delivered) > 0 
          THEN ROUND((SUM(emails_opened)::DECIMAL / SUM(emails_delivered)) * 100, 1)
          ELSE 0 
        END as open_rate,
        CASE 
          WHEN SUM(emails_delivered) > 0 
          THEN ROUND((SUM(emails_clicked)::DECIMAL / SUM(emails_delivered)) * 100, 1)
          ELSE 0 
        END as click_rate
      FROM email_analytics 
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `

    return NextResponse.json(
      stats || {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
      },
    )
  } catch (error) {
    console.error("Failed to fetch email stats:", error)
    return NextResponse.json({ error: "Failed to fetch email stats" }, { status: 500 })
  }
}

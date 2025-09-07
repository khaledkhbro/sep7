import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const providers = await sql`
      SELECT 
        id, name, type, provider, is_active, is_primary, priority,
        config, daily_limit, monthly_limit, current_daily_usage, 
        current_monthly_usage, status, last_error, last_used_at,
        created_at, updated_at
      FROM email_providers 
      ORDER BY priority ASC, name ASC
    `

    return NextResponse.json(providers)
  } catch (error) {
    console.error("Failed to fetch email providers:", error)
    return NextResponse.json({ error: "Failed to fetch email providers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, provider, config, daily_limit, monthly_limit, priority } = body

    const [newProvider] = await sql`
      INSERT INTO email_providers (
        name, type, provider, config, daily_limit, monthly_limit, priority
      ) VALUES (
        ${name}, ${type}, ${provider}, ${JSON.stringify(config)}, 
        ${daily_limit}, ${monthly_limit}, ${priority}
      )
      RETURNING *
    `

    return NextResponse.json(newProvider)
  } catch (error) {
    console.error("Failed to create email provider:", error)
    return NextResponse.json({ error: "Failed to create email provider" }, { status: 500 })
  }
}

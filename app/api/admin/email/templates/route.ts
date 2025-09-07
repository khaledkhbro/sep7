import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const templates = await sql`
      SELECT 
        id, name, type, subject, html_content, text_content,
        variables, theme, is_active, is_default, created_at, updated_at
      FROM email_templates 
      ORDER BY type ASC, name ASC
    `

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Failed to fetch email templates:", error)
    return NextResponse.json({ error: "Failed to fetch email templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, subject, html_content, text_content, variables, theme } = body

    const [newTemplate] = await sql`
      INSERT INTO email_templates (
        name, type, subject, html_content, text_content, variables, theme
      ) VALUES (
        ${name}, ${type}, ${subject}, ${html_content}, ${text_content}, 
        ${JSON.stringify(variables)}, ${theme}
      )
      RETURNING *
    `

    return NextResponse.json(newTemplate)
  } catch (error) {
    console.error("Failed to create email template:", error)
    return NextResponse.json({ error: "Failed to create email template" }, { status: 500 })
  }
}

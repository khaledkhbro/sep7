import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = Number.parseInt(params.id)
    const body = await request.json()

    // Build dynamic update query
    const updateFields = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(body)) {
      if (key === "config") {
        updateFields.push(`${key} = $${paramIndex}`)
        values.push(JSON.stringify(value))
      } else {
        updateFields.push(`${key} = $${paramIndex}`)
        values.push(value)
      }
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // If setting as primary, unset other primary providers
    if (body.is_primary === true) {
      await sql`UPDATE email_providers SET is_primary = false WHERE id != ${providerId}`
    }

    const query = `
      UPDATE email_providers 
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `
    values.push(providerId)

    const result = await sql.unsafe(query, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to update email provider:", error)
    return NextResponse.json({ error: "Failed to update email provider" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = Number.parseInt(params.id)

    const result = await sql`
      DELETE FROM email_providers 
      WHERE id = ${providerId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete email provider:", error)
    return NextResponse.json({ error: "Failed to delete email provider" }, { status: 500 })
  }
}

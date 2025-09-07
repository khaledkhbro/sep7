import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/commission`, {
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch commission settings" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in commission GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${API_BASE_URL}/admin/commission`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to update commission settings" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in commission PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

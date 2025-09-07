import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const defaultPricing = [
      {
        id: "1",
        support_type: "free",
        price: 0.0,
        response_time_hours: 48,
        description: "Standard support with 24-48 hour response time",
        is_active: true,
      },
      {
        id: "2",
        support_type: "priority",
        price: 0.5,
        response_time_hours: 2,
        description: "Priority support with 1-2 hour response time",
        is_active: true,
      },
      {
        id: "3",
        support_type: "urgent",
        price: 1.0,
        response_time_hours: 1,
        description: "Urgent support with response within 1 hour",
        is_active: true,
      },
    ]

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("admin_support_pricing")
        if (stored) {
          const supportPricing = JSON.parse(stored)
          console.log("[v0] Support pricing loaded from localStorage")
          return NextResponse.json({ supportPricing })
        }
      }

      console.log("[v0] Support pricing not found in localStorage, returning default pricing")
      return NextResponse.json({ supportPricing: defaultPricing })
    } catch (error) {
      console.error("Error loading support pricing from localStorage:", error)
      return NextResponse.json({ supportPricing: defaultPricing })
    }
  } catch (error) {
    console.error("Error in support pricing GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || user.userType !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { supportType, settings } = await request.json()

    if (!supportType || !settings) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    try {
      let supportPricing = []

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("admin_support_pricing")
        if (stored) {
          supportPricing = JSON.parse(stored)
        }
      }

      // Find and update the specific support type
      const existingIndex = supportPricing.findIndex((item: any) => item.support_type === supportType)

      const updatedItem = {
        id: existingIndex >= 0 ? supportPricing[existingIndex].id : Date.now().toString(),
        support_type: supportType,
        price: settings.price || 0,
        response_time_hours: settings.responseTimeHours || 24,
        description: settings.description || "",
        is_active: settings.isActive || false,
        updated_at: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        supportPricing[existingIndex] = updatedItem
      } else {
        supportPricing.push(updatedItem)
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("admin_support_pricing", JSON.stringify(supportPricing))
      }

      console.log("[v0] Support pricing updated in localStorage")
      return NextResponse.json({ success: true, data: updatedItem })
    } catch (error) {
      console.error("Error updating support pricing in localStorage:", error)
      return NextResponse.json({ error: "Failed to update support pricing" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in support pricing PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

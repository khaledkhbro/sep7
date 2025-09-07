import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, description, priority, ticketType, chatId } = await request.json()

    if (!subject || !description || !ticketType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get support pricing
    const { data: supportPricing } = await supabase
      .from("support_pricing_settings")
      .select("*")
      .eq("support_type", ticketType)
      .eq("is_active", true)
      .single()

    const paymentAmount = supportPricing?.price || 0
    const responseTimeHours = supportPricing?.response_time_hours || 48

    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        chat_id: chatId || null,
        ticket_type: ticketType,
        subject,
        description,
        priority: priority || "normal",
        payment_amount: paymentAmount,
        response_time_hours: responseTimeHours,
        status: "open",
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Error creating support ticket:", ticketError)
      return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 })
    }

    // Process payment for priority support
    if (ticketType === "priority" && paymentAmount > 0) {
      // Deduct from user wallet
      await supabase.rpc("update_wallet_balance", {
        user_id: user.id,
        amount: -paymentAmount,
        transaction_type: "priority_support_payment",
      })

      // Update ticket with payment transaction
      await supabase
        .from("support_tickets")
        .update({ payment_transaction_id: "mock_transaction_id" })
        .eq("id", ticket.id)
    }

    return NextResponse.json({
      success: true,
      ticket: {
        ...ticket,
        paymentProcessed: ticketType === "priority",
      },
    })
  } catch (error) {
    console.error("Error in support ticket creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const ticketType = searchParams.get("ticketType")

    const supabase = createServerClient()

    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (ticketType && ticketType !== "all") {
      query = query.eq("ticket_type", ticketType)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error("Error fetching support tickets:", error)
      return NextResponse.json({ error: "Failed to fetch support tickets" }, { status: 500 })
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error in support tickets GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

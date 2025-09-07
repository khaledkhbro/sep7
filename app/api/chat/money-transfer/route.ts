import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId, receiverId, amount, message } = await request.json()

    if (!chatId || !receiverId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get commission settings
    const { data: commissionSettings } = await supabase
      .from("admin_fee_settings")
      .select("*")
      .eq("fee_type", "chat_transfer")
      .eq("is_active", true)
      .single()

    // Calculate commission
    let commissionAmount = 0
    if (commissionSettings) {
      commissionAmount = (amount * commissionSettings.fee_percentage) / 100
      commissionAmount += commissionSettings.fee_fixed || 0

      if (commissionAmount < commissionSettings.minimum_fee) {
        commissionAmount = commissionSettings.minimum_fee
      }

      if (commissionSettings.maximum_fee && commissionAmount > commissionSettings.maximum_fee) {
        commissionAmount = commissionSettings.maximum_fee
      }
    }

    const netAmount = amount - commissionAmount

    // Start transaction
    const { data: transfer, error: transferError } = await supabase
      .from("chat_money_transfers")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        receiver_id: receiverId,
        amount,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        message: message || null,
        status: "pending",
      })
      .select()
      .single()

    if (transferError) {
      console.error("Error creating money transfer:", transferError)
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
    }

    // Process wallet transactions (simplified - in real app, use proper transaction handling)
    // Deduct from sender
    await supabase.rpc("update_wallet_balance", {
      user_id: user.id,
      amount: -amount,
      transaction_type: "chat_transfer_sent",
    })

    // Add to receiver
    await supabase.rpc("update_wallet_balance", {
      user_id: receiverId,
      amount: netAmount,
      transaction_type: "chat_transfer_received",
    })

    // Update transfer status
    await supabase
      .from("chat_money_transfers")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", transfer.id)

    return NextResponse.json({
      success: true,
      transfer: {
        ...transfer,
        status: "completed",
      },
    })
  } catch (error) {
    console.error("Error in money transfer:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

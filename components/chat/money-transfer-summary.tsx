"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, ArrowUpRight, Wallet } from "lucide-react"
import { getWalletTransactions } from "@/lib/wallet"
import { useAuth } from "@/contexts/auth-context"

interface TransferStats {
  totalSent: number
  transferCount: number
  lastTransferDate: Date | null
}

export function MoneyTransferSummary() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TransferStats>({
    totalSent: 0,
    transferCount: 0,
    lastTransferDate: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTransferStats()
    }
  }, [user])

  const loadTransferStats = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get all wallet transactions for chat transfers (sent money)
      const transactions = await getWalletTransactions(user.id)

      // Filter for chat transfer payments (negative amounts = money sent)
      const chatTransfers = transactions.filter(
        (tx) => tx.referenceType === "chat_transfer" && tx.type === "payment" && tx.amount < 0,
      )

      const totalSent = Math.abs(chatTransfers.reduce((sum, tx) => sum + tx.amount, 0))
      const transferCount = chatTransfers.length
      const lastTransferDate =
        chatTransfers.length > 0
          ? new Date(Math.max(...chatTransfers.map((tx) => new Date(tx.createdAt).getTime())))
          : null

      setStats({
        totalSent,
        transferCount,
        lastTransferDate,
      })

      console.log("[v0] Loaded transfer stats:", { totalSent, transferCount, lastTransferDate })
    } catch (error) {
      console.error("[v0] Error loading transfer stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          Chat Money Transfers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Sent */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-full">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Total Sent</p>
              <p className="text-2xl font-bold text-emerald-900">${stats.totalSent.toFixed(2)}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            All Time
          </Badge>
        </div>

        {/* Transfer Count */}
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500 rounded-full">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm text-teal-700 font-medium">Transactions</p>
              <p className="text-2xl font-bold text-teal-900">{stats.transferCount}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-teal-200 text-teal-700">
            {stats.transferCount === 0
              ? "No transfers"
              : stats.transferCount === 1
                ? "1 transfer"
                : `${stats.transferCount} transfers`}
          </Badge>
        </div>

        {/* Last Transfer */}
        {stats.lastTransferDate && (
          <div className="p-3 bg-white/40 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium mb-1">Last Transfer</p>
            <p className="text-sm text-emerald-800">
              {stats.lastTransferDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {/* No transfers message */}
        {stats.transferCount === 0 && (
          <div className="text-center p-4 bg-white/40 rounded-lg border border-emerald-100">
            <p className="text-sm text-emerald-600">No money transfers yet</p>
            <p className="text-xs text-emerald-500 mt-1">Use the $ button in chat to send money to other users</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

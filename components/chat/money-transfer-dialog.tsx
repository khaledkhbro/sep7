"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, AlertCircle, CreditCard, X } from "lucide-react"
import { toast } from "sonner"
import { calculateChatTransferCommission } from "@/lib/admin-commission"
import { getWallet, addWalletTransaction, type WalletType } from "@/lib/wallet"
import { useAuth } from "@/contexts/auth-context"

interface MoneyTransferDialogProps {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  recipientId: string
  chatId: string
  onTransferComplete?: (transferData: any) => void
}

export function MoneyTransferDialog({
  isOpen,
  onClose,
  recipientName,
  recipientId,
  chatId,
  onTransferComplete,
}: MoneyTransferDialogProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [senderWallet, setSenderWallet] = useState<WalletType | null>(null)
  const [loading, setLoading] = useState(false)

  // Mock commission settings - in real app, fetch from API
  const commissionSettings = {
    feePercentage: 2.0,
    feeFixed: 0.0,
    minimumFee: 0.05,
    maximumFee: null,
    isActive: true,
  }

  const numericAmount = Number.parseFloat(amount) || 0
  const { commissionAmount, netAmount } = calculateChatTransferCommission(numericAmount, commissionSettings)

  useEffect(() => {
    if (isOpen && user) {
      loadSenderWallet()
    }
  }, [isOpen, user])

  const loadSenderWallet = async () => {
    if (!user) return

    setLoading(true)
    try {
      const wallet = await getWallet(user.id)
      setSenderWallet(wallet)
      console.log("[v0] Loaded sender wallet:", wallet)
    } catch (error) {
      console.error("[v0] Error loading sender wallet:", error)
      toast.error("Failed to load wallet information")
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!user || !senderWallet) {
      toast.error("User information not available")
      return
    }

    if (numericAmount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (numericAmount < 1) {
      toast.error("Minimum transfer amount is $1.00")
      return
    }

    if (senderWallet.depositBalance < numericAmount) {
      toast.error(`Insufficient deposit balance. Available: $${senderWallet.depositBalance.toFixed(2)}`)
      return
    }

    setIsProcessing(true)

    try {
      const transferData = {
        chatId,
        recipientId,
        amount: numericAmount,
        commissionAmount,
        netAmount,
        message: message.trim(),
      }

      console.log("[v0] Processing money transfer:", transferData)

      await addWalletTransaction({
        userId: user.id,
        type: "payment",
        amount: -numericAmount, // Negative amount for deduction
        description: `Chat transfer to ${recipientName} $$ID: ${recipientId}$$${message.trim() ? ` - "${message.trim()}"` : ""}`,
        referenceId: chatId,
        referenceType: "chat_transfer",
        balanceType: "deposit",
      })

      await addWalletTransaction({
        userId: recipientId,
        type: "earning",
        amount: netAmount, // Net amount after commission
        description: `Chat transfer from ${user.firstName} ${user.lastName} $$ID: ${user.id}$$${message.trim() ? ` - "${message.trim()}"` : ""}`,
        referenceId: chatId,
        referenceType: "chat_transfer",
        balanceType: "earnings",
      })

      if (commissionAmount > 0) {
        console.log("[v0] Recording commission:", commissionAmount)
        // In a real app, this would be recorded in admin earnings
      }

      toast.success(`$${numericAmount.toFixed(2)} sent to ${recipientName}!`)

      if (onTransferComplete) {
        onTransferComplete(transferData)
      }

      await loadSenderWallet()

      onClose()
      setAmount("")
      setMessage("")
    } catch (error) {
      console.error("Error processing transfer:", error)
      toast.error("Transfer failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const hasInsufficientBalance = senderWallet && numericAmount > senderWallet.depositBalance

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Send Money
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : senderWallet ? (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Your Deposit Balance</span>
                  </div>
                  <span className="font-bold text-blue-900">${senderWallet.depositBalance.toFixed(2)}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">Available for transfers and job payments</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">Unable to load wallet information</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recipient Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sending to</p>
                  <p className="font-medium">{recipientName}</p>
                  <p className="text-xs text-muted-foreground">ID: {recipientId}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Chat Transfer
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`pl-10 text-lg font-medium ${hasInsufficientBalance ? "border-red-300" : ""}`}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Minimum transfer: $1.00</span>
              {senderWallet && (
                <span className="text-muted-foreground">Max: ${senderWallet.depositBalance.toFixed(2)}</span>
              )}
            </div>
            {hasInsufficientBalance && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-3 w-3" />
                <span>Insufficient deposit balance</span>
              </div>
            )}
          </div>

          {/* Commission Breakdown */}
          {numericAmount > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transfer amount:</span>
                  <span>${numericAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform fee ({commissionSettings.feePercentage}%):</span>
                  <span>-${commissionAmount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Recipient receives:</span>
                  <span className="text-green-600">${netAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note with your transfer..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{message.length}/200 characters</p>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Transfer Notice</p>
                <p>
                  Money transfers are instant and cannot be reversed. Funds are deducted from your deposit balance and
                  added to recipient's earnings balance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 border-t bg-background">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              className="flex-1 gap-2"
              disabled={!amount || numericAmount <= 0 || isProcessing || hasInsufficientBalance || !senderWallet}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Send ${numericAmount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, CreditCard, DollarSign, AlertTriangle, AlertCircle } from "lucide-react"
import {
  createWithdrawal,
  getAdminFeeSettings,
  type PaymentMethod,
  type Wallet,
  type AdminFeeSettings,
} from "@/lib/wallet"

interface WithdrawalDialogProps {
  wallet: Wallet
  paymentMethods: PaymentMethod[]
  onSuccess: () => void
}

export function WithdrawalDialog({ wallet, paymentMethods, onSuccess }: WithdrawalDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const [feeSettings, setFeeSettings] = useState<AdminFeeSettings | null>(null)

  useEffect(() => {
    if (open) {
      loadFeeSettings()
    }
  }, [open])

  const loadFeeSettings = async () => {
    try {
      const settings = await getAdminFeeSettings("withdrawal")
      setFeeSettings(settings)
    } catch (error) {
      console.error("Failed to load fee settings:", error)
    }
  }

  const calculateFee = (withdrawalAmount: number): number => {
    if (!feeSettings || !feeSettings.isActive) return 0

    let fee = (withdrawalAmount * feeSettings.feePercentage) / 100 + feeSettings.feeFixed

    if (fee < feeSettings.minimumFee) {
      fee = feeSettings.minimumFee
    }

    if (feeSettings.maximumFee && fee > feeSettings.maximumFee) {
      fee = feeSettings.maximumFee
    }

    return Math.round(fee * 100) / 100
  }

  const earningsBalance = wallet.earningsBalance || 0
  const depositBalance = wallet.depositBalance || 0
  const totalBalance = wallet.balance || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !paymentMethodId) return

    const withdrawalAmount = Number.parseFloat(amount)
    if (withdrawalAmount > earningsBalance) {
      alert("Insufficient earnings balance for withdrawal.")
      return
    }

    setLoading(true)
    try {
      await createWithdrawal({
        amount: withdrawalAmount,
        paymentMethodId,
        userId: "user1", // Added userId parameter
      })

      setOpen(false)
      setAmount("")
      setPaymentMethodId("")
      onSuccess()
      alert("Withdrawal request submitted successfully!")
    } catch (error) {
      console.error("Withdrawal failed:", error)
      alert("Withdrawal failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const withdrawalAmount = Number.parseFloat(amount || "0")
  const feeAmount = calculateFee(withdrawalAmount)
  const netAmount = withdrawalAmount - feeAmount
  const isInsufficientBalance = withdrawalAmount > earningsBalance

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-transparent">
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Available for Withdrawal:</strong> ${earningsBalance.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Deposit Balance:</strong> ${depositBalance.toFixed(2)} (Cannot withdraw)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-10 ${isInsufficientBalance ? "border-red-300" : ""}`}
                min="10"
                max={earningsBalance}
                step="0.01"
                required
              />
            </div>
            {isInsufficientBalance && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Insufficient earnings balance</span>
              </div>
            )}
            <p className="text-xs text-gray-500">Minimum: $10.00, Maximum: ${earningsBalance.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label>Withdrawal Method</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select withdrawal method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>
                        {method.type === "card"
                          ? `${method.brand} ****${method.last4}`
                          : method.type === "paypal"
                            ? "PayPal Account"
                            : "Bank Account"}
                        {method.isDefault && " (Default)"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {amount && !isInsufficientBalance && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Withdrawal Amount:</span>
                    <span>${withdrawalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span className={feeAmount > 0 ? "text-red-600" : "text-green-600"}>-${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 text-green-600">
                    <span>You'll Receive:</span>
                    <span>${netAmount.toFixed(2)}</span>
                  </div>
                </div>
                {feeSettings && feeSettings.isActive && feeAmount > 0 && (
                  <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800 flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Fee Structure:</strong> {feeSettings.feePercentage}% + ${feeSettings.feeFixed.toFixed(2)}
                      {feeSettings.minimumFee > 0 && ` (min $${feeSettings.minimumFee.toFixed(2)})`}
                    </div>
                  </div>
                )}
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <strong>Note:</strong> Withdrawals typically take 1-3 business days to process.
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !paymentMethodId || isInsufficientBalance}>
              {loading ? "Processing..." : `Withdraw $${netAmount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

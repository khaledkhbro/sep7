"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, CreditCard, DollarSign, AlertCircle } from "lucide-react"
import { createDeposit, getAdminFeeSettings, type PaymentMethod, type AdminFeeSettings } from "@/lib/wallet"

interface DepositDialogProps {
  paymentMethods: PaymentMethod[]
  onSuccess: () => void
}

export function DepositDialog({ paymentMethods, onSuccess }: DepositDialogProps) {
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
      const settings = await getAdminFeeSettings("deposit")
      setFeeSettings(settings)
    } catch (error) {
      console.error("Failed to load fee settings:", error)
    }
  }

  const calculateFee = (depositAmount: number): number => {
    if (!feeSettings || !feeSettings.isActive) return 0

    let fee = (depositAmount * feeSettings.feePercentage) / 100 + feeSettings.feeFixed

    if (fee < feeSettings.minimumFee) {
      fee = feeSettings.minimumFee
    }

    if (feeSettings.maximumFee && fee > feeSettings.maximumFee) {
      fee = feeSettings.maximumFee
    }

    return Math.round(fee * 100) / 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || !paymentMethodId) return

    setLoading(true)
    try {
      await createDeposit({
        amount: Number.parseFloat(amount),
        paymentMethodId,
        userId: "user1", // Added userId parameter
      })

      setOpen(false)
      setAmount("")
      setPaymentMethodId("")
      onSuccess()
      alert("Deposit successful!")
    } catch (error) {
      console.error("Deposit failed:", error)
      alert("Deposit failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const depositAmount = Number.parseFloat(amount || "0")
  const feeAmount = calculateFee(depositAmount)
  const totalAmount = depositAmount + feeAmount
  const netAmount = depositAmount - feeAmount

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to Wallet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="10"
                max="5000"
                step="0.01"
                required
              />
            </div>
            <p className="text-xs text-gray-500">Minimum: $10.00, Maximum: $5,000.00</p>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
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

          {amount && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Deposit Amount:</span>
                    <span>${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span className={feeAmount > 0 ? "text-orange-600" : "text-green-600"}>
                      ${feeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Charge:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 text-green-600">
                    <span>Added to Wallet:</span>
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
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  <strong>Note:</strong> Funds will be added to your deposit balance and cannot be withdrawn directly.
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !paymentMethodId}>
              {loading ? "Processing..." : `Charge $${totalAmount.toFixed(2)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

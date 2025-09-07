"use client"

import { useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CheckCircle } from "@/components/ui/icons" // Import CheckCircle icon

const JobCreationForm = () => {
  const [paymentType, setPaymentType] = useState("") // Declare paymentType and setPaymentType

  return (
    <div className="space-y-2">
      <Label htmlFor="paymentType">Payment Method</Label>
      <Select value={paymentType} onValueChange={setPaymentType}>
        <SelectTrigger>
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="instant">
            <div className="flex flex-col">
              <span className="font-medium">Instant Payment (Recommended)</span>
              <span className="text-sm text-gray-500">Payment released immediately when you accept a worker</span>
            </div>
          </SelectItem>
          <SelectItem value="proof_required">
            <div className="flex flex-col">
              <span className="font-medium">Proof Required</span>
              <span className="text-sm text-gray-500">Worker must submit proof before payment</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      {paymentType === "instant" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">Instant Payment Enabled</p>
              <p className="text-green-700">
                When you accept a worker's application, payment will be released immediately to their withdrawal
                balance. This builds trust and gets work started faster.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobCreationForm

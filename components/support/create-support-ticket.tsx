"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Clock, Zap, CreditCard } from "lucide-react"
import { toast } from "sonner"

interface SupportPricing {
  type: "free" | "priority"
  price: number
  responseTime: string
  description: string
}

const supportOptions: SupportPricing[] = [
  {
    type: "free",
    price: 0,
    responseTime: "24-72 hours",
    description: "Standard support with response within 24-72 hours",
  },
  {
    type: "priority",
    price: 0.2,
    responseTime: "Within 1 hour",
    description: "Priority support with guaranteed response within 1 hour",
  },
]

interface CreateSupportTicketProps {
  onClose?: () => void
  chatId?: string
}

export function CreateSupportTicket({ onClose, chatId }: CreateSupportTicketProps) {
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "normal",
    supportType: "free",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedOption = supportOptions.find((option) => option.type === formData.supportType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const ticketData = {
        ...formData,
        chatId,
        paymentRequired: formData.supportType === "priority",
        paymentAmount: selectedOption?.price || 0,
      }

      console.log("[v0] Creating support ticket:", ticketData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (formData.supportType === "priority") {
        toast.success("Priority support ticket created! Payment processed successfully.")
      } else {
        toast.success("Support ticket created! We'll respond within 24-72 hours.")
      }

      if (onClose) onClose()
    } catch (error) {
      console.error("Error creating support ticket:", error)
      toast.error("Failed to create support ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Create Support Ticket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Support Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Support Type</Label>
            <RadioGroup
              value={formData.supportType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, supportType: value }))}
              className="space-y-3"
            >
              {supportOptions.map((option) => (
                <div key={option.type} className="flex items-center space-x-3">
                  <RadioGroupItem value={option.type} id={option.type} />
                  <Label htmlFor={option.type} className="flex-1 cursor-pointer">
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {option.type === "free" ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Zap className="h-5 w-5 text-orange-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{option.type} Support</span>
                              {option.type === "priority" && (
                                <Badge variant="secondary" className="text-xs">
                                  Fast Response
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {option.price === 0 ? "Free" : `$${option.price.toFixed(2)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">{option.responseTime}</div>
                        </div>
                      </div>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Priority Support Payment Notice */}
          {formData.supportType === "priority" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Priority Support Payment</span>
              </div>
              <p className="text-sm text-orange-700">
                A payment of ${selectedOption?.price.toFixed(2)} will be charged from your wallet for priority support
                with guaranteed response within 1 hour.
              </p>
            </div>
          )}

          {/* Ticket Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                required
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General question</SelectItem>
                  <SelectItem value="normal">Normal - Standard issue</SelectItem>
                  <SelectItem value="high">High - Urgent problem</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? "Creating Ticket..."
                : formData.supportType === "priority"
                  ? `Create Priority Ticket ($${selectedOption?.price.toFixed(2)})`
                  : "Create Free Ticket"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

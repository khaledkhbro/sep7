"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileText, LinkIcon, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { createDispute, getEscrowTransactionsByUser, type DisputeCase, type EscrowTransaction } from "@/lib/escrow"

interface CreateDisputeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function CreateDisputeDialog({ isOpen, onClose, onSuccess, trigger }: CreateDisputeDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([])
  const [formData, setFormData] = useState({
    escrowTransactionId: "",
    reason: "" as DisputeCase["reason"],
    description: "",
    evidence: [] as DisputeCase["evidence"],
  })
  const [newEvidence, setNewEvidence] = useState({
    type: "text" as "text" | "file" | "link",
    content: "",
  })

  useEffect(() => {
    if (isOpen && user?.id) {
      loadEscrowTransactions()
    }
  }, [isOpen, user?.id])

  const loadEscrowTransactions = async () => {
    if (!user?.id) return

    try {
      const transactions = await getEscrowTransactionsByUser(user.id)
      // Only show locked or disputed transactions that can have disputes filed
      const disputableTransactions = transactions.filter(
        (t) => t.status === "locked" || (t.status === "disputed" && !t.disputeId),
      )
      setEscrowTransactions(disputableTransactions)
    } catch (error) {
      console.error("Failed to load escrow transactions:", error)
      toast.error("Failed to load available jobs")
    }
  }

  const handleAddEvidence = () => {
    if (!newEvidence.content.trim()) return

    const evidence: DisputeCase["evidence"][0] = {
      type: newEvidence.type,
      content: newEvidence.content,
      uploadedAt: new Date().toISOString(),
    }

    setFormData((prev) => ({
      ...prev,
      evidence: [...prev.evidence, evidence],
    }))

    setNewEvidence({ type: "text", content: "" })
  }

  const handleRemoveEvidence = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !formData.escrowTransactionId || !formData.reason || !formData.description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const selectedTransaction = escrowTransactions.find((t) => t.id === formData.escrowTransactionId)
      if (!selectedTransaction) {
        toast.error("Selected job not found")
        return
      }

      await createDispute({
        escrowTransactionId: formData.escrowTransactionId,
        jobId: selectedTransaction.jobId,
        initiatorId: user.id,
        respondentId:
          selectedTransaction.payerId === user.id ? selectedTransaction.payeeId : selectedTransaction.payerId,
        reason: formData.reason,
        description: formData.description,
        evidence: formData.evidence,
      })

      // Reset form
      setFormData({
        escrowTransactionId: "",
        reason: "" as DisputeCase["reason"],
        description: "",
        evidence: [],
      })

      onSuccess()
    } catch (error) {
      console.error("Failed to create dispute:", error)
      toast.error("Failed to create dispute. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedTransaction = escrowTransactions.find((t) => t.id === formData.escrowTransactionId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
            File a Dispute
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Selection */}
          <div className="space-y-2">
            <Label htmlFor="job">Select Job *</Label>
            <Select
              value={formData.escrowTransactionId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, escrowTransactionId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose the job this dispute is about" />
              </SelectTrigger>
              <SelectContent>
                {escrowTransactions.map((transaction) => (
                  <SelectItem key={transaction.id} value={transaction.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{transaction.metadata?.jobTitle || `Job ${transaction.jobId}`}</span>
                      <Badge variant="outline" className="ml-2">
                        ${transaction.amount}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {escrowTransactions.length === 0 && (
              <p className="text-sm text-gray-500">No active jobs available for disputes</p>
            )}
          </div>

          {/* Selected Job Details */}
          {selectedTransaction && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-2">Job Details</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>
                    <strong>Title:</strong> {selectedTransaction.metadata?.jobTitle}
                  </p>
                  <p>
                    <strong>Amount:</strong> ${selectedTransaction.amount}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedTransaction.status}
                  </p>
                  <p>
                    <strong>Other Party:</strong>{" "}
                    {selectedTransaction.payerId === user?.id
                      ? selectedTransaction.metadata?.workerName
                      : selectedTransaction.metadata?.employerName}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Dispute Reason *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value as DisputeCase["reason"] }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the reason for this dispute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work_quality">Work Quality Issues</SelectItem>
                <SelectItem value="payment_delay">Payment Delay</SelectItem>
                <SelectItem value="scope_change">Scope Change</SelectItem>
                <SelectItem value="communication">Communication Problems</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              placeholder="Please provide a detailed explanation of the issue, including what happened, when it occurred, and what resolution you're seeking..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {/* Evidence Section */}
          <div className="space-y-4">
            <Label>Supporting Evidence</Label>

            {/* Add Evidence Form */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <Select
                      value={newEvidence.type}
                      onValueChange={(value) =>
                        setNewEvidence((prev) => ({ ...prev, type: value as "text" | "file" | "link" }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder={
                        newEvidence.type === "text"
                          ? "Describe the evidence..."
                          : newEvidence.type === "link"
                            ? "https://example.com/evidence"
                            : "File name or description"
                      }
                      value={newEvidence.content}
                      onChange={(e) => setNewEvidence((prev) => ({ ...prev, content: e.target.value }))}
                      className="flex-1"
                    />

                    <Button type="button" onClick={handleAddEvidence} size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence List */}
            {formData.evidence.length > 0 && (
              <div className="space-y-2">
                {formData.evidence.map((evidence, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {evidence.type === "text" && <FileText className="h-4 w-4 text-gray-500" />}
                      {evidence.type === "link" && <LinkIcon className="h-4 w-4 text-blue-500" />}
                      {evidence.type === "file" && <Upload className="h-4 w-4 text-green-500" />}
                      <span className="text-sm">{evidence.content}</span>
                      <Badge variant="outline" className="text-xs">
                        {evidence.type}
                      </Badge>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveEvidence(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Filing Dispute..." : "File Dispute"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

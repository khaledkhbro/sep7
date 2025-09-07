"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  LinkIcon,
  Upload,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { getDisputeStatusColor, type DisputeCase } from "@/lib/escrow"

interface DisputeDetailsModalProps {
  dispute: DisputeCase | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function DisputeDetailsModal({ dispute, isOpen, onClose, onUpdate }: DisputeDetailsModalProps) {
  const [addingEvidence, setAddingEvidence] = useState(false)
  const [newEvidenceContent, setNewEvidenceContent] = useState("")

  if (!dispute) return null

  const getStatusIcon = (status: DisputeCase["status"]) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "under_review":
        return <Clock className="h-5 w-5 text-yellow-600" />
      case "resolved":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "closed":
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getReasonLabel = (reason: DisputeCase["reason"]) => {
    switch (reason) {
      case "work_quality":
        return "Work Quality"
      case "payment_delay":
        return "Payment Delay"
      case "scope_change":
        return "Scope Change"
      case "communication":
        return "Communication Issues"
      case "other":
        return "Other"
      default:
        return reason
    }
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case "text":
        return <FileText className="h-4 w-4 text-gray-500" />
      case "link":
        return <LinkIcon className="h-4 w-4 text-blue-500" />
      case "file":
        return <Upload className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const handleAddEvidence = async () => {
    if (!newEvidenceContent.trim()) return

    try {
      // In a real app, this would call an API to add evidence to the dispute
      toast.success("Evidence added successfully")
      setNewEvidenceContent("")
      setAddingEvidence(false)
      onUpdate()
    } catch (error) {
      console.error("Failed to add evidence:", error)
      toast.error("Failed to add evidence")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(dispute.status)}
            <span>Dispute #{dispute.id.slice(-8)}</span>
            <Badge className={getDisputeStatusColor(dispute.status)}>
              {dispute.status.replace("_", " ").toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dispute Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium">{getReasonLabel(dispute.reason)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Job ID</p>
                  <p className="font-medium">{dispute.jobId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escrow Transaction</p>
                  <p className="font-medium">{dispute.escrowTransactionId.slice(-8)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900 leading-relaxed">{dispute.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Parties Involved */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Parties Involved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Dispute Initiator</p>
                    <p className="text-sm text-gray-600">User ID: {dispute.initiatorId}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Respondent</p>
                    <p className="text-sm text-gray-600">User ID: {dispute.respondentId}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Evidence ({dispute.evidence.length})</CardTitle>
                {dispute.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => setAddingEvidence(!addingEvidence)}>
                    Add Evidence
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Evidence Form */}
              {addingEvidence && (
                <div className="p-4 border border-dashed rounded-lg space-y-3">
                  <Textarea
                    placeholder="Describe additional evidence or provide links..."
                    value={newEvidenceContent}
                    onChange={(e) => setNewEvidenceContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddEvidence}>
                      Add Evidence
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAddingEvidence(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Evidence List */}
              {dispute.evidence.length > 0 ? (
                <div className="space-y-3">
                  {dispute.evidence.map((evidence, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">{getEvidenceIcon(evidence.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {evidence.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(evidence.uploadedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 break-words">{evidence.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No evidence provided yet</p>
              )}
            </CardContent>
          </Card>

          {/* Resolution */}
          {dispute.resolution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Decision</p>
                    <p className="font-medium text-green-900">
                      {dispute.resolution.decision === "favor_worker" && "In Favor of Worker"}
                      {dispute.resolution.decision === "favor_employer" && "In Favor of Employer"}
                      {dispute.resolution.decision === "partial_refund" && "Partial Refund"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Resolved</p>
                    <p className="font-medium text-green-900 flex items-center">
                      <Calendar className="mr-1 h-4 w-4" />
                      {formatDistanceToNow(new Date(dispute.resolution.resolvedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {dispute.resolution.amount && (
                    <div>
                      <p className="text-sm text-green-700">Amount</p>
                      <p className="font-medium text-green-900 flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />${dispute.resolution.amount}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-green-700">Resolved By</p>
                    <p className="font-medium text-green-900">{dispute.resolution.resolvedBy}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-green-700 mb-2">Reasoning</p>
                  <p className="text-green-900 leading-relaxed">{dispute.resolution.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {dispute.status === "open" && (
                <Button variant="outline" size="sm">
                  <MessageCircle className="mr-1 h-4 w-4" />
                  Contact Support
                </Button>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

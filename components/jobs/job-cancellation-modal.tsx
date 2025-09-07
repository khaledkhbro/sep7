"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { AlertTriangle, DollarSign, Users, RefreshCw, Calculator, Wallet, FileText, Clock } from "lucide-react"
import { getWorkProofs, type Job } from "@/lib/jobs"

interface JobCancellationModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job | null
  onJobCancelled: () => void
  userId: string
}

export default function JobCancellationModal({
  isOpen,
  onClose,
  job,
  onJobCancelled,
  userId,
}: JobCancellationModalProps) {
  const [workProofs, setWorkProofs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && job) {
      loadWorkProofs()
    }
  }, [isOpen, job])

  const loadWorkProofs = async () => {
    if (!job) return

    setLoading(true)
    try {
      const proofs = await getWorkProofs(job.id)
      setWorkProofs(proofs)
    } catch (error) {
      console.error("Error loading work proofs:", error)
      toast.error("Failed to load work submissions")
    } finally {
      setLoading(false)
    }
  }

  const calculateCancellationDetails = () => {
    if (!job) return { submittedWorkCount: 0, remainingSlots: 0, refundAmount: 0, platformFeeRefund: 0, totalRefund: 0 }

    const submittedWorkCount = workProofs.length
    const remainingSlots = Math.max(0, job.workersNeeded - submittedWorkCount)
    const workerPaymentRefund = remainingSlots * job.budgetMax
    const platformFeeRefund = workerPaymentRefund * 0.05
    const totalRefund = workerPaymentRefund + platformFeeRefund

    return { submittedWorkCount, remainingSlots, refundAmount: workerPaymentRefund, platformFeeRefund, totalRefund }
  }

  const handleCancelJob = async () => {
    if (!job) return

    setActionLoading(true)
    try {
      // Cancel the job with integrated refund processing
      const { cancelJob } = await import("@/lib/jobs")
      const { refundAmount } = await cancelJob(job.id, userId)

      const { submittedWorkCount } = calculateCancellationDetails()

      toast.success(
        `Job cancelled successfully! ${refundAmount > 0 ? `$${refundAmount.toFixed(2)} refunded for remaining slots.` : ""} ${submittedWorkCount > 0 ? `${submittedWorkCount} submitted work(s) can still be reviewed.` : ""}`,
      )
      onJobCancelled()
      onClose()
    } catch (error) {
      console.error("Error cancelling job:", error)
      toast.error("Failed to cancel job")
    } finally {
      setActionLoading(false)
    }
  }

  if (!job) return null

  const { submittedWorkCount, remainingSlots, refundAmount, platformFeeRefund, totalRefund } =
    calculateCancellationDetails()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Cancel Job: {job.title}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2">Loading work submissions...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-blue-600" />
                    <span>{job.workersNeeded} workers needed</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-blue-600" />
                    <span>${job.budgetMax} per worker</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-green-600" />
                    <span>{submittedWorkCount} work submitted</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-orange-600" />
                    <span>{remainingSlots} slots remaining</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Details */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">Cancellation Impact</h3>
                <div className="space-y-3 text-sm">
                  {submittedWorkCount > 0 && (
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">
                          {submittedWorkCount} worker{submittedWorkCount > 1 ? "s have" : " has"} submitted work
                        </p>
                        <p className="text-green-700">
                          You can still review and approve/reject these submissions from your job dashboard
                        </p>
                      </div>
                    </div>
                  )}

                  {remainingSlots > 0 && (
                    <div className="flex items-start space-x-2">
                      <Wallet className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">
                          {remainingSlots} remaining slot{remainingSlots > 1 ? "s" : ""} will be refunded
                        </p>
                        <p className="text-blue-700">
                          ${totalRefund.toFixed(2)} will be returned to your deposit balance
                        </p>
                      </div>
                    </div>
                  )}

                  {submittedWorkCount === 0 && remainingSlots === job.workersNeeded && (
                    <div className="flex items-start space-x-2">
                      <Calculator className="h-4 w-4 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-800">No work has been submitted yet</p>
                        <p className="text-gray-700">Full refund of ${totalRefund.toFixed(2)} will be processed</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Refund Breakdown */}
            {totalRefund > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-green-900 mb-3">Refund Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Worker payments to refund:</span>
                      <span className="font-medium">
                        {remainingSlots} × ${job.budgetMax} = ${refundAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform fee refund (5%):</span>
                      <span className="font-medium">${platformFeeRefund.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-green-700">
                      <span>Total refund:</span>
                      <span>${totalRefund.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Important:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• This action cannot be undone</li>
                <li>• Job will be removed from the marketplace</li>
                {submittedWorkCount > 0 && (
                  <li>
                    • You can still review {submittedWorkCount} submitted work{submittedWorkCount > 1 ? "s" : ""} after
                    cancellation
                  </li>
                )}
                {totalRefund > 0 && <li>• ${totalRefund.toFixed(2)} will be refunded to your deposit balance</li>}
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Keep Job Active
          </Button>
          <Button onClick={handleCancelJob} disabled={actionLoading} className="bg-red-600 hover:bg-red-700">
            {actionLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Cancelling Job...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cancel Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
// import { getDisputesByUser, getDisputeStatusColor, type DisputeCase } from "@/lib/escrow"
// import { CreateDisputeDialog } from "@/components/disputes/create-dispute-dialog"
// import { DisputeDetailsModal } from "@/components/disputes/dispute-details-modal"

interface DisputeCase {
  id: string
  status: "open" | "under_review" | "resolved" | "closed"
  reason: "work_quality" | "payment_delay" | "scope_change" | "communication" | "other"
  description: string
  createdAt: string
  evidence: any[]
  resolution?: {
    resolvedAt: string
  }
}

export default function DisputesPage() {
  const { user } = useAuth()
  const [disputes] = useState<DisputeCase[]>([])
  const [loading, setLoading] = useState(false)

  return (
    <>
      <DashboardHeader title="Disputes" description="Dispute system is currently disabled" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute System Disabled</h3>
              <p className="text-gray-600 mb-6">
                The dispute system has been temporarily disabled. Please contact support directly for any issues.
              </p>
              <Button variant="outline">Contact Support</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

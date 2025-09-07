"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAdminDisputes, resolveDispute, type AdminDispute } from "@/lib/admin-disputes"
import { getWorkProofsByJob } from "@/lib/work-proofs"
import { getJobById } from "@/lib/jobs"
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  FileText,
  ImageIcon,
  Link,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DisputeDetails {
  dispute: AdminDispute
  workProof: any
  job: any
  allWorkProofs: any[]
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(null)
  const [disputeDetails, setDisputeDetails] = useState<DisputeDetails | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showResolutionDialog, setShowResolutionDialog] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [resolutionDecision, setResolutionDecision] = useState<
    "approve_worker" | "approve_employer" | "partial_refund"
  >("")
  const [isResolving, setIsResolving] = useState(false)

  useEffect(() => {
    loadDisputes()
  }, [searchQuery, statusFilter, priorityFilter])

  const loadDisputes = async () => {
    setLoading(true)
    try {
      console.log(`[v0] Loading disputes with filters:`, { searchQuery, statusFilter, priorityFilter })

      const filters: any = {}
      if (searchQuery) filters.search = searchQuery
      if (statusFilter !== "all") filters.status = statusFilter
      if (priorityFilter !== "all") filters.priority = priorityFilter

      const disputesData = await getAdminDisputes(filters)

      console.log(`[v0] Loaded ${disputesData.length} disputes`)
      console.log(
        `[v0] Disputes data:`,
        disputesData.map((d) => ({ id: d.id, title: d.jobTitle, status: d.status })),
      )

      setDisputes(disputesData)
    } catch (error) {
      console.error("Failed to load disputes:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDisputeDetails = async (dispute: AdminDispute) => {
    try {
      console.log("[v0] Loading comprehensive dispute details for:", dispute.id)

      // Get work proof details
      const workProofId = dispute.id.replace("dispute-", "") // Extract work proof ID from dispute ID
      let workProof = null

      // Try to find work proof by searching all work proofs for this job
      const allWorkProofs = await getWorkProofsByJob(dispute.jobId)
      console.log("[v0] Found work proofs for job:", allWorkProofs.length)

      // Find the disputed work proof
      workProof = allWorkProofs.find((wp) => wp.status === "disputed" && wp.jobId === dispute.jobId)
      if (!workProof && allWorkProofs.length > 0) {
        // Fallback to the most recent work proof
        workProof = allWorkProofs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      }

      console.log("[v0] Found work proof:", workProof?.id, "status:", workProof?.status)

      // Get job details
      const job = await getJobById(dispute.jobId)
      console.log("[v0] Found job:", job?.title)

      const details: DisputeDetails = {
        dispute,
        workProof,
        job,
        allWorkProofs,
      }

      setDisputeDetails(details)
      console.log("[v0] Dispute details loaded successfully")
    } catch (error) {
      console.error("[v0] Failed to load dispute details:", error)
    }
  }

  const handleViewDetails = async (dispute: AdminDispute) => {
    setSelectedDispute(dispute)
    await loadDisputeDetails(dispute)
    setShowDetailsDialog(true)
  }

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolutionDecision || !resolutionNotes.trim()) {
      alert("Please provide resolution decision and notes")
      return
    }

    if (isResolving) {
      console.log("[v0] Resolution already in progress, ignoring duplicate request")
      return
    }

    setIsResolving(true)

    try {
      console.log(`[v0] Resolving dispute: ${selectedDispute.id} with decision: ${resolutionDecision}`)

      await resolveDispute(selectedDispute.id, {
        decision: resolutionDecision,
        adminNotes: resolutionNotes,
        adminId: "current-admin", // This would come from auth context
      })

      await loadDisputes()
      setShowResolutionDialog(false)
      setSelectedDispute(null)
      setResolutionNotes("")
      setResolutionDecision("")
      alert("Dispute resolved successfully!")
    } catch (error) {
      console.error("Failed to resolve dispute:", error)
      if (error instanceof Error && error.message.includes("already exists")) {
        alert("This dispute has already been resolved or is being processed.")
      } else {
        alert("Failed to resolve dispute. Please try again.")
      }
    } finally {
      setIsResolving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      under_review: "bg-blue-100 text-blue-800 border-blue-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      escalated: "bg-red-100 text-red-800 border-red-200",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      urgent: "bg-red-100 text-red-800 border-red-200",
    }
    return variants[priority as keyof typeof variants] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.employerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter
    const matchesPriority = priorityFilter === "all" || dispute.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <>
      <AdminHeader title="Dispute Resolution" description="Manage and resolve platform disputes" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{disputes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {disputes.filter((d) => d.status === "pending" || d.status === "under_review").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {
                    disputes.filter(
                      (d) =>
                        d.status === "resolved" && new Date(d.updatedAt).toDateString() === new Date().toDateString(),
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {disputes.filter((d) => d.priority === "high" || d.priority === "urgent").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search disputes by job title, worker, or employer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadDisputes}>Refresh</Button>
              </div>
            </CardContent>
          </Card>

          {/* Disputes List */}
          <Tabs
            value={statusFilter === "all" ? "all" : statusFilter}
            onValueChange={setStatusFilter}
            className="space-y-6"
          >
            <TabsList>
              <TabsTrigger value="all">All Disputes ({filteredDisputes.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter === "all" ? "all" : statusFilter}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : filteredDisputes.length > 0 ? (
                <div className="space-y-4">
                  {filteredDisputes.map((dispute) => (
                    <Card key={dispute.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-900">{dispute.jobTitle}</h3>
                              <Badge className={`${getStatusBadge(dispute.status)} border`}>{dispute.status}</Badge>
                              <Badge className={`${getPriorityBadge(dispute.priority)} border`}>
                                {dispute.priority}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{dispute.workerName[0]}</AvatarFallback>
                                </Avatar>
                                <span>Worker: {dispute.workerName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">{dispute.employerName[0]}</AvatarFallback>
                                </Avatar>
                                <span>Employer: {dispute.employerName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">
                                <strong>Reason:</strong> {dispute.reason}
                              </p>
                              <p className="text-sm text-gray-600 line-clamp-2">{dispute.description}</p>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Amount: ${dispute.amount.toFixed(2)}</span>
                              {dispute.evidenceCount > 0 && (
                                <div className="flex items-center space-x-1">
                                  <FileText className="h-4 w-4" />
                                  <span>{dispute.evidenceCount} evidence files</span>
                                </div>
                              )}
                            </div>

                            {dispute.status === "resolved" && dispute.resolution && (
                              <div className="mt-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-green-800 flex items-center text-lg">
                                    <CheckCircle className="mr-2 h-5 w-5" />✅ Dispute Resolved by Admin
                                  </h4>
                                  <span className="text-sm text-green-600 font-medium">
                                    Resolved {formatDistanceToNow(new Date(dispute.updatedAt), { addSuffix: true })}
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  <div className="bg-white p-3 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-green-700">Admin Decision:</span>
                                      <Badge className="bg-green-200 text-green-900 border-green-400 px-3 py-1 text-sm font-semibold">
                                        {dispute.resolution === "approve_worker" && "✅ WORKER APPROVED"}
                                        {dispute.resolution === "approve_employer" && "🔄 EMPLOYER REFUNDED"}
                                        {dispute.resolution === "partial_refund" && "⚖️ PARTIAL RESOLUTION"}
                                      </Badge>
                                    </div>

                                    <div className="bg-green-25 p-2 rounded border-l-4 border-green-400">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-700">Payment Action:</span>
                                        <span className="text-sm font-bold text-green-900">
                                          {dispute.resolution === "approve_worker" &&
                                            `💰 $${dispute.amount.toFixed(2)} → ${dispute.workerName}`}
                                          {dispute.resolution === "approve_employer" &&
                                            `💸 $${dispute.amount.toFixed(2)} → ${dispute.employerName} (Refunded)`}
                                          {dispute.resolution === "partial_refund" &&
                                            `⚖️ $${(dispute.amount * 0.5).toFixed(2)} each → Both parties`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {dispute.adminNotes && (
                                    <div className="bg-white p-3 rounded-lg border border-green-200">
                                      <span className="text-sm font-medium text-green-700">
                                        Admin Resolution Notes:
                                      </span>
                                      <p className="text-sm text-green-900 mt-2 font-medium bg-green-25 p-2 rounded border-l-4 border-green-400">
                                        "{dispute.adminNotes}"
                                      </p>
                                    </div>
                                  )}

                                  {dispute.adminId && (
                                    <div className="flex items-center justify-between text-sm text-green-600 bg-white p-2 rounded border border-green-200">
                                      <span className="font-medium">Resolved by Admin: {dispute.adminId}</span>
                                      <span className="text-xs">
                                        {new Date(dispute.updatedAt).toLocaleDateString()} at{" "}
                                        {new Date(dispute.updatedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(dispute)}
                              className="bg-transparent"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View Details
                            </Button>
                            {dispute.status !== "resolved" &&
                              (dispute.status === "pending" || dispute.status === "under_review") && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDispute(dispute)
                                    setShowResolutionDialog(true)
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Resolve Dispute
                                </Button>
                              )}
                            {dispute.status === "resolved" && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No disputes found matching your criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>
          {disputeDetails && (
            <div className="space-y-6">
              {/* Dispute Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Dispute Overview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Job Title:</span>
                    <span className="ml-2 font-medium">{disputeDetails.dispute.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dispute ID:</span>
                    <span className="ml-2 font-medium">{disputeDetails.dispute.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Worker:</span>
                    <span className="ml-2 font-medium">{disputeDetails.dispute.workerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employer:</span>
                    <span className="ml-2 font-medium">{disputeDetails.dispute.employerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">${disputeDetails.dispute.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <Badge className={`${getPriorityBadge(disputeDetails.dispute.priority)} border ml-2`}>
                      {disputeDetails.dispute.priority}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-gray-600">Dispute Reason:</span>
                  <p className="mt-1 text-sm bg-white p-3 rounded border">{disputeDetails.dispute.reason}</p>
                </div>
                <div className="mt-3">
                  <span className="text-gray-600">Evidence/Description:</span>
                  <p className="mt-1 text-sm bg-white p-3 rounded border">{disputeDetails.dispute.description}</p>
                </div>
              </div>

              {/* Job Requirements */}
              {disputeDetails.job && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Original Job Requirements
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1 bg-white p-3 rounded border">{disputeDetails.job.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Budget:</span>
                        <span className="ml-2 font-medium">
                          ${disputeDetails.job.budgetMin} - ${disputeDetails.job.budgetMax}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Workers Needed:</span>
                        <span className="ml-2 font-medium">{disputeDetails.job.workersNeeded || 1}</span>
                      </div>
                    </div>
                    {disputeDetails.job.requirements && (
                      <div>
                        <span className="text-gray-600">Requirements:</span>
                        <p className="mt-1 bg-white p-3 rounded border">{disputeDetails.job.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Work Proof Submission */}
              {disputeDetails.workProof && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Worker's Submission
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Submission Text:</span>
                      <p className="mt-1 bg-white p-3 rounded border">{disputeDetails.workProof.submissionText}</p>
                    </div>

                    {disputeDetails.workProof.reviewFeedback && (
                      <div>
                        <span className="text-gray-600">Employer's Rejection Reason:</span>
                        <p className="mt-1 bg-red-50 p-3 rounded border text-red-800">
                          {disputeDetails.workProof.reviewFeedback}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Submitted:</span>
                        <span className="ml-2 font-medium">
                          {formatDistanceToNow(new Date(disputeDetails.workProof.submittedAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <Badge className="ml-2 bg-orange-100 text-orange-800 border-orange-200">
                          {disputeDetails.workProof.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Files and Links */}
                    {(disputeDetails.workProof.proofFiles?.length > 0 ||
                      disputeDetails.workProof.proofLinks?.length > 0 ||
                      disputeDetails.workProof.screenshots?.length > 0) && (
                      <div className="space-y-2">
                        <span className="text-gray-600">Submitted Evidence:</span>
                        <div className="bg-white p-3 rounded border space-y-2">
                          {disputeDetails.workProof.proofFiles?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span>{disputeDetails.workProof.proofFiles.length} file(s) attached</span>
                              </div>
                              <div className="ml-6 space-y-1">
                                {disputeDetails.workProof.proofFiles.map((file: any, index: number) => {
                                  try {
                                    const fileData = typeof file === "string" ? JSON.parse(file) : file
                                    if (fileData.data && fileData.name) {
                                      return (
                                        <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                                          <FileText className="h-4 w-4 text-blue-600" />
                                          <a
                                            href={fileData.data}
                                            download={fileData.name}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                          >
                                            📎 {fileData.name}
                                          </a>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              const newWindow = window.open()
                                              if (newWindow) {
                                                newWindow.location.href = fileData.data
                                              }
                                            }}
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                      )
                                    }
                                  } catch (error) {
                                    console.error("[v0] Failed to parse file:", error)
                                  }
                                  return null
                                })}
                              </div>
                            </div>
                          )}
                          {disputeDetails.workProof.screenshots?.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <ImageIcon className="h-4 w-4 text-green-500" />
                                <span>{disputeDetails.workProof.screenshots.length} screenshot(s) attached</span>
                              </div>
                              <div className="ml-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {disputeDetails.workProof.screenshots.map((screenshot: any, index: number) => {
                                  console.log(
                                    `[v0] Processing screenshot ${index + 1}:`,
                                    typeof screenshot,
                                    screenshot?.substring?.(0, 50),
                                  )

                                  let screenshotData = null
                                  let screenshotName = `Screenshot ${index + 1}`

                                  try {
                                    // Case 1: Direct base64 string
                                    if (typeof screenshot === "string" && screenshot.startsWith("data:")) {
                                      screenshotData = screenshot
                                      console.log(`[v0] Screenshot ${index + 1}: Direct base64 string`)
                                    }
                                    // Case 2: JSON string with data property
                                    else if (typeof screenshot === "string" && screenshot.includes("{")) {
                                      const parsed = JSON.parse(screenshot)
                                      if (parsed.data && parsed.data.startsWith("data:")) {
                                        screenshotData = parsed.data
                                        screenshotName = parsed.name || screenshotName
                                        console.log(
                                          `[v0] Screenshot ${index + 1}: Parsed from JSON with name:`,
                                          screenshotName,
                                        )
                                      }
                                    }
                                    // Case 3: Object with data property
                                    else if (
                                      typeof screenshot === "object" &&
                                      screenshot?.data?.startsWith?.("data:")
                                    ) {
                                      screenshotData = screenshot.data
                                      screenshotName = screenshot.name || screenshotName
                                      console.log(`[v0] Screenshot ${index + 1}: Object with data property`)
                                    }
                                    // Case 4: Try as direct string (fallback)
                                    else if (typeof screenshot === "string" && screenshot.length > 100) {
                                      // Might be base64 without data: prefix
                                      screenshotData = screenshot.startsWith("data:")
                                        ? screenshot
                                        : `data:image/png;base64,${screenshot}`
                                      console.log(`[v0] Screenshot ${index + 1}: Fallback string processing`)
                                    }
                                  } catch (error) {
                                    console.error(`[v0] Failed to parse screenshot ${index + 1}:`, error)
                                  }

                                  try {
                                    // Case 1: Direct base64 string
                                    if (typeof screenshot === "string" && screenshot.startsWith("data:")) {
                                      screenshotData = screenshot
                                      console.log(`[v0] Screenshot ${index + 1}: Direct base64 string`)
                                    }
                                    // Case 2: JSON string with data property - FIXED to properly extract data
                                    else if (typeof screenshot === "string" && screenshot.includes("{")) {
                                      const parsed = JSON.parse(screenshot)
                                      console.log(`[v0] Screenshot ${index + 1}: Parsed JSON object:`, {
                                        hasData: !!parsed.data,
                                        hasName: !!parsed.name,
                                        dataType: typeof parsed.data,
                                        dataStart: parsed.data?.substring?.(0, 30),
                                      })

                                      if (parsed.data) {
                                        // Ensure data has proper data URL format
                                        screenshotData = parsed.data.startsWith("data:")
                                          ? parsed.data
                                          : `data:image/png;base64,${parsed.data}`
                                        screenshotName = parsed.name || screenshotName
                                        console.log(
                                          `[v0] Screenshot ${index + 1}: Successfully extracted data from JSON`,
                                        )
                                      }
                                    }
                                    // Case 3: Object with data property
                                    else if (typeof screenshot === "object" && screenshot?.data) {
                                      screenshotData = screenshot.data.startsWith("data:")
                                        ? screenshot.data
                                        : `data:image/png;base64,${screenshot.data}`
                                      screenshotName = screenshot.name || screenshotName
                                      console.log(`[v0] Screenshot ${index + 1}: Object with data property`)
                                    }
                                    // Case 4: Try as direct string (fallback)
                                    else if (typeof screenshot === "string" && screenshot.length > 100) {
                                      screenshotData = screenshot.startsWith("data:")
                                        ? screenshot
                                        : `data:image/png;base64,${screenshot}`
                                      console.log(`[v0] Screenshot ${index + 1}: Fallback string processing`)
                                    }

                                    console.log(`[v0] Screenshot ${index + 1}: Final result:`, {
                                      hasData: !!screenshotData,
                                      dataLength: screenshotData?.length,
                                      name: screenshotName,
                                    })
                                  } catch (error) {
                                    console.error(`[v0] Failed to parse screenshot ${index + 1}:`, error)
                                  }

                                  if (screenshotData && screenshotData.startsWith("data:")) {
                                    return (
                                      <div
                                        key={index}
                                        className="relative group bg-gray-100 rounded-lg overflow-hidden"
                                      >
                                        <img
                                          src={screenshotData || "/placeholder.svg"}
                                          alt={screenshotName}
                                          className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            // Open in new tab for full view
                                            const newWindow = window.open()
                                            if (newWindow) {
                                              newWindow.document.write(`
                                                <html>
                                                  <head><title>${screenshotName}</title></head>
                                                  <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                                                    <img src="${screenshotData}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                                                  </body>
                                                </html>
                                              `)
                                            }
                                          }}
                                          onError={(e) => {
                                            console.error(`[v0] Failed to load screenshot ${index + 1}`)
                                            e.currentTarget.src =
                                              "/placeholder.svg?height=96&width=128&text=Failed+to+Load"
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                                          {screenshotName}
                                        </div>
                                      </div>
                                    )
                                  } else {
                                    console.warn(`[v0] Invalid screenshot data for ${index + 1}:`, {
                                      type: typeof screenshot,
                                      hasData: !!screenshotData,
                                      dataStart: screenshotData?.substring?.(0, 30),
                                    })
                                    return (
                                      <div
                                        key={index}
                                        className="bg-gray-200 rounded-lg h-24 flex flex-col items-center justify-center p-2"
                                      >
                                        <ImageIcon className="h-6 w-6 text-gray-400 mb-1" />
                                        <span className="text-gray-500 text-xs text-center">{screenshotName}</span>
                                        <span className="text-gray-400 text-xs">Failed to Load</span>
                                      </div>
                                    )
                                  }
                                })}
                              </div>
                            </div>
                          )}
                          {disputeDetails.workProof.proofLinks?.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Link className="h-4 w-4 text-purple-500" />
                                <span>Links provided:</span>
                              </div>
                              <div className="ml-6 space-y-2">
                                {disputeDetails.workProof.proofLinks.map((link: string, index: number) => (
                                  <div key={index} className="flex items-center space-x-2 p-2 bg-purple-50 rounded">
                                    <Link className="h-4 w-4 text-purple-600" />
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:underline text-sm font-medium flex-1 truncate"
                                    >
                                      {link}
                                    </a>
                                    <Button size="sm" variant="outline" onClick={() => window.open(link, "_blank")}>
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      Open
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Revision History */}
                    {disputeDetails.allWorkProofs && disputeDetails.allWorkProofs.length > 1 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-3 flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Revision History ({disputeDetails.allWorkProofs.length} submissions)
                        </h4>
                        <div className="space-y-3">
                          {disputeDetails.allWorkProofs
                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                            .map((proof, index) => (
                              <div key={proof.id} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">
                                    Submission #{disputeDetails.allWorkProofs.length - index}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Badge className="text-xs">{proof.status}</Badge>
                                    <span className="text-xs text-gray-500">
                                      {formatDistanceToNow(new Date(proof.submittedAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">{proof.submissionText}</p>
                                {proof.reviewFeedback && (
                                  <p className="text-xs text-red-600 mt-1 italic">Feedback: {proof.reviewFeedback}</p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="bg-transparent">
                  Close
                </Button>
                {disputeDetails.dispute.status !== "resolved" &&
                  (disputeDetails.dispute.status === "pending" || disputeDetails.dispute.status === "under_review") && (
                    <Button
                      onClick={() => {
                        setSelectedDispute(disputeDetails.dispute)
                        setShowDetailsDialog(false)
                        setShowResolutionDialog(true)
                      }}
                      disabled={isResolving}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isResolving ? "Resolving..." : "Resolve Dispute"}
                    </Button>
                  )}
                {disputeDetails.dispute.status === "resolved" && (
                  <Badge className="bg-green-100 text-green-800 border-green-300 px-4 py-2 text-sm font-semibold">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Dispute Already Resolved
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog - Now separate from details dialog */}
      <Dialog open={showResolutionDialog} onOpenChange={setShowResolutionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedDispute.jobTitle}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Worker:</span>
                    <span className="ml-2 font-medium">{selectedDispute.workerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Employer:</span>
                    <span className="ml-2 font-medium">{selectedDispute.employerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <span className="ml-2 font-medium">${selectedDispute.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Priority:</span>
                    <Badge className={getPriorityBadge(selectedDispute.priority)}>{selectedDispute.priority}</Badge>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-gray-600">Reason:</span>
                  <p className="mt-1 text-sm">{selectedDispute.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Resolution Decision</label>
                  <Select value={resolutionDecision} onValueChange={setResolutionDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select resolution decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve_worker">Approve Worker - Release Full Payment</SelectItem>
                      <SelectItem value="approve_employer">Approve Job poster - Full Refund</SelectItem>
                      <SelectItem value="partial_refund">Partial Resolution - Split Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Admin Resolution Notes</label>
                  <Textarea
                    placeholder="Provide detailed explanation of your decision and reasoning..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {resolutionDecision === "partial_refund" && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      For partial resolution, 50% will be released to the worker and 50% refunded to the employer. You
                      can adjust this in the resolution notes if needed.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResolutionDialog(false)
                    setResolutionNotes("")
                    setResolutionDecision("")
                  }}
                  className="bg-transparent"
                  disabled={isResolving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolveDispute}
                  disabled={!resolutionDecision || !resolutionNotes.trim() || isResolving}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isResolving ? "Resolving..." : "Resolve Dispute"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

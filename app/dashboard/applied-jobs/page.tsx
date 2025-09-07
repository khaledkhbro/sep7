"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  Timer,
  CheckCircle,
  Eye,
  ExternalLink,
  FileText,
} from "lucide-react"
import { toast } from "sonner"
import { getUserApplications, getJobById, type Job } from "@/lib/jobs"
import { getWorkProofsByJob, type WorkProof } from "@/lib/work-proofs"
import { acceptRejection, createDispute } from "@/lib/work-proofs"
import { getRevisionSettingsFromAPI, type RevisionSettings } from "@/lib/admin-settings"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface JobApplication {
  id: string
  jobId: string
  applicantId: string // Changed from workerId to applicantId
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  portfolioLinks: string[]
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  createdAt: string
  appliedAt?: string
  job?: Job | null
  applicant?: {
    id: string
    firstName: string
    lastName: string
    username: string
    rating: number
    totalReviews: number
    skills: string[]
  }
}

interface WorkProofSubmission {
  title: string
  description: string
  screenshots: File[]
  proofLinks: string[]
  additionalNotes: string
}

const AppliedJobsPage = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [jobs, setJobs] = useState<{ [key: string]: Job }>({})
  const [workProofs, setWorkProofs] = useState<{ [key: string]: WorkProof[] }>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [submittingProof, setSubmittingProof] = useState(false)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeSubmission, setDisputeSubmission] = useState({
    reason: "",
    requestedAction: "payment" as const,
  })
  const [proofSubmission, setProofSubmission] = useState({
    description: "",
    screenshots: [] as File[],
    proofLinks: [""],
    additionalNotes: "",
  })

  const [rejectionResponseModalOpen, setRejectionResponseModalOpen] = useState(false)
  const [selectedRejectedProof, setSelectedRejectedProof] = useState<WorkProof | null>(null)
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false)
  const [selectedRevisionProof, setSelectedRevisionProof] = useState<WorkProof | null>(null)
  const [revisionSettings, setRevisionSettings] = useState<RevisionSettings | null>(null)
  const [viewSubmissionModalOpen, setViewSubmissionModalOpen] = useState(false)
  const [selectedWorkProof, setSelectedWorkProof] = useState<WorkProof | null>(null)
  const [viewApplicationModalOpen, setViewApplicationModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)

  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({})

  const calculateCountdown = (deadline: string, proofStatus?: string): string => {
    // If job is already auto-processed, don't show countdown
    if (proofStatus === "cancelled_by_worker" || proofStatus === "rejected_accepted") {
      return "AUTO_PROCESSED"
    }

    const now = new Date().getTime()
    const deadlineTime = new Date(deadline).getTime()
    const timeLeft = deadlineTime - now

    if (timeLeft <= 0) {
      return "EXPIRED"
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s left`
    } else {
      return `${seconds}s left`
    }
  }

  const processExpiredTimeout = async (proofId: string, proofStatus: string) => {
    try {
      console.log("[v0] Processing expired timeout for proof:", proofId, "status:", proofStatus)

      const response = await fetch("/api/test-cron", {
        method: "GET",
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] Timeout processing completed:", result)

        // Show success message based on the type of timeout
        if (proofStatus === "rejected") {
          toast.success("Rejection timeout expired - Refund processed automatically!")
        } else if (proofStatus === "revision_requested") {
          toast.success("Revision timeout expired - Job cancelled and refunded automatically!")
        }

        // Refresh the applications data to show updated status
        await refreshApplications()
      } else {
        console.error("[v0] Failed to process timeout:", response.status)
        toast.error("Failed to process expired timeout. Please refresh the page.")
      }
    } catch (error) {
      console.error("[v0] Error processing expired timeout:", error)
      toast.error("Failed to process expired timeout. Please refresh the page.")
    }
  }

  const updateCountdowns = () => {
    const newCountdowns: { [key: string]: string } = {}
    const expiredProofs: { proofId: string; status: string }[] = []

    Object.values(workProofs)
      .flat()
      .forEach((proof) => {
        if (proof.status === "rejected" && proof.rejectionDeadline) {
          const countdown = calculateCountdown(proof.rejectionDeadline, proof.status)
          newCountdowns[proof.id] = countdown

          if (countdown === "EXPIRED" && countdowns[proof.id] !== "EXPIRED") {
            expiredProofs.push({ proofId: proof.id, status: proof.status })
          }
        } else if (proof.status === "revision_requested" && proof.revisionDeadline) {
          const countdown = calculateCountdown(proof.revisionDeadline, proof.status)
          newCountdowns[proof.id] = countdown

          if (countdown === "EXPIRED" && countdowns[proof.id] !== "EXPIRED") {
            expiredProofs.push({ proofId: proof.id, status: proof.status })
          }
        } else if (proof.status === "cancelled_by_worker" || proof.status === "rejected_accepted") {
          newCountdowns[proof.id] = "AUTO_PROCESSED"
        }
      })

    setCountdowns(newCountdowns)

    expiredProofs.forEach(({ proofId, status }) => {
      processExpiredTimeout(proofId, status)
    })
  }

  useEffect(() => {
    if (user?.id) {
      console.log("[v0] Applied Jobs page mounted, loading data for user:", user.id)
      loadWorkProofs()
    }
  }, [user?.id])

  useEffect(() => {
    const interval = setInterval(updateCountdowns, 1000) // Update every second
    return () => clearInterval(interval)
  }, [workProofs, countdowns]) // Include countdowns in dependencies to detect changes

  useEffect(() => {
    if (!user?.id) return

    const refreshInterval = setInterval(() => {
      console.log("[v0] Periodic refresh of application data")
      refreshApplications()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [user?.id])

  const handleRejectionResponse = (proof: WorkProof) => {
    setSelectedRejectedProof(proof)
    setRejectionResponseModalOpen(true)
  }

  const handleRevisionResubmit = (proof: WorkProof) => {
    setSelectedRevisionProof(proof)
    setResubmitModalOpen(true)
  }

  const handleAcceptRejection = async () => {
    if (!selectedRejectedProof) return

    try {
      await acceptRejection(selectedRejectedProof.id)
      toast.success("Rejection accepted. Refund processed to employer.")
      setRejectionResponseModalOpen(false)
      await refreshApplications()
    } catch (error) {
      console.error("Error accepting rejection:", error)
      toast.error("Failed to accept rejection")
    }
  }

  const handleCreateDispute = async () => {
    console.log("[v0] Starting dispute submission...")
    console.log("[v0] Selected proof:", selectedRejectedProof?.id)
    console.log("[v0] Dispute data:", disputeSubmission)

    if (!selectedRejectedProof || !disputeSubmission.reason) {
      console.log("[v0] Validation failed - missing required fields")
      toast.error("Please fill in all required fields")
      return
    }

    try {
      console.log("[v0] Calling createDispute function...")
      await createDispute(selectedRejectedProof.id, disputeSubmission)
      console.log("[v0] Dispute created successfully")
      toast.success("Dispute submitted successfully! Admin will review your case.")
      setRejectionResponseModalOpen(false)
      setDisputeModalOpen(false)
      setDisputeSubmission({
        reason: "",
        requestedAction: "payment" as const,
      })
      await refreshApplications()
    } catch (error) {
      console.error("[v0] Error submitting dispute:", error)

      if (error instanceof Error && error.message.includes("already exists and is pending resolution")) {
        toast.error(
          "A dispute for this job is already being reviewed by our admin team. Please check your existing disputes or wait for the current dispute to be resolved.",
        )
        // Close the modal since the user can't create another dispute
        setRejectionResponseModalOpen(false)
        setDisputeModalOpen(false)
        setDisputeSubmission({
          reason: "",
          requestedAction: "payment" as const,
        })
      } else {
        // Handle other errors with the original error message
        toast.error(`Failed to submit dispute: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }

  const handleCancelJob = async (proofId: string) => {
    if (!confirm("Are you sure you want to cancel this job? The employer will receive a full refund.")) {
      return
    }

    try {
      console.log("[v0] Cancelling job for proof:", proofId)

      // Find the work proof to get job and application details
      const proof = Object.values(workProofs)
        .flat()
        .find((p) => p.id === proofId)
      if (!proof) {
        throw new Error("Work proof not found")
      }

      const { cancelJobByWorker } = await import("@/lib/work-proofs")
      await cancelJobByWorker(proofId)

      toast.success("Job cancelled successfully. Employer has been refunded.")
      await refreshApplications()
    } catch (error) {
      console.error("Error cancelling job:", error)
      toast.error("Failed to cancel job")
    }
  }

  const loadWorkProofs = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      console.log("[v0] Loading applications for user:", user.id)
      const userApplications = await getUserApplications(user.id)
      console.log("[v0] Found applications:", userApplications.length)
      setApplications(userApplications)

      const jobIds = [...new Set(userApplications.map((app) => app.jobId))]
      console.log("[v0] Loading jobs for IDs:", jobIds)
      const jobsData: { [key: string]: Job } = {}
      const workProofsData: { [key: string]: WorkProof[] } = {}

      console.log("[v0] Processing expired deadlines immediately...")
      try {
        const response = await fetch("/api/test-cron-now", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const result = await response.json()
          console.log("[v0] Immediate processing completed:", result)
        } else {
          console.log("[v0] Immediate processing failed:", response.status)
        }
      } catch (error) {
        console.error("[v0] Error in immediate processing:", error)
      }

      await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const job = await getJobById(jobId)
            if (job) {
              jobsData[jobId] = job
              console.log("[v0] Loaded job:", job.title)
            }

            const proofs = await getWorkProofsByJob(jobId)
            workProofsData[jobId] = proofs.filter((proof) => proof.workerId === user.id)
            console.log("[v0] Found work proofs for job", jobId, ":", workProofsData[jobId].length)
          } catch (error) {
            console.error(`Error loading data for job ${jobId}:`, error)
          }
        }),
      )

      setJobs(jobsData)
      setWorkProofs(workProofsData)
      console.log("[v0] Applied jobs data loaded successfully")
    } catch (error) {
      console.error("Error loading applications:", error)
      toast.error("Failed to load your jobs")
    } finally {
      setLoading(false)
    }
  }

  const refreshApplications = async () => {
    if (!user?.id) return

    try {
      const userApplications = await getUserApplications(user.id)
      setApplications(userApplications)

      const jobIds = [...new Set(userApplications.map((app) => app.jobId))]
      const jobsData: { [key: string]: Job } = {}
      const workProofsData: { [key: string]: WorkProof[] } = {}

      await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const job = await getJobById(jobId)
            if (job) {
              jobsData[jobId] = job
            }

            const proofs = await getWorkProofsByJob(jobId)
            workProofsData[jobId] = proofs.filter((proof) => proof.workerId === user.id)
          } catch (error) {
            console.error(`Error loading data for job ${jobId}:`, error)
          }
        }),
      )

      setJobs(jobsData)
      setWorkProofs(workProofsData)
    } catch (error) {
      console.error("Error refreshing applications:", error)
      toast.error("Failed to refresh applications")
    }
  }

  const handleSubmitWork = (application: JobApplication) => {
    // Implementation for submitting work
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    // Implementation for handling file upload
  }

  const removeScreenshot = (index: number) => {
    // Implementation for removing screenshot
  }

  const addProofLink = () => {
    // Implementation for adding proof link
  }

  const updateProofLink = (index: number, value: string) => {
    // Implementation for updating proof link
  }

  const removeProofLink = (index: number) => {
    // Implementation for removing proof link
  }

  const submitProof = async () => {
    // Implementation for submitting proof
  }

  const handleResubmitWork = async () => {
    if (!selectedRevisionProof || !user?.id) return

    try {
      setSubmittingProof(true)
      console.log("[v0] Resubmitting work for proof:", selectedRevisionProof.id)

      const formData = new FormData()
      const form = document.querySelector("#resubmit-form") as HTMLFormElement
      if (!form) throw new Error("Form not found")

      const workDescription = (form.querySelector('[name="workDescription"]') as HTMLTextAreaElement)?.value || ""
      const proofLinks = (form.querySelector('[name="proofLinks"]') as HTMLTextAreaElement)?.value || ""
      const additionalNotes = (form.querySelector('[name="additionalNotes"]') as HTMLTextAreaElement)?.value || ""

      if (!workDescription.trim()) {
        toast.error("Please provide a work description")
        return
      }

      const { resubmitWork } = await import("@/lib/work-proofs")
      await resubmitWork(selectedRevisionProof.id, {
        description: workDescription,
        proofLinks: proofLinks.split("\n").filter((link) => link.trim()),
        additionalNotes,
        proofFiles: [],
      })

      toast.success("Work resubmitted successfully!")
      setResubmitModalOpen(false)
      setSelectedRevisionProof(null)
      await refreshApplications()
    } catch (error) {
      console.error("Error resubmitting work:", error)
      toast.error("Failed to resubmit work")
    } finally {
      setSubmittingProof(false)
    }
  }

  const handleViewSubmission = (application: JobApplication) => {
    const jobProofs = workProofs[application.jobId] || []
    const userProof = jobProofs.find((proof) => proof.applicationId === application.id)

    if (userProof) {
      setSelectedWorkProof(userProof)
      setViewSubmissionModalOpen(true)
    } else {
      toast.error("No work submission found for this application")
    }
  }

  const getStatusDisplay = (status: string) => {
    return {
      label: "Waiting",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <Clock className="h-3 w-3" />,
    }
  }

  const getJobStatus = (application: JobApplication): string => {
    const proofs = application.jobId ? workProofs[application.jobId] || [] : []
    const latestProof = proofs[proofs.length - 1]

    if (latestProof) {
      // Check if job was automatically cancelled due to expired deadlines
      if (latestProof.status === "cancelled_by_worker") {
        return "auto_cancelled"
      }
      // Check if rejection was automatically accepted (refunded)
      if (latestProof.status === "rejected_accepted") {
        return "auto_refunded"
      }
      return latestProof.status
    }

    return application.status
  }

  const handleViewApplication = (application: JobApplication) => {
    setSelectedApplication(application)
    setViewApplicationModalOpen(true)
  }

  const getFilteredAndSortedApplications = () => {
    let filtered = applications

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((app) => {
        const job = jobs[app.jobId]
        return (
          job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job?.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => getJobStatus(app) === statusFilter)
    }

    // Sort by priority: action needed first, then by date
    return filtered.sort((a, b) => {
      const statusA = getJobStatus(a)
      const statusB = getJobStatus(b)

      // Priority order: rejected, revision_requested, ready, then others
      const priorityOrder = {
        rejected: 1,
        revision_requested: 2,
        ready: 3,
        submitted: 4,
        completed: 5,
        disputed: 6,
        auto_cancelled: 7,
        auto_refunded: 8,
        waiting: 9,
      }

      const priorityA = priorityOrder[statusA as keyof typeof priorityOrder] || 10
      const priorityB = priorityOrder[statusB as keyof typeof priorityOrder] || 10

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      // If same priority, sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  const filteredApplications = getFilteredAndSortedApplications()
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage)

  const readyJobs = applications.filter((app) => getJobStatus(app) === "ready")
  const submittedJobs = applications.filter((app) => getJobStatus(app) === "submitted")
  const completedJobs = applications.filter((app) => getJobStatus(app) === "completed")
  const waitingJobs = applications.filter((app) => getJobStatus(app) === "waiting")
  const revisionJobs = applications.filter((app) => getJobStatus(app) === "revision_requested")
  const rejectedJobs = applications.filter((app) => getJobStatus(app) === "rejected")
  const disputedJobs = applications.filter((app) => getJobStatus(app) === "disputed")
  const autoCancelledJobs = applications.filter((app) => getJobStatus(app) === "auto_cancelled")
  const autoRefundedJobs = applications.filter((app) => getJobStatus(app) === "auto_refunded")

  const renderApplicationCard = (application: JobApplication) => {
    const job = application.job || jobs[application.jobId]
    if (!job) return null

    const jobProofs = workProofs[application.jobId] || []
    const userProof = jobProofs.find((proof) => proof.applicationId === application.id)
    const status = userProof?.status || application.status

    const getCountdownDisplay = (proof: WorkProof) => {
      const countdown = countdowns[proof.id]
      if (!countdown) return null

      const isExpired = countdown === "EXPIRED"
      const isUrgent = countdown.includes("m") && !countdown.includes("h")

      return (
        <div
          className={`p-3 rounded-lg border-2 ${
            isExpired
              ? "bg-red-100 border-red-300"
              : isUrgent
                ? "bg-orange-100 border-orange-300"
                : "bg-yellow-100 border-yellow-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Timer
              className={`h-4 w-4 ${isExpired ? "text-red-600" : isUrgent ? "text-orange-600" : "text-yellow-600"}`}
            />
            <span
              className={`font-semibold ${
                isExpired ? "text-red-800" : isUrgent ? "text-orange-800" : "text-yellow-800"
              }`}
            >
              {isExpired ? "⚠️ DEADLINE EXPIRED - ACTION REQUIRED!" : `⏰ ${countdown}`}
            </span>
          </div>
          {isExpired && (
            <p className="text-sm text-red-700 mt-1">
              You must take action now or the system will auto-process this request.
            </p>
          )}
        </div>
      )
    }

    return (
      <Card key={application.id} className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">{job.title}</span>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewApplication(application)}
                className="h-7 text-xs px-3"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              Applied {new Date(application.createdAt).toLocaleDateString()}
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">{job?.description}</p>

          {status === "rejected" && userProof && (
            <div className="space-y-3">
              {getCountdownDisplay(userProof)}

              <div className="flex items-center space-x-2 p-3 bg-red-50 rounded text-sm text-red-800">
                <XCircle className="h-4 w-4" />
                <span>
                  Work rejected - You have{" "}
                  {formatTimeDisplay(
                    revisionSettings?.rejectionResponseTimeoutValue || 24,
                    revisionSettings?.rejectionResponseTimeoutUnit || "hours",
                  )}{" "}
                  to respond
                </span>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">⚠️ Important Warning</p>
                    <p>
                      Filing false disputes or submitting fake work may result in account suspension and penalty fees.
                      Only dispute if you genuinely believe your work met the requirements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleRejectionResponse(userProof)}
                  size="sm"
                  className="h-7 text-xs px-3 bg-red-600 hover:bg-red-700"
                >
                  Respond to Rejection
                </Button>
              </div>
            </div>
          )}

          {status === "revision_requested" && userProof && (
            <div className="space-y-3">
              {getCountdownDisplay(userProof)}

              <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded text-sm text-yellow-800">
                <RefreshCw className="h-4 w-4" />
                <span>
                  Revision requested - You have{" "}
                  {formatTimeDisplay(
                    revisionSettings?.revisionRequestTimeoutValue || 24,
                    revisionSettings?.revisionRequestTimeoutUnit || "hours",
                  )}{" "}
                  to resubmit
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Revision Guidelines</p>
                    <p>
                      Employers can request up to {revisionSettings?.maxRevisionRequests || 2} revisions maximum. If you
                      don't resubmit within{" "}
                      {formatTimeDisplay(
                        revisionSettings?.revisionRequestTimeoutValue || 24,
                        revisionSettings?.revisionRequestTimeoutUnit || "hours",
                      )}
                      , the job will be automatically cancelled with a refund to the employer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleRevisionResubmit(userProof)}
                  size="sm"
                  className="h-7 text-xs px-3 bg-yellow-600 hover:bg-yellow-700"
                >
                  Resubmit Work
                </Button>
                <Button
                  onClick={() => handleCancelJob(userProof.id)}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-3 bg-transparent"
                >
                  Cancel Job
                </Button>
              </div>
            </div>
          )}

          {status === "auto_cancelled" && userProof && (
            <div className="space-y-3">{renderDeadlineWarning(userProof)}</div>
          )}

          {status === "auto_refunded" && userProof && (
            <div className="space-y-3">{renderDeadlineWarning(userProof)}</div>
          )}
        </CardContent>
      </Card>
    )
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "ready":
        return "Ready to Work"
      case "submitted":
        return "Under Review"
      case "approved":
      case "auto_approved":
        return "Completed"
      case "rejected":
        return "Action Required"
      case "revision_requested":
        return "Revision Needed"
      case "rejected_accepted":
        return "Rejection Accepted"
      case "disputed":
        return "Under Dispute"
      case "cancelled_by_worker":
        return "Cancelled"
      case "auto_cancelled":
        return "Auto-Cancelled"
      case "auto_refunded":
        return "Auto-Refunded"
      default:
        return "Waiting"
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "ready":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg shadow-blue-200 font-semibold px-3 py-1.5 animate-pulse"
      case "submitted":
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg shadow-purple-200 font-semibold px-3 py-1.5"
      case "approved":
      case "auto_approved":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg shadow-green-200 font-semibold px-3 py-1.5 ring-2 ring-green-300"
      case "rejected":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg shadow-red-200 font-semibold px-3 py-1.5 animate-bounce"
      case "revision_requested":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-500 shadow-lg shadow-yellow-200 font-semibold px-3 py-1.5 ring-2 ring-yellow-300"
      case "rejected_accepted":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-500 shadow-lg shadow-gray-200 font-semibold px-3 py-1.5"
      case "disputed":
        return "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-500 shadow-lg shadow-orange-200 font-semibold px-3 py-1.5 ring-2 ring-orange-300 animate-pulse"
      case "cancelled_by_worker":
        return "bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-lg shadow-slate-200 font-semibold px-3 py-1.5"
      case "auto_cancelled":
        return "bg-green-100 text-green-800 border-green-300"
      case "auto_refunded":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-400 shadow-lg shadow-gray-200 font-semibold px-3 py-1.5"
    }
  }

  const renderDeadlineWarning = (proof: WorkProof) => {
    const countdown = countdowns[proof.id]
    if (!countdown) return null

    const isAutoProcessed = countdown === "AUTO_PROCESSED"
    const isExpired = countdown === "EXPIRED"
    const isUrgent = countdown.includes("m") && !countdown.includes("h")

    if (isAutoProcessed) {
      return (
        <div className="p-3 rounded-lg border-2 bg-green-100 border-green-300">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-800">✅ AUTO-PROCESSED - REFUND ISSUED</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This request was automatically processed and refunded due to deadline expiration.
          </p>
        </div>
      )
    }

    return null
  }

  const formatTimeDisplay = (value: number, unit: string): string => {
    if (unit === "hours") {
      return `${value} hours`
    } else if (unit === "days") {
      return `${value} days`
    } else {
      return `${value} ${unit}`
    }
  }

  useEffect(() => {
    const loadRevisionSettings = async () => {
      try {
        const settings = await getRevisionSettingsFromAPI()
        setRevisionSettings(settings)
        console.log("[v0] Loaded revision settings from API in applied jobs:", settings)
      } catch (error) {
        console.error("Failed to load revision settings in applied jobs:", error)
        // Set default settings if API fails
        setRevisionSettings({
          maxRevisionRequests: 2,
          revisionRequestTimeoutValue: 24,
          revisionRequestTimeoutUnit: "hours",
          rejectionResponseTimeoutValue: 24,
          rejectionResponseTimeoutUnit: "hours",
          enableAutomaticRefunds: true,
          refundOnRevisionTimeout: true,
          refundOnRejectionTimeout: true,
          enableRevisionWarnings: true,
          revisionPenaltyEnabled: false,
          revisionPenaltyAmount: 0,
        })
      }
    }

    loadRevisionSettings()
  }, [])

  if (loading) {
    return (
      <>
        <DashboardHeader title="My Jobs" description="Track your work and earnings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your jobs...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Applied Jobs" description="Track your job applications and submissions" />

      <div className="flex-1 overflow-auto p-6">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applied Jobs Yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't applied to any jobs yet. Start browsing available jobs to find work opportunities.
            </p>
            <Button onClick={() => (window.location.href = "/jobs")} className="bg-blue-600 hover:bg-blue-700">
              Browse Jobs
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-64"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <Select onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ready">Ready to Work</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revision_requested">Revision Requested</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                    <SelectItem value="auto_cancelled">Auto-Cancelled</SelectItem>
                    <SelectItem value="auto_refunded">Auto-Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredApplications.length)} of{" "}
                {filteredApplications.length} applications
              </div>
              <div className="text-sm text-gray-500">Action needed items shown first</div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {paginatedApplications.map((application) => renderApplicationCard(application))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(page)
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {autoCancelledJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Auto-Cancelled Jobs ({autoCancelledJobs.length})
                </h3>
                <div className="grid gap-4">
                  {autoCancelledJobs.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-md transition-shadow bg-green-100 text-green-800"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{jobs[application.jobId]?.title}</span>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Auto-Cancelled - Refunded
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{jobs[application.jobId]?.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {autoRefundedJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Auto-Refunded Jobs ({autoRefundedJobs.length})
                </h3>
                <div className="grid gap-4">
                  {autoRefundedJobs.map((application) => (
                    <Card
                      key={application.id}
                      className="hover:shadow-md transition-shadow bg-green-100 text-green-800"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{jobs[application.jobId]?.title}</span>
                          <Badge className="bg-green-100 text-green-800 border-green-300">Auto-Refunded</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{jobs[application.jobId]?.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={viewApplicationModalOpen} onOpenChange={setViewApplicationModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-6">
                {/* Job Applied For */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Job Applied For</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Title:</span>{" "}
                        {jobs[selectedApplication.jobId]?.title || "Loading..."}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>{" "}
                        {jobs[selectedApplication.jobId]?.description || "Loading..."}
                      </div>
                      <div>
                        <span className="font-medium">Budget:</span> ${jobs[selectedApplication.jobId]?.budget || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Applied Date:</span>{" "}
                        {new Date(selectedApplication.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* What You Applied With */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">What You Applied With</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <span className="font-medium">Cover Letter:</span>
                      <div className="mt-1 p-3 bg-white rounded border">
                        {selectedApplication.coverLetter || "No cover letter provided"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Proposed Budget:</span> ${selectedApplication.proposedBudget}
                    </div>
                    <div>
                      <span className="font-medium">Estimated Duration:</span>{" "}
                      {selectedApplication.estimatedDuration || "undefined days"}
                    </div>
                  </div>
                </div>

                {/* Work Submissions */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Work Submissions</h3>
                  {(() => {
                    const jobProofs = workProofs[selectedApplication.jobId] || []
                    const userProof = jobProofs.find((proof) => proof.applicationId === selectedApplication.id)

                    if (!userProof) {
                      return (
                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">No work submitted yet</div>
                      )
                    }

                    return (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        {/* Work Description */}
                        {userProof.description && (
                          <div>
                            <span className="font-medium">Work Description:</span>
                            <div className="mt-1 p-3 bg-white rounded border">{userProof.description}</div>
                          </div>
                        )}

                        {/* Screenshots Gallery */}
                        {userProof.screenshots && userProof.screenshots.length > 0 && (
                          <div>
                            <span className="font-medium">Screenshots ({userProof.screenshots.length}):</span>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {userProof.screenshots.map((screenshot, index) => {
                                let screenshotData = null

                                try {
                                  // Process screenshot data similar to enhanced modal
                                  if (typeof screenshot === "string" && screenshot.startsWith("data:")) {
                                    screenshotData = screenshot
                                  } else if (typeof screenshot === "string" && screenshot.includes("{")) {
                                    const parsed = JSON.parse(screenshot)
                                    if (parsed.data && parsed.data.startsWith("data:")) {
                                      screenshotData = parsed.data
                                    }
                                  } else if (
                                    typeof screenshot === "object" &&
                                    screenshot?.data?.startsWith?.("data:")
                                  ) {
                                    screenshotData = screenshot.data
                                  }
                                } catch (error) {
                                  console.error(`Failed to parse screenshot ${index}:`, error)
                                }

                                if (!screenshotData) return null

                                return (
                                  <div
                                    key={index}
                                    className="bg-white rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
                                  >
                                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                      <img
                                        src={screenshotData || "/placeholder.svg"}
                                        alt={`Screenshot ${index + 1}`}
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => {
                                          // Open in new tab for full view
                                          const newWindow = window.open()
                                          if (newWindow) {
                                            newWindow.document.write(
                                              `<img src="${screenshotData}" style="max-width:100%;height:auto;" />`,
                                            )
                                          }
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "/placeholder.svg?height=150&width=200&text=Failed+to+Load"
                                        }}
                                      />
                                    </div>
                                    <div className="p-2">
                                      <span className="text-xs text-gray-600">Screenshot {index + 1}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Proof Files */}
                        {userProof.proofFiles && userProof.proofFiles.length > 0 && (
                          <div>
                            <span className="font-medium">Attached Files ({userProof.proofFiles.length}):</span>
                            <div className="mt-2 space-y-2">
                              {userProof.proofFiles.map((file: any, index: number) => {
                                try {
                                  const fileData = typeof file === "string" ? JSON.parse(file) : file
                                  if (fileData.data && fileData.name) {
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center space-x-2 p-2 bg-white rounded border"
                                      >
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <a
                                          href={fileData.data}
                                          download={fileData.name}
                                          className="text-blue-600 hover:underline text-sm"
                                        >
                                          {fileData.name}
                                        </a>
                                      </div>
                                    )
                                  }
                                } catch (error) {
                                  console.error("Failed to parse file:", error)
                                }
                                return null
                              })}
                            </div>
                          </div>
                        )}

                        {/* Proof Links */}
                        {userProof.proofLinks && userProof.proofLinks.length > 0 && (
                          <div>
                            <span className="font-medium">Proof Links:</span>
                            <div className="mt-2 space-y-2">
                              {userProof.proofLinks.map((link, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <ExternalLink className="h-4 w-4 text-blue-500" />
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm break-all"
                                  >
                                    {link}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Notes */}
                        {userProof.additionalNotes && (
                          <div>
                            <span className="font-medium">Additional Notes:</span>
                            <div className="mt-1 p-3 bg-white rounded border">{userProof.additionalNotes}</div>
                          </div>
                        )}

                        {/* Submission Status */}
                        <div>
                          <span className="font-medium">Status:</span>
                          <Badge className={`ml-2 ${getStatusColor(userProof.status)}`}>
                            {getStatusLabel(userProof.status)}
                          </Badge>
                        </div>

                        {/* Submission Date */}
                        <div>
                          <span className="font-medium">Submitted:</span>
                          <span className="ml-2 text-gray-600">{new Date(userProof.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Enhanced Rejection Response Modal */}
        <Dialog open={rejectionResponseModalOpen} onOpenChange={setRejectionResponseModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Work Rejected - Choose Your Response</DialogTitle>
              <p className="text-sm text-gray-600">
                {selectedRejectedProof && revisionSettings
                  ? `Your work was rejected. You have ${revisionSettings.rejectionResponseTimeoutValue} ${revisionSettings.rejectionResponseTimeoutUnit} to respond or it will be automatically accepted.`
                  : "Your work was rejected. You have 24 hours to respond or it will be automatically accepted."}
              </p>
            </DialogHeader>

            {selectedRejectedProof && (
              <div className="space-y-4">
                {countdowns[selectedRejectedProof.id] && (
                  <div
                    className={`p-3 rounded-lg border-2 ${
                      countdowns[selectedRejectedProof.id] === "EXPIRED"
                        ? "bg-red-100 border-red-300"
                        : countdowns[selectedRejectedProof.id].includes("m") &&
                            !countdowns[selectedRejectedProof.id].includes("h")
                          ? "bg-orange-100 border-orange-300"
                          : "bg-yellow-100 border-yellow-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Timer
                        className={`h-4 w-4 ${
                          countdowns[selectedRejectedProof.id] === "EXPIRED"
                            ? "text-red-600"
                            : countdowns[selectedRejectedProof.id].includes("m") &&
                                !countdowns[selectedRejectedProof.id].includes("h")
                              ? "text-orange-600"
                              : "text-yellow-600"
                        }`}
                      />
                      <span
                        className={`font-semibold ${countdowns[selectedRejectedProof.id] === "EXPIRED" ? "text-red-800" : countdowns[selectedRejectedProof.id].includes("m") && !countdowns[selectedRejectedProof.id].includes("h") ? "text-orange-800" : "text-yellow-800"}`}
                      >
                        {countdowns[selectedRejectedProof.id] === "EXPIRED"
                          ? "⚠️ DEADLINE EXPIRED - CHOOSE NOW!"
                          : `⏰ ${countdowns[selectedRejectedProof.id]} to respond`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-red-900">Rejection Details</h4>
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Job:</strong> {selectedRejectedProof.title}
                  </p>
                  <p className="text-sm text-red-800">
                    <strong>Reason:</strong> {selectedRejectedProof.rejectionReason}
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="secondary" onClick={() => setRejectionResponseModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setDisputeModalOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                    File a Dispute
                  </Button>
                  <Button onClick={handleAcceptRejection} className="bg-green-500 hover:bg-green-600">
                    Accept Rejection
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dispute Submission Modal */}
        <Dialog open={disputeModalOpen} onOpenChange={setDisputeModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>File a Dispute</DialogTitle>
              <p className="text-gray-500">Explain why you disagree with the rejection.</p>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Dispute</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you believe the rejection is unfair..."
                  value={disputeSubmission.reason}
                  onChange={(e) => setDisputeSubmission({ ...disputeSubmission, reason: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="requestedAction">Requested Action</Label>
                <Select
                  onValueChange={(value) =>
                    setDisputeSubmission({ ...disputeSubmission, requestedAction: value as "payment" })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Request Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Request Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" variant="secondary" onClick={() => setDisputeModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDispute} className="bg-blue-500 hover:bg-blue-600">
                Submit Dispute
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resubmit Work Modal */}
        <Dialog open={resubmitModalOpen} onOpenChange={setResubmitModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resubmit Work</DialogTitle>
              <p className="text-gray-500">Make the necessary revisions and resubmit your work.</p>
            </DialogHeader>

            {selectedRevisionProof && (
              <form id="resubmit-form" className="space-y-4">
                <div>
                  <Label htmlFor="workDescription">Work Description</Label>
                  <Textarea
                    id="workDescription"
                    name="workDescription"
                    placeholder="Describe the changes you've made..."
                    defaultValue={selectedRevisionProof.description}
                  />
                </div>

                <div>
                  <Label htmlFor="proofLinks">Proof Links</Label>
                  <Textarea
                    id="proofLinks"
                    name="proofLinks"
                    placeholder="Add links to your updated work (one link per line)"
                    defaultValue={selectedRevisionProof.proofLinks?.join("\n")}
                  />
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    placeholder="Any additional notes for the employer?"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="secondary" onClick={() => setResubmitModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResubmitWork}
                    disabled={submittingProof}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {submittingProof ? "Submitting..." : "Resubmit Work"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

export default AppliedJobsPage

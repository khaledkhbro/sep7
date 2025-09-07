"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Eye,
  Edit,
  Pause,
  Play,
  RefreshCw,
  FileText,
  AlertTriangle,
  Trash2,
  Users,
  Search,
  Filter,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  getUserJobs,
  pauseJob,
  reactivateJob,
  toggleJobOn,
  toggleJobOff,
  getJobStatusColor,
  getJobStatusLabel,
  JOB_STATUS,
  type Job,
} from "@/lib/jobs"
import type { WorkProof } from "@/lib/work-proofs"
import WorkProofModal from "@/components/work-proofs/work-proof-modal"
import JobCancellationModal from "@/components/jobs/job-cancellation-modal"
import { Label } from "@/components/ui/label"
import { getWorkProofsByJob } from "@/lib/work-proofs"

interface ConfirmationDialog {
  isOpen: boolean
  title: string
  description: string
  action: () => void
  actionLabel: string
  variant: "default" | "destructive"
}

export default function JobsPage() {
  const [userJobs, setUserJobs] = useState<Job[]>([])
  const [jobWorkProofs, setJobWorkProofs] = useState<Record<string, WorkProof[]>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedJobProofs, setSelectedJobProofs] = useState<WorkProof[]>([])
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false)
  const [selectedJobForCancellation, setSelectedJobForCancellation] = useState<Job | null>(null)
  const [workerUpdateModalOpen, setWorkerUpdateModalOpen] = useState(false)
  const [selectedJobForWorkerUpdate, setSelectedJobForWorkerUpdate] = useState<Job | null>(null)
  const [newWorkerCount, setNewWorkerCount] = useState<number>(1)
  const [jobVisibility, setJobVisibility] = useState<Record<string, boolean>>({})
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false)
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {},
    actionLabel: "",
    variant: "default",
  })
  const { user } = useAuth()
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const fetchUserJobs = async () => {
      if (!user?.id) {
        console.log("[v0] No user ID available")
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Loading user jobs for:", user.id)
        const jobs = await getUserJobs(user.id)
        console.log("[v0] Loaded user jobs:", jobs.length, "jobs")
        console.log(
          "[v0] User jobs details:",
          jobs.map((j) => ({ id: j.id, title: j.title, userId: j.userId, status: j.status })),
        )
        setUserJobs(jobs)

        const workProofsData: Record<string, WorkProof[]> = {}
        for (const job of jobs) {
          try {
            const proofs = await getWorkProofsByJob(job.id)
            workProofsData[job.id] = proofs
            console.log(`[v0] Loaded ${proofs.length} work proofs for job ${job.id}`)
          } catch (error) {
            console.error(`[v0] Error loading work proofs for job ${job.id}:`, error)
            workProofsData[job.id] = []
          }
        }
        setJobWorkProofs(workProofsData)

        const initialVisibility: Record<string, boolean> = {}
        jobs.forEach((job) => {
          const savedVisibility = localStorage.getItem(`job_visibility_${job.id}`)
          initialVisibility[job.id] = savedVisibility !== null ? savedVisibility === "true" : true
        })
        setJobVisibility(initialVisibility)
      } catch (error) {
        console.error("[v0] Error loading user jobs:", error)
        toast.error("Failed to load your jobs")
      } finally {
        setLoading(false)
      }
    }

    fetchUserJobs()
  }, [user?.id])

  const handlePauseJob = async (jobId: string, jobTitle: string) => {
    showConfirmDialog(
      "Pause Job",
      `Are you sure you want to pause "${jobTitle}"? This will temporarily remove it from the marketplace and stop accepting new applications.`,
      async () => {
        if (!user?.id) return
        setActionLoading(jobId)
        try {
          await pauseJob(jobId, user.id)
          toast.success("Job paused successfully")
          await refreshJobs()
        } catch (error) {
          console.error("Error pausing job:", error)
          toast.error("Failed to pause job")
        } finally {
          setActionLoading(null)
        }
      },
      "Pause Job",
      "default",
    )
  }

  const handleCancelJob = async (job: Job) => {
    if (job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED) {
      console.log("[v0] Cannot cancel job that is already cancelled or rejected:", job.id)
      return
    }

    setSelectedJobForCancellation(job)
    setCancellationModalOpen(true)
  }

  const handleReactivateJob = async (jobId: string, jobTitle: string) => {
    showConfirmDialog(
      "Reactivate Job",
      `Reactivate "${jobTitle}"? The job will be submitted for admin review and will go live once approved.`,
      async () => {
        if (!user?.id) return
        setActionLoading(jobId)
        try {
          await reactivateJob(jobId, user.id)
          toast.success("Job reactivated and submitted for review")
          await refreshJobs()
        } catch (error) {
          console.error("Error reactivating job:", error)
          toast.error("Failed to reactivate job")
        } finally {
          setActionLoading(null)
        }
      },
      "Reactivate Job",
      "default",
    )
  }

  const handleEditJob = (jobId: string) => {
    router.push(`/dashboard/jobs/edit/${jobId}`)
  }

  const handleViewApplications = (jobId: string) => {
    router.push(`/dashboard/jobs/${jobId}/applications`)
  }

  const handleDuplicateJob = (jobId: string) => {
    router.push(`/dashboard/jobs/create?duplicate=${jobId}`)
    toast.success("Job template loaded for duplication")
  }

  const getJobsByStatus = (status?: string) => {
    if (!status || status === "all") return userJobs
    return userJobs.filter((job) => job.status === status)
  }

  const getStatusStats = () => {
    return {
      pending: userJobs.filter((job) => job.status === JOB_STATUS.PENDING).length,
      open: userJobs.filter((job) => job.status === JOB_STATUS.OPEN).length,
      inProgress: userJobs.filter((job) => job.status === JOB_STATUS.IN_PROGRESS).length,
      completed: userJobs.filter((job) => job.status === JOB_STATUS.COMPLETED).length,
      paused: userJobs.filter((job) => job.status === JOB_STATUS.SUSPENDED).length,
      cancelled: userJobs.filter((job) => job.status === JOB_STATUS.CANCELLED).length,
      rejected: userJobs.filter((job) => job.status === JOB_STATUS.REJECTED).length,
      approved: userJobs.filter((job) => job.status === JOB_STATUS.APPROVED).length,
    }
  }

  const getFilteredAndSortedJobs = () => {
    const filtered = userJobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      return matchesSearch && matchesStatus
    })

    // Sort jobs
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Job]
      let bValue = b[sortBy as keyof Job]

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }

  const filteredJobs = getFilteredAndSortedJobs()
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleViewProof = async (jobId: string) => {
    // Navigate to dedicated work proof page instead of modal
    router.push(`/dashboard/jobs/${jobId}/work-proofs`)
  }

  const getJobProgress = (job: Job): number => {
    console.log(
      "[v0] Calculating progress for job:",
      job.title,
      "Status:",
      job.status,
      "Workers needed:",
      job.workersNeeded,
      "Applications:",
      job.applicationsCount,
    )

    const workersNeeded = job.workersNeeded || 1
    let completedWork = 0

    // For cancelled/rejected jobs, show progress based on all submitted work proofs before cancellation
    if (job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED) {
      const workProofs =
        jobWorkProofs[job.id]?.filter((proof) =>
          ["submitted", "approved", "auto_approved", "revision_requested", "rejected"].includes(proof.status),
        ) || []
      completedWork = workProofs.length
    } else if (job.status === JOB_STATUS.APPROVED) {
      const workProofs =
        jobWorkProofs[job.id]?.filter((proof) =>
          ["submitted", "approved", "auto_approved", "revision_requested", "rejected"].includes(proof.status),
        ) || []
      completedWork = workProofs.length
    } else {
      completedWork = job.applicationsCount || 0
    }

    const progress = Math.min((completedWork / workersNeeded) * 100, 100)
    const finalProgress = Math.round(progress)
    console.log("[v0] Final progress for", job.title, ":", finalProgress, "%")
    return finalProgress
  }

  const handleToggleJobOn = async (jobId: string, jobTitle: string) => {
    setActionLoading(jobId)
    try {
      await toggleJobOn(jobId, user!.id)
      toast.success(`"${jobTitle}" is now live and accepting applications!`)
      await refreshJobs()
    } catch (error) {
      console.error("Error turning job on:", error)
      toast.error("Failed to turn job on")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleJobOff = async (jobId: string, jobTitle: string) => {
    setActionLoading(jobId)
    try {
      await toggleJobOff(jobId, user!.id)
      toast.success(`"${jobTitle}" is now paused and not accepting applications`)
      await refreshJobs()
    } catch (error) {
      console.error("Error turning job off:", error)
      toast.error("Failed to turn job off")
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateWorkers = (job: Job) => {
    setSelectedJobForWorkerUpdate(job)
    setNewWorkerCount(job.workersNeeded || 1)
    setWorkerUpdateModalOpen(true)
  }

  const handleWorkerCountUpdate = async (newWorkerCount: number) => {
    if (!selectedJobForWorkerUpdate || !user?.id) return

    setActionLoading("update-workers")
    try {
      console.log("[v0] 👥 Updating worker count via API:", {
        jobId: selectedJobForWorkerUpdate.id,
        newWorkerCount,
        userId: user.id,
      })

      const response = await fetch("/api/jobs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: selectedJobForWorkerUpdate.id,
          newWorkerCount,
          userId: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update worker count")
      }

      console.log("[v0] ✅ Worker count updated successfully:", result)

      toast.success(result.message || "Worker count updated successfully")
      setWorkerUpdateModalOpen(false)

      await refreshJobs()
    } catch (error) {
      console.error("[v0] ❌ Error updating worker count:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update worker count")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleJobVisibility = async (jobId: string, jobTitle: string, currentVisibility: boolean) => {
    const newVisibility = !currentVisibility
    setJobVisibility((prev) => ({ ...prev, [jobId]: newVisibility }))

    localStorage.setItem(`job_visibility_${jobId}`, newVisibility.toString())

    toast.success(
      newVisibility
        ? `"${jobTitle}" is now visible on your dashboard`
        : `"${jobTitle}" is now hidden from your dashboard`,
    )
  }

  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job)
    setJobDetailsModalOpen(true)
  }

  const refreshJobs = async () => {
    if (!user?.id) return

    try {
      console.log("[v0] Refreshing jobs for user:", user.id)
      const updatedJobs = await getUserJobs(user.id)
      console.log("[v0] Refreshed jobs count:", updatedJobs.length)

      const hasChanges =
        userJobs.length !== updatedJobs.length ||
        updatedJobs.some((updatedJob) => {
          const currentJob = userJobs.find((j) => j.id === updatedJob.id)
          return (
            !currentJob ||
            currentJob.workersNeeded !== updatedJob.workersNeeded ||
            currentJob.status !== updatedJob.status ||
            currentJob.estimatedTotalCost !== updatedJob.estimatedTotalCost
          )
        })

      if (hasChanges) {
        console.log("[v0] Changes detected, updating jobs data")
        setUserJobs(updatedJobs)

        const workProofsData: Record<string, WorkProof[]> = {}
        for (const job of updatedJobs) {
          try {
            console.log(`[v0] Loading work proofs for job: ${job.id}`)
            const proofs = await getWorkProofsByJob(job.id)
            workProofsData[job.id] = proofs
            console.log(`[v0] Found work proofs for job ${job.id} :`, proofs)
          } catch (error) {
            console.error(`[v0] Error refreshing work proofs for job ${job.id}:`, error)
            workProofsData[job.id] = []
          }
        }
        setJobWorkProofs(workProofsData)
        console.log("[v0] Jobs data updated")
      } else {
        console.log("[v0] No changes detected, skipping state update")
      }
    } catch (error) {
      console.error("[v0] Error refreshing jobs:", error)
      toast.error("Failed to refresh jobs")
    }
  }

  const showConfirmDialog = (
    title: string,
    description: string,
    action: () => void,
    actionLabel: string,
    variant: "default" | "destructive" = "default",
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action,
      actionLabel,
      variant,
    })
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const startInterval = () => {
      intervalId = setInterval(() => {
        if (user?.id && !actionLoading) {
          refreshJobs()
        }
      }, 30000) // Refresh every 30 seconds only when not performing actions
    }

    if (user?.id) {
      startInterval()
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user?.id, actionLoading])

  const getJobWorkProofCounts = (jobId: string) => {
    const proofs = jobWorkProofs[jobId] || []
    const job = userJobs.find((j) => j.id === jobId)

    return {
      pending: proofs.filter((proof) => proof.status === "submitted" || proof.status === "pending").length,
      approved: proofs.filter((proof) => {
        // Count manually approved proofs
        if (proof.status === "approved") return true

        // Count auto-approved proofs
        if (proof.status === "auto_approved") return true

        // Count submitted proofs with expired deadlines (should be auto-approved)
        if (proof.status === "submitted" && job && job.approvalType === "manual") {
          const submittedAt = new Date(proof.submittedAt)
          const approvalDays = job.manualApprovalDays || 3
          const deadlineDate = new Date(submittedAt.getTime() + approvalDays * 24 * 60 * 60 * 1000)
          const now = new Date()

          if (now > deadlineDate) return true
        }

        return false
      }).length,
      rejected: proofs.filter((proof) => proof.status === "rejected").length,
    }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <>
        <DashboardHeader title="My Jobs" description="Manage your posted jobs and track applications" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your jobs...</p>
          </div>
        </div>
      </>
    )
  }

  if (!user?.id) {
    return (
      <>
        <DashboardHeader title="My Jobs" description="Manage your posted jobs and track applications" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Please log in to view your jobs</p>
            <Link href="/login">
              <Button className="mt-4">Go to Login</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="My Jobs" description="Manage your posted jobs and track applications" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
              <p className="text-gray-600">Track and manage your {userJobs.length} job postings</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={refreshJobs} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Link href="/dashboard/jobs/create">
                <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-bold px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="relative z-10">Post New Job</span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{userJobs.length}</div>
                <div className="text-sm text-blue-600">Total Jobs</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.open}</div>
                <div className="text-sm text-green-600">Open</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
                <div className="text-sm text-blue-600">Active</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{stats.paused}</div>
                <div className="text-sm text-gray-600">Paused</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{stats.completed}</div>
                <div className="text-sm text-purple-600">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.cancelled + stats.rejected}</div>
                <div className="text-sm text-red-600">Inactive</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
                <div className="text-sm text-green-600">Approved</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Job Listings</CardTitle>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
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
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Job Name</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900">Work Proofs</TableHead>
                      <TableHead className="font-semibold text-gray-900">Total Cost Paid</TableHead>
                      <TableHead className="font-semibold text-gray-900">Progress</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-mono"
                              >
                                #{job.formattedJobId || job.jobNumber?.toString().padStart(3, "0") || "N/A"}
                              </Badge>
                              <div className="font-medium text-gray-900">{job.title}</div>
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">{job.description}</div>
                            <div className="text-xs text-gray-400">
                              {job.applicationsCount} applications • {job.viewsCount} views
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getJobStatusColor(job.status)}>{getJobStatusLabel(job.status)}</Badge>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleViewProof(job.id)}
                              className="w-full justify-start relative overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                              size="sm"
                            >
                              {/* Animated background overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                              {/* Pulsing dot indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg"></div>

                              <FileText className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                              <span className="font-semibold">View Submissions</span>
                              <ExternalLink className="h-3 w-3 ml-auto group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />

                              {/* Glowing border effect */}
                              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 blur-sm -z-10 transition-opacity duration-300"></div>
                            </Button>

                            {job.approvalType === "instant" ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                <div className="flex items-center text-xs text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  <span className="font-medium">Instant Approval Enabled</span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                  Workers receive payment immediately upon work submission
                                </p>
                              </div>
                            ) : job.approvalType === "manual" ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                <div className="flex items-center text-xs text-orange-700">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="font-medium">
                                    Manual Approval ({job.manualApprovalDays || 3} days)
                                  </span>
                                </div>
                                <p className="text-xs text-orange-600 mt-1">
                                  Auto-payment if not reviewed within deadline
                                </p>
                              </div>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="flex items-center text-xs text-blue-700">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span className="font-medium">Standard Review Process</span>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">Manual review and approval required</p>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center text-blue-600">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Pending: {getJobWorkProofCounts(job.id).pending}</span>
                              </div>
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>Approved: {getJobWorkProofCounts(job.id).approved}</span>
                              </div>
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-3 w-3 mr-1" />
                                <span>Rejected: {getJobWorkProofCounts(job.id).rejected}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-green-600">
                              ${(() => {
                                if (job.estimatedTotalCost) {
                                  return job.estimatedTotalCost.toFixed(2)
                                }

                                if (job.depositDeducted) {
                                  return job.depositDeducted.toFixed(2)
                                }

                                // Calculate the actual total cost step by step
                                const baseJobCost = (job.workersNeeded || 1) * job.budgetMax
                                const screenshotCount = job.requireScreenshots || 0
                                let screenshotCost = 0
                                if (screenshotCount > 0) {
                                  screenshotCost = Math.max(0, screenshotCount - 1) * (baseJobCost * 0.03)
                                }
                                const subtotal = baseJobCost + screenshotCost
                                const platformFee = subtotal * 0.05
                                const totalCost = subtotal + platformFee

                                return totalCost.toFixed(2)
                              })()}
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                              <div className="flex justify-between">
                                <span>Workers:</span>
                                <span>
                                  {job.workersNeeded || 1} × ${job.budgetMax?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Job Cost:</span>
                                <span>${((job.workersNeeded || 1) * job.budgetMax).toFixed(2)}</span>
                              </div>
                              {(job.requireScreenshots || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Screenshot Cost:</span>
                                  <span>
                                    ${(() => {
                                      const baseJobCost = (job.workersNeeded || 1) * job.budgetMax
                                      const screenshotCount = job.requireScreenshots || 0
                                      // Calculate screenshot cost based on the pricing structure
                                      let screenshotCost = 0
                                      if (screenshotCount > 0) {
                                        // First screenshot is free, subsequent ones are 3% of base cost each
                                        screenshotCost = Math.max(0, screenshotCount - 1) * (baseJobCost * 0.03)
                                      }
                                      return screenshotCost.toFixed(2)
                                    })()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Platform fee (5%):</span>
                                <span>
                                  ${(() => {
                                    const baseJobCost = (job.workersNeeded || 1) * job.budgetMax
                                    const screenshotCount = job.requireScreenshots || 0
                                    let screenshotCost = 0
                                    if (screenshotCount > 0) {
                                      screenshotCost = Math.max(0, screenshotCount - 1) * (baseJobCost * 0.03)
                                    }
                                    const subtotal = baseJobCost + screenshotCost
                                    const platformFee = subtotal * 0.05
                                    return platformFee.toFixed(2)
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold border-t pt-1">
                                <span>Total Paid:</span>
                                <span>
                                  ${(() => {
                                    if (job.estimatedTotalCost) {
                                      return job.estimatedTotalCost.toFixed(2)
                                    }

                                    if (job.depositDeducted) {
                                      return job.depositDeducted.toFixed(2)
                                    }

                                    // Use the same calculation as above for consistency
                                    const baseJobCost = (job.workersNeeded || 1) * job.budgetMax
                                    const screenshotCount = job.requireScreenshots || 0
                                    let screenshotCost = 0
                                    if (screenshotCount > 0) {
                                      screenshotCost = Math.max(0, screenshotCount - 1) * (baseJobCost * 0.03)
                                    }
                                    const subtotal = baseJobCost + screenshotCost
                                    const platformFee = subtotal * 0.05
                                    const totalCost = subtotal + platformFee

                                    return totalCost.toFixed(2)
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-2">
                            <Progress value={getJobProgress(job)} className="h-2" />
                            <div className="text-sm text-gray-600">{getJobProgress(job)}% Complete</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewJobDetails(job)}
                              className="h-8 w-8 p-0"
                              title="View Job Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {jobVisibility[job.id] ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleJobVisibility(job.id, job.title, true)}
                                disabled={
                                  actionLoading === job.id ||
                                  job.status === JOB_STATUS.CANCELLED ||
                                  job.status === JOB_STATUS.REJECTED
                                }
                                className={`h-8 w-8 p-0 ${
                                  job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                }`}
                                title={
                                  job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                    ? "Cannot modify cancelled/rejected jobs"
                                    : "Hide from Dashboard"
                                }
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleJobVisibility(job.id, job.title, false)}
                                disabled={
                                  actionLoading === job.id ||
                                  job.status === JOB_STATUS.CANCELLED ||
                                  job.status === JOB_STATUS.REJECTED
                                }
                                className={`h-8 w-8 p-0 ${
                                  job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                }`}
                                title={
                                  job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                    ? "Cannot modify cancelled/rejected jobs"
                                    : "Show on Dashboard"
                                }
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateWorkers(job)}
                              disabled={job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED}
                              className={`h-8 w-8 p-0 ${
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                              title={
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "Cannot modify cancelled/rejected jobs"
                                  : "Update Worker Count"
                              }
                            >
                              <Users className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelJob(job)}
                              disabled={
                                job.status === JOB_STATUS.CANCELLED ||
                                job.status === JOB_STATUS.REJECTED ||
                                actionLoading === job.id
                              }
                              className={`h-8 w-8 p-0 ${
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              }`}
                              title={
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "Job already cancelled"
                                  : "Cancel Job"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJob(job.id)}
                              disabled={job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED}
                              className={`h-8 w-8 p-0 ${
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "text-gray-400 cursor-not-allowed"
                                  : ""
                              }`}
                              title={
                                job.status === JOB_STATUS.CANCELLED || job.status === JOB_STATUS.REJECTED
                                  ? "Cannot edit cancelled/rejected jobs"
                                  : "Edit Job"
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {filteredJobs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "No jobs match your search criteria"
                      : "You haven't posted any jobs yet"}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Link href="/dashboard/jobs/create">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Job
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <JobCancellationModal
        isOpen={cancellationModalOpen}
        onClose={() => {
          setCancellationModalOpen(false)
          setSelectedJobForCancellation(null)
        }}
        job={selectedJobForCancellation}
        onJobCancelled={refreshJobs}
        userId={user?.id || ""}
      />

      <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">Work Proofs</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report User
              </Button>
            </div>
          </DialogHeader>

          <WorkProofModal
            proofs={selectedJobProofs}
            isOpen={proofModalOpen}
            onClose={() => setProofModalOpen(false)}
            onUpdate={refreshJobs}
            userRole="employer"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, isOpen: open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant}
              onClick={() => {
                confirmDialog.action()
                setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
              }}
            >
              {confirmDialog.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={workerUpdateModalOpen} onOpenChange={setWorkerUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Worker Count</DialogTitle>
            <DialogDescription>
              Add more workers to "{selectedJobForWorkerUpdate?.title}". Additional workers will be charged to your
              deposit balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="worker-count">Number of Workers</Label>
              <Input
                id="worker-count"
                type="number"
                min="1"
                value={newWorkerCount}
                onChange={(e) => setNewWorkerCount(Number.parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>

            {selectedJobForWorkerUpdate && newWorkerCount > (selectedJobForWorkerUpdate.workersNeeded || 1) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 mb-2">Additional Cost</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Additional workers:</span>
                    <span>{newWorkerCount - (selectedJobForWorkerUpdate.workersNeeded || 1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost per worker:</span>
                    <span>${selectedJobForWorkerUpdate.budgetMax}</span>
                  </div>
                  {(selectedJobForWorkerUpdate.requireScreenshots || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Additional screenshot cost:</span>
                      <span>
                        ${(() => {
                          const currentWorkers = selectedJobForWorkerUpdate.workersNeeded || 1
                          const additionalWorkers = newWorkerCount - currentWorkers
                          const costPerWorker = selectedJobForWorkerUpdate.budgetMax

                          // Calculate new total base cost and current base cost
                          const newTotalBaseCost = newWorkerCount * costPerWorker
                          const currentTotalBaseCost = currentWorkers * costPerWorker

                          const screenshotCount = selectedJobForWorkerUpdate.requireScreenshots || 0

                          // Calculate screenshot costs
                          let newScreenshotCost = 0
                          let currentScreenshotCost = 0

                          if (screenshotCount > 0) {
                            // First screenshot free, rest are 3% each
                            newScreenshotCost = Math.max(0, screenshotCount - 1) * (newTotalBaseCost * 0.03)
                            currentScreenshotCost = Math.max(0, screenshotCount - 1) * (currentTotalBaseCost * 0.03)
                          }

                          const additionalScreenshotCost = newScreenshotCost - currentScreenshotCost
                          return additionalScreenshotCost.toFixed(2)
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Platform fee (5%):</span>
                    <span>
                      ${(() => {
                        const currentWorkers = selectedJobForWorkerUpdate.workersNeeded || 1
                        const additionalWorkers = newWorkerCount - currentWorkers
                        const costPerWorker = selectedJobForWorkerUpdate.budgetMax
                        const additionalBaseCost = additionalWorkers * costPerWorker

                        // Calculate additional screenshot cost
                        let additionalScreenshotCost = 0
                        const screenshotCount = selectedJobForWorkerUpdate.requireScreenshots || 0
                        if (screenshotCount > 0) {
                          const newTotalBaseCost = newWorkerCount * costPerWorker
                          const currentTotalBaseCost = currentWorkers * costPerWorker
                          const newScreenshotCost = Math.max(0, screenshotCount - 1) * (newTotalBaseCost * 0.03)
                          const currentScreenshotCost = Math.max(0, screenshotCount - 1) * (currentTotalBaseCost * 0.03)
                          additionalScreenshotCost = newScreenshotCost - currentScreenshotCost
                        }

                        const additionalSubtotal = additionalBaseCost + additionalScreenshotCost
                        const platformFee = additionalSubtotal * 0.05
                        return platformFee.toFixed(2)
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total additional cost:</span>
                    <span>
                      ${(() => {
                        const currentWorkers = selectedJobForWorkerUpdate.workersNeeded || 1
                        const additionalWorkers = newWorkerCount - currentWorkers
                        const costPerWorker = selectedJobForWorkerUpdate.budgetMax
                        const additionalBaseCost = additionalWorkers * costPerWorker

                        // Calculate additional screenshot cost
                        let additionalScreenshotCost = 0
                        const screenshotCount = selectedJobForWorkerUpdate.requireScreenshots || 0
                        if (screenshotCount > 0) {
                          const newTotalBaseCost = newWorkerCount * costPerWorker
                          const currentTotalBaseCost = currentWorkers * costPerWorker
                          const newScreenshotCost = Math.max(0, screenshotCount - 1) * (newTotalBaseCost * 0.03)
                          const currentScreenshotCost = Math.max(0, screenshotCount - 1) * (currentTotalBaseCost * 0.03)
                          additionalScreenshotCost = newScreenshotCost - currentScreenshotCost
                        }

                        const additionalSubtotal = additionalBaseCost + additionalScreenshotCost
                        const totalAdditionalCost = additionalSubtotal * 1.05
                        return totalAdditionalCost.toFixed(2)
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkerUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleWorkerCountUpdate(newWorkerCount)}
              disabled={
                actionLoading === "update-workers" ||
                newWorkerCount === (selectedJobForWorkerUpdate?.workersNeeded || 1)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading === "update-workers" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Worker Count"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={jobDetailsModalOpen} onOpenChange={setJobDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Job Details</DialogTitle>
            <DialogDescription>Complete details of your posted job</DialogDescription>
          </DialogHeader>

          {selectedJobForDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Job ID</Label>
                    <p className="text-lg font-mono font-medium text-blue-600 mt-1">
                      #
                      {selectedJobForDetails.formattedJobId ||
                        selectedJobForDetails.jobNumber?.toString().padStart(3, "0") ||
                        "N/A"}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Job Title</Label>
                    <p className="text-lg font-medium text-gray-900 mt-1">{selectedJobForDetails.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Description</Label>
                    <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedJobForDetails.description}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Requirements</Label>
                    <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedJobForDetails.requirements}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Instructions</Label>
                    <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedJobForDetails.instructions}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Budget Range</Label>
                      <p className="text-lg font-medium text-green-600 mt-1">
                        ${selectedJobForDetails.budgetMin} - ${selectedJobForDetails.budgetMax}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Workers Needed</Label>
                      <p className="text-lg font-medium text-blue-600 mt-1">{selectedJobForDetails.workersNeeded}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Deadline</Label>
                      <p className="text-gray-800 mt-1">
                        {selectedJobForDetails.deadline
                          ? new Date(selectedJobForDetails.deadline).toLocaleDateString()
                          : "Not specified"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Location</Label>
                      <p className="text-gray-800 mt-1">{selectedJobForDetails.location || "Remote"}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge className={getJobStatusColor(selectedJobForDetails.status)}>
                        {getJobStatusLabel(selectedJobForDetails.status)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Payment Type</Label>
                    <p className="text-gray-800 mt-1 capitalize">{selectedJobForDetails.paymentType || "Standard"}</p>
                  </div>

                  {selectedJobForDetails.tags && selectedJobForDetails.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedJobForDetails.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-semibold text-gray-700">Job Statistics</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div className="flex justify-between">
                        <span>Applications:</span>
                        <span className="font-medium">{selectedJobForDetails.applicationsCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span className="font-medium">{selectedJobForDetails.viewsCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="font-medium">
                          {selectedJobForDetails.createdAt
                            ? new Date(selectedJobForDetails.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="font-medium">
                          {selectedJobForDetails.updatedAt
                            ? new Date(selectedJobForDetails.updatedAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setJobDetailsModalOpen(false)}>
              Close
            </Button>
            {selectedJobForDetails && selectedJobForDetails.status !== "cancelled" && (
              <Button
                onClick={() => {
                  setJobDetailsModalOpen(false)
                  handleEditJob(selectedJobForDetails.id)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Job
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Job-related types and mock data
export interface Job {
  id: string
  userId: string
  categoryId: string
  subcategoryId?: string
  title: string
  description: string
  requirements?: string
  instructions?: string
  budgetMin: number
  budgetMax: number
  deadline: string
  location: string
  isRemote: boolean
  status: "pending" | "approved" | "rejected" | "suspended" | "open" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "normal" | "high" | "urgent"
  skillsRequired: string[]
  applicationsCount: number
  viewsCount: number
  workersNeeded?: number
  duration?: string
  durationType?: string
  tags?: string[]
  attachments?: string[]
  thumbnail?: string
  requireScreenshots?: number
  screenshotCost?: number
  estimatedApprovalDays?: number
  requiredProof?: string
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  approvalReason?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  suspendedAt?: string
  suspendedBy?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  enableCountryRestrictions?: boolean
  restrictionType?: "include" | "exclude"
  allowedCountries?: string[]
  restrictedCountries?: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  subcategory?: {
    id: string
    name: string
    slug: string
    thumbnail?: string
  }
  poster: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
    rating: number
    totalReviews: number
  }
  assignedWorkerId?: string // New field for assigned worker ID
  paymentType?: string
  categoryThumbnail?: string
  approvalType?: string
  manualApprovalDays?: number
  isInstantApprovalEnabled?: boolean
  estimatedTotalCost?: number
  depositDeducted?: number
  cancellationDetails?: {
    cancelledAt: string
    submittedWorkCount: number
    remainingSlots: number
    refundAmount: number
    canReviewSubmissions: boolean
  }
  jobNumber?: number
  formattedJobId?: string
  maxWorkers?: number
}

export interface JobApplication {
  id: string
  jobId: string
  applicantId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  portfolioLinks: string[]
  status: "pending" | "accepted" | "rejected" | "completed"
  createdAt: string
  applicant: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
    rating: number
    totalReviews: number
    skills: string[]
  }
  job?: Job
  appliedAt?: string
  acceptedAt?: string
  acceptedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  resubmissionCount?: number
}

// New interfaces for enhanced work proof system
export interface WorkProof {
  id: string
  jobId: string
  applicationId: string
  workerId: string
  employerId: string
  title: string
  description: string
  submissionText: string
  proofFiles: string[] // URLs to uploaded files
  proofLinks: string[] // External URLs (YouTube, social media, etc.)
  screenshots: string[]
  attachments: string[]
  additionalNotes?: string
  submissionNumber: number
  status: "submitted" | "under_review" | "accepted" | "rejected" | "revision_requested" | "approved"
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  paymentAmount?: number
  paymentProcessedAt?: string
  paymentError?: string
  createdAt: string
  updatedAt: string
  worker?: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
  }
  employer?: {
    id: string
    firstName: string
    lastName: string
    username: string
  }
}

export interface JobReview {
  id: string
  jobId: string
  proofId: string
  reviewerId: string
  decision: "accepted" | "rejected" | "revision_requested"
  feedback?: string
  revisionNotes?: string
  reviewedAt: string
}

// Job status history interface for tracking workflow changes
export interface JobStatusHistory {
  id: string
  jobId: string
  userId?: string
  oldStatus?: string
  newStatus: string
  notes?: string
  metadata?: Record<string, any>
  createdAt: string
}

const JOBS_STORAGE_KEY = "marketplace-jobs"
const APPLICATIONS_STORAGE_KEY = "marketplace-applications"
const WORK_PROOFS_STORAGE_KEY = "marketplace-work-proofs"
const JOB_REVIEWS_STORAGE_KEY = "marketplace-job-reviews"
const JOB_STATUS_HISTORY_STORAGE_KEY = "marketplace-job-status-history"

const getStoredJobs = (): Job[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY)
    if (stored) {
      const jobs = JSON.parse(stored)
      return jobs
    }
    return []
  } catch {
    return []
  }
}

const saveJobs = (jobs: Job[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs))
  } catch (error) {
    console.error("Failed to save jobs:", error)
  }
}

const getStoredApplications = (): JobApplication[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(APPLICATIONS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveApplications = (applications: JobApplication[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications))
  } catch (error) {
    console.error("Failed to save applications:", error)
  }
}

const getStoredWorkProofs = (): WorkProof[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(WORK_PROOFS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveWorkProofs = (workProofs: WorkProof[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORK_PROOFS_STORAGE_KEY, JSON.stringify(workProofs))
  } catch (error) {
    console.error("Failed to save work proofs:", error)
  }
}

const getStoredJobReviews = (): JobReview[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(JOB_REVIEWS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveJobReviews = (reviews: JobReview[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(JOB_REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch (error) {
    console.error("Failed to save job reviews:", error)
  }
}

// Storage functions for job status history
const getStoredJobStatusHistory = (): JobStatusHistory[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(JOB_STATUS_HISTORY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveJobStatusHistory = (history: JobStatusHistory[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(JOB_STATUS_HISTORY_STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error("Failed to save job status history:", error)
  }
}

// Function to record status changes
const recordStatusChange = (
  jobId: string,
  oldStatus: string | undefined,
  newStatus: string,
  userId?: string,
  notes?: string,
  metadata?: Record<string, any>,
): void => {
  const history = getStoredJobStatusHistory()
  const statusEntry: JobStatusHistory = {
    id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    jobId,
    userId,
    oldStatus,
    newStatus,
    notes,
    metadata,
    createdAt: new Date().toISOString(),
  }

  history.push(statusEntry)
  saveJobStatusHistory(history)

  console.log(`[v0] Status change recorded for job ${jobId}: ${oldStatus} -> ${newStatus}`)
}

import { getSubcategoryById, getCategoryById } from "./categories"
import { getPlatformFeeSettings, calculatePlatformFee } from "./platform-fee"

import { localReservationStorage } from "./local-reservation-storage"

async function populateJobCategoryData(job: Job): Promise<Job> {
  console.log(
    "[v0] Populating category data for job:",
    job.title,
    "categoryId:",
    job.categoryId,
    "subcategoryId:",
    job.subcategoryId,
  )
  const populatedJob = { ...job }

  if (!populatedJob.category?.thumbnail && populatedJob.categoryId) {
    const fullCategory = await getCategoryById(populatedJob.categoryId)
    console.log("[v0] Loaded category:", fullCategory?.name, "thumbnail:", fullCategory?.thumbnail)
    if (fullCategory) {
      populatedJob.category = {
        id: fullCategory.id,
        name: fullCategory.name,
        slug: fullCategory.slug,
        thumbnail: fullCategory.thumbnail,
      }
      populatedJob.categoryThumbnail = fullCategory.thumbnail
    }
  }

  // Load subcategory data if subcategoryId exists
  if (populatedJob.subcategoryId) {
    const subcategory = await getSubcategoryById(populatedJob.subcategoryId)
    console.log("[v0] Loaded subcategory:", subcategory?.name, "thumbnail:", subcategory?.thumbnail)
    if (subcategory) {
      populatedJob.subcategory = subcategory
    }
  }

  console.log("[v0] Final job data:", {
    title: populatedJob.title,
    categoryThumbnail: populatedJob.categoryThumbnail,
    subcategory: populatedJob.subcategory?.name,
    subcategoryThumbnail: populatedJob.subcategory?.thumbnail,
  })

  return populatedJob
}

export async function getJobs(filters?: {
  category?: string
  location?: string
  budget?: { min: number; max: number }
  remote?: boolean
  search?: string
}): Promise<Job[]> {
  try {
    // Try to fetch from API first
    const params = new URLSearchParams()
    if (filters?.category) params.append("category", filters.category)
    if (filters?.location) params.append("location", filters.location)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.remote !== undefined) params.append("remote", filters.remote.toString())
    if (filters?.budget) {
      params.append("budgetMin", filters.budget.min.toString())
      params.append("budgetMax", filters.budget.max.toString())
    }

    const response = await fetch(`/api/jobs?${params.toString()}`)
    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Jobs fetched with algorithm:", data.algorithm)
      return data.jobs
    }
  } catch (error) {
    console.error("Error fetching jobs from API:", error)
  }

  // Fallback to local storage logic
  await new Promise((resolve) => setTimeout(resolve, 500))

  let filteredJobs = getStoredJobs().filter((job) => job.status === "approved" || job.status === "open")

  if (filters?.search) {
    filteredJobs = filteredJobs.filter(
      (job) =>
        job.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
        job.description.toLowerCase().includes(filters.search!.toLowerCase()) ||
        job.skillsRequired.some((skill) => skill.toLowerCase().includes(filters.search!.toLowerCase())),
    )
  }

  if (filters?.category) {
    filteredJobs = filteredJobs.filter((job) => job.category.slug === filters.category)
  }

  if (filters?.remote !== undefined) {
    filteredJobs = filteredJobs.filter((job) => job.isRemote === filters.remote)
  }

  if (filters?.budget) {
    filteredJobs = filteredJobs.filter(
      (job) => job.budgetMax >= filters.budget!.min && job.budgetMin <= filters.budget!.max,
    )
  }

  if (filters?.location && filters.location !== "all") {
    filteredJobs = filteredJobs.filter((job) => job.location.toLowerCase().includes(filters.location!.toLowerCase()))
  }

  const sortedJobs = filteredJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const populatedJobs = await Promise.all(sortedJobs.map(populateJobCategoryData))

  return populatedJobs
}

export async function getJobById(id: string): Promise<Job | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const jobs = getStoredJobs()
  const job = jobs.find((job) => job.id === id)

  if (job) {
    // Increment view count
    job.viewsCount = (job.viewsCount || 0) + 1
    const jobIndex = jobs.findIndex((j) => j.id === id)
    if (jobIndex !== -1) {
      jobs[jobIndex] = job
      saveJobs(jobs)
    }

    const { getAllUsers } = await import("./auth")
    const users = getAllUsers()
    const posterUser = users.find((u) => u.id === job.userId)

    if (posterUser) {
      job.poster = {
        id: posterUser.id,
        firstName: posterUser.firstName,
        lastName: posterUser.lastName,
        username: posterUser.username,
        avatar: posterUser.avatar,
        rating: 4.5, // TODO: Calculate from actual reviews
        totalReviews: 0, // TODO: Count from actual reviews
      }
    }

    return await populateJobCategoryData(job)
  }

  return null
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const applications = getStoredApplications()
  return applications.filter((app) => app.jobId === jobId)
}

export async function submitJobApplication(data: {
  jobId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  portfolioLinks: string[]
  userId?: string
}): Promise<JobApplication> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!data.userId) {
    throw new Error("User ID is required to submit application")
  }

  if (!data.coverLetter.trim()) {
    throw new Error("Cover letter is required")
  }

  if (data.proposedBudget <= 0) {
    throw new Error("Proposed budget must be greater than 0")
  }

  // Check if user already applied
  const existingApplications = getStoredApplications()
  const hasApplied = existingApplications.some((app) => app.jobId === data.jobId && app.applicantId === data.userId)

  if (hasApplied) {
    throw new Error("You have already applied to this job")
  }

  // Get user data for application
  const { getAllUsers } = await import("./auth")
  const users = getAllUsers()
  const user = users.find((u) => u.id === data.userId)

  if (!user) {
    throw new Error("User not found")
  }

  const newApplication: JobApplication = {
    id: `app_${Date.now()}`,
    jobId: data.jobId,
    applicantId: data.userId,
    coverLetter: data.coverLetter,
    proposedBudget: data.proposedBudget,
    estimatedDuration: data.estimatedDuration,
    portfolioLinks: data.portfolioLinks,
    status: "pending",
    createdAt: new Date().toISOString(),
    applicant: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      rating: 4.5, // Default rating for new users
      totalReviews: 0,
      skills: ["General"], // Default skills
    },
  }

  const applications = getStoredApplications()
  applications.push(newApplication)
  saveApplications(applications)

  // Update job application count
  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === data.jobId)
  if (jobIndex !== -1) {
    jobs[jobIndex].applicationsCount = (jobs[jobIndex].applicationsCount || 0) + 1
    saveJobs(jobs)
  }

  // Create notification for job poster
  const { createNotification } = await import("./notifications")
  const job = jobs.find((j) => j.id === data.jobId)
  if (job) {
    await createNotification({
      userId: job.userId,
      type: "job",
      title: "New Job Application",
      description: `${user.firstName} ${user.lastName} applied for your job "${job.title}"`,
      actionUrl: `/dashboard/jobs/${job.id}/applications`,
    })
  }

  return newApplication
}

export async function submitJobForApproval(jobData: Partial<Job>, userId?: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!userId) {
    throw new Error("User ID is required to submit job")
  }

  if (!jobData.title?.trim()) {
    throw new Error("Job title is required")
  }

  if (!jobData.description?.trim()) {
    throw new Error("Job description is required")
  }

  if (!jobData.budgetMin || jobData.budgetMin <= 0) {
    throw new Error("Valid budget is required")
  }

  const { getAllUsers } = await import("./auth")
  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)

  if (!user) {
    throw new Error("User not found")
  }

  const { getCategoryById } = await import("./categories")
  const category = await getCategoryById(jobData.categoryId || "")

  const { getSubcategoryById } = await import("./categories")
  const subcategory = jobData.subcategoryId ? await getSubcategoryById(jobData.subcategoryId) : null

  const checkAutoJobApproval = (): boolean => {
    console.log("[v0] 🔧 AUTO-APPROVAL CHECK: Starting auto-approval check...")

    // For server-side execution, we need to pass the setting from client
    // Default to MANUAL APPROVAL (false) for security
    let autoApprovalSetting = false

    try {
      // Check if we're in browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const setting = localStorage.getItem("admin_auto_job_approval_enabled")
        console.log("[v0] 🔧 AUTO-APPROVAL CHECK: Raw localStorage value:", JSON.stringify(setting))

        // Only enable if explicitly set to "true"
        autoApprovalSetting = setting === "true"
        console.log("[v0] 🔧 AUTO-APPROVAL CHECK: Parsed setting:", autoApprovalSetting)
      } else {
        console.log("[v0] 🔧 AUTO-APPROVAL CHECK: Server-side execution - defaulting to MANUAL APPROVAL")
        autoApprovalSetting = false
      }
    } catch (error) {
      console.error("[v0] 🔧 AUTO-APPROVAL CHECK: Error accessing localStorage:", error)
      autoApprovalSetting = false
    }

    console.log(
      "[v0] 🔧 AUTO-APPROVAL CHECK: Final decision:",
      autoApprovalSetting ? "AUTO-APPROVE" : "MANUAL APPROVAL",
    )
    return autoApprovalSetting
  }

  const shouldAutoApprove = checkAutoJobApproval()

  const jobStatus = shouldAutoApprove ? "approved" : "pending"

  console.log("[v0] 💼 JOB CREATION: Starting job creation process")
  console.log("[v0] 💼 JOB CREATION: Auto-approval enabled:", shouldAutoApprove)
  console.log("[v0] 💼 JOB CREATION: Job status will be:", jobStatus)
  console.log("[v0] 💼 JOB CREATION: Job title:", jobData.title)

  const newJob: Job = {
    id: `job_${Date.now()}`,
    userId,
    categoryId: jobData.categoryId || "",
    subcategoryId: jobData.subcategoryId,
    title: jobData.title,
    description: jobData.description,
    requirements: jobData.requirements,
    instructions: jobData.instructions,
    budgetMin: jobData.budgetMin,
    budgetMax: jobData.budgetMax || jobData.budgetMin,
    deadline: jobData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    location: jobData.location || "Remote",
    isRemote: jobData.isRemote ?? true,
    status: jobStatus, // Use the explicitly determined status
    priority: jobData.priority || "normal",
    skillsRequired: jobData.skillsRequired || [],
    applicationsCount: 0,
    viewsCount: 0,
    workersNeeded: jobData.workersNeeded || 1,
    duration: jobData.duration,
    durationType: jobData.durationType,
    tags: jobData.tags || [],
    attachments: jobData.attachments || [],
    requireScreenshots: jobData.requireScreenshots || 0,
    screenshotCost: (jobData.requireScreenshots || 0) * 0.05,
    estimatedApprovalDays: jobData.estimatedApprovalDays || 1,
    requiredProof: jobData.requirements,
    submittedAt: new Date().toISOString(),
    approvedAt: shouldAutoApprove ? new Date().toISOString() : undefined,
    approvedBy: shouldAutoApprove ? "System (Auto-approval)" : undefined,
    approvalReason: shouldAutoApprove ? "Automatically approved - Auto-approval is enabled" : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: category || {
      id: jobData.categoryId || "",
      name: "General",
      slug: "general",
    },
    subcategory: subcategory
      ? {
          id: subcategory.id,
          name: subcategory.name,
          slug: subcategory.slug,
          thumbnail: subcategory.thumbnail,
        }
      : undefined,
    poster: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      rating: 4.5,
      totalReviews: 0,
    },
  }

  const jobs = getStoredJobs()
  jobs.push(newJob)
  saveJobs(jobs)

  const { createNotification } = await import("./notifications")
  await createNotification({
    userId,
    type: "job",
    title: shouldAutoApprove ? "Job Approved" : "Job Submitted for Review",
    description: shouldAutoApprove
      ? `Your job "${newJob.title}" has been automatically approved and is now live`
      : `Your job "${newJob.title}" has been submitted and is pending admin review`,
    actionUrl: `/dashboard/jobs`,
  })

  console.log("[v0] ✅ JOB CREATION: Job created successfully with ID:", newJob.id)
  console.log("[v0] ✅ JOB CREATION: Final job status:", newJob.status)
  console.log("[v0] ✅ JOB CREATION: Auto-approved:", shouldAutoApprove)

  return newJob
}

export async function approveJob(jobId: string, adminId: string, reason?: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId)
  if (jobIndex === -1) throw new Error("Job not found")

  const oldStatus = jobs[jobIndex].status
  const updatedJob = await updateJobStatus(jobId, "approved", adminId, reason)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(
    jobId,
    oldStatus,
    "open", // Jobs become "open" when approved
    adminId,
    reason || "Job approved by admin",
    {
      reviewId: `review-${Date.now()}`,
      decision: "accepted",
      feedback: reason,
    },
  )

  return updatedJob
}

export async function rejectJob(jobId: string, adminId: string, reason: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId)
  if (jobIndex === -1) throw new Error("Job not found")

  const oldStatus = jobs[jobIndex].status
  const updatedJob = await updateJobStatus(jobId, "rejected", adminId, reason)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "rejected", adminId, reason, {
    reviewId: `review-${Date.now()}`,
    decision: "rejected",
    feedback: reason,
  })

  return updatedJob
}

export async function suspendJob(jobId: string, adminId: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId)
  if (jobIndex === -1) throw new Error("Job not found")

  const oldStatus = jobs[jobIndex].status
  const updatedJob = await updateJobStatus(jobId, "suspended", adminId)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "suspended", adminId, "Job suspended by admin", {
    reviewId: `review-${Date.now()}`,
    decision: "revision_requested",
    feedback: "Job suspended by admin",
  })

  return updatedJob
}

export async function getPendingJobs(): Promise<Job[]> {
  const jobs = getStoredJobs()
  return jobs.filter((job) => job.status === "pending")
}

export async function getApprovedJobs(): Promise<Job[]> {
  const jobs = getStoredJobs()
  return jobs.filter((job) => job.status === "approved" || job.status === "open")
}

export async function getAllJobs(): Promise<Job[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const jobs = getStoredJobs()

  const populatedJobs = await Promise.all(jobs.map(populateJobCategoryData))

  return populatedJobs
}

export async function getAllUserJobs(userId: string): Promise<Job[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const jobs = getStoredJobs()
  return jobs.filter((job) => job.userId === userId)
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId)
  if (jobIndex === -1) throw new Error("Job not found")

  const updatedJob = {
    ...jobs[jobIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
    // If job is edited, it needs re-approval
    status: updates.status || "pending",
  }

  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  return updatedJob
}

export async function cancelJob(jobId: string, userId: string): Promise<{ job: Job; refundAmount: number }> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId && j.userId === userId)
  if (jobIndex === -1) throw new Error("Job not found or unauthorized")

  const job = jobs[jobIndex]
  const oldStatus = job.status

  // Get work proofs to see how many workers have submitted work
  const workProofs = getStoredWorkProofs().filter((wp) => wp.jobId === jobId)
  const submittedWorkCount = workProofs.length
  const remainingSlots = job.workersNeeded - submittedWorkCount

  const jobCostPerWorker = job.budgetMax
  const platformFeePerWorker = jobCostPerWorker * 0.05
  const totalCostPerWorker = jobCostPerWorker + platformFeePerWorker
  const refundAmount = remainingSlots > 0 ? remainingSlots * totalCostPerWorker : 0

  if (refundAmount > 0) {
    try {
      const { addWalletTransaction } = await import("./wallet")
      await addWalletTransaction({
        userId,
        type: "refund",
        amount: refundAmount,
        description: `Refund for cancelled job: "${job.title}" (Job #${job.formattedJobId || job.id}) - ${remainingSlots} remaining slots + platform fees`,
        referenceId: jobId,
        referenceType: "job_cancellation",
        balanceType: "deposit",
      })
      console.log(`[v0] ✅ Job cancellation refund processed: $${refundAmount}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(`[v0] ⚠️ Job cancellation refund already processed for job: ${jobId}`)
      } else {
        console.error(`[v0] ❌ Failed to process job cancellation refund:`, error)
        throw error
      }
    }
  }

  // Update job status to cancelled but keep it accessible for submitted work review
  const updatedJob = {
    ...job,
    status: "cancelled" as Job["status"],
    updatedAt: new Date().toISOString(),
    cancellationDetails: {
      cancelledAt: new Date().toISOString(),
      submittedWorkCount,
      remainingSlots,
      refundAmount,
      canReviewSubmissions: submittedWorkCount > 0,
    },
  }

  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(
    jobId,
    oldStatus,
    "cancelled",
    userId,
    `Job cancelled. ${submittedWorkCount} work submissions can still be reviewed. ${remainingSlots} slots refunded including platform fee.`,
    {
      userAction: "cancel",
      submittedWorkCount,
      remainingSlots,
      refundAmount,
      canReviewSubmissions: submittedWorkCount > 0,
    },
  )

  console.log(
    `[v0] Job ${jobId} cancelled. Refund: $${refundAmount} (including platform fee), Submitted work: ${submittedWorkCount}`,
  )

  return { job: updatedJob, refundAmount }
}

export async function pauseJob(jobId: string, userId: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId && j.userId === userId)
  if (jobIndex === -1) throw new Error("Job not found or unauthorized")

  const oldStatus = jobs[jobIndex].status
  const updatedJob = await updateJobStatus(jobId, "suspended", userId)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "suspended", userId, "Job paused by owner", { userAction: "pause" })

  return updatedJob
}

export async function reactivateJob(jobId: string, userId: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId && j.userId === userId)
  if (jobIndex === -1) throw new Error("Job not found or unauthorized")

  const oldStatus = jobs[jobIndex].status
  // Reactivated jobs need re-approval
  const updatedJob = await updateJobStatus(jobId, "pending", userId)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "pending", userId, "Job reactivated and resubmitted for approval", {
    userAction: "reactivate",
  })

  return updatedJob
}

export async function getUserApplications(userId: string): Promise<JobApplication[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const applications = getStoredApplications()
  const jobs = getStoredJobs()

  // Filter applications by user and add job details
  const userApplications = applications
    .filter((app) => app.applicantId === userId)
    .map((app) => {
      const job = jobs.find((j) => j.id === app.jobId)
      return {
        ...app,
        job: job || null,
        appliedAt: app.createdAt,
      }
    })

  return userApplications
}

import { getAllUsers } from "./auth"

export async function submitWorkProof(data: {
  jobId: string
  applicationId: string
  workerId: string
  title: string
  description: string
  submissionText: string
  proofFiles?: any[]
  proofLinks?: string[]
  screenshots?: any[]
  attachments?: any[]
}): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] 📝 WORK PROOF: Starting work proof submission")
  console.log("[v0] 📝 WORK PROOF: Job ID:", data.jobId)
  console.log("[v0] 📝 WORK PROOF: Worker ID:", data.workerId)

  const users = getAllUsers()
  const workerUser = users.find((u) => u.id === data.workerId)
  console.log("[v0] 👤 Found worker user:", workerUser?.firstName, workerUser?.lastName, workerUser?.username)

  // Get job details to check approval type
  const jobs = getStoredJobs()
  const job = jobs.find((j) => j.id === data.jobId)

  if (!job) {
    throw new Error("Job not found")
  }

  console.log("[v0] 📝 WORK PROOF: Job approval type:", job.approvalType)
  console.log("[v0] 📝 WORK PROOF: Instant approval enabled:", job.isInstantApprovalEnabled)

  // Get application details
  const applications = getStoredApplications()
  const application = applications.find((app) => app.id === data.applicationId)

  if (!application) {
    throw new Error("Application not found")
  }

  const paymentAmount = application.proposedBudget || job.budgetMax || job.budgetMin

  const shouldProcessInstantPayment = job.approvalType === "instant" && job.isInstantApprovalEnabled === true

  console.log("[v0] 📝 WORK PROOF: Should process instant payment:", shouldProcessInstantPayment)
  console.log("[v0] 📝 WORK PROOF: Payment amount:", paymentAmount)

  const newProof: WorkProof = {
    id: Date.now().toString(),
    jobId: data.jobId,
    applicationId: data.applicationId,
    workerId: data.workerId,
    employerId: job.userId,
    title: data.title,
    description: data.description,
    submissionText: data.submissionText,
    proofFiles: data.proofFiles || [],
    proofLinks: data.proofLinks || [],
    screenshots: data.screenshots || [],
    attachments: data.attachments || [],
    status: shouldProcessInstantPayment ? "approved" : "submitted",
    submittedAt: new Date().toISOString(),
    approvedAt: shouldProcessInstantPayment ? new Date().toISOString() : undefined,
    paymentAmount,
    submissionNumber: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    worker: {
      id: data.workerId,
      firstName: workerUser?.firstName || "Unknown",
      lastName: workerUser?.lastName || "Worker",
      username: workerUser?.username || `user${data.workerId}`,
      avatar: workerUser?.avatar,
    },
    employer: {
      id: job.userId,
      firstName: users.find((u) => u.id === job.userId)?.firstName || "Job",
      lastName: users.find((u) => u.id === job.userId)?.lastName || "Poster",
      username: users.find((u) => u.id === job.userId)?.username || "jobposter",
    },
  }

  if (shouldProcessInstantPayment) {
    try {
      console.log("[v0] 💰 INSTANT PAYMENT: Processing instant payment for work proof")

      const { addWalletTransaction } = await import("./wallet")

      // Calculate platform fee (5% default)
      const platformFeeSettings = await getPlatformFeeSettings()
      let platformFeeRate = 0.05 // Default fallback
      let platformFee = 0

      if (platformFeeSettings) {
        const feeCalculation = calculatePlatformFee(paymentAmount, platformFeeSettings)
        platformFee = feeCalculation.platformFee
        platformFeeRate = platformFeeSettings.feePercentage / 100
      } else {
        platformFee = Math.round(paymentAmount * platformFeeRate * 100) / 100
      }

      const workerAmount = Math.round((paymentAmount - platformFee) * 100) / 100

      console.log("[v0] 💰 INSTANT PAYMENT: Total amount:", paymentAmount)
      console.log("[v0] 💰 INSTANT PAYMENT: Platform fee:", platformFee)
      console.log("[v0] 💰 INSTANT PAYMENT: Worker receives:", workerAmount)

      // Add money to worker's withdrawal balance
      await addWalletTransaction({
        userId: data.workerId,
        type: "job_payment",
        amount: workerAmount,
        description: `Instant payment for job: ${job.title}`,
        referenceId: data.jobId,
        referenceType: "job_payment",
        balanceType: "withdrawal",
      })

      // Record platform fee
      await addWalletTransaction({
        userId: "platform",
        type: "platform_fee",
        amount: platformFee,
        description: `Platform fee for job: ${job.title}`,
        referenceId: data.jobId,
        referenceType: "platform_fee",
        balanceType: "withdrawal",
      })

      newProof.approvedAt = new Date().toISOString()
      newProof.approvedBy = "System (Instant Approval)"
      newProof.paymentProcessedAt = new Date().toISOString()

      console.log("[v0] ✅ INSTANT PAYMENT: Payment processed successfully")

      // Create notification for worker
      const { createNotification } = await import("./notifications")
      await createNotification({
        userId: data.workerId,
        type: "payment",
        title: "Instant Payment Received! 💰",
        description: `You received $${workerAmount.toFixed(2)} for completing "${job.title}". Payment has been added to your withdrawal balance.`,
        actionUrl: `/dashboard/wallet`,
      })

      // Create notification for employer
      await createNotification({
        userId: job.userId,
        type: "job",
        title: "Work Submitted & Payment Released",
        description: `Work has been submitted for "${job.title}" and instant payment of $${paymentAmount.toFixed(2)} has been released to the worker.`,
        actionUrl: `/dashboard/jobs/${data.jobId}`,
      })

      console.log("[v0] ✅ INSTANT PAYMENT: Notifications sent successfully")
    } catch (error) {
      console.error("[v0] ❌ INSTANT PAYMENT: Error processing instant payment:", error)
      // Don't fail the work proof submission, just log the error
      newProof.status = "submitted"
      newProof.paymentError = error.message
    }
  } else {
    console.log("[v0] 📝 WORK PROOF: Manual approval required, creating notification for employer")
    const { createNotification } = await import("./notifications")
    await createNotification({
      userId: job.userId,
      type: "job",
      title: "Work Submitted for Review",
      description: `Work has been submitted for "${job.title}". Please review and approve within ${job.manualApprovalDays || 3} days.`,
      actionUrl: `/dashboard/jobs/${data.jobId}`,
    })
  }

  const workProofs = getStoredWorkProofs()
  workProofs.push(newProof)
  saveWorkProofs(workProofs)

  console.log("[v0] ✅ WORK PROOF: Work proof saved successfully with status:", newProof.status)

  return newProof
}

export async function getWorkProofsByJob(jobId: string): Promise<WorkProof[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const workProofs = getStoredWorkProofs()
  return workProofs.filter((proof) => proof.jobId === jobId)
}

export async function getWorkProofsByWorker(workerId: string): Promise<WorkProof[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const workProofs = getStoredWorkProofs()
  return workProofs.filter((proof) => proof.workerId === workerId)
}

export async function getWorkProofs(jobId: string): Promise<WorkProof[]> {
  return await getWorkProofsByJob(jobId)
}

export async function reviewWorkProof(
  proofId: string,
  reviewData: {
    decision: "accepted" | "rejected" | "revision_requested"
    feedback?: string
    revisionNotes?: string
    reviewerId: string
  },
): Promise<JobReview> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const workProofs = getStoredWorkProofs()
  const proofIndex = workProofs.findIndex((proof) => proof.id === proofId)

  if (proofIndex === -1) {
    throw new Error("Work proof not found")
  }

  const proof = workProofs[proofIndex]

  // Update proof status
  workProofs[proofIndex] = {
    ...proof,
    status:
      reviewData.decision === "accepted"
        ? "accepted"
        : reviewData.decision === "rejected"
          ? "rejected"
          : "revision_requested",
    updatedAt: new Date().toISOString(),
  }
  saveWorkProofs(workProofs)

  // Create review record
  const review: JobReview = {
    id: `review-${Date.now()}`,
    jobId: proof.jobId,
    proofId: proofId,
    reviewerId: reviewData.reviewerId,
    decision: reviewData.decision,
    feedback: reviewData.feedback,
    revisionNotes: reviewData.revisionNotes,
    reviewedAt: new Date().toISOString(),
  }

  // Store review (in real app, this would go to database)
  const reviews = getStoredJobReviews()
  reviews.push(review)
  saveJobReviews(reviews)

  // Update job and application status based on decision
  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((job) => job.id === proof.jobId)

  if (jobIndex !== -1) {
    const oldStatus = jobs[jobIndex].status
    let newStatus = oldStatus

    if (reviewData.decision === "accepted") {
      // Update job to completed
      newStatus = "completed"
      jobs[jobIndex] = {
        ...jobs[jobIndex],
        status: "completed",
        updatedAt: new Date().toISOString(),
      }

      recordStatusChange(
        proof.jobId,
        oldStatus,
        "completed",
        reviewData.reviewerId,
        "Work proof accepted - job completed",
        {
          reviewId: review.id,
          decision: "accepted",
          feedback: reviewData.feedback,
        },
      )
    } else if (reviewData.decision === "rejected") {
      recordStatusChange(
        proof.jobId,
        oldStatus,
        oldStatus, // Status might not change, but we record the review
        reviewData.reviewerId,
        "Work proof rejected - awaiting rework or dispute",
        {
          reviewId: review.id,
          decision: "rejected",
          feedback: reviewData.feedback,
          revisionNotes: reviewData.revisionNotes,
        },
      )
    } else {
      recordStatusChange(
        proof.jobId,
        oldStatus,
        oldStatus, // Status stays the same for revision requests
        reviewData.reviewerId,
        "Revision requested on work proof",
        {
          reviewId: review.id,
          decision: "revision_requested",
          revisionNotes: reviewData.revisionNotes,
        },
      )
    }

    saveJobs(jobs)

    // Update application to completed if accepted
    if (reviewData.decision === "accepted") {
      const applications = getStoredApplications()
      const appIndex = applications.findIndex((app) => app.jobId === proof.jobId && app.applicantId === proof.workerId)
      if (appIndex !== -1) {
        applications[appIndex] = {
          ...applications[appIndex],
          status: "completed",
        }
        saveApplications(applications)
      }
    }
  }

  return review
}

export async function getJobApplicationById(applicationId: string): Promise<JobApplication | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const applications = getStoredApplications()
  return applications.find((app) => app.id === applicationId) || null
}

export async function updateJobStatus(
  jobId: string,
  newStatus: Job["status"],
  userId?: string,
  metadata?: Record<string, any>,
): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((job) => job.id === jobId)
  if (jobIndex === -1) throw new Error("Job not found")

  const job = jobs[jobIndex]
  const oldStatus = job.status

  const updatedJob = {
    ...job,
    status: newStatus,
    updatedAt: new Date().toISOString(),
    ...(newStatus === "completed" && { completedAt: new Date().toISOString() }),
  }

  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  // Add to status history
  const statusHistory = getStoredJobStatusHistory()
  statusHistory.push({
    id: `status_${Date.now()}`,
    jobId,
    userId,
    oldStatus,
    newStatus,
    notes: metadata?.notes || `Status changed from ${oldStatus} to ${newStatus}`,
    metadata,
    createdAt: new Date().toISOString(),
  })
  saveJobStatusHistory(statusHistory)

  console.log("[v0] Job status updated:", jobId, "from", oldStatus, "to", newStatus)

  if (newStatus === "completed") {
    try {
      const { createNotification } = await import("./notifications")

      // Notify job poster
      await createNotification({
        userId: job.userId,
        type: "job",
        title: "Job Completed Successfully",
        description: `Your job "${job.title}" has been completed by all required workers.`,
        actionUrl: `/dashboard/jobs/${jobId}`,
      })

      // If there are multiple workers, notify them all
      if (metadata?.totalWorkersCompleted && metadata.totalWorkersCompleted > 1) {
        const { getJobApplications } = await import("./jobs")
        const applications = await getJobApplications(jobId)
        const acceptedWorkers = applications.filter((app) => app.status === "accepted")

        for (const app of acceptedWorkers) {
          await createNotification({
            userId: app.applicantId,
            type: "job",
            title: "Job Fully Completed",
            description: `The job "${job.title}" has been completed by all required workers.`,
            actionUrl: `/dashboard/applied-jobs`,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to send completion notifications:", error)
    }
  }

  return updatedJob
}

export const JOB_STATUS = {
  PENDING: "pending" as const,
  APPROVED: "approved" as const,
  REJECTED: "rejected" as const,
  SUSPENDED: "suspended" as const,
  OPEN: "open" as const,
  IN_PROGRESS: "in_progress" as const,
  COMPLETED: "completed" as const,
  CANCELLED: "cancelled" as const,
}

export const getJobStatusColor = (status: string) => {
  switch (status) {
    case JOB_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case JOB_STATUS.APPROVED:
    case JOB_STATUS.OPEN:
      return "bg-green-100 text-green-800"
    case JOB_STATUS.REJECTED:
      return "bg-red-100 text-red-800"
    case JOB_STATUS.SUSPENDED:
      return "bg-gray-100 text-gray-800"
    case JOB_STATUS.IN_PROGRESS:
      return "bg-blue-100 text-blue-800"
    case JOB_STATUS.COMPLETED:
      return "bg-purple-100 text-purple-800"
    case JOB_STATUS.CANCELLED:
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getJobStatusLabel = (status: string) => {
  switch (status) {
    case JOB_STATUS.PENDING:
      return "Pending Review"
    case JOB_STATUS.APPROVED:
      return "Approved"
    case JOB_STATUS.REJECTED:
      return "Rejected"
    case JOB_STATUS.SUSPENDED:
      return "Suspended"
    case JOB_STATUS.OPEN:
      return "Open"
    case JOB_STATUS.IN_PROGRESS:
      return "In Progress"
    case JOB_STATUS.COMPLETED:
      return "Completed"
    case JOB_STATUS.CANCELLED:
      return "Cancelled"
    default:
      return status
  }
}

export const canApplyToJob = (job: Job) => {
  return job.status === JOB_STATUS.APPROVED || job.status === JOB_STATUS.OPEN
}

export const isJobVisible = (job: Job, userType: "user" | "admin" = "user") => {
  if (userType === "admin") {
    return true // Admins can see all jobs
  }

  // Regular users can only see approved/open jobs
  return job.status === JOB_STATUS.APPROVED || job.status === JOB_STATUS.OPEN
}

export const getAvailableJobs = async (currentUserId?: string): Promise<Job[]> => {
  const jobs = getStoredJobs()

  return jobs.filter((job) => {
    // Basic status filter - only show approved/open jobs that aren't completed
    const isValidStatus =
      (job.status === JOB_STATUS.APPROVED || job.status === JOB_STATUS.OPEN) && job.status !== JOB_STATUS.COMPLETED

    if (!isValidStatus) return false

    const workersNeeded = job.workersNeeded || job.maxWorkers || 1
    const currentApplications = job.applicationsCount || 0

    // If job has reached its worker limit, don't show it as available
    if (currentApplications >= workersNeeded) {
      console.log("[v0] Job", job.id, "at capacity:", currentApplications, "of", workersNeeded, "workers")
      return false
    }

    const reservationInfo = localReservationStorage.isJobReserved(job.id)

    // If job is not reserved, show it to everyone
    if (!reservationInfo.isReserved) return true

    // If job needs multiple workers, show it even when reserved (partial reservation)
    if (job.workersNeeded > 1) return true

    // For single-worker jobs that are reserved:
    // Only show to the user who reserved it, hide from others
    if (job.workersNeeded === 1 && reservationInfo.isReserved) {
      return currentUserId === reservationInfo.userId
    }

    return true
  })
}

export const getJobsForDashboard = (jobs: Job[], currentUserId?: string) => {
  return jobs.filter((job) => {
    // Basic status filter
    const isValidStatus =
      (job.status === JOB_STATUS.APPROVED || job.status === JOB_STATUS.OPEN) && job.status !== JOB_STATUS.COMPLETED

    if (!isValidStatus) return false

    const workersNeeded = job.workersNeeded || job.maxWorkers || 1
    const currentApplications = job.applicationsCount || 0

    // If job has reached its worker limit, don't show it as available
    if (currentApplications >= workersNeeded) {
      console.log("[v0] Dashboard job", job.id, "at capacity:", currentApplications, "of", workersNeeded, "workers")
      return false
    }

    const reservationInfo = localReservationStorage.isJobReserved(job.id)

    // If job is not reserved, show it to everyone
    if (!reservationInfo.isReserved) return true

    // If job needs multiple workers, show it even when reserved
    if (job.workersNeeded > 1) return true

    // For single-worker jobs that are reserved:
    // Only show to the user who reserved it
    if (job.workersNeeded === 1 && reservationInfo.isReserved) {
      return currentUserId === reservationInfo.userId
    }

    return true
  })
}

// Function to get job status history
export async function getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const history = getStoredJobStatusHistory()
  return history
    .filter((entry) => entry.jobId === jobId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Function to get all status history for admin
export async function getAllJobStatusHistory(): Promise<JobStatusHistory[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const history = getStoredJobStatusHistory()
  return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function acceptJobApplication(applicationId: string, employerId: string): Promise<JobApplication> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const applications = getStoredApplications()
  const applicationIndex = applications.findIndex((app) => app.id === applicationId)

  if (applicationIndex === -1) {
    throw new Error("Application not found")
  }

  const application = applications[applicationIndex]

  // Verify employer owns the job
  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === application.jobId)
  const job = jobs[jobIndex]

  if (!job || job.userId !== employerId) {
    throw new Error("You don't have permission to accept this application")
  }

  const updatedApplication = {
    ...application,
    status: "accepted" as const,
    acceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  applications[applicationIndex] = updatedApplication
  saveApplications(applications)

  const updatedJob = {
    ...job,
    status: "completed" as const,
    assignedWorkerId: application.applicantId,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  try {
    const { addWalletTransaction } = await import("./wallet")

    const paymentAmount = application.proposedBudget

    if (!paymentAmount || paymentAmount <= 0) {
      throw new Error(`Invalid payment amount: ${paymentAmount}`)
    }

    // Calculate platform fee (5% default)
    const platformFeeSettings = await getPlatformFeeSettings()
    let platformFeeRate = 0.05 // Default fallback
    let platformFee = 0

    if (platformFeeSettings) {
      const feeCalculation = calculatePlatformFee(paymentAmount, platformFeeSettings)
      platformFee = feeCalculation.platformFee
      platformFeeRate = platformFeeSettings.feePercentage / 100
    } else {
      platformFee = Math.round(paymentAmount * platformFeeRate * 100) / 100
    }

    const workerAmount = Math.round((paymentAmount - platformFee) * 100) / 100 // Round to 2 decimals

    console.log(`[v0] 💰 Processing instant payment:`)
    console.log(`[v0] - Total job amount: $${paymentAmount}`)
    console.log(`[v0] - Platform fee (5%): $${platformFee}`)
    console.log(`[v0] - Worker receives: $${workerAmount}`)
    console.log(`[v0] - Worker ID: ${application.applicantId}`)

    // Add money to worker's withdrawal balance
    await addWalletTransaction(application.applicantId, {
      type: "job_payment",
      amount: workerAmount,
      description: `Payment for job: ${job.title}`,
      jobId: job.id,
      fromUserId: employerId,
    })

    console.log(`[v0] ✅ Payment successfully added to worker ${application.applicantId} wallet: $${workerAmount}`)

    // Record platform fee
    await addWalletTransaction("platform", {
      type: "platform_fee",
      amount: platformFee,
      description: `Platform fee for job: ${job.title}`,
      jobId: job.id,
      fromUserId: employerId,
    })

    console.log(`[v0] ✅ Platform fee recorded: $${platformFee}`)
  } catch (error) {
    console.error("[v0] ❌ Error processing instant payment:", error)
    throw new Error(`Payment processing failed: ${error.message}`)
  }

  // Create notification for applicant
  const { createNotification } = await import("./notifications")
  await createNotification({
    userId: application.applicantId,
    type: "job",
    title: "Job Accepted & Payment Released!",
    description: `Your application for "${job.title}" has been accepted and payment of $${application.proposedBudget - application.proposedBudget * 0.05} has been added to your withdrawal balance!`,
    actionUrl: `/dashboard/wallet`,
  })

  // Create notification for employer
  await createNotification({
    userId: employerId,
    type: "job",
    title: "Job Completed",
    description: `Job "${job.title}" has been completed and payment has been released to the worker.`,
    actionUrl: `/dashboard/jobs`,
  })

  try {
    const { triggerWalletNotification, triggerAppliedJobsNotification } = await import(
      "../components/notifications/notification-helpers"
    )

    // Trigger wallet notification for the worker (they received payment)
    console.log("[v0] 🔔 Triggering wallet notification for worker:", application.applicantId)
    triggerWalletNotification()

    // Trigger applied jobs notification for the worker (their application was accepted)
    console.log("[v0] 🔔 Triggering applied jobs notification for worker:", application.applicantId)
    triggerAppliedJobsNotification()

    console.log("[v0] ✅ Real-time notification badges triggered successfully")
  } catch (error) {
    console.error("[v0] ❌ Error triggering notification badges:", error)
  }

  return updatedApplication
}

export async function rejectJobApplication(
  applicationId: string,
  employerId: string,
  reason: string,
): Promise<JobApplication> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const applications = getStoredApplications()
  const applicationIndex = applications.findIndex((app) => app.id === applicationId)

  if (applicationIndex === -1) {
    throw new Error("Application not found")
  }

  const application = applications[applicationIndex]

  // Verify employer owns the job
  const jobs = getStoredJobs()
  const job = jobs.find((j) => j.id === application.jobId)

  if (!job || job.userId !== employerId) {
    throw new Error("You don't have permission to reject this application")
  }

  const updatedApplication = {
    ...application,
    status: "rejected" as const,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
    updatedAt: new Date().toISOString(),
  }

  applications[applicationIndex] = updatedApplication
  saveApplications(applications)

  // Create notification for applicant
  const { createNotification } = await import("./notifications")
  await createNotification({
    userId: application.applicantId,
    type: "job",
    title: "Application Rejected",
    description: `Your application for "${job.title}" was not selected. Keep applying to other opportunities!`,
    actionUrl: `/dashboard/applied-jobs`,
  })

  try {
    const { triggerAppliedJobsNotification } = await import("../components/notifications/notification-helpers")

    // Trigger applied jobs notification for the worker (their application was rejected)
    console.log("[v0] 🔔 Triggering applied jobs notification for rejection:", application.applicantId)
    triggerAppliedJobsNotification()

    console.log("[v0] ✅ Real-time notification badge triggered for rejection")
  } catch (error) {
    console.error("[v0] ❌ Error triggering rejection notification badge:", error)
  }

  return updatedApplication
}

export async function getUserJobs(userId: string): Promise<Job[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const jobs = getStoredJobs()
  const userJobs = jobs.filter((job) => job.userId === userId)

  const jobsWithCounts = await Promise.all(
    userJobs.map(async (job) => {
      try {
        // Get applications for this job
        const applications = await getJobApplications(job.id)
        const applicationsCount = applications.length

        console.log(`[v0] Job ${job.id} (${job.title}): Found ${applicationsCount} applications`)

        // Update the job with actual counts
        return {
          ...job,
          applicationsCount,
          // For now, we'll use a simple view count based on applications
          // In a real system, this would be tracked separately
          viewsCount: Math.max(job.viewsCount || 0, applicationsCount * 2),
        }
      } catch (error) {
        console.error(`[v0] Error counting applications for job ${job.id}:`, error)
        return job
      }
    }),
  )

  return jobsWithCounts
}

export async function applyToJob(data: {
  jobId: string
  applicantId: string
  coverLetter: string
  proposedBudget: number
  estimatedDuration: string
  portfolioLinks: string[]
}): Promise<JobApplication> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] 🔍 WORKER VALIDATION: Checking application for job:", data.jobId, "by worker:", data.applicantId)

  const jobs = getStoredJobs()
  const job = jobs.find((j) => j.id === data.jobId)

  if (!job) {
    throw new Error("Job not found")
  }

  if (job.status !== "approved") {
    throw new Error("Job is not available for applications")
  }

  // Check if user already applied to this job
  const existingApplications = getStoredApplications()
  const existingApplication = existingApplications.find(
    (app) => app.jobId === data.jobId && app.applicantId === data.applicantId,
  )

  if (existingApplication) {
    console.log("[v0] ⚠️ WORKER VALIDATION: User already applied to this job - treating as resubmission")

    // Update existing application instead of creating new one
    const applications = JSON.parse(localStorage.getItem("job_applications") || "[]")
    const applicationIndex = applications.findIndex((app: JobApplication) => app.id === existingApplication.id)

    if (applicationIndex !== -1) {
      applications[applicationIndex] = {
        ...applications[applicationIndex],
        coverLetter: data.coverLetter,
        proposedBudget: data.proposedBudget,
        estimatedDuration: data.estimatedDuration,
        portfolioLinks: data.portfolioLinks,
        updatedAt: new Date().toISOString(),
        resubmissionCount: (applications[applicationIndex].resubmissionCount || 0) + 1,
      }

      localStorage.setItem("job_applications", JSON.stringify(applications))
      console.log("[v0] ✅ WORKER VALIDATION: Application updated as resubmission")
      return applications[applicationIndex]
    }
  }

  // Check if job has reached worker limit
  const acceptedApplications = existingApplications.filter((app) => app.status === "accepted")
  const workersNeeded = job.workersNeeded || job.maxWorkers || 1

  if (acceptedApplications.length >= workersNeeded) {
    throw new Error(`This job has already reached its worker limit of ${workersNeeded} workers`)
  }

  console.log("[v0] ✅ WORKER VALIDATION: New application allowed")
  console.log(
    "[v0] 📊 WORKER VALIDATION: Current accepted workers:",
    acceptedApplications.length,
    "/ Needed:",
    workersNeeded,
  )

  // Get user data for application
  const { getAllUsers } = await import("./auth")
  const users = getAllUsers()
  const user = users.find((u) => u.id === data.applicantId)

  if (!user) {
    throw new Error("User not found")
  }

  const newApplication: JobApplication = {
    id: `app_${Date.now()}`,
    jobId: data.jobId,
    applicantId: data.applicantId,
    coverLetter: data.coverLetter,
    proposedBudget: data.proposedBudget,
    estimatedDuration: data.estimatedDuration,
    portfolioLinks: data.portfolioLinks,
    status: "pending",
    createdAt: new Date().toISOString(),
    applicant: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      rating: user.rating,
      totalReviews: user.totalReviews,
      skills: user.skills,
    },
  }

  const applications = getStoredApplications()
  applications.push(newApplication)
  saveApplications(applications)

  // Update job application count
  const jobIndex = jobs.findIndex((j) => j.id === data.jobId)
  if (jobIndex !== -1) {
    jobs[jobIndex].applicationsCount = (jobs[jobIndex].applicationsCount || 0) + 1
    saveJobs(jobs)
  }

  // Create notification for job poster
  const { createNotification } = await import("./notifications")
  await createNotification({
    userId: job.userId,
    type: "job",
    title: "New Job Application",
    description: `${user.firstName} ${user.lastName} applied for your job "${job.title}"`,
    actionUrl: `/dashboard/jobs/${job.id}/applications`,
  })

  return newApplication
}

export async function createJob(data: any): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  console.log("[v0] 💼 JOB CREATION: Starting job creation process")
  console.log("[v0] 💼 JOB CREATION: Workers needed:", data.workersNeeded)
  console.log("[v0] 💼 JOB CREATION: Budget per worker:", data.budgetMin, "-", data.budgetMax)
  console.log("[v0] 💼 JOB CREATION: Screenshot requirements:", data.requireScreenshots || 0)
  console.log("[v0] 💼 JOB CREATION: Approval type:", data.approvalType)
  console.log("[v0] 💼 JOB CREATION: Manual approval days:", data.manualApprovalDays)
  console.log("[v0] 💼 JOB CREATION: Country restrictions enabled:", data.enableCountryRestrictions)
  console.log("[v0] 💼 JOB CREATION: Restriction type:", data.restrictionType)
  console.log("[v0] 💼 JOB CREATION: Allowed countries:", data.allowedCountries)
  console.log("[v0] 💼 JOB CREATION: Restricted countries:", data.restrictedCountries)

  const isInstantApproval = data.approvalType === "instant"

  const isInstantApprovalEnabled = () => {
    try {
      // Check if we're in browser environment
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const setting = localStorage.getItem("admin_instant_approval_enabled")
        console.log("[v0] 🔧 INSTANT-APPROVAL: localStorage setting found:", setting)
        const enabled = setting === "true"
        console.log("[v0] 🔧 INSTANT-APPROVAL: Instant approval enabled:", enabled)
        return enabled
      } else {
        // On server side or when localStorage is not available, default to true for instant approval requests
        console.log("[v0] 🔧 INSTANT-APPROVAL: Server side or no localStorage, defaulting to true for instant requests")
        return isInstantApproval
      }
    } catch (error) {
      console.error("[v0] 🔧 INSTANT-APPROVAL: Error checking setting:", error)
      // If there's an error, allow instant approval if user requested it
      return isInstantApproval
    }
  }

  const getDefaultManualApprovalDays = () => {
    try {
      if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
        const defaultDays = localStorage.getItem("admin_default_manual_approval_days")
        return defaultDays ? Number.parseInt(defaultDays) : 3
      }
      return 3 // Default fallback
    } catch (error) {
      console.error("[v0] 🔧 DEFAULT-DAYS: Error getting default days:", error)
      return 3
    }
  }

  const canUseInstantApproval = isInstantApproval && isInstantApprovalEnabled()

  const existingJobs = getStoredJobs()
  const nextJobNumber = existingJobs.length + 1
  const formattedJobId = String(nextJobNumber).padStart(3, "0")

  console.log("[v0] 💼 JOB CREATION: Generated job number:", nextJobNumber, "formatted as:", formattedJobId)

  const jobStatus = "approved" // All jobs are approved immediately, instant payment happens on work submission

  const finalManualApprovalDays = data.manualApprovalDays || getDefaultManualApprovalDays()

  console.log("[v0] 🔧 INSTANT-APPROVAL: User requested instant approval:", isInstantApproval)
  console.log("[v0] 🔧 INSTANT-APPROVAL: Can use instant approval:", canUseInstantApproval)
  console.log("[v0] 🔧 INSTANT-APPROVAL: Job status will be:", jobStatus)
  console.log("[v0] 🔧 MANUAL-APPROVAL: Final manual approval days:", finalManualApprovalDays)

  const budgetPerWorker = data.budgetMax || data.budgetMin
  const baseJobCost = budgetPerWorker * data.workersNeeded

  // Calculate screenshot costs
  let screenshotCost = 0
  if (data.requireScreenshots > 0) {
    try {
      const { calculateScreenshotCosts } = await import("./screenshot-pricing")
      const screenshotCalculation = await calculateScreenshotCosts(data.requireScreenshots, baseJobCost)
      screenshotCost = screenshotCalculation.totalScreenshotCost
      console.log("[v0] 📸 JOB CREATION: Screenshot cost calculated:", screenshotCost)
    } catch (error) {
      console.error("[v0] 📸 JOB CREATION: Error calculating screenshot costs:", error)
      // Fallback calculation
      screenshotCost = data.requireScreenshots * 0.05
    }
  }

  const subtotal = baseJobCost + screenshotCost

  let platformFee = 0
  let platformFeeRate = 0.05 // Default fallback

  try {
    const platformFeeSettings = await getPlatformFeeSettings()
    if (platformFeeSettings) {
      const feeCalculation = calculatePlatformFee(subtotal, platformFeeSettings)
      platformFee = feeCalculation.platformFee
      platformFeeRate = platformFeeSettings.feePercentage / 100
      console.log("[v0] 💰 JOB CREATION: Using configurable platform fee:", platformFeeSettings.feePercentage + "%")
    } else {
      platformFee = subtotal * platformFeeRate
      console.log("[v0] 💰 JOB CREATION: Using default platform fee: 5%")
    }
  } catch (error) {
    console.error("[v0] 💰 JOB CREATION: Error loading platform fee settings, using default:", error)
    platformFee = subtotal * platformFeeRate
  }

  const totalWithFees = subtotal + platformFee

  console.log("[v0] 💰 JOB CREATION: Base job cost:", baseJobCost)
  console.log("[v0] 💰 JOB CREATION: Screenshot cost:", screenshotCost)
  console.log("[v0] 💰 JOB CREATION: Subtotal:", subtotal)
  console.log("[v0] 💰 JOB CREATION: Platform fee:", platformFee)
  console.log("[v0] 💰 JOB CREATION: Total with fees:", totalWithFees)

  // Check and deduct from user's deposit wallet
  try {
    const { getWallet, addWalletTransaction } = await import("./wallet")
    const wallet = await getWallet(data.userId)

    if (wallet.depositBalance < totalWithFees) {
      throw new Error(
        `Insufficient deposit balance. Required: $${totalWithFees.toFixed(2)}, Available: $${wallet.depositBalance.toFixed(2)}`,
      )
    }

    let transactionDescription = `Job creation deposit for: ${data.title} (${data.workersNeeded} workers × $${budgetPerWorker}`
    if (screenshotCost > 0) {
      transactionDescription += ` + $${screenshotCost.toFixed(2)} screenshot fee`
    }
    transactionDescription += ` + $${platformFee.toFixed(2)} platform fee)`

    // Deduct estimated cost from deposit balance
    await addWalletTransaction({
      userId: data.userId,
      type: "payment",
      amount: -totalWithFees,
      description: transactionDescription,
      referenceId: `job_${Date.now()}`,
      referenceType: "job_creation",
      balanceType: "deposit",
    })

    console.log("[v0] ✅ JOB CREATION: Deposit deducted successfully:", totalWithFees)
  } catch (error) {
    console.error("[v0] ❌ JOB CREATION: Deposit deduction failed:", error)
    throw new Error(`Failed to process job creation deposit: ${error.message}`)
  }

  const newJob: Job = {
    id: `job_${Date.now()}`,
    jobNumber: nextJobNumber, // Added sequential job number
    formattedJobId: formattedJobId, // Added formatted job ID for display
    userId: data.userId,
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId,
    title: data.title,
    description: data.description,
    requirements: data.requirements,
    instructions: data.instructions,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    deadline: data.deadline,
    location: data.location || "Remote",
    isRemote: true,
    status: jobStatus,
    priority: "normal",
    skillsRequired: [],
    applicationsCount: 0,
    viewsCount: 0,
    workersNeeded: data.workersNeeded,
    maxWorkers: data.workersNeeded,
    tags: data.tags || [],
    attachments: data.attachments || [],
    requireScreenshots: data.requireScreenshots || 0,
    screenshotCost: (data.requireScreenshots || 0) * 0.05,
    estimatedApprovalDays: data.estimatedApprovalDays || 1,
    approvalType: data.approvalType || "manual",
    manualApprovalDays: finalManualApprovalDays,
    isInstantApprovalEnabled: canUseInstantApproval,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(), // All jobs are approved immediately
    approvedBy: "System",
    approvalReason: "Job approved for posting",
    estimatedTotalCost: subtotal,
    depositDeducted: totalWithFees,
    enableCountryRestrictions: data.enableCountryRestrictions || false,
    restrictionType: data.restrictionType || "include",
    allowedCountries: data.allowedCountries || [],
    restrictedCountries: data.restrictedCountries || [],
    category: {
      id: data.categoryId,
      name: "Unknown Category",
      slug: "unknown",
    },
  }

  const jobs = getStoredJobs()
  jobs.push(newJob)
  saveJobs(jobs)

  return newJob
}

export async function toggleJobOn(jobId: string, userId: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId && j.userId === userId)
  if (jobIndex === -1) throw new Error("Job not found or unauthorized")

  const job = jobs[jobIndex]
  const oldStatus = job.status

  // Only allow toggle if job was previously approved/open or suspended
  if (!["suspended", "open", "approved"].includes(oldStatus)) {
    throw new Error("Job cannot be turned on from current status")
  }

  const updatedJob = await updateJobStatus(jobId, "open", userId)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "open", userId, "Job turned on by owner", {
    userAction: "toggle_on",
    instantToggle: true,
  })

  return updatedJob
}

export async function toggleJobOff(jobId: string, userId: string): Promise<Job> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((j) => j.id === jobId && j.userId === userId)
  if (jobIndex === -1) throw new Error("Job not found or unauthorized")

  const job = jobs[jobIndex]
  const oldStatus = job.status

  // Only allow toggle if job is currently open/approved
  if (!["open", "approved"].includes(oldStatus)) {
    throw new Error("Job cannot be turned off from current status")
  }

  const updatedJob = await updateJobStatus(jobId, "suspended", userId)
  jobs[jobIndex] = updatedJob
  saveJobs(jobs)

  recordStatusChange(jobId, oldStatus, "suspended", userId, "Job turned off by owner", {
    userAction: "toggle_off",
    instantToggle: true,
  })

  return updatedJob
}

export async function updateJobWorkers(
  jobId: string,
  newWorkerCount: number,
  userId: string,
): Promise<{ success: boolean; message: string; additionalCost?: number }> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] 👥 UPDATE-WORKERS: Starting worker count update for job:", jobId)
  console.log("[v0] 👥 UPDATE-WORKERS: New worker count:", newWorkerCount)

  const jobs = getStoredJobs()
  const jobIndex = jobs.findIndex((job) => job.id === jobId && job.userId === userId)

  if (jobIndex === -1) {
    console.log("[v0] ❌ UPDATE-WORKERS: Job not found or unauthorized")
    return { success: false, message: "Job not found or you don't have permission to modify it." }
  }

  const job = jobs[jobIndex]
  const currentWorkerCount = job.workersNeeded
  const workerDifference = newWorkerCount - currentWorkerCount

  console.log("[v0] 👥 UPDATE-WORKERS: Current workers:", currentWorkerCount)
  console.log("[v0] 👥 UPDATE-WORKERS: Worker difference:", workerDifference)

  if (workerDifference === 0) {
    console.log("[v0] 👥 UPDATE-WORKERS: No change in worker count")
    return { success: true, message: "Worker count unchanged." }
  }

  if (workerDifference < 0) {
    console.log("[v0] 👥 UPDATE-WORKERS: Reducing worker count - no additional payment needed")
    jobs[jobIndex].workersNeeded = newWorkerCount
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs))
    console.log("[v0] 👥 UPDATE-WORKERS: Updated job saved to localStorage with key:", JOBS_STORAGE_KEY)
    return { success: true, message: `Worker count reduced to ${newWorkerCount}.` }
  }

  const costPerWorker = job.budgetMax || job.budgetMin || 0
  const additionalBaseCost = workerDifference * costPerWorker

  // Calculate additional screenshot costs proportionally
  let additionalScreenshotCost = 0
  if (job.requireScreenshots > 0) {
    try {
      const { calculateScreenshotCosts } = await import("./screenshot-pricing")

      // Calculate screenshot cost for new total workers
      const newTotalBaseCost = newWorkerCount * costPerWorker

      // Calculate current screenshot cost for comparison
      const currentTotalBaseCost = currentWorkerCount * costPerWorker
      const currentScreenshotCost = (await calculateScreenshotCosts(job.requireScreenshots, currentTotalBaseCost))
        .totalScreenshotCost

      const newScreenshotCost = (await calculateScreenshotCosts(job.requireScreenshots, newTotalBaseCost))
        .totalScreenshotCost

      additionalScreenshotCost = newScreenshotCost - currentScreenshotCost
      console.log("[v0] 👥 UPDATE-WORKERS: Additional screenshot cost:", additionalScreenshotCost)
    } catch (error) {
      console.error("[v0] ❌ UPDATE-WORKERS: Error calculating screenshot costs:", error)
    }
  }

  const platformFeeRate = 0.05
  const subtotal = additionalBaseCost + additionalScreenshotCost
  const platformFee = subtotal * platformFeeRate
  const totalAdditionalCost = subtotal + platformFee

  console.log("[v0] 👥 UPDATE-WORKERS: Cost breakdown:", {
    additionalBaseCost,
    additionalScreenshotCost,
    platformFee,
    totalAdditionalCost,
  })

  const { getWallet } = await import("./wallet")
  // Check wallet balance
  const wallet = await getWallet(userId)
  if (wallet.depositBalance < totalAdditionalCost) {
    console.log("[v0] ❌ UPDATE-WORKERS: Insufficient balance")
    return {
      success: false,
      message: `Insufficient deposit balance. Required: $${totalAdditionalCost.toFixed(2)}, Available: $${wallet.depositBalance.toFixed(2)}`,
    }
  }

  const { addWalletTransaction } = await import("./wallet")

  let transactionDescription = `Additional workers for job: ${job.title} (+${workerDifference} workers)`
  if (additionalScreenshotCost > 0) {
    transactionDescription += ` + $${additionalScreenshotCost.toFixed(2)} screenshot fee`
  }
  transactionDescription += ` + $${platformFee.toFixed(2)} platform fee)`

  // Deduct from wallet
  await addWalletTransaction({
    userId: userId,
    type: "payment",
    amount: -totalAdditionalCost,
    description: transactionDescription,
    referenceId: jobId,
    referenceType: "worker_update",
    balanceType: "deposit",
  })

  const newTotalBaseCost = newWorkerCount * costPerWorker
  let newTotalScreenshotCost = 0

  if (job.requireScreenshots > 0) {
    try {
      const { calculateScreenshotCosts } = await import("./screenshot-pricing")
      newTotalScreenshotCost = (await calculateScreenshotCosts(job.requireScreenshots, newTotalBaseCost))
        .totalScreenshotCost
    } catch (error) {
      console.error("[v0] Error recalculating total screenshot costs:", error)
    }
  }

  const newSubtotal = newTotalBaseCost + newTotalScreenshotCost
  const newPlatformFee = newSubtotal * platformFeeRate
  const newTotalCost = newSubtotal + newPlatformFee

  jobs[jobIndex] = {
    ...job,
    workersNeeded: newWorkerCount,
    estimatedTotalCost: newTotalCost,
  }

  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs))
  console.log("[v0] 👥 UPDATE-WORKERS: Updated job saved to localStorage with key:", JOBS_STORAGE_KEY)

  console.log("[v0] ✅ UPDATE-WORKERS: Worker count updated successfully")
  console.log("[v0] 👥 UPDATE-WORKERS: New total cost:", newTotalCost.toFixed(2))

  return {
    success: true,
    message: `Worker count updated to ${newWorkerCount}. Additional cost: $${totalAdditionalCost.toFixed(2)}`,
    additionalCost: totalAdditionalCost,
  }
}

export { getStoredJobs }

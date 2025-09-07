// Work proof submission and review system
export interface WorkProof {
  id: string
  jobId: string
  applicationId: string
  workerId: string
  employerId: string
  title: string
  description: string
  submissionText: string
  proofFiles: string[]
  proofLinks: string[]
  screenshots: string[]
  attachments?: string[]
  status:
    | "submitted"
    | "approved"
    | "rejected"
    | "revision_requested"
    | "auto_approved"
    | "rejected_accepted"
    | "disputed"
    | "cancelled_by_worker"
  submittedAt: string
  reviewedAt?: string
  reviewFeedback?: string
  paymentAmount: number
  submissionNumber: number
  createdAt: string
  updatedAt: string
  // New fields for enhanced workflow
  revisionCount?: number
  revisionDeadline?: string
  rejectionDeadline?: string
  workerResponse?: "accepted" | "disputed" | "cancelled"
  workerResponseAt?: string
  disputeReason?: string
  disputeEvidence?: string
  disputeRequestedAction?: string
  worker: {
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
    avatar?: string
  }
}

const WORK_PROOFS_STORAGE_KEY = "marketplace-work-proofs"

const getStoredWorkProofs = (): WorkProof[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(WORK_PROOFS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveWorkProofs = (proofs: WorkProof[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORK_PROOFS_STORAGE_KEY, JSON.stringify(proofs))
  } catch (error) {
    console.error("Failed to save work proofs:", error)
  }
}

export const getWorkProofs = (): WorkProof[] => {
  return getStoredWorkProofs()
}

const isAutoApprovalEnabled = (): boolean => {
  if (typeof window === "undefined") return false
  try {
    const setting = localStorage.getItem("admin_auto_approval_enabled")
    const isEnabled = setting === "true"
    console.log("[v0] Checking auto-approval setting:", setting, "-> enabled:", isEnabled)
    return isEnabled
  } catch (error) {
    console.error("[v0] Failed to check auto-approval setting:", error)
    return false
  }
}

export async function submitWorkProof(data: {
  jobId: string
  workerId: string
  applicationId?: string
  submissionText: string
  proofFiles: File[]
  proofLinks: string[]
  screenshots: File[]
  attachments?: File[]
}): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] 🚀 Starting work proof submission for job:", data.jobId, "worker:", data.workerId)

  const proofFiles = data.proofFiles || []
  const screenshots = data.screenshots || []
  const proofLinks = data.proofLinks || []
  const attachments = data.attachments || []

  console.log("[v0] 📸 PROCESSING FILES: Received", proofFiles.length, "files")

  let job: any = null
  let shouldProcessInstantPayment = false

  try {
    const { getJobById } = await import("./jobs")
    job = await getJobById(data.jobId)

    if (job) {
      console.log("[v0] 🔍 FULL JOB DEBUG:")
      console.log("[v0] 🔍 Job ID:", job.id)
      console.log("[v0] 🔍 Job title:", job.title)
      console.log("[v0] 🔍 Job approvalType:", job.approvalType)
      console.log("[v0] 🔍 Job isInstantApprovalEnabled:", job.isInstantApprovalEnabled)
      console.log("[v0] 🔍 Job instantApprovalEnabled:", job.instantApprovalEnabled)
      console.log("[v0] 🔍 Job instant_approval_enabled:", job.instant_approval_enabled)
      console.log("[v0] 🔍 Job instant_payment_enabled:", job.instant_payment_enabled)
      console.log("[v0] 🔍 Job requiresInstantApproval:", job.requiresInstantApproval)
      console.log("[v0] 🔍 Job autoApproval:", job.autoApproval)
      console.log("[v0] 🔍 Job instantPayment:", job.instantPayment)

      const hasInstantApproval =
        job.isInstantApprovalEnabled === true ||
        job.instantApprovalEnabled === true ||
        job.instant_approval_enabled === true ||
        job.instant_payment_enabled === true ||
        job.requiresInstantApproval === true ||
        job.autoApproval === true ||
        job.instantPayment === true

      shouldProcessInstantPayment = job.approvalType === "instant" && hasInstantApproval

      console.log("[v0] 📝 WORK PROOF: Job approval type:", job.approvalType)
      console.log("[v0] 📝 WORK PROOF: Has instant approval (any field):", hasInstantApproval)
      console.log("[v0] 📝 WORK PROOF: Should process instant payment:", shouldProcessInstantPayment)
    }
  } catch (error) {
    console.error("[v0] ❌ Failed to get job for instant approval check:", error)
  }

  const processedFiles: string[] = []
  const processedScreenshots: string[] = []
  const processedAttachments: string[] = []

  const processedFileNames = new Set<string>()

  for (let i = 0; i < proofFiles.length; i++) {
    const file = proofFiles[i]
    console.log("[v0] 📁 Processing file:", file.name, "type:", file.type, "size:", file.size)

    try {
      // Convert file to base64 for persistent storage
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
      }

      const fileDataString = JSON.stringify(fileData)
      processedFiles.push(fileDataString)
      processedAttachments.push(fileDataString)

      if (file.type.startsWith("image/") && !processedFileNames.has(file.name)) {
        processedScreenshots.push(fileDataString)
        processedFileNames.add(file.name)
        console.log("[v0] 📸 Added image to screenshots:", file.name)
      }

      console.log("[v0] ✅ Successfully processed file:", file.name)
    } catch (error) {
      console.error("[v0] ❌ Failed to process file:", file.name, error)
    }
  }

  for (let i = 0; i < screenshots.length; i++) {
    const file = screenshots[i]
    console.log("[v0] 📸 Processing screenshot:", file.name, "type:", file.type, "size:", file.size)

    try {
      // Convert file to base64 for persistent storage
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
      }

      const fileDataString = JSON.stringify(fileData)

      if (!processedFileNames.has(file.name)) {
        processedScreenshots.push(fileDataString)
        processedFileNames.add(file.name)
      }
      processedAttachments.push(fileDataString)

      console.log("[v0] ✅ Successfully processed screenshot:", file.name)
    } catch (error) {
      console.error("[v0] ❌ Failed to process screenshot:", file.name, error)
    }
  }

  console.log("[v0] 📊 FILE PROCESSING COMPLETE:")
  console.log("[v0] 📁 Total files processed:", processedFiles.length)
  console.log("[v0] 📸 Screenshots processed:", processedScreenshots.length)
  console.log("[v0] 📎 Attachments processed:", processedAttachments.length)

  let paymentAmount = 0
  let applicationId = data.applicationId

  try {
    const { getJobApplicationById, getJobApplications, getJobById } = await import("./jobs")

    // First try to get from specific application
    if (applicationId) {
      console.log("[v0] 🔍 Looking for specific application:", applicationId)
      try {
        const application = await getJobApplicationById(applicationId)
        if (application && application.status === "accepted" && application.proposedBudget > 0) {
          paymentAmount = application.proposedBudget
          console.log("[v0] ✅ Found accepted application with budget:", paymentAmount)
        } else {
          console.log("[v0] ⚠️ Application not accepted or has $0 budget:", application)
        }
      } catch (error) {
        console.error("[v0] ❌ Failed to get specific application:", error)
      }
    }

    // If no payment amount yet, search for ANY accepted application by this worker for this job
    if (paymentAmount === 0) {
      console.log("[v0] 🔍 Searching for ANY accepted application by worker:", data.workerId, "for job:", data.jobId)
      try {
        const applications = await getJobApplications(data.jobId)
        console.log("[v0] 📋 Found", applications.length, "applications for job")

        const acceptedApp = applications.find(
          (app) => app.applicantId === data.workerId && app.status === "accepted" && app.proposedBudget > 0,
        )

        if (acceptedApp) {
          paymentAmount = acceptedApp.proposedBudget
          applicationId = acceptedApp.id // Update application ID
          console.log(
            "[v0] ✅ Found accepted application for worker with budget:",
            paymentAmount,
            "app ID:",
            applicationId,
          )
        } else {
          console.log("[v0] ⚠️ No accepted application found for worker")
        }
      } catch (error) {
        console.error("[v0] ❌ Failed to search applications:", error)
      }
    }

    // Fallback to job minimum budget
    if (paymentAmount === 0) {
      console.log("[v0] 🔍 Using job minimum budget as fallback")
      try {
        const job = await getJobById(data.jobId)
        if (job && job.budgetMin > 0) {
          paymentAmount = job.budgetMin
          console.log("[v0] ✅ Using job minimum budget:", paymentAmount)
        } else {
          console.log("[v0] ⚠️ Job not found or has $0 budget")
        }
      } catch (error) {
        console.error("[v0] ❌ Failed to get job:", error)
      }
    }

    // Final fallback: minimum payment
    if (paymentAmount === 0) {
      paymentAmount = 25 // Minimum $25 payment
      console.warn("[v0] ⚠️ Using minimum $25 payment as final fallback")
    }
  } catch (error) {
    console.error("[v0] ❌ CRITICAL ERROR in payment calculation:", error)
    paymentAmount = 25 // Emergency fallback
  }

  console.log("[v0] 💰 FINAL PAYMENT AMOUNT:", paymentAmount, "for work proof")

  const { getAllUsers, getStoredUser } = await import("./auth")
  const users = getAllUsers()

  console.log("[v0] 🔍 DEBUG: Looking for worker with ID:", data.workerId)
  console.log(
    "[v0] 🔍 DEBUG: Available users in database:",
    users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, username: u.username })),
  )

  const workerUser = users.find((u) => u.id === data.workerId)
  console.log(
    "[v0] 👤 Found worker user:",
    workerUser ? `${workerUser.firstName} ${workerUser.lastName} (@${workerUser.username})` : "NOT FOUND",
  )

  // If worker not found, try to create a default user or find by different criteria
  let finalWorkerUser = workerUser
  if (!finalWorkerUser) {
    console.log("[v0] ⚠️ Worker not found, checking if we can find by other means...")
    // Try to find the currently logged in user as fallback
    const currentUser = getStoredUser()
    if (currentUser && currentUser.id === data.workerId) {
      finalWorkerUser = currentUser
      console.log(
        "[v0] ✅ Using current logged in user as worker:",
        finalWorkerUser.firstName,
        finalWorkerUser.lastName,
      )
    } else {
      // Create a temporary user entry for this worker ID
      console.log("[v0] ⚠️ Creating temporary user data for worker ID:", data.workerId)
      finalWorkerUser = {
        id: data.workerId,
        firstName: "Worker",
        lastName: `#${data.workerId}`,
        username: `worker${data.workerId}`,
        email: `worker${data.workerId}@temp.com`,
        userType: "user" as const,
        isVerified: false,
        deposit: 0,
        earning: 0,
        country: "Unknown",
        createdAt: new Date().toISOString(),
      }
    }
  }

  const employerUser = users.find((u) => u.id === job?.userId)
  console.log(
    "[v0] 👤 Found employer user:",
    employerUser ? `${employerUser.firstName} ${employerUser.lastName} (@${employerUser.username})` : "NOT FOUND",
  )

  const newProof: WorkProof = {
    id: Date.now().toString(),
    jobId: data.jobId,
    applicationId: applicationId || `app-${Date.now()}`,
    workerId: data.workerId,
    employerId: job?.userId || "employer-user",
    title: `Work proof for job ${data.jobId}`,
    description: data.submissionText,
    submissionText: data.submissionText,
    proofFiles: processedFiles,
    proofLinks: proofLinks,
    screenshots: processedScreenshots,
    attachments: processedAttachments,
    status: shouldProcessInstantPayment ? "approved" : "submitted",
    submittedAt: new Date().toISOString(),
    reviewedAt: shouldProcessInstantPayment ? new Date().toISOString() : undefined,
    reviewFeedback: shouldProcessInstantPayment ? "Automatically approved and paid (Instant Payment)" : undefined,
    paymentAmount,
    submissionNumber: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    worker: {
      id: data.workerId,
      firstName: finalWorkerUser?.firstName || "Unknown",
      lastName: finalWorkerUser?.lastName || "Worker",
      username: finalWorkerUser?.username || `user${data.workerId}`,
      avatar: finalWorkerUser?.avatar,
    },
    employer: {
      id: job?.userId || "employer-user",
      firstName: employerUser?.firstName || "Job",
      lastName: employerUser?.lastName || "Poster",
      username: employerUser?.username || "jobposter",
    },
  }

  if (shouldProcessInstantPayment && paymentAmount > 0) {
    try {
      console.log("[v0] 💰 INSTANT PAYMENT: Processing instant payment for work proof")

      const { addWalletTransaction } = await import("./wallet")

      // Calculate platform fee (5% default)
      const platformFeeRate = 0.05
      const platformFee = Math.round(paymentAmount * platformFeeRate * 100) / 100
      const workerAmount = Math.round((paymentAmount - platformFee) * 100) / 100

      console.log("[v0] 💰 INSTANT PAYMENT: Total amount:", paymentAmount)
      console.log("[v0] 💰 INSTANT PAYMENT: Platform fee:", platformFee)
      console.log("[v0] 💰 INSTANT PAYMENT: Worker receives:", workerAmount)

      const walletTransaction = await addWalletTransaction({
        userId: data.workerId,
        type: "earning",
        amount: workerAmount,
        description: `Instant payment for job: ${job?.title || "Job"}${job?.formattedJobId ? ` (#${job.formattedJobId})` : job?.jobNumber ? ` (#${job.jobNumber.toString().padStart(3, "0")})` : ""}`,
        referenceId: data.jobId,
        referenceType: "job_payment",
        balanceType: "earnings",
      })

      console.log("[v0] 💰 ✅ Payment successfully added to worker's wallet!")
      console.log("[v0] 💰 Transaction ID:", walletTransaction.id)
      console.log("[v0] 💰 Worker", data.workerId, "received $", workerAmount, "in earnings balance")

      const { createNotification } = await import("./notifications")
      await createNotification({
        userId: data.workerId,
        type: "payment",
        title: "Instant Payment Received! 💰",
        description: `You received $${workerAmount.toFixed(2)} for completing "${job?.title || "the job"}". Payment has been added to your withdrawal balance.`,
        actionUrl: `/dashboard/wallet`,
      })

      // Create notification for employer
      if (job?.userId) {
        await createNotification({
          userId: job.userId,
          type: "job",
          title: "Work Submitted & Payment Released",
          description: `Work has been submitted for "${job.title}" and instant payment of $${paymentAmount.toFixed(2)} has been released to the worker.`,
          actionUrl: `/dashboard/jobs/${data.jobId}`,
        })
      }

      console.log("[v0] ✅ INSTANT PAYMENT: Notifications sent successfully")
    } catch (error) {
      console.error("[v0] ❌ INSTANT PAYMENT: Error processing instant payment:", error)
      newProof.status = "submitted"
      newProof.reviewedAt = undefined
      newProof.reviewFeedback = undefined
      shouldProcessInstantPayment = false
      console.log("[v0] ⚠️ INSTANT PAYMENT: Reverted to manual approval due to payment error")
    }
  } else if (!shouldProcessInstantPayment) {
    console.log("[v0] 📝 WORK PROOF: Manual approval required, creating notification for employer")
    console.log("[v0] 🔍 DEBUG: Instant payment not processed because:")
    console.log("[v0] 🔍 DEBUG: - Job approval type:", job?.approvalType)
    console.log("[v0] 🔍 DEBUG: - Has instant approval enabled:", shouldProcessInstantPayment)
    console.log("[v0] 🔍 DEBUG: - Payment amount:", paymentAmount)

    try {
      const { createNotification } = await import("./notifications")
      if (job?.userId) {
        await createNotification({
          userId: job.userId,
          type: "job",
          title: "Work Submitted for Review",
          description: `Work has been submitted for "${job.title}". Please review and approve within ${job.manualApprovalDays || 3} days.`,
          actionUrl: `/dashboard/jobs/${data.jobId}`,
        })
      }
    } catch (error) {
      console.error("[v0] ❌ Failed to create notification:", error)
    }
  }

  const proofs = getStoredWorkProofs()
  proofs.push(newProof)
  saveWorkProofs(proofs)

  console.log("[v0] ✅ Work proof created successfully!")
  console.log("[v0] 💰 Payment amount stored:", newProof.paymentAmount)
  console.log("[v0] 📋 Work proof ID:", newProof.id)
  console.log("[v0] 🔗 Application ID:", newProof.applicationId)
  console.log("[v0] ⚡ Instant approval:", shouldProcessInstantPayment ? "YES" : "NO")
  console.log("[v0] 📊 Final status:", newProof.status)

  return newProof
}

export async function getWorkProofsByJob(jobId: string): Promise<WorkProof[]> {
  console.log("[v0] Loading work proofs for job:", jobId)
  await new Promise((resolve) => setTimeout(resolve, 300))

  // The automatic processing should only happen server-side via the cron job endpoint

  const proofs = getStoredWorkProofs()
  const jobProofs = proofs.filter((proof) => proof.jobId === jobId)
  console.log("[v0] Found work proofs for job", jobId, ":", jobProofs)
  return jobProofs
}

export async function getWorkProofById(proofId: string): Promise<WorkProof | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const proofs = getStoredWorkProofs()
  return proofs.find((proof) => proof.id === proofId) || null
}

export async function approveWorkProof(proofId: string, reviewNotes?: string): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] 🔍 Starting approval process for proof ID:", proofId)

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) {
    console.error("[v0] ❌ Work proof not found:", proofId)
    throw new Error("Work proof not found")
  }

  const proof = proofs[proofIndex]
  console.log("[v0] 📋 Found work proof:", proof.title, "Payment amount:", proof.paymentAmount)

  if (proof.paymentAmount === 0 || proof.paymentAmount === null || proof.paymentAmount === undefined) {
    console.error("[v0] ❌ CRITICAL ERROR: Work proof has invalid payment amount:", proof.paymentAmount)

    try {
      const { getJobApplicationById, getJobApplications, getJobById } = await import("./jobs")

      let fixedPaymentAmount = 0

      // Try to get from application
      if (proof.applicationId) {
        console.log("[v0] 🔧 Attempting to fix payment from application:", proof.applicationId)
        try {
          const application = await getJobApplicationById(proof.applicationId)
          if (application && application.status === "accepted" && application.proposedBudget > 0) {
            fixedPaymentAmount = application.proposedBudget
            console.log("[v0] ✅ Fixed payment amount from application:", fixedPaymentAmount)
          }
        } catch (error) {
          console.error("[v0] ❌ Failed to get application for fixing:", error)
        }
      }

      // Search for any accepted application by this worker
      if (fixedPaymentAmount === 0) {
        console.log("[v0] 🔧 Searching for accepted application by worker:", proof.workerId)
        try {
          const applications = await getJobApplications(proof.jobId)
          const acceptedApp = applications.find(
            (app) => app.applicantId === proof.workerId && app.status === "accepted" && app.proposedBudget > 0,
          )
          if (acceptedApp) {
            fixedPaymentAmount = acceptedApp.proposedBudget
            console.log("[v0] ✅ Fixed payment amount from worker's accepted application:", fixedPaymentAmount)
          }
        } catch (error) {
          console.error("[v0] ❌ Failed to search applications for fixing:", error)
        }
      }

      // Fallback to job minimum budget
      if (fixedPaymentAmount === 0) {
        console.log("[v0] 🔧 Using job minimum budget as fallback")
        try {
          const job = await getJobById(proof.jobId)
          if (job && job.budgetMin > 0) {
            fixedPaymentAmount = job.budgetMin
            console.log("[v0] ✅ Fixed payment amount from job budget:", fixedPaymentAmount)
          }
        } catch (error) {
          console.error("[v0] ❌ Failed to get job for fixing:", error)
        }
      }

      // Final fallback
      if (fixedPaymentAmount === 0) {
        fixedPaymentAmount = 25
        console.log("[v0] ⚠️ Using minimum $25 payment as final fallback")
      }

      // Update the proof with fixed payment amount
      proof.paymentAmount = fixedPaymentAmount
      console.log("[v0] ✅ Fixed payment amount to:", fixedPaymentAmount)
    } catch (error) {
      console.error("[v0] ❌ Failed to fix payment amount:", error)
      throw new Error("Cannot approve work proof with invalid payment amount")
    }
  }

  const updatedProof = {
    ...proof,
    status: "approved" as const,
    reviewedAt: new Date().toISOString(),
    reviewFeedback: reviewNotes || "Work approved by employer",
    updatedAt: new Date().toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  console.log("[v0] ✅ Work proof approved by employer:", proofId)
  console.log("[v0] 💰 Processing payment of $", updatedProof.paymentAmount, "to worker", updatedProof.workerId)

  try {
    const { addWalletTransaction } = await import("./wallet")
    const walletTransaction = await addWalletTransaction({
      userId: updatedProof.workerId,
      type: "earning",
      amount: updatedProof.paymentAmount,
      description: `Payment for completed work: ${updatedProof.title}`,
      referenceId: proofId,
      referenceType: "work_completion",
    })

    console.log("[v0] 💰 ✅ Payment successfully added to worker's wallet!")
    console.log("[v0] 💰 Transaction ID:", walletTransaction.id)
    console.log(
      "[v0] 💰 Worker",
      updatedProof.workerId,
      "received $",
      updatedProof.paymentAmount,
      "in earnings balance",
    )

    const { getJobById, updateJobStatus } = await import("./jobs")
    const job = await getJobById(updatedProof.jobId)

    if (job) {
      const workersNeeded = job.workersNeeded || job.maxWorkers || 1

      // Get all approved work proofs for this job
      const allJobProofs = proofs.filter((p) => p.jobId === updatedProof.jobId && p.status === "approved")

      // Count unique workers who have completed work
      const uniqueWorkers = new Set(allJobProofs.map((p) => p.workerId))
      const completedWorkers = uniqueWorkers.size

      console.log("[v0] 📊 Job completion check:")
      console.log("[v0] 📊 Workers needed:", workersNeeded)
      console.log("[v0] 📊 Completed workers:", completedWorkers)
      console.log("[v0] 📊 Unique workers with approved work:", Array.from(uniqueWorkers))

      if (completedWorkers >= workersNeeded) {
        // All required workers have completed work - mark job as completed
        await updateJobStatus(updatedProof.jobId, "completed", updatedProof.workerId, {
          completedBy: updatedProof.workerId,
          paymentAmount: updatedProof.paymentAmount,
          completedAt: new Date().toISOString(),
          totalWorkersCompleted: completedWorkers,
          workersNeeded: workersNeeded,
        })
        console.log("[v0] ✅ Job", updatedProof.jobId, "marked as COMPLETED - all", workersNeeded, "workers finished")
      } else {
        // Still need more workers - keep job in progress
        await updateJobStatus(updatedProof.jobId, "in_progress", updatedProof.workerId, {
          completedBy: updatedProof.workerId,
          paymentAmount: updatedProof.paymentAmount,
          workersCompleted: completedWorkers,
          workersNeeded: workersNeeded,
          workersRemaining: workersNeeded - completedWorkers,
        })
        console.log(
          "[v0] 🔄 Job",
          updatedProof.jobId,
          "remains IN PROGRESS -",
          completedWorkers,
          "of",
          workersNeeded,
          "workers completed",
        )
      }
    } else {
      console.error("[v0] ❌ Could not find job to update status:", updatedProof.jobId)
    }
  } catch (error) {
    console.error("[v0] ❌ CRITICAL ERROR: Failed to process payment or update job status:", error)
    throw error
  }

  return updatedProof
}

export async function rejectWorkProof(proofId: string, rejectionReason: string): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]

  const { getRevisionSettingsFromAPI } = await import("./admin-settings")
  const revisionSettings = await getRevisionSettingsFromAPI()

  // Calculate rejection deadline based on admin settings
  const timeoutValue = revisionSettings.rejectionResponseTimeoutValue || 24
  const timeoutUnit = revisionSettings.rejectionResponseTimeoutUnit || "hours"

  let timeoutMs = 0
  switch (timeoutUnit) {
    case "minutes":
      timeoutMs = timeoutValue * 60 * 1000
      break
    case "hours":
      timeoutMs = timeoutValue * 60 * 60 * 1000
      break
    case "days":
      timeoutMs = timeoutValue * 24 * 60 * 60 * 1000
      break
    default:
      timeoutMs = 24 * 60 * 60 * 1000 // fallback to 24 hours
  }

  const updatedProof = {
    ...proof,
    status: "rejected" as const,
    reviewedAt: new Date().toISOString(),
    reviewFeedback: rejectionReason,
    updatedAt: new Date().toISOString(),
    rejectionDeadline: new Date(Date.now() + timeoutMs).toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  try {
    const { createNotification } = await import("./notifications")

    const timeoutText =
      timeoutUnit === "minutes" && timeoutValue < 60
        ? `${timeoutValue} minutes`
        : timeoutUnit === "hours" && timeoutValue < 24
          ? `${timeoutValue} hours`
          : `${timeoutValue} ${timeoutUnit}`

    await createNotification({
      userId: proof.workerId,
      type: "job",
      title: "Work Rejected - Action Required",
      description: `Your work for "${proof.title}" was rejected. You have ${timeoutText} to accept or dispute this decision.`,
      actionUrl: `/dashboard/applied-jobs`,
    })
  } catch (error) {
    console.error("[v0] Failed to create rejection notification:", error)
  }

  return updatedProof
}

export async function requestRevision(
  proofId: string,
  revisionNotes: string,
  revisionCount?: number,
): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]

  const { getRevisionSettingsFromAPI } = await import("./admin-settings")
  const revisionSettings = await getRevisionSettingsFromAPI()

  const maxRevisions = revisionSettings.maxRevisionRequests || 2
  const currentRevisionCount = proof.revisionCount || 0
  const newRevisionCount = revisionCount !== undefined ? revisionCount : currentRevisionCount + 1

  if (newRevisionCount > maxRevisions) {
    throw new Error(`Maximum revision requests (${maxRevisions}) exceeded. Please reject or approve the work.`)
  }

  const timeoutValue = revisionSettings.revisionRequestTimeoutValue || 24
  const timeoutUnit = revisionSettings.revisionRequestTimeoutUnit || "hours"

  let timeoutMs = 0
  switch (timeoutUnit) {
    case "minutes":
      timeoutMs = timeoutValue * 60 * 1000
      break
    case "hours":
      timeoutMs = timeoutValue * 60 * 60 * 1000
      break
    case "days":
      timeoutMs = timeoutValue * 24 * 60 * 60 * 1000
      break
    default:
      timeoutMs = 24 * 60 * 60 * 1000 // fallback to 24 hours
  }

  const updatedProof = {
    ...proof,
    status: "revision_requested" as const,
    reviewedAt: new Date().toISOString(),
    reviewFeedback: revisionNotes,
    updatedAt: new Date().toISOString(),
    revisionCount: newRevisionCount,
    revisionDeadline: new Date(Date.now() + timeoutMs).toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  try {
    const { createNotification } = await import("./notifications")

    const timeoutText =
      timeoutUnit === "minutes" && timeoutValue < 60
        ? `${timeoutValue} minutes`
        : timeoutUnit === "hours" && timeoutValue < 24
          ? `${timeoutValue} hours`
          : `${timeoutValue} ${timeoutUnit}`

    await createNotification({
      userId: proof.workerId,
      type: "job",
      title: `Revision Requested (${newRevisionCount}/${maxRevisions})`,
      description: `Your work needs revision. You have ${timeoutText} to resubmit or cancel the job.`,
      actionUrl: `/dashboard/applied-jobs`,
    })
  } catch (error) {
    console.error("[v0] Failed to create revision notification:", error)
  }

  return updatedProof
}

export async function acceptRejection(proofId: string): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]

  if (proof.status === "rejected_accepted") {
    console.log("[v0] ⚠️ WORK PROOF: Rejection already accepted for proof:", proofId)
    return proof
  }

  if (proof.status !== "rejected") {
    console.log("[v0] ⚠️ WORK PROOF: Cannot accept rejection - proof status is:", proof.status)
    throw new Error(`Cannot accept rejection for proof with status: ${proof.status}`)
  }

  const updatedProof = {
    ...proof,
    status: "rejected_accepted" as const,
    workerResponse: "accepted",
    workerResponseAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  try {
    const { addWalletTransaction } = await import("./wallet")
    const { getJobById } = await import("./jobs")

    const job = await getJobById(proof.jobId)

    if (job?.userId && proof.paymentAmount > 0) {
      await addWalletTransaction({
        userId: job.userId,
        type: "refund",
        amount: proof.paymentAmount,
        description: `Refund for rejected work: "${job.title}" (Job #${job.sequentialId || job.id})`,
        referenceId: proofId,
        referenceType: "work_rejection_refund",
        balanceType: "deposit",
      })

      // Notify employer about refund
      const { createNotification } = await import("./notifications")
      await createNotification({
        userId: job.userId,
        type: "payment",
        title: "Refund Processed",
        description: `$${proof.paymentAmount.toFixed(2)} refunded for rejected work: ${proof.title}`,
        actionUrl: `/dashboard/wallet`,
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log("[v0] ⚠️ WORK PROOF: Refund already processed for proof:", proofId)
    } else {
      console.error("[v0] Failed to process rejection refund:", error)
      const proofs = getStoredWorkProofs()
      const proofIndex = proofs.findIndex((p) => p.id === proofId)
      if (proofIndex !== -1) {
        proofs[proofIndex] = { ...proof, status: "rejected" }
        saveWorkProofs(proofs)
      }
      throw error
    }
  }

  return updatedProof
}

export async function createDispute(
  proofId: string,
  disputeData: {
    reason: string
    evidence: string
    requestedAction: string
  },
): Promise<void> {
  console.log("[v0] Creating dispute for proof:", proofId, "with data:", disputeData)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]
  console.log("[v0] Found work proof for dispute:", proof.id, "job:", proof.jobId)

  const updatedProof = {
    ...proof,
    status: "disputed" as const,
    workerResponse: "disputed",
    workerResponseAt: new Date().toISOString(),
    disputeReason: disputeData.reason,
    disputeEvidence: disputeData.evidence,
    disputeRequestedAction: disputeData.requestedAction,
    updatedAt: new Date().toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)
  console.log("[v0] Updated work proof status to disputed")

  try {
    console.log("[v0] Importing admin dispute functions...")
    const { createAdminDispute } = await import("./admin-disputes")
    const { getJobById } = await import("./jobs")

    console.log("[v0] Getting job details for dispute...")
    const job = await getJobById(proof.jobId)
    console.log("[v0] Job details:", job?.title || "Unknown Job")

    console.log("[v0] Creating admin dispute...")
    await createAdminDispute({
      jobId: proof.jobId,
      workProofId: proofId,
      workerId: proof.workerId,
      employerId: proof.employerId,
      jobTitle: job?.title || "Unknown Job",
      workerName: `${proof.worker.firstName} ${proof.worker.lastName}`,
      employerName: job?.user ? `${job.user.firstName} ${job.user.lastName}` : "Unknown Employer",
      amount: proof.paymentAmount,
      reason: disputeData.reason,
      description: disputeData.evidence,
      requestedAction: disputeData.requestedAction,
      priority: "medium",
      evidenceCount: 0,
    })
    console.log("[v0] Admin dispute created successfully!")

    const { createNotification } = await import("./notifications")
    await createNotification({
      userId: "admin",
      type: "admin",
      title: "New Dispute Filed",
      description: `Worker disputed rejection for "${job?.title || "job"}". Review required.`,
      actionUrl: `/admin/disputes`,
    })
    console.log("[v0] Admin notification created")
  } catch (error) {
    console.error("[v0] Failed to create admin dispute:", error)
    throw error
  }
}

export async function cancelJobByWorker(proofId: string): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]

  const updatedProof = {
    ...proof,
    status: "cancelled_by_worker" as const,
    workerResponse: "cancelled",
    workerResponseAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  try {
    const { addWalletTransaction } = await import("./wallet")
    const { getJobById } = await import("./jobs")

    const job = await getJobById(proof.jobId)

    if (job?.userId && proof.paymentAmount > 0) {
      await addWalletTransaction({
        userId: job.userId,
        type: "refund",
        amount: proof.paymentAmount,
        description: `Refund for cancelled job: "${job.title}" (Job #${job.sequentialId || job.id})`,
        referenceId: proofId,
        referenceType: "job_cancellation_refund",
        balanceType: "deposit",
      })

      // Notify employer about cancellation and refund
      const { createNotification } = await import("./notifications")
      await createNotification({
        userId: job.userId,
        type: "job",
        title: "Job Cancelled by Worker",
        description: `Worker cancelled the job "${proof.title}". $${proof.paymentAmount.toFixed(2)} has been refunded.`,
        actionUrl: `/dashboard/jobs`,
      })
    }
  } catch (error) {
    console.error("[v0] Failed to process cancellation refund:", error)
  }

  return updatedProof
}

export async function resubmitWork(
  proofId: string,
  resubmissionData: {
    description: string
    proofFiles: File[]
    proofLinks: string[]
    additionalNotes?: string
  },
): Promise<WorkProof> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.id === proofId)
  if (proofIndex === -1) throw new Error("Work proof not found")

  const proof = proofs[proofIndex]

  // Process new files
  const processedFiles: string[] = []
  const processedScreenshots: string[] = []
  const processedAttachments: string[] = []

  const processedFileNames = new Set<string>()

  for (let i = 0; i < resubmissionData.proofFiles.length; i++) {
    const file = resubmissionData.proofFiles[i]

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
      }

      const fileDataString = JSON.stringify(fileData)
      processedFiles.push(fileDataString)
      processedAttachments.push(fileDataString)

      if (file.type.startsWith("image/") && !processedFileNames.has(file.name)) {
        processedScreenshots.push(fileDataString)
        processedFileNames.add(file.name)
      }
    } catch (error) {
      console.error("[v0] Failed to process resubmission file:", file.name, error)
    }
  }

  const updatedProof = {
    ...proof,
    status: "submitted" as const,
    description: resubmissionData.description,
    submissionText: resubmissionData.description,
    proofFiles: processedFiles,
    proofLinks: resubmissionData.proofLinks,
    screenshots: processedScreenshots,
    attachments: processedAttachments,
    submittedAt: new Date().toISOString(), // Update submission time
    reviewedAt: undefined, // Clear previous review
    reviewFeedback: undefined, // Clear previous feedback
    submissionNumber: (proof.submissionNumber || 1) + 1,
    updatedAt: new Date().toISOString(),
    // Clear revision deadline since work is resubmitted
    revisionDeadline: undefined,
  }

  proofs[proofIndex] = updatedProof
  saveWorkProofs(proofs)

  try {
    const { createNotification } = await import("./notifications")
    const { getJobById } = await import("./jobs")

    const job = await getJobById(proof.jobId)

    if (job?.userId) {
      await createNotification({
        userId: job.userId,
        type: "job",
        title: "Work Resubmitted",
        description: `Worker has resubmitted work for "${proof.title}". Please review the updated submission.`,
        actionUrl: `/dashboard/jobs/${proof.jobId}/work-proofs`,
      })
    }
  } catch (error) {
    console.error("[v0] Failed to create resubmission notification:", error)
  }

  return updatedProof
}

export const getWorkProofStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "bg-blue-100 text-blue-800"
    case "approved":
      return "bg-green-100 text-green-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "revision_requested":
      return "bg-yellow-100 text-yellow-800"
    case "auto_approved":
      return "bg-green-200 text-green-900"
    case "rejected_accepted":
      return "bg-gray-100 text-gray-800"
    case "disputed":
      return "bg-orange-100 text-orange-800"
    case "cancelled_by_worker":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export const getWorkProofStatusLabel = (status: string) => {
  switch (status) {
    case "submitted":
      return "Submitted"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    case "revision_requested":
      return "Revision Requested"
    case "auto_approved":
      return "Auto Approved"
    case "rejected_accepted":
      return "Rejection Accepted"
    case "disputed":
      return "Under Dispute"
    case "cancelled_by_worker":
      return "Cancelled"
    default:
      return status
  }
}

export async function processExpiredDeadlines(): Promise<void> {
  console.log("[v0] 🕐 Processing expired deadlines...")

  try {
    const proofs = getStoredWorkProofs()
    let processedCount = 0

    for (const proof of proofs) {
      const now = new Date()

      // Auto-accept rejections after 24 hours
      if (proof.status === "rejected" && proof.rejectionDeadline) {
        const deadline = new Date(proof.rejectionDeadline)
        if (now > deadline) {
          console.log("[v0] ⏰ Auto-accepting rejection for proof:", proof.id)
          await acceptRejection(proof.id)
          processedCount++
        }
      }

      // Auto-cancel jobs with expired revision deadlines
      if (proof.status === "revision_requested" && proof.revisionDeadline) {
        const deadline = new Date(proof.revisionDeadline)
        if (now > deadline) {
          console.log("[v0] ⏰ Auto-cancelling job due to expired revision deadline:", proof.id)
          await cancelJobByWorker(proof.id)
          processedCount++
        }
      }
    }

    if (processedCount > 0) {
      console.log("[v0] ✅ Processed", processedCount, "expired deadlines")
    }
  } catch (error) {
    console.error("[v0] ❌ Error processing expired deadlines:", error)
  }
}

export async function processExpiredWorkProofs(): Promise<number> {
  console.log("[v0] 🕐 Processing expired work proof deadlines...")

  const isFromCron = process.env.CRON_PROCESSING === "true"
  const isClientSide = typeof window !== "undefined"

  console.log("[v0] 🔍 Environment check:")
  console.log("[v0] - CRON_PROCESSING env var:", process.env.CRON_PROCESSING)
  console.log("[v0] - isFromCron:", isFromCron)
  console.log("[v0] - isClientSide:", isClientSide)
  console.log("[v0] - typeof window:", typeof window)

  // Only skip if we're on client side AND not from cron
  if (isClientSide && !isFromCron) {
    console.log("[v0] ⚠️ Skipping timeout processing - should only run from cron jobs or server")
    console.log("[v0] ⚠️ Reason: Running on client side without cron authorization")
    return 0
  }

  if (!isFromCron && !isClientSide) {
    console.log("[v0] ⚠️ Skipping timeout processing - running on server but not from cron job")
    console.log("[v0] ⚠️ This prevents processing during page loads and API calls")
    return 0
  }

  console.log("[v0] ✅ Processing authorized - isFromCron:", isFromCron, "isClientSide:", isClientSide)

  try {
    const { getRevisionSettingsFromAPI } = await import("./admin-settings")

    let revisionSettings
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        revisionSettings = await getRevisionSettingsFromAPI()
        break
      } catch (error) {
        retryCount++
        console.error(`[v0] ❌ Failed to get revision settings (attempt ${retryCount}/${maxRetries}):`, error)

        if (retryCount >= maxRetries) {
          console.log("[v0] ⚠️ Using fallback settings after max retries")
          revisionSettings = {
            maxRevisionRequests: 2,
            revisionRequestTimeoutValue: 24,
            revisionRequestTimeoutUnit: "hours" as const,
            rejectionResponseTimeoutValue: 24,
            rejectionResponseTimeoutUnit: "hours" as const,
            enableAutomaticRefunds: true,
            refundOnRevisionTimeout: true,
            refundOnRejectionTimeout: true,
            enableRevisionWarnings: true,
            revisionPenaltyEnabled: false,
            revisionPenaltyAmount: 0,
          }
        } else {
          // Wait 1 second before retry
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    console.log("[v0] ⚙️ Revision settings loaded:", {
      enableAutomaticRefunds: revisionSettings.enableAutomaticRefunds,
      refundOnRevisionTimeout: revisionSettings.refundOnRevisionTimeout,
      refundOnRejectionTimeout: revisionSettings.refundOnRejectionTimeout,
    })

    const proofs = getStoredWorkProofs()
    const now = new Date()
    let processedCount = 0
    let errorCount = 0

    console.log(`[v0] 📊 Found ${proofs.length} work proofs to check for expiration`)

    for (const proof of proofs) {
      if (proof.status === "rejected_accepted" || proof.status === "cancelled_by_worker") {
        continue
      }

      try {
        if (proof.status === "submitted") {
          try {
            const { getJobById } = await import("./jobs")
            const job = await getJobById(proof.jobId)
            if (job && job.approvalType === "manual") {
              const submittedAt = new Date(proof.submittedAt)
              const approvalDays = job.manualApprovalDays || 3
              const approvalDeadline = new Date(submittedAt.getTime() + approvalDays * 24 * 60 * 60 * 1000)

              if (now > approvalDeadline) {
                console.log("[v0] ⏰ Auto-approving expired submitted work proof:", proof.id)
                await approveWorkProof(proof.id, "Automatically approved due to deadline expiration")
                processedCount++
                continue
              }
            }
          } catch (error) {
            console.error("[v0] ❌ Failed to process submitted work proof:", proof.id, error)
            errorCount++
            continue
          }
        }

        if (proof.status === "rejected" && proof.rejectionDeadline) {
          const deadline = new Date(proof.rejectionDeadline)
          if (now > deadline) {
            console.log("[v0] ⏰ Processing expired rejection for proof:", proof.id)
            console.log(
              "[v0] 💰 Refund settings - enabled:",
              revisionSettings.enableAutomaticRefunds,
              "on rejection timeout:",
              revisionSettings.refundOnRejectionTimeout,
            )

            if (revisionSettings.enableAutomaticRefunds && revisionSettings.refundOnRejectionTimeout) {
              console.log("[v0] 💰 Processing automatic refund for rejection timeout")
              try {
                await acceptRejection(proof.id)
                console.log("[v0] ✅ Successfully processed rejection refund for proof:", proof.id)
              } catch (error) {
                if (error instanceof Error && error.message.includes("already processed")) {
                  console.log("[v0] ⚠️ Rejection already processed for proof:", proof.id)
                } else if (error instanceof Error && error.message.includes("already exists")) {
                  console.log("[v0] ⚠️ Refund already exists for proof:", proof.id)
                } else {
                  console.error("[v0] ❌ Failed to process rejection refund for proof:", proof.id, error)
                  errorCount++
                  continue
                }
              }
            } else {
              console.log("[v0] ⚠️ Automatic refunds disabled - marking as accepted without refund")
              const proofs = getStoredWorkProofs()
              const proofIndex = proofs.findIndex((p) => p.id === proof.id)
              if (proofIndex !== -1 && proofs[proofIndex].status === "rejected") {
                proofs[proofIndex] = {
                  ...proofs[proofIndex],
                  status: "rejected_accepted" as const,
                  workerResponse: "accepted",
                  workerResponseAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
                saveWorkProofs(proofs)
              }
            }
            processedCount++
          }
        }

        if (proof.status === "revision_requested" && proof.revisionDeadline) {
          const deadline = new Date(proof.revisionDeadline)
          if (now > deadline) {
            console.log("[v0] ⏰ Processing expired revision deadline for proof:", proof.id)
            console.log(
              "[v0] 💰 Refund settings - enabled:",
              revisionSettings.enableAutomaticRefunds,
              "on revision timeout:",
              revisionSettings.refundOnRevisionTimeout,
            )

            if (revisionSettings.enableAutomaticRefunds && revisionSettings.refundOnRevisionTimeout) {
              console.log("[v0] 💰 Processing automatic refund for revision timeout")
              try {
                await cancelJobByWorker(proof.id)
                console.log("[v0] ✅ Successfully processed revision timeout refund for proof:", proof.id)
              } catch (error) {
                if (error instanceof Error && error.message.includes("already processed")) {
                  console.log("[v0] ⚠️ Revision timeout already processed for proof:", proof.id)
                } else if (error instanceof Error && error.message.includes("already exists")) {
                  console.log("[v0] ⚠️ Refund already exists for proof:", proof.id)
                } else {
                  console.error("[v0] ❌ Failed to process revision timeout refund for proof:", proof.id, error)
                  errorCount++
                  continue
                }
              }
            } else {
              console.log("[v0] ⚠️ Automatic refunds disabled - marking as cancelled without refund")
              const proofs = getStoredWorkProofs()
              const proofIndex = proofs.findIndex((p) => p.id === proof.id)
              if (proofIndex !== -1 && proofs[proofIndex].status === "revision_requested") {
                proofs[proofIndex] = {
                  ...proofs[proofIndex],
                  status: "cancelled_by_worker" as const,
                  updatedAt: new Date().toISOString(),
                }
                saveWorkProofs(proofs)
              }
            }
            processedCount++
          }
        }
      } catch (error) {
        console.error("[v0] ❌ Error processing proof:", proof.id, error)
        errorCount++
      }
    }

    console.log(`[v0] ✅ Automatic timeout processing completed. Processed ${processedCount} expired deadlines.`)
    if (errorCount > 0) {
      console.warn(`[v0] ⚠️ Encountered ${errorCount} errors during processing`)
    }
    return processedCount
  } catch (error) {
    console.error("[v0] ❌ Error in processExpiredWorkProofs:", error)
    return 0
  }
}

// Removing duplicate function
// export async function acceptRejection(proofId: string): Promise<WorkProof> {
//   console.log("[v0] 🔄 Processing rejection acceptance for proof:", proofId)

//   const proofs = getStoredWorkProofs()
//   const proofIndex = proofs.findIndex((p) => p.id === proofId)
//   if (proofIndex === -1) throw new Error("Work proof not found")

//   const proof = proofs[proofIndex]

//   if (proof.status === "rejected_accepted") {
//     console.log("[v0] ⚠️ Rejection already processed for proof:", proofId)
//     throw new Error("This rejection has already been processed")
//   }

//   if (proof.status !== "rejected") {
//     throw new Error("Work proof is not in rejected status")
//   }

//   const updatedProof = {
//     ...proof,
//     status: "rejected_accepted" as const,
//     workerResponse: "accepted",
//     workerResponseAt: new Date().toISOString(),
//     updatedAt: new Date().toISOString(),
//   }

//   proofs[proofIndex] = updatedProof
//   saveWorkProofs(proofs)

//   try {
//     const { getJobById } = await import("./jobs")
//     const job = await getJobById(proof.jobId)

//     if (job?.userId && proof.paymentAmount > 0) {
//       await addWalletTransaction({
//         userId: job.userId,
//         type: "refund",
//         amount: proof.paymentAmount,
//         description: `Refund for rejected work: ${proof.title}`,
//         referenceId: proofId,
//         referenceType: "work_rejection_refund",
//         balanceType: "deposit",
//       })

//       const { createNotification } = await import("./notifications")
//       await createNotification({
//         userId: job.userId,
//         type: "payment",
//         title: "Refund Processed",
//         description: `$${proof.paymentAmount.toFixed(2)} refunded for rejected work: ${proof.title}`,
//         actionUrl: `/dashboard/wallet`,
//       })
//     }
//   } catch (error) {
//     if (error instanceof Error && error.message.includes("already exists")) {
//       console.log("[v0] ⚠️ WORK PROOF: Refund already processed for proof:", proofId)
//     } else {
//       console.error("[v0] Failed to process rejection refund:", error)
//       const proofs = getStoredWorkProofs()
//       const proofIndex = proofs.findIndex((p) => p.id === proofId)
//       if (proofIndex !== -1) {
//         proofs[proofIndex] = { ...proof, status: "rejected" }
//         saveWorkProofs(proofs)
//       }
//       throw error
//     }
//   }

//   return updatedProof
// }

// Removing duplicate function
// export async function cancelJobByWorker(proofId: string): Promise<WorkProof> {
//   console.log("[v0] 🔄 Processing worker job cancellation for proof:", proofId)

//   const proofs = getStoredWorkProofs()
//   const proofIndex = proofs.findIndex((p) => p.id === proofId)
//   if (proofIndex === -1) throw new Error("Work proof not found")

//   const proof = proofs[proofIndex]

//   if (proof.status === "cancelled_by_worker") {
//     console.log("[v0] ⚠️ Worker cancellation already processed for proof:", proofId)
//     throw new Error("This work proof has already been cancelled")
//   }

//   const updatedProof = {
//     ...proof,
//     status: "cancelled_by_worker" as const,
//     updatedAt: new Date().toISOString(),
//   }

//   proofs[proofIndex] = updatedProof
//   saveWorkProofs(proofs)

//   try {
//     const { getJobById } = await import("./jobs")
//     const job = await getJobById(proof.jobId)

//     if (job?.userId && proof.paymentAmount > 0) {
//       await addWalletTransaction({
//         userId: job.userId,
//         type: "refund",
//         amount: proof.paymentAmount,
//         description: `Refund for cancelled job: ${proof.title}`,
//         referenceId: proofId,
//         referenceType: "job_cancellation_refund",
//         balanceType: "deposit",
//       })

//       const { createNotification } = await import("./notifications")
//       await createNotification({
//         userId: job.userId,
//         type: "job",
//         title: "Job Cancelled by Worker",
//         description: `Worker cancelled the job "${proof.title}". $${proof.paymentAmount.toFixed(2)} has been refunded.`,
//         actionUrl: `/dashboard/jobs`,
//       })
//     }
//   } catch (error) {
//     if (error instanceof Error && error.message.includes("already exists")) {
//       console.log("[v0] ⚠️ WORK PROOF: Cancellation refund already processed for proof:", proofId)
//     } else {
//       console.error("[v0] Failed to process cancellation refund:", error)
//       const proofs = getStoredWorkProofs()
//       const proofIndex = proofs.findIndex((p) => p.id === proofId)
//       if (proofIndex !== -1) {
//         proofs[proofIndex] = { ...proof, status: proof.status }
//         saveWorkProofs(proofs)
//       }
//       throw error
//     }
//   }

//   return updatedProof
// }

// Removing duplicate function
// export async function resubmitWork(
//   proofId: string,
//   resubmissionData: {
//     description: string
//     proofFiles: File[]
//     proofLinks: string[]
//     additionalNotes?: string
//   },
// ): Promise<WorkProof> {
//   await new Promise((resolve) => setTimeout(resolve, 500))

//   const proofs = getStoredWorkProofs()
//   const proofIndex = proofs.findIndex((p) => p.id === proofId)
//   if (proofIndex === -1) throw new Error("Work proof not found")

//   const proof = proofs[proofIndex]

//   const processedFiles: string[] = []
//   const processedScreenshots: string[] = []
//   const processedAttachments: string[] = []

//   const processedFileNames = new Set<string>()

//   for (let i = 0; i < resubmissionData.proofFiles.length; i++) {
//     const file = resubmissionData.proofFiles[i]

//     try {
//       const base64 = await new Promise((resolve, reject) => {
//         const reader = new FileReader()
//         reader.onload = () => resolve(reader.result as string)
//         reader.onerror = reject
//         reader.readAsDataURL(file)
//       })

//       const fileData = {
//         name: file.name,
//         type: file.type,
//         size: file.size,
//         data: base64,
//         uploadedAt: new Date().toISOString(),
//       }

//       const fileDataString = JSON.stringify(fileData)
//       processedFiles.push(fileDataString)
//       processedAttachments.push(fileDataString)

//       if (file.type.startsWith("image/") && !processedFileNames.has(file.name)) {
//         processedScreenshots.push(fileDataString)
//         processedFileNames.add(file.name)
//       }
//     } catch (error) {
//       console.error("[v0] Failed to process resubmission file:", file.name, error)
//     }
//   }

//   const updatedProof = {
//     ...proof,
//     status: "submitted" as const,
//     description: resubmissionData.description,
//     submissionText: resubmissionData.description,
//     proofFiles: processedFiles,
//     proofLinks: resubmissionData.proofLinks,
//     screenshots: processedScreenshots,
//     attachments: processedAttachments,
//     submittedAt: new Date().toISOString(),
//     reviewedAt: undefined,
//     reviewFeedback: undefined,
//     submissionNumber: (proof.submissionNumber || 1) + 1,
//     updatedAt: new Date().toISOString(),
//     revisionDeadline: undefined,
//   }

//   proofs[proofIndex] = updatedProof
//   saveWorkProofs(proofs)

//   try {
//     const { createNotification } = await import("./notifications")
//     const { getJobById } = await import("./jobs")

//     const job = await getJobById(proof.jobId)

//     if (job?.userId) {
//       await createNotification({
//         userId: job.userId,
//         type: "job",
//         title: "Work Resubmitted",
//         description: `Worker has resubmitted work for "${proof.title}". Please review the updated submission.`,
//         actionUrl: `/dashboard/jobs/${proof.jobId}/work-proofs`,
//       })
//     }
//   } catch (error) {
//     console.error("[v0] Failed to create resubmission notification:", error)
//   }

//   return updatedProof
// }

// Removing duplicate function
// export const getWorkProofStatusColor = (status: string) => {
//   switch (status) {
//     case "submitted":
//       return "bg-blue-100 text-blue-800"
//     case "approved":
//       return "bg-green-100 text-green-800"
//     case "rejected":
//       return "bg-red-100 text-red-800"
//     case "revision_requested":
//       return "bg-yellow-100 text-yellow-800"
//     case "auto_approved":
//       return "bg-green-200 text-green-900"
//     case "rejected_accepted":
//       return "bg-gray-100 text-gray-800"
//     case "disputed":
//        "rejected_accepted":
//       return "bg-gray-100 text-gray-800"
//     case "disputed":
//
// Removing duplicate function
// export const getWorkProofStatusLabel = (status: string) => {
//   switch (status) {
//     case "submitted":
//       return "Submitted"
//     case "approved":
//       return "Approved"
//     case "rejected":
//       return "Rejected"
//     case "revision_requested":
//       return "Revision Requested"
//     case "auto_approved":
//       return "Auto Approved"
//     case "rejected_accepted":
//       return "Rejection Accepted"
//     case "disputed":
//       return "Under Dispute"
//     case "cancelled_by_worker":
//       return "Cancelled"
//     default:
//       return status
//   }
// }

// Removing duplicate function
// export async function processExpiredDeadlines(): Promise<void> {
//   console.log("[v0] 🕐 Processing expired deadlines...")

//   try {
//     const proofs = getStoredWorkProofs()
//     let processedCount = 0

//     for (const proof of proofs) {
//       const now = new Date()

//       if (proof.status === "rejected" && proof.rejectionDeadline) {
//         const deadline = new Date(proof.rejectionDeadline)
//         if (now > deadline) {
//           console.log("[v0] ⏰ Auto-accepting rejection for proof:", proof.id)
//           await acceptRejection(proof.id)
//           processedCount++
//         }
//       }

//       if (proof.status === "revision_requested" && proof.revisionDeadline) {
//         const deadline = new Date(proof.revisionDeadline)
//         if (now > deadline) {
//           console.log("[v0] ⏰ Auto-cancelling job due to expired revision deadline:", proof.id)
//           await cancelJobByWorker(proof.id)
//           processedCount++
//         }
//       }
//     }

//     if (processedCount > 0) {
//       console.log("[v0] ✅ Processed", processedCount, "expired deadlines")
//     }
//   } catch (error) {
//     console.error("[v0] ❌ Error processing expired deadlines:", error)
//   }
// }

export function isWorkProofDeadlineExpired(proof: WorkProof, job?: any): boolean {
  const now = new Date()

  // Check rejection deadline
  if (proof.status === "rejected" && proof.rejectionDeadline) {
    const deadline = new Date(proof.rejectionDeadline)
    return now > deadline
  }

  // Check revision deadline
  if (proof.status === "revision_requested" && proof.revisionDeadline) {
    const deadline = new Date(proof.revisionDeadline)
    return now > deadline
  }

  if (proof.status === "submitted" && job && job.approvalType === "manual") {
    const submittedAt = new Date(proof.submittedAt)
    const approvalDays = job.manualApprovalDays || 3
    const approvalDeadline = new Date(submittedAt.getTime() + approvalDays * 24 * 60 * 60 * 1000)
    return now > approvalDeadline
  }

  return false
}

export function getWorkProofEffectiveStatus(proof: WorkProof): string {
  const job = {
    approvalType: "manual",
    manualApprovalDays: 3,
  }

  if (isWorkProofDeadlineExpired(proof, job)) {
    if (proof.status === "rejected" && !proof.workerResponse) {
      return "rejected_accepted"
    }
    if (proof.status === "revision_requested") {
      return "cancelled_by_worker"
    }
    if (proof.status === "submitted") {
      return "approved"
    }
  }

  return proof.status
}

export async function updateWorkProofStatus(
  jobId: string,
  workerId: string,
  status: "completed" | "rejected" | "approved" | "submitted",
): Promise<void> {
  const proofs = getStoredWorkProofs()
  const proofIndex = proofs.findIndex((p) => p.jobId === jobId && p.workerId === workerId)

  if (proofIndex !== -1) {
    proofs[proofIndex] = {
      ...proofs[proofIndex],
      status: status as any,
      updatedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
    }
    saveWorkProofs(proofs)
    console.log(`[v0] Updated work proof status to '${status}' for job: ${jobId}, worker: ${workerId}`)
  } else {
    console.warn(`[v0] Work proof not found for job: ${jobId}, worker: ${workerId}`)
  }
}

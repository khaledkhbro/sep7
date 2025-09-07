export interface AdminDispute {
  id: string
  jobId: string
  jobTitle: string
  workerId: string
  workerName: string
  employerId: string
  employerName: string
  reason: string
  description: string
  amount: number
  status: "pending" | "under_review" | "resolved" | "escalated"
  priority: "low" | "medium" | "high" | "urgent"
  evidenceCount: number
  createdAt: string
  updatedAt: string
  adminId?: string
  adminNotes?: string
  resolution?: string
}

export interface DisputeResolution {
  decision: "approve_worker" | "approve_employer" | "partial_refund"
  adminNotes: string
  adminId: string
}

// Mock data for admin disputes
const DISPUTES_STORAGE_KEY = "admin_disputes_mock_data"

// Initialize mock data with persistence
function initializeMockDisputes(): AdminDispute[] {
  // Try to load from localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DISPUTES_STORAGE_KEY)
    if (stored) {
      try {
        const parsedDisputes = JSON.parse(stored)
        console.log(`[v0] Loaded ${parsedDisputes.length} disputes from localStorage`)
        return parsedDisputes
      } catch (error) {
        console.log(`[v0] Error parsing stored disputes, using defaults:`, error)
      }
    }
  }

  const defaultDisputes: AdminDispute[] = []

  // Save defaults to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(defaultDisputes))
    console.log(`[v0] Initialized ${defaultDisputes.length} default disputes in localStorage`)
  }

  return defaultDisputes
}

function saveDisputesToStorage(disputes: AdminDispute[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DISPUTES_STORAGE_KEY, JSON.stringify(disputes))
    console.log(`[v0] Saved ${disputes.length} disputes to localStorage`)
  }
}

function getCurrentDisputes(): AdminDispute[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DISPUTES_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.log(`[v0] Error parsing stored disputes:`, error)
      }
    }
  }
  return initializeMockDisputes()
}

const mockDisputes: AdminDispute[] = initializeMockDisputes()

export async function getAdminDisputes(
  filters: {
    search?: string
    status?: string
    priority?: string
    limit?: number
  } = {},
): Promise<AdminDispute[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const currentDisputes = getCurrentDisputes()

  console.log(`[v0] Fetching admin disputes. Total in storage: ${currentDisputes.length}`)
  console.log(
    `[v0] Current disputes:`,
    currentDisputes.map((d) => ({ id: d.id, title: d.jobTitle, status: d.status })),
  )

  let filtered = currentDisputes.filter((dispute) => !["dispute-1", "dispute-2", "dispute-3"].includes(dispute.id))

  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(
      (dispute) =>
        dispute.jobTitle.toLowerCase().includes(search) ||
        dispute.workerName.toLowerCase().includes(search) ||
        dispute.employerName.toLowerCase().includes(search) ||
        dispute.reason.toLowerCase().includes(search),
    )
  }

  if (filters.status) {
    filtered = filtered.filter((dispute) => dispute.status === filters.status)
  }

  if (filters.priority) {
    filtered = filtered.filter((dispute) => dispute.priority === filters.priority)
  }

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit)
  }

  // Sort by priority and creation date
  filtered.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder]
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder]

    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  console.log(`[v0] Filtered disputes count: ${filtered.length}`)
  console.log(`[v0] Filters applied:`, filters)

  return filtered
}

export async function resolveDispute(disputeId: string, resolution: DisputeResolution): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const currentDisputes = getCurrentDisputes()
  const disputeIndex = currentDisputes.findIndex((d) => d.id === disputeId)
  if (disputeIndex === -1) {
    throw new Error("Dispute not found")
  }

  const dispute = currentDisputes[disputeIndex]

  if (dispute.status === "resolved") {
    console.log(`[v0] ⚠️ Dispute ${disputeId} is already resolved, skipping duplicate resolution`)
    throw new Error("This dispute has already been resolved")
  }

  console.log(`[v0] 🔄 Starting dispute resolution for: ${disputeId}`)
  console.log(`[v0] 🔄 Current dispute status: ${dispute.status}`)

  // Update the dispute status first to prevent race conditions
  currentDisputes[disputeIndex] = {
    ...currentDisputes[disputeIndex],
    status: "resolved",
    adminId: resolution.adminId,
    adminNotes: resolution.adminNotes,
    resolution: resolution.decision,
    updatedAt: new Date().toISOString(),
  }

  saveDisputesToStorage(currentDisputes)

  console.log(`[v0] Dispute ${disputeId} resolved with decision: ${resolution.decision}`)
  console.log(`[v0] Admin notes: ${resolution.adminNotes}`)

  try {
    await handleDisputeResolution(dispute, resolution.decision)
    console.log(`[v0] ✅ Payment processing completed for dispute: ${disputeId}`)
  } catch (error) {
    console.error(`[v0] ❌ Payment processing failed for dispute: ${disputeId}`, error)

    currentDisputes[disputeIndex].status = "pending"
    saveDisputesToStorage(currentDisputes)

    throw new Error("Dispute resolution failed during payment processing")
  }
}

export async function escalateDispute(disputeId: string, reason: string): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const currentDisputes = getCurrentDisputes()
  const disputeIndex = currentDisputes.findIndex((d) => d.id === disputeId)
  if (disputeIndex === -1) {
    throw new Error("Dispute not found")
  }

  currentDisputes[disputeIndex] = {
    ...currentDisputes[disputeIndex],
    status: "escalated",
    priority: "urgent",
    updatedAt: new Date().toISOString(),
  }

  saveDisputesToStorage(currentDisputes)

  console.log(`[v0] Dispute ${disputeId} escalated: ${reason}`)
}

export async function createAdminDispute(disputeData: {
  jobId: string
  workProofId: string
  workerId: string
  employerId: string
  jobTitle: string
  workerName: string
  employerName: string
  amount: number
  reason: string
  description: string
  requestedAction: string
  priority: "low" | "medium" | "high" | "urgent"
  evidenceCount: number
}): Promise<AdminDispute> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const currentDisputes = getCurrentDisputes()

  // Check if a dispute already exists for this job/worker/employer combination
  const existingDispute = currentDisputes.find(
    (dispute) =>
      dispute.jobId === disputeData.jobId &&
      dispute.workerId === disputeData.workerId &&
      dispute.employerId === disputeData.employerId &&
      (dispute.status === "pending" || dispute.status === "under_review"),
  )

  if (existingDispute) {
    console.log(`[v0] ⚠️ Duplicate dispute prevented for job: ${disputeData.jobTitle}`)
    console.log(`[v0] ⚠️ Existing dispute ID: ${existingDispute.id}`)
    throw new Error("A dispute for this job already exists and is pending resolution")
  }

  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const disputeId = `dispute-${timestamp}-${randomSuffix}`

  const newDispute: AdminDispute = {
    id: disputeId,
    jobId: disputeData.jobId,
    jobTitle: disputeData.jobTitle,
    workerId: disputeData.workerId,
    workerName: disputeData.workerName,
    employerId: disputeData.employerId,
    employerName: disputeData.employerName,
    reason: disputeData.reason,
    description: disputeData.description,
    amount: disputeData.amount,
    status: "pending",
    priority: disputeData.priority,
    evidenceCount: disputeData.evidenceCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  currentDisputes.unshift(newDispute)
  saveDisputesToStorage(currentDisputes)

  console.log(`[v0] Created admin dispute: ${newDispute.id} for job: ${disputeData.jobTitle}`)
  console.log(`[v0] Total disputes after creation: ${currentDisputes.length}`)
  console.log(`[v0] New dispute details:`, newDispute)

  return newDispute
}

import { createNotification } from "./notifications"
import { addWalletTransaction } from "./wallet"
import { updateWorkProofStatus } from "./work-proofs"

async function handleDisputeResolution(dispute: AdminDispute, decision: string): Promise<void> {
  console.log(`[v0] 💰 Processing dispute resolution payment for: ${dispute.id}`)
  console.log(`[v0] 💰 Decision: ${decision}, Amount: $${dispute.amount}`)
  console.log(`[v0] 💰 Worker: ${dispute.workerName} (${dispute.workerId})`)
  console.log(`[v0] 💰 Employer: ${dispute.employerName} (${dispute.employerId})`)

  const amount = dispute.amount

  try {
    switch (decision) {
      case "approve_worker":
        console.log(`[v0] 💰 APPROVE WORKER: Releasing $${amount} to worker`)

        // Release full payment to worker's earnings balance
        await addWalletTransaction({
          userId: dispute.workerId,
          type: "earning",
          amount: amount,
          description: `Dispute Resolution: Payment released for "${dispute.jobTitle}" (Job #${dispute.jobId})`,
          referenceId: dispute.id,
          referenceType: "dispute_resolution",
          balanceType: "earnings",
        })

        await updateWorkProofStatus(dispute.jobId, dispute.workerId, "completed")
        console.log(`[v0] ✅ Work proof status updated to 'completed' for job: ${dispute.jobId}`)

        // Notify worker
        await createNotification({
          userId: dispute.workerId,
          type: "payment",
          title: "🎉 Dispute Resolved in Your Favor",
          description: `You've received $${amount.toFixed(2)} for "${dispute.jobTitle}" (Job #${dispute.jobId}). The admin has approved your work.`,
          actionUrl: "/dashboard/wallet",
        })

        // Notify employer
        await createNotification({
          userId: dispute.employerId,
          type: "dispute",
          title: "📋 Dispute Resolution",
          description: `The dispute for "${dispute.jobTitle}" (Job #${dispute.jobId}) has been resolved in favor of the worker. Payment of $${amount.toFixed(2)} has been released.`,
          actionUrl: "/dashboard/jobs",
        })

        console.log(`[v0] ✅ Worker payment completed: $${amount}`)
        break

      case "approve_employer":
        console.log(`[v0] 💰 APPROVE EMPLOYER: Refunding $${amount} to employer`)

        // Refund full amount to employer's deposit balance
        await addWalletTransaction({
          userId: dispute.employerId,
          type: "refund",
          amount: amount,
          description: `Dispute Resolution: Refund for "${dispute.jobTitle}" (Job #${dispute.jobId})`,
          referenceId: dispute.id,
          referenceType: "dispute_resolution",
          balanceType: "deposit",
        })

        await updateWorkProofStatus(dispute.jobId, dispute.workerId, "rejected")
        console.log(`[v0] ✅ Work proof status updated to 'rejected' for job: ${dispute.jobId}`)

        // Notify employer
        await createNotification({
          userId: dispute.employerId,
          type: "payment",
          title: "🔄 Dispute Resolved - Refund Issued",
          description: `You've received a $${amount.toFixed(2)} refund for "${dispute.jobTitle}" (Job #${dispute.jobId}). The admin has approved your dispute.`,
          actionUrl: "/dashboard/wallet",
        })

        // Notify worker
        await createNotification({
          userId: dispute.workerId,
          type: "dispute",
          title: "📋 Dispute Resolution",
          description: `The dispute for "${dispute.jobTitle}" (Job #${dispute.jobId}) has been resolved in favor of the employer. A refund of $${amount.toFixed(2)} has been issued.`,
          actionUrl: "/dashboard/applied-jobs",
        })

        console.log(`[v0] ✅ Employer refund completed: $${amount}`)
        break

      case "partial_refund":
        console.log(`[v0] 💰 PARTIAL RESOLUTION: Splitting $${amount} between worker and employer`)

        const workerAmount = amount * 0.5
        const employerAmount = amount * 0.5

        // Give 50% to worker as earnings
        await addWalletTransaction({
          userId: dispute.workerId,
          type: "earning",
          amount: workerAmount,
          description: `Dispute Resolution: Partial payment (50%) for "${dispute.jobTitle}" (Job #${dispute.jobId})`,
          referenceId: dispute.id,
          referenceType: "dispute_resolution",
          balanceType: "earnings",
        })

        // Refund 50% to employer
        await addWalletTransaction({
          userId: dispute.employerId,
          type: "refund",
          amount: employerAmount,
          description: `Dispute Resolution: Partial refund (50%) for "${dispute.jobTitle}" (Job #${dispute.jobId})`,
          referenceId: dispute.id,
          referenceType: "dispute_resolution",
          balanceType: "deposit",
        })

        await updateWorkProofStatus(dispute.jobId, dispute.workerId, "completed")
        console.log(`[v0] ✅ Work proof status updated to 'completed' for partial resolution: ${dispute.jobId}`)

        // Notify worker
        await createNotification({
          userId: dispute.workerId,
          type: "payment",
          title: "⚖️ Dispute Partially Resolved",
          description: `You've received $${workerAmount.toFixed(2)} (50%) for "${dispute.jobTitle}" (Job #${dispute.jobId}). The admin has made a partial resolution.`,
          actionUrl: "/dashboard/wallet",
        })

        // Notify employer
        await createNotification({
          userId: dispute.employerId,
          type: "payment",
          title: "⚖️ Dispute Partially Resolved",
          description: `You've received a $${employerAmount.toFixed(2)} (50%) refund for "${dispute.jobTitle}" (Job #${dispute.jobId}). The admin has made a partial resolution.`,
          actionUrl: "/dashboard/wallet",
        })

        console.log(`[v0] ✅ Partial resolution completed: Worker $${workerAmount}, Employer $${employerAmount}`)
        break

      default:
        throw new Error(`Unknown resolution decision: ${decision}`)
    }

    console.log(`[v0] 🎯 Dispute resolution payment processing completed successfully`)
  } catch (error) {
    console.error(`[v0] ❌ Error processing dispute resolution payment:`, error)
    throw error
  }
}

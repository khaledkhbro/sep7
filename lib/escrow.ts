// Payment escrow system for secure job transactions - DISABLED
import type { WalletTransaction } from "./wallet"

export interface EscrowTransaction {
  id: string
  jobId: string
  applicationId: string
  workProofId?: string
  payerId: string
  payeeId: string
  amount: number
  status: "locked" | "released" | "refunded" | "disputed" | "auto_released"
  lockedAt: string
  releaseScheduledAt: string
  releasedAt?: string
  refundedAt?: string
  disputeId?: string
  description: string
  metadata?: {
    jobTitle: string
    workerName: string
    employerName: string
  }
  createdAt: string
  updatedAt: string
}

export interface DisputeCase {
  id: string
  escrowTransactionId: string
  jobId: string
  initiatorId: string
  respondentId: string
  reason: "work_quality" | "payment_delay" | "scope_change" | "communication" | "other"
  description: string
  evidence: {
    type: "text" | "file" | "link"
    content: string
    uploadedAt: string
  }[]
  status: "open" | "under_review" | "resolved" | "closed"
  resolution?: {
    decision: "favor_worker" | "favor_employer" | "partial_refund"
    amount?: number
    reasoning: string
    resolvedBy: string
    resolvedAt: string
  }
  createdAt: string
  updatedAt: string
}

export async function createEscrowTransaction(data: {
  jobId: string
  applicationId: string
  payerId: string
  payeeId: string
  amount: number
  jobTitle: string
  workerName: string
  employerName: string
}): Promise<EscrowTransaction> {
  throw new Error("Escrow functionality has been disabled")
}

export async function releaseEscrowPayment(
  escrowId: string,
  workProofId?: string,
): Promise<{ escrowTransaction: EscrowTransaction; walletTransaction: WalletTransaction }> {
  throw new Error("Escrow functionality has been disabled")
}

export async function refundEscrowPayment(
  escrowId: string,
  reason: string,
): Promise<{ escrowTransaction: EscrowTransaction; walletTransaction: WalletTransaction }> {
  throw new Error("Escrow functionality has been disabled")
}

export async function processAutoReleases(): Promise<EscrowTransaction[]> {
  return []
}

export async function createDispute(data: {
  escrowTransactionId: string
  jobId: string
  initiatorId: string
  respondentId: string
  reason: DisputeCase["reason"]
  description: string
  evidence: DisputeCase["evidence"]
}): Promise<DisputeCase> {
  throw new Error("Escrow functionality has been disabled")
}

export async function resolveDispute(
  disputeId: string,
  resolution: DisputeCase["resolution"],
): Promise<{ dispute: DisputeCase; escrowTransaction?: EscrowTransaction; walletTransaction?: WalletTransaction }> {
  throw new Error("Escrow functionality has been disabled")
}

export async function getEscrowTransactionsByUser(userId: string): Promise<EscrowTransaction[]> {
  return []
}

export async function getEscrowTransactionByJob(jobId: string): Promise<EscrowTransaction | null> {
  return null
}

export async function getDisputesByUser(userId: string): Promise<DisputeCase[]> {
  return []
}

export async function getAllDisputes(): Promise<DisputeCase[]> {
  return []
}

export const getEscrowStatusColor = (status: EscrowTransaction["status"]) => {
  return "bg-gray-100 text-gray-800"
}

export const getDisputeStatusColor = (status: DisputeCase["status"]) => {
  return "bg-gray-100 text-gray-800"
}

export const formatTimeRemaining = (releaseScheduledAt: string): string => {
  return "Escrow disabled"
}

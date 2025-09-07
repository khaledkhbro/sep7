import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ArrowUpRight, ArrowDownLeft, CreditCard, DollarSign, RefreshCw, MessageCircle } from "lucide-react"
import { TransactionAmount } from "@/components/ui/price-display"
import type { WalletTransaction } from "@/lib/wallet"

interface TransactionItemProps {
  transaction: WalletTransaction
}

const getTransactionIcon = (type: WalletTransaction["type"], referenceType?: string) => {
  if (referenceType === "chat_transfer") {
    return <MessageCircle className="h-4 w-4 text-purple-600" />
  }

  switch (type) {
    case "deposit":
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    case "withdrawal":
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    case "earning":
      return <DollarSign className="h-4 w-4 text-green-600" />
    case "payment":
      return <CreditCard className="h-4 w-4 text-blue-600" />
    case "refund":
      return <RefreshCw className="h-4 w-4 text-orange-600" />
    default:
      return <DollarSign className="h-4 w-4 text-gray-600" />
  }
}

const getStatusColor = (status: WalletTransaction["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const getTransactionDescription = () => {
    if (transaction.referenceType === "chat_transfer") {
      // Extract recipient info from description or referenceId
      const match = transaction.description.match(/to (.+?) $$ID: (.+?)$$/)
      if (match) {
        const [, recipientName, recipientId] = match
        return `Chat transfer to ${recipientName} (ID: ${recipientId})`
      }
      return transaction.description
    }

    // Handle job refunds with better formatting
    if (
      transaction.description.includes("Refund for cancelled job") ||
      transaction.description.includes("Refund for rejected work")
    ) {
      const jobIdMatch = transaction.description.match(/job_(\d+)/)
      if (jobIdMatch) {
        const jobId = jobIdMatch[0]
        const isRejected = transaction.description.includes("rejected work")
        const actionType = isRejected ? "Rejected Work" : "Cancelled Job"
        return `Refund for ${actionType}: Job ${jobId.replace("job_", "#")}`
      }
    }

    // Handle job creation deposits with better formatting
    if (transaction.description.includes("Job creation deposit for")) {
      const match = transaction.description.match(
        /Job creation deposit for:?\s*(.+?)\s*$$(\d+)\s*workers?\s*×\s*\$?([\d.]+)\s*\+\s*\$?([\d.]+)\s*platform fee$$/,
      )
      if (match) {
        const [, jobName, workerCount, workerRate, platformFee] = match
        const jobId = transaction.referenceId || `job_${Date.now()}`
        return `Job Creation Deposit: "${jobName.trim()}" (ID: ${jobId}) - ${workerCount} workers × $${workerRate} + $${platformFee} platform fee`
      }

      // Fallback for simpler format
      const simpleMatch = transaction.description.match(/Job creation deposit for:?\s*(.+?)$/)
      if (simpleMatch) {
        const jobInfo = simpleMatch[1].trim()
        const jobId = transaction.referenceId || "Unknown ID"
        return `Job Creation Deposit: "${jobInfo}" (ID: ${jobId})`
      }
    }

    // Handle job completion payments
    if (transaction.description.includes("Job completion payment")) {
      const jobIdMatch = transaction.description.match(/job_(\d+)/)
      if (jobIdMatch) {
        const jobId = jobIdMatch[0]
        return `Job Completion Payment: Job #${jobId.replace("job_", "")} (ID: ${jobId})`
      }
    }

    // Handle job application fees
    if (transaction.description.includes("Job application fee")) {
      const jobIdMatch = transaction.description.match(/job_(\d+)/)
      if (jobIdMatch) {
        const jobId = jobIdMatch[0]
        return `Job Application Fee: Job #${jobId.replace("job_", "")} (ID: ${jobId})`
      }
    }

    // Handle work proof submissions
    if (transaction.description.includes("Work proof for job")) {
      const jobIdMatch = transaction.description.match(/job_(\d+)/)
      if (jobIdMatch) {
        const jobId = jobIdMatch[0]
        return `Work Proof Submission: Job #${jobId.replace("job_", "")} (ID: ${jobId})`
      }
    }

    return transaction.description
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">{getTransactionIcon(transaction.type, transaction.referenceType)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">{getTransactionDescription()}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
            </p>
            <Badge variant="secondary" className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
            {transaction.referenceType === "chat_transfer" && (
              <Badge className="bg-purple-100 text-purple-800">Chat Transfer</Badge>
            )}
            {(transaction.description.includes("Job creation deposit") ||
              transaction.description.includes("Job completion") ||
              transaction.description.includes("Job application") ||
              transaction.description.includes("Work proof")) && (
              <Badge className="bg-blue-100 text-blue-800">Job Related</Badge>
            )}
            {(transaction.description.includes("Refund for cancelled") ||
              transaction.description.includes("Refund for rejected")) && (
              <Badge className="bg-orange-100 text-orange-800">Job Refund</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <TransactionAmount amount={transaction.amount} />
      </div>
    </div>
  )
}

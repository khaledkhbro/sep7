// Wallet-related types
export interface Wallet {
  id: string
  userId: string
  balance: number // Legacy field for backward compatibility
  depositBalance: number // Cannot be withdrawn
  earningsBalance: number // Can be withdrawn
  pendingBalance: number
  totalEarned: number
  totalSpent: number
  upcomingPayments: number
  pendingPayments: number
  createdAt: string
  updatedAt: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: "deposit" | "withdrawal" | "payment" | "earning" | "refund"
  amount: number
  feeAmount: number
  netAmount: number
  balanceType: "deposit" | "earnings"
  description: string
  referenceId?: string
  referenceType?: string
  status: "pending" | "completed" | "failed"
  createdAt: string
}

export interface PaymentMethod {
  id: string
  userId: string
  type: "card" | "paypal" | "bank_account"
  last4?: string
  brand?: string
  isDefault: boolean
  createdAt: string
}

// Admin fee settings interface
export interface AdminFeeSettings {
  id: string
  feeType: "deposit" | "withdrawal" | "transaction" | "tip"
  feePercentage: number
  feeFixed: number
  minimumFee: number
  maximumFee?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Payment schedule interface
export interface PaymentSchedule {
  id: string
  userId: string
  amount: number
  scheduledDate: string
  description: string
  referenceId?: string
  referenceType?: string
  status: "scheduled" | "processed" | "failed" | "cancelled"
  createdAt: string
  processedAt?: string
}

// API client for backend communication
const API_BASE_URL =
  typeof window !== "undefined"
    ? "" // Use relative URLs in browser environment
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const fullUrl = `${API_BASE_URL}${endpoint}`
  console.log("[v0] 🌐 API: Making request to:", fullUrl)

  const response = await fetch(fullUrl, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.text()
    console.error("[v0] ❌ API: Request failed:", response.status, error)
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log("[v0] ✅ API: Request successful, received data:", data)
  return data
}

export async function getWallet(userId: string): Promise<Wallet> {
  try {
    console.log("[v0] 💰 WALLET: Fetching wallet for user:", userId)
    const wallet = await apiCall(`/api/wallet/${userId}`)
    console.log("[v0] 💰 WALLET: Retrieved wallet from database:", wallet)
    return wallet
  } catch (error) {
    console.error("[v0] ❌ WALLET: Failed to fetch wallet:", error)
    throw new Error("Failed to fetch wallet data")
  }
}

export async function getTransactions(
  walletId: string,
  filters?: {
    type?: string
    status?: string
    limit?: number
  },
): Promise<WalletTransaction[]> {
  try {
    const userId = walletId.replace("wallet_", "")
    const params = new URLSearchParams()

    if (filters?.type) params.append("type", filters.type)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.limit) params.append("limit", filters.limit.toString())

    const queryString = params.toString()
    const endpoint = `/api/wallet/${userId}/transactions${queryString ? `?${queryString}` : ""}`

    console.log("[v0] 💰 WALLET: Fetching transactions from:", endpoint)
    const transactions = await apiCall(endpoint)
    console.log("[v0] 💰 WALLET: Retrieved", transactions.length, "transactions from database")
    return transactions
  } catch (error) {
    console.error("[v0] ❌ WALLET: Failed to fetch transactions:", error)
    throw new Error("Failed to fetch transaction data")
  }
}

export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  return getTransactions(`wallet_${userId}`)
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    console.log("[v0] 💳 PAYMENT: Fetching payment methods for user:", userId)
    const methods = await apiCall(`/api/wallet/${userId}/payment-methods`)
    return methods || []
  } catch (error) {
    console.error("[v0] ❌ PAYMENT: Failed to fetch payment methods:", error)
    return []
  }
}

export async function createDeposit(data: {
  amount: number
  paymentMethodId: string
  userId: string
}): Promise<WalletTransaction> {
  try {
    console.log("[v0] 💰 DEPOSIT: Creating deposit:", data)
    const transaction = await apiCall(`/api/wallet/${data.userId}/deposit`, {
      method: "POST",
      body: JSON.stringify({
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
      }),
    })
    console.log("[v0] ✅ DEPOSIT: Created successfully:", transaction.id)
    return transaction
  } catch (error) {
    console.error("[v0] ❌ DEPOSIT: Failed to create deposit:", error)
    throw new Error("Failed to process deposit")
  }
}

export async function createWithdrawal(data: {
  amount: number
  paymentMethodId: string
  userId: string
}): Promise<WalletTransaction> {
  try {
    console.log("[v0] 💰 WITHDRAWAL: Creating withdrawal:", data)
    const transaction = await apiCall(`/api/wallet/${data.userId}/withdrawal`, {
      method: "POST",
      body: JSON.stringify({
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
      }),
    })
    console.log("[v0] ✅ WITHDRAWAL: Created successfully:", transaction.id)
    return transaction
  } catch (error) {
    console.error("[v0] ❌ WITHDRAWAL: Failed to create withdrawal:", error)
    throw new Error("Failed to process withdrawal")
  }
}

export async function addPaymentMethod(
  userId: string,
  method: Omit<PaymentMethod, "id" | "userId" | "createdAt">,
): Promise<PaymentMethod> {
  try {
    console.log("[v0] 💳 PAYMENT: Adding payment method for user:", userId)
    const newMethod = await apiCall(`/api/wallet/${userId}/payment-methods`, {
      method: "POST",
      body: JSON.stringify(method),
    })
    console.log("[v0] ✅ PAYMENT: Added payment method:", newMethod.id)
    return newMethod
  } catch (error) {
    console.error("[v0] ❌ PAYMENT: Failed to add payment method:", error)
    throw new Error("Failed to add payment method")
  }
}

export async function addEarnings(data: {
  amount: number
  userId: string
  description: string
  referenceId?: string
  referenceType?: string
}): Promise<WalletTransaction> {
  try {
    console.log("[v0] 💰 EARNINGS: Adding earnings:", data)
    const transaction = await apiCall(`/api/wallet/${data.userId}/earnings`, {
      method: "POST",
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
      }),
    })
    console.log("[v0] ✅ EARNINGS: Added successfully:", transaction.id)
    return transaction
  } catch (error) {
    console.error("[v0] ❌ EARNINGS: Failed to add earnings:", error)
    throw new Error("Failed to add earnings")
  }
}

// Admin fee management functions
export async function getAdminFeeSettings(feeType: string): Promise<AdminFeeSettings> {
  try {
    console.log("[v0] ⚙️ FEE: Fetching fee settings for type:", feeType)
    const settings = await apiCall(`/api/admin/fee-settings/${feeType}`)
    return settings
  } catch (error) {
    console.error("[v0] ❌ FEE: Failed to fetch fee settings:", error)
    // Return default settings as fallback
    return {
      id: `fee_${feeType}`,
      feeType: feeType as "deposit" | "withdrawal" | "transaction" | "tip",
      feePercentage: feeType === "deposit" ? 2.5 : feeType === "withdrawal" ? 1.0 : feeType === "tip" ? 0 : 3.0,
      feeFixed: feeType === "withdrawal" ? 0.25 : feeType === "tip" ? 0 : 0,
      minimumFee: feeType === "deposit" ? 0.5 : feeType === "tip" ? 0.5 : 0.25,
      maximumFee: feeType === "tip" ? 100 : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function updateAdminFeeSettings(
  feeType: string,
  settings: Partial<AdminFeeSettings>,
): Promise<AdminFeeSettings> {
  try {
    console.log("[v0] ⚙️ FEE: Updating fee settings for type:", feeType)
    const updatedSettings = await apiCall(`/api/admin/fee-settings/${feeType}`, {
      method: "PUT",
      body: JSON.stringify(settings),
    })
    console.log("[v0] ✅ FEE: Updated fee settings successfully")
    return updatedSettings
  } catch (error) {
    console.error("[v0] ❌ FEE: Failed to update fee settings:", error)
    throw new Error("Failed to update fee settings")
  }
}

function calculateFee(amount: number, feeSettings: AdminFeeSettings): number {
  if (!feeSettings.isActive) return 0

  let fee = (amount * feeSettings.feePercentage) / 100 + feeSettings.feeFixed

  if (fee < feeSettings.minimumFee) {
    fee = feeSettings.minimumFee
  }

  if (feeSettings.maximumFee && fee > feeSettings.maximumFee) {
    fee = feeSettings.maximumFee
  }

  return Math.round(fee * 100) / 100 // Round to 2 decimal places
}

export async function getUpcomingPayments(userId: string): Promise<PaymentSchedule[]> {
  try {
    console.log("[v0] 📅 SCHEDULE: Fetching upcoming payments for user:", userId)
    const payments = await apiCall(`/api/wallet/${userId}/upcoming-payments`)
    return payments || []
  } catch (error) {
    console.error("[v0] ❌ SCHEDULE: Failed to fetch upcoming payments:", error)
    return []
  }
}

export async function getPendingPayments(userId: string): Promise<WalletTransaction[]> {
  return getTransactions(`wallet_${userId}`, { status: "pending" })
}

import { createNotification } from "./notifications"

export async function addWalletTransaction(data: {
  userId: string
  type: "deposit" | "withdrawal" | "payment" | "earning" | "refund"
  amount: number
  description: string
  referenceId?: string
  referenceType?: string
  balanceType?: "deposit" | "earnings"
}): Promise<WalletTransaction> {
  try {
    console.log("[v0] 💰 WALLET: Starting secure transaction for user:", data.userId)
    console.log("[v0] 💰 WALLET: Transaction type:", data.type, "Amount:", data.amount)
    console.log("[v0] 💰 WALLET: Description:", data.description)
    console.log("[v0] 💰 WALLET: Reference ID:", data.referenceId)

    const transaction = await apiCall(`/api/wallet/${data.userId}/transactions`, {
      method: "POST",
      body: JSON.stringify({
        type: data.type,
        amount: data.amount,
        description: data.description,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        balanceType: data.balanceType || (data.type === "earning" ? "earnings" : "deposit"),
      }),
    })

    console.log("[v0] ✅ WALLET: Transaction completed successfully in database!")
    console.log("[v0] 💰 WALLET: Transaction ID:", transaction.id)

    try {
      const notificationTitle = getTransactionNotificationTitle(data.type, data.amount)
      const notificationDescription = data.description

      await createNotification({
        userId: data.userId,
        type: "payment",
        title: notificationTitle,
        description: notificationDescription,
        actionUrl: "/dashboard/wallet",
      })

      console.log("[v0] 🔔 NOTIFICATION: Created transaction notification for user:", data.userId)
    } catch (error) {
      console.error("[v0] ❌ NOTIFICATION: Failed to create transaction notification:", error)
    }

    return transaction
  } catch (error) {
    console.error("[v0] ❌ WALLET: Failed to add transaction:", error)
    throw new Error("Failed to process transaction")
  }
}

function getTransactionNotificationTitle(type: string, amount: number): string {
  const absAmount = Math.abs(amount)
  const formattedAmount = `$${absAmount.toFixed(2)}`

  switch (type) {
    case "earning":
      return `💰 Earnings Added: ${formattedAmount}`
    case "deposit":
      return `💳 Deposit Successful: ${formattedAmount}`
    case "withdrawal":
      return `🏦 Withdrawal Processed: ${formattedAmount}`
    case "payment":
      return `💸 Payment Made: ${formattedAmount}`
    case "refund":
      return `🔄 Refund Received: ${formattedAmount}`
    default:
      return `💰 Transaction: ${formattedAmount}`
  }
}

export async function validateTipBalance(
  userId: string,
  tipAmount: number,
): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log("[v0] 🎁 TIP: Validating tip balance for user:", userId, "Amount:", tipAmount)

    const validation = await apiCall(`/api/wallet/${userId}/validate-tip`, {
      method: "POST",
      body: JSON.stringify({ amount: tipAmount }),
    })

    console.log("[v0] ✅ TIP: Validation result:", validation)
    return validation
  } catch (error) {
    console.error("[v0] ❌ TIP: Failed to validate tip balance:", error)
    return {
      valid: false,
      error: "Failed to validate tip balance",
    }
  }
}

export async function processTipPayment(data: {
  employerId: string
  workerId: string
  tipAmount: number
  description: string
  referenceId: string
}): Promise<{ success: boolean; error?: string; transactions?: WalletTransaction[] }> {
  try {
    console.log(
      "[v0] 🎁 TIP: Processing secure tip payment:",
      data.tipAmount,
      "from",
      data.employerId,
      "to",
      data.workerId,
    )

    const result = await apiCall(`/api/wallet/process-tip`, {
      method: "POST",
      body: JSON.stringify({
        employerId: data.employerId,
        workerId: data.workerId,
        amount: data.tipAmount,
        description: data.description,
        referenceId: data.referenceId,
      }),
    })

    console.log("[v0] ✅ TIP: Tip processed successfully in database!")
    return result
  } catch (error) {
    console.error("[v0] ❌ TIP: Failed to process tip payment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process tip payment",
    }
  }
}

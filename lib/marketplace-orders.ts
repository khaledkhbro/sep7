export interface MarketplaceOrder {
  id: string
  serviceId: string
  sellerId: string
  buyerId: string
  serviceName: string
  serviceImage?: string
  tier: "basic" | "standard" | "premium"
  price: number
  deliveryTime: number // in days
  status:
    | "awaiting_acceptance"
    | "pending"
    | "in_progress"
    | "delivered"
    | "completed"
    | "cancelled"
    | "disputed"
    | "dispute_resolved"
  createdAt: string
  acceptedAt?: string
  deliveredAt?: string
  completedAt?: string
  disputedAt?: string

  // Countdown timers
  acceptanceDeadline?: string
  reviewDeadline?: string

  // Order details
  requirements: string
  deliverables?: {
    files: string[]
    message: string
    submittedAt: string
  }

  // Communication
  messages: OrderMessage[]

  // Dispute info
  disputeReason?: string
  disputeDetails?: string
  adminDecision?: "refund_buyer" | "pay_seller"
  adminNotes?: string
}

export interface OrderMessage {
  id: string
  senderId: string
  senderType: "buyer" | "seller" | "admin"
  message: string
  files?: string[]
  timestamp: string
}

export interface OrderSettings {
  acceptanceWindowHours: number
  reviewPeriodDays: number
  autoReleasePayment: boolean
}

export interface WalletTransaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "order_hold" | "order_release" | "refund"
  amount: number
  orderId?: string
  description: string
  timestamp: string
  status: "pending" | "completed" | "failed"
}

class MarketplaceOrderManager {
  private readonly ORDERS_KEY = "marketplace_orders"
  private readonly SETTINGS_KEY = "marketplace_order_settings"
  private readonly WALLET_KEY = "marketplace_wallets"
  private readonly TRANSACTIONS_KEY = "marketplace_transactions"

  // Default settings
  private defaultSettings: OrderSettings = {
    acceptanceWindowHours: 24,
    reviewPeriodDays: 3,
    autoReleasePayment: true,
  }

  // Order Management
  createOrder(
    orderData: Omit<MarketplaceOrder, "id" | "status" | "createdAt" | "acceptanceDeadline" | "messages">,
  ): MarketplaceOrder {
    const settings = this.getSettings()
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const acceptanceDeadline = new Date()
    acceptanceDeadline.setHours(acceptanceDeadline.getHours() + settings.acceptanceWindowHours)

    const order: MarketplaceOrder = {
      ...orderData,
      id: orderId,
      status: "awaiting_acceptance",
      createdAt: new Date().toISOString(),
      acceptanceDeadline: acceptanceDeadline.toISOString(),
      messages: [],
    }

    // Hold money in buyer's wallet
    this.holdOrderPayment(orderData.buyerId, order.price, orderId)

    this.saveOrder(order)
    return order
  }

  acceptOrder(orderId: string, sellerId: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.sellerId !== sellerId || order.status !== "awaiting_acceptance") {
      return false
    }

    // Check if acceptance window hasn't expired
    if (new Date() > new Date(order.acceptanceDeadline!)) {
      this.cancelOrder(orderId, "Acceptance window expired")
      return false
    }

    order.status = "pending"
    order.acceptedAt = new Date().toISOString()

    // Calculate delivery deadline
    const deliveryDeadline = new Date()
    deliveryDeadline.setDate(deliveryDeadline.getDate() + order.deliveryTime)

    this.saveOrder(order)
    return true
  }

  declineOrder(orderId: string, sellerId: string, reason?: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.sellerId !== sellerId || order.status !== "awaiting_acceptance") {
      return false
    }

    return this.cancelOrder(orderId, reason || "Declined by seller")
  }

  updateOrderStatus(orderId: string, sellerId: string, newStatus: "pending" | "in_progress" | "delivered"): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.sellerId !== sellerId) {
      return false
    }

    const validTransitions: Record<string, string[]> = {
      pending: ["in_progress"],
      in_progress: ["delivered"],
      delivered: [], // Can't change from delivered
    }

    if (!validTransitions[order.status]?.includes(newStatus)) {
      return false
    }

    order.status = newStatus

    if (newStatus === "delivered") {
      order.deliveredAt = new Date().toISOString()

      // Start review countdown
      const settings = this.getSettings()
      const reviewDeadline = new Date()
      reviewDeadline.setDate(reviewDeadline.getDate() + settings.reviewPeriodDays)
      order.reviewDeadline = reviewDeadline.toISOString()

      // Schedule auto-release if enabled
      if (settings.autoReleasePayment) {
        this.scheduleAutoRelease(orderId, reviewDeadline)
      }
    }

    this.saveOrder(order)
    return true
  }

  submitDelivery(orderId: string, sellerId: string, deliverables: { files: string[]; message: string }): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.sellerId !== sellerId || order.status !== "in_progress") {
      return false
    }

    order.deliverables = {
      ...deliverables,
      submittedAt: new Date().toISOString(),
    }

    return this.updateOrderStatus(orderId, sellerId, "delivered")
  }

  releasePayment(orderId: string, buyerId: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.buyerId !== buyerId || order.status !== "delivered") {
      return false
    }

    order.status = "completed"
    order.completedAt = new Date().toISOString()

    // Release payment to seller
    this.releaseOrderPayment(order.buyerId, order.sellerId, order.price, orderId)

    this.saveOrder(order)
    return true
  }

  openDispute(orderId: string, buyerId: string, reason: string, details: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.buyerId !== buyerId || order.status !== "delivered") {
      return false
    }

    order.status = "disputed"
    order.disputedAt = new Date().toISOString()
    order.disputeReason = reason
    order.disputeDetails = details

    this.saveOrder(order)
    return true
  }

  resolveDispute(orderId: string, adminId: string, decision: "refund_buyer" | "pay_seller", notes?: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.status !== "disputed") {
      return false
    }

    order.status = "dispute_resolved"
    order.adminDecision = decision
    order.adminNotes = notes
    order.completedAt = new Date().toISOString()

    // Handle payment based on decision
    if (decision === "refund_buyer") {
      this.refundOrderPayment(order.buyerId, order.price, orderId)
    } else {
      this.releaseOrderPayment(order.buyerId, order.sellerId, order.price, orderId)
    }

    this.saveOrder(order)
    return true
  }

  cancelOrder(orderId: string, reason: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || !["awaiting_acceptance", "pending"].includes(order.status)) {
      return false
    }

    order.status = "cancelled"
    order.completedAt = new Date().toISOString()

    // Refund buyer
    this.refundOrderPayment(order.buyerId, order.price, orderId)

    this.saveOrder(order)
    return true
  }

  updateOrderRequirements(orderId: string, buyerId: string, requirements: string): boolean {
    const order = this.getOrder(orderId)
    if (!order || order.buyerId !== buyerId) {
      return false
    }

    // Only allow requirements updates for orders that haven't started work yet
    if (!["awaiting_acceptance", "pending"].includes(order.status)) {
      return false
    }

    order.requirements = requirements
    this.saveOrder(order)
    return true
  }

  // Message Management
  addMessage(
    orderId: string,
    senderId: string,
    senderType: "buyer" | "seller" | "admin",
    message: string,
    files?: string[],
  ): boolean {
    const order = this.getOrder(orderId)
    if (!order) return false

    const messageObj: OrderMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderType,
      message,
      files,
      timestamp: new Date().toISOString(),
    }

    order.messages.push(messageObj)
    this.saveOrder(order)
    return true
  }

  // Wallet Management
  getWalletBalance(userId: string): number {
    const wallets = this.getWallets()
    return wallets[userId] || 0
  }

  depositToWallet(userId: string, amount: number): boolean {
    if (amount <= 0) return false

    const wallets = this.getWallets()
    wallets[userId] = (wallets[userId] || 0) + amount

    this.saveWallets(wallets)
    this.addTransaction(userId, "deposit", amount, undefined, `Wallet deposit of $${amount}`)
    return true
  }

  withdrawFromWallet(userId: string, amount: number): boolean {
    const balance = this.getWalletBalance(userId)
    if (amount <= 0 || amount > balance) return false

    const wallets = this.getWallets()
    wallets[userId] = balance - amount

    this.saveWallets(wallets)
    this.addTransaction(userId, "withdrawal", -amount, undefined, `Wallet withdrawal of $${amount}`)
    return true
  }

  private holdOrderPayment(buyerId: string, amount: number, orderId: string): boolean {
    const balance = this.getWalletBalance(buyerId)
    if (amount > balance) return false

    const wallets = this.getWallets()
    wallets[buyerId] = balance - amount

    this.saveWallets(wallets)
    this.addTransaction(buyerId, "order_hold", -amount, orderId, `Payment held for order ${orderId}`)
    return true
  }

  private releaseOrderPayment(buyerId: string, sellerId: string, amount: number, orderId: string): void {
    const wallets = this.getWallets()
    wallets[sellerId] = (wallets[sellerId] || 0) + amount

    this.saveWallets(wallets)
    this.addTransaction(sellerId, "order_release", amount, orderId, `Payment received for order ${orderId}`)
  }

  private refundOrderPayment(buyerId: string, amount: number, orderId: string): void {
    const wallets = this.getWallets()
    wallets[buyerId] = (wallets[buyerId] || 0) + amount

    this.saveWallets(wallets)
    this.addTransaction(buyerId, "refund", amount, orderId, `Refund for order ${orderId}`)
  }

  private addTransaction(
    userId: string,
    type: WalletTransaction["type"],
    amount: number,
    orderId?: string,
    description?: string,
  ): void {
    const transactions = this.getTransactions()
    const transaction: WalletTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      amount,
      orderId,
      description: description || "",
      timestamp: new Date().toISOString(),
      status: "completed",
    }

    transactions.push(transaction)
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions))
  }

  // Auto-release scheduling (simplified - in real app would use proper scheduling)
  private scheduleAutoRelease(orderId: string, deadline: Date): void {
    const timeUntilRelease = deadline.getTime() - Date.now()
    if (timeUntilRelease > 0) {
      setTimeout(() => {
        const order = this.getOrder(orderId)
        if (order && order.status === "delivered") {
          this.releasePayment(orderId, order.buyerId)
        }
      }, timeUntilRelease)
    }
  }

  // Data persistence
  private saveOrder(order: MarketplaceOrder): void {
    const orders = this.getAllOrders()
    const index = orders.findIndex((o) => o.id === order.id)

    if (index >= 0) {
      orders[index] = order
    } else {
      orders.push(order)
    }

    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders))
  }

  getOrder(orderId: string): MarketplaceOrder | null {
    const orders = this.getAllOrders()
    return orders.find((o) => o.id === orderId) || null
  }

  getAllOrders(): MarketplaceOrder[] {
    const stored = localStorage.getItem(this.ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  getOrdersByUser(userId: string, userType: "buyer" | "seller"): MarketplaceOrder[] {
    const orders = this.getAllOrders()
    return orders.filter((order) => (userType === "buyer" ? order.buyerId === userId : order.sellerId === userId))
  }

  getOrdersByStatus(status: MarketplaceOrder["status"]): MarketplaceOrder[] {
    return this.getAllOrders().filter((order) => order.status === status)
  }

  // Settings Management
  getSettings(): OrderSettings {
    const stored = localStorage.getItem(this.SETTINGS_KEY)
    return stored ? { ...this.defaultSettings, ...JSON.parse(stored) } : this.defaultSettings
  }

  updateSettings(settings: Partial<OrderSettings>): void {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updated))
  }

  // Wallet data
  private getWallets(): Record<string, number> {
    const stored = localStorage.getItem(this.WALLET_KEY)
    return stored ? JSON.parse(stored) : {}
  }

  private saveWallets(wallets: Record<string, number>): void {
    localStorage.setItem(this.WALLET_KEY, JSON.stringify(wallets))
  }

  getTransactions(userId?: string): WalletTransaction[] {
    const stored = localStorage.getItem(this.TRANSACTIONS_KEY)
    const transactions: WalletTransaction[] = stored ? JSON.parse(stored) : []

    return userId ? transactions.filter((t) => t.userId === userId) : transactions
  }

  // Utility methods
  isOrderExpired(order: MarketplaceOrder): boolean {
    if (order.status === "awaiting_acceptance" && order.acceptanceDeadline) {
      return new Date() > new Date(order.acceptanceDeadline)
    }
    if (order.status === "delivered" && order.reviewDeadline) {
      return new Date() > new Date(order.reviewDeadline)
    }
    return false
  }

  getTimeRemaining(deadline: string): { days: number; hours: number; minutes: number } {
    const now = new Date().getTime()
    const target = new Date(deadline).getTime()
    const diff = target - now

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0 }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes }
  }

  // Admin methods
  getAllOrdersForAdmin(): MarketplaceOrder[] {
    return this.getAllOrders()
  }

  getDisputedOrders(): MarketplaceOrder[] {
    return this.getOrdersByStatus("disputed")
  }

  // Cleanup expired orders
  cleanupExpiredOrders(): void {
    const orders = this.getAllOrders()
    const now = new Date()

    orders.forEach((order) => {
      if (order.status === "awaiting_acceptance" && order.acceptanceDeadline) {
        if (now > new Date(order.acceptanceDeadline)) {
          this.cancelOrder(order.id, "Acceptance window expired")
        }
      } else if (order.status === "delivered" && order.reviewDeadline) {
        if (now > new Date(order.reviewDeadline)) {
          const settings = this.getSettings()
          if (settings.autoReleasePayment) {
            this.releasePayment(order.id, order.buyerId)
          }
        }
      }
    })
  }
}

// Export singleton instance
export const marketplaceOrderManager = new MarketplaceOrderManager()

// Helper functions
export const formatOrderStatus = (status: MarketplaceOrder["status"]): string => {
  const statusMap: Record<MarketplaceOrder["status"], string> = {
    awaiting_acceptance: "Awaiting Seller Acceptance",
    pending: "Pending",
    in_progress: "In Progress",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    disputed: "Disputed",
    dispute_resolved: "Dispute Resolved",
  }
  return statusMap[status] || status
}

export const getOrderStatusColor = (status: MarketplaceOrder["status"]): string => {
  const colorMap: Record<MarketplaceOrder["status"], string> = {
    awaiting_acceptance: "text-yellow-600 bg-yellow-50",
    pending: "text-blue-600 bg-blue-50",
    in_progress: "text-purple-600 bg-purple-50",
    delivered: "text-green-600 bg-green-50",
    completed: "text-green-700 bg-green-100",
    cancelled: "text-red-600 bg-red-50",
    disputed: "text-orange-600 bg-orange-50",
    dispute_resolved: "text-gray-600 bg-gray-50",
  }
  return colorMap[status] || "text-gray-600 bg-gray-50"
}

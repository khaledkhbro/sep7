export interface SupportTicket {
  id: string
  userId: string
  chatId?: string
  ticketType: "free" | "priority"
  subject: string
  description: string
  priority: "low" | "normal" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  assignedAdminId?: string
  assignedAdminName?: string
  paymentAmount: number
  paymentTransactionId?: string
  responseTimeHours: number
  createdAt: Date
  firstResponseAt?: Date
  resolvedAt?: Date
  closedAt?: Date
  unreadMessages?: number
}

export interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  message: string
  isAdminResponse: boolean
  attachments: string[]
  createdAt: Date
}

export async function createSupportTicket(ticketData: {
  subject: string
  description: string
  priority: string
  ticketType: "free" | "priority"
  chatId?: string
}): Promise<SupportTicket> {
  try {
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    })

    if (!response.ok) {
      throw new Error("Failed to create support ticket")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating support ticket:", error)
    throw error
  }
}

export async function getSupportTickets(filters?: {
  status?: string
  ticketType?: string
  userId?: string
}): Promise<SupportTicket[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.ticketType) params.append("ticketType", filters.ticketType)
    if (filters?.userId) params.append("userId", filters.userId)

    const response = await fetch(`/api/support/tickets?${params}`)
    if (!response.ok) {
      throw new Error("Failed to fetch support tickets")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching support tickets:", error)
    throw error
  }
}

export const getStoredSupportTickets = (): SupportTicket[] => {
  try {
    const stored = localStorage.getItem("support-tickets")
    const tickets = stored ? JSON.parse(stored) : []

    // Convert date strings back to Date objects
    return tickets.map((ticket: any) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      firstResponseAt: ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : undefined,
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
      closedAt: ticket.closedAt ? new Date(ticket.closedAt) : undefined,
    }))
  } catch (error) {
    console.error("[v0] Error loading support tickets:", error)
    return []
  }
}

export const saveSupportTicket = async (ticket: SupportTicket): Promise<SupportTicket> => {
  const tickets = getStoredSupportTickets()
  const existingIndex = tickets.findIndex((t) => t.id === ticket.id)

  if (existingIndex >= 0) {
    tickets[existingIndex] = ticket
  } else {
    tickets.push(ticket)
  }

  localStorage.setItem("support-tickets", JSON.stringify(tickets))
  console.log("[v0] Support ticket saved:", ticket.id)
  return ticket
}

export const createSupportTicketFromChat = async (data: {
  userId: string
  userName: string
  userEmail: string
  chatId: string
  subject: string
  description: string
  priority: string
  ticketType: "free" | "priority"
}): Promise<SupportTicket> => {
  const ticket: SupportTicket = {
    id: `ticket_${Date.now()}`,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    chatId: data.chatId,
    ticketType: data.ticketType,
    subject: data.subject,
    description: data.description,
    priority: data.priority as SupportTicket["priority"],
    status: "open",
    paymentAmount: data.ticketType === "priority" ? 0.2 : 0,
    responseTimeHours: data.ticketType === "priority" ? 1 : 48,
    createdAt: new Date(),
    unreadMessages: 1,
  }

  return await saveSupportTicket(ticket)
}

export const updateSupportTicketStatus = async (
  ticketId: string,
  status: SupportTicket["status"],
  adminId?: string,
  adminName?: string,
): Promise<SupportTicket> => {
  const tickets = getStoredSupportTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex === -1) {
    throw new Error("Support ticket not found")
  }

  const ticket = tickets[ticketIndex]
  const updatedTicket: SupportTicket = {
    ...ticket,
    status,
    assignedAdminId: status === "in_progress" ? adminId : ticket.assignedAdminId,
    assignedAdminName: status === "in_progress" ? adminName : ticket.assignedAdminName,
    firstResponseAt: status === "in_progress" && !ticket.firstResponseAt ? new Date() : ticket.firstResponseAt,
    resolvedAt: status === "resolved" ? new Date() : ticket.resolvedAt,
    closedAt: status === "closed" ? new Date() : ticket.closedAt,
  }

  return await saveSupportTicket(updatedTicket)
}

export function calculateSupportCost(ticketType: "free" | "priority"): number {
  return ticketType === "priority" ? 0.2 : 0.0
}

export function getExpectedResponseTime(ticketType: "free" | "priority"): string {
  return ticketType === "priority" ? "Within 1 hour" : "24-72 hours"
}

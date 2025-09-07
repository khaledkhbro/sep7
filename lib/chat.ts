// Chat system types and utilities
export interface User {
  id: string
  name: string
  avatar?: string
  userType: "user" | "admin" | "buyer"
  isOnline?: boolean
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  sender: User
  content: string
  messageType: "text" | "image" | "file" | "system"
  fileUrl?: string
  fileName?: string
  fileSize?: number
  replyToId?: string
  replyTo?: Message
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  status: "sent" | "delivered" | "read"
}

export interface Chat {
  id: string
  type: "direct" | "order" | "admin_support"
  title?: string
  participants: User[]
  lastMessage?: Message
  lastMessageAt: Date
  unreadCount: number
  isActive: boolean
  orderId?: string
  jobId?: string
  marketplaceItemId?: string
}

// Mock data for development
export const mockUsers: User[] = []
export const mockMessages: Message[] = []
export const mockChats: Chat[] = []

// Utility functions
export const formatMessageTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return dateObj.toLocaleDateString()
}

export const getUnreadCount = (chatId: string): number => {
  const chat = getStoredChats().find((c) => c.id === chatId)
  return chat?.unreadCount || 0
}

// Database integration functions
export const saveMessage = async (message: Omit<Message, "id" | "createdAt">): Promise<Message> => {
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    createdAt: new Date(),
  }

  // Store in localStorage for persistence
  const messages = getStoredMessages()
  messages.push(newMessage)
  localStorage.setItem("chat-messages", JSON.stringify(messages))

  if (message.messageType === "text" && message.content.trim()) {
    const { updateLastTextActivity } = await import("./file-management")
    updateLastTextActivity(message.chatId)
  }

  console.log("[v0] Message saved:", newMessage.id)
  return newMessage
}

export const getStoredMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem("chat-messages")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[v0] Error loading messages:", error)
    return []
  }
}

export const getMessagesByChatId = (chatId: string): Message[] => {
  const messages = getStoredMessages()
  return messages
    .filter((m) => m.chatId === chatId)
    .map((message) => ({
      ...message,
      createdAt: typeof message.createdAt === "string" ? new Date(message.createdAt) : message.createdAt,
      editedAt:
        message.editedAt && typeof message.editedAt === "string" ? new Date(message.editedAt) : message.editedAt,
    }))
}

export const saveChat = async (chat: Chat): Promise<Chat> => {
  const chats = getStoredChats()
  const existingIndex = chats.findIndex((c) => c.id === chat.id)

  if (existingIndex >= 0) {
    chats[existingIndex] = chat
  } else {
    chats.push(chat)
  }

  localStorage.setItem("chat-conversations", JSON.stringify(chats))
  console.log("[v0] Chat saved:", chat.id)
  return chat
}

export const getStoredChats = (): Chat[] => {
  try {
    const stored = localStorage.getItem("chat-conversations")
    const chats = stored ? JSON.parse(stored) : []

    // Convert date strings back to Date objects
    return chats.map((chat: any) => ({
      ...chat,
      lastMessageAt: new Date(chat.lastMessageAt),
      lastMessage: chat.lastMessage
        ? {
            ...chat.lastMessage,
            createdAt: new Date(chat.lastMessage.createdAt),
          }
        : undefined,
    }))
  } catch (error) {
    console.error("[v0] Error loading chats:", error)
    return []
  }
}

// Updated createJobChat to use persistent storage
export const createJobChat = async (jobId: string, clientId: string, freelancerId: string) => {
  console.log("[v0] Creating job chat for:", { jobId, clientId, freelancerId })

  const existingChats = getStoredChats()
  const existingChat = existingChats.find(
    (chat) =>
      chat.jobId === jobId &&
      chat.participants.some((p) => p.id === clientId) &&
      chat.participants.some((p) => p.id === freelancerId),
  )

  if (existingChat) {
    console.log("[v0] Found existing job chat:", existingChat.id)
    return existingChat
  }

  let jobTitle = "Job Discussion"
  try {
    const { getJobById } = await import("@/lib/jobs")
    const job = await getJobById(jobId)
    if (job) {
      jobTitle = `${job.title.substring(0, 30)}${job.title.length > 30 ? "..." : ""}`
    }
  } catch (error) {
    console.warn("[v0] Could not load job details for chat title")
  }

  const clientParticipant: User = {
    id: clientId,
    name: "Client",
    userType: "user" as const,
    isOnline: true,
  }

  const freelancerParticipant: User = {
    id: freelancerId,
    name: "Job Poster",
    userType: "user" as const,
    isOnline: false,
  }

  const newChat: Chat = {
    id: `job-chat-${jobId}-${Date.now()}`,
    type: "direct",
    title: jobTitle,
    participants: [clientParticipant, freelancerParticipant],
    lastMessageAt: new Date(),
    unreadCount: 0,
    isActive: true,
    jobId,
  }

  if (!newChat.id || !newChat.jobId) {
    throw new Error("Failed to create valid chat object")
  }

  await saveChat(newChat)
  console.log("[v0] Job chat created successfully:", newChat.id)
  return newChat
}

// Updated createOrderChat to use persistent storage
export const createOrderChat = async (orderId: string, buyerId: string, sellerId: string) => {
  const newChat: Chat = {
    id: `order-chat-${Date.now()}`,
    type: "order",
    title: `Order Discussion`,
    participants: [
      { id: buyerId, name: "Buyer", userType: "user", isOnline: true },
      { id: sellerId, name: "Seller", userType: "user", isOnline: false },
    ],
    lastMessageAt: new Date(),
    unreadCount: 0,
    isActive: true,
    orderId,
  }

  await saveChat(newChat)
  return newChat
}

// Updated createServiceInquiryChat to use persistent storage
export const createServiceInquiryChat = async (serviceId: string, buyerId: string, sellerId: string) => {
  const newChat: Chat = {
    id: `service-chat-${Date.now()}`,
    type: "direct",
    title: `Service Inquiry`,
    participants: [
      { id: buyerId, name: "Buyer", userType: "user", isOnline: true },
      { id: sellerId, name: "Seller", userType: "user", isOnline: false },
    ],
    lastMessageAt: new Date(),
    unreadCount: 0,
    isActive: true,
    marketplaceItemId: serviceId,
  }

  await saveChat(newChat)
  console.log("[v0] Service inquiry chat created successfully:", newChat.id)
  return newChat
}

export const createChat = async (options: {
  type: "direct" | "order" | "admin_support"
  title: string
  participants: User[]
  jobId?: string
  orderId?: string
}) => {
  const newChat: Chat = {
    id: `${options.type}-chat-${Date.now()}`,
    type: options.type,
    title: options.title,
    participants: options.participants,
    lastMessageAt: new Date(),
    unreadCount: 0,
    isActive: true,
    jobId: options.jobId,
    orderId: options.orderId,
  }

  await saveChat(newChat)
  console.log("[v0] Chat created successfully:", newChat.id)
  return newChat
}

export const getChatMessages = async (chatId: string) => {
  return getMessagesByChatId(chatId)
}

export const sendMessage = async (chatId: string, senderId: string, content: string, files?: File[]) => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")

  const sender: User = {
    id: senderId,
    name: `${currentUser.firstName || "User"} ${currentUser.lastName || ""}`.trim(),
    userType: "user",
    isOnline: true,
  }

  const message = await saveMessage({
    chatId,
    senderId,
    sender,
    content,
    messageType: files && files.length > 0 ? "file" : "text",
    isEdited: false,
    status: "sent",
  })

  // Update chat's last message
  const chats = getStoredChats()
  const chatIndex = chats.findIndex((c) => c.id === chatId)
  if (chatIndex >= 0) {
    chats[chatIndex].lastMessage = message
    chats[chatIndex].lastMessageAt = message.createdAt
    localStorage.setItem("chat-conversations", JSON.stringify(chats))
  }

  return message
}

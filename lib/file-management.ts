// File management system for chat attachments
export interface ChatFile {
  id: string
  chatId: string
  messageId: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadedAt: Date
  lastTextActivity: Date // Track when last text message was sent in chat
  expiresAt: Date // 14 days after last text activity
  isExpired: boolean
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const FILE_EXPIRY_DAYS = 14
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
]

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 5MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    }
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: Images, PDF, Word documents, Text files`,
    }
  }

  return { isValid: true }
}

export const saveFileToChat = async (file: File, chatId: string, messageId: string): Promise<ChatFile> => {
  const validation = validateFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Create file URL (in real app, this would upload to cloud storage)
  const fileUrl = URL.createObjectURL(file)

  const now = new Date()
  const expiresAt = new Date(now.getTime() + FILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const chatFile: ChatFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chatId,
    messageId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    fileUrl,
    uploadedAt: now,
    lastTextActivity: now,
    expiresAt,
    isExpired: false,
  }

  // Store file metadata
  const files = getStoredFiles()
  files.push(chatFile)
  localStorage.setItem("chat-files", JSON.stringify(files))

  console.log("[v0] File saved:", chatFile.fileName, "Size:", (file.size / 1024).toFixed(2), "KB")
  return chatFile
}

export const getStoredFiles = (): ChatFile[] => {
  try {
    const stored = localStorage.getItem("chat-files")
    const files = stored ? JSON.parse(stored) : []

    // Convert date strings back to Date objects
    return files.map((file: any) => ({
      ...file,
      uploadedAt: new Date(file.uploadedAt),
      lastTextActivity: new Date(file.lastTextActivity),
      expiresAt: new Date(file.expiresAt),
    }))
  } catch (error) {
    console.error("[v0] Error loading files:", error)
    return []
  }
}

export const updateLastTextActivity = (chatId: string): void => {
  const files = getStoredFiles()
  const now = new Date()
  const newExpiryDate = new Date(now.getTime() + FILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const updatedFiles = files.map((file) => {
    if (file.chatId === chatId && !file.isExpired) {
      return {
        ...file,
        lastTextActivity: now,
        expiresAt: newExpiryDate,
      }
    }
    return file
  })

  localStorage.setItem("chat-files", JSON.stringify(updatedFiles))
  console.log("[v0] Updated last text activity for chat:", chatId)
}

export const cleanupExpiredFiles = (): number => {
  const files = getStoredFiles()
  const now = new Date()
  let cleanedCount = 0

  const activeFiles = files.filter((file) => {
    const isExpired = now > file.expiresAt
    if (isExpired && !file.isExpired) {
      // Mark as expired and revoke object URL
      URL.revokeObjectURL(file.fileUrl)
      cleanedCount++
      console.log("[v0] Expired file cleaned:", file.fileName, "from chat:", file.chatId)
      return false // Remove from active files
    }
    return !isExpired
  })

  localStorage.setItem("chat-files", JSON.stringify(activeFiles))

  if (cleanedCount > 0) {
    console.log("[v0] Cleaned up", cleanedCount, "expired files")
  }

  return cleanedCount
}

export const getFilesByChatId = (chatId: string): ChatFile[] => {
  const files = getStoredFiles()
  return files.filter((file) => file.chatId === chatId && !file.isExpired)
}

export const getFileStats = () => {
  const files = getStoredFiles()
  const now = new Date()

  const stats = {
    totalFiles: files.length,
    activeFiles: files.filter((f) => !f.isExpired && now <= f.expiresAt).length,
    expiredFiles: files.filter((f) => f.isExpired || now > f.expiresAt).length,
    totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
    oldestFile: files.length > 0 ? Math.min(...files.map((f) => f.uploadedAt.getTime())) : null,
    newestFile: files.length > 0 ? Math.max(...files.map((f) => f.uploadedAt.getTime())) : null,
  }

  return stats
}

// Auto-cleanup function to run periodically
export const initFileCleanup = () => {
  // Run cleanup immediately
  cleanupExpiredFiles()

  // Set up periodic cleanup every hour
  setInterval(
    () => {
      cleanupExpiredFiles()
    },
    60 * 60 * 1000,
  ) // 1 hour

  console.log("[v0] File cleanup system initialized")
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith("image/")) return "🖼️"
  if (fileType === "application/pdf") return "📄"
  if (fileType.includes("word") || fileType.includes("document")) return "📝"
  if (fileType.startsWith("text/")) return "📄"
  return "📎"
}

// Notification system for real-time user updates
export interface Notification {
  id: string
  userId: string
  type: "job" | "message" | "payment" | "system"
  title: string
  description: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

const NOTIFICATIONS_STORAGE_KEY = "marketplace-notifications"

const getStoredNotifications = (): Notification[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveNotifications = (notifications: Notification[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  } catch (error) {
    console.error("Failed to save notifications:", error)
  }
}

export async function createNotification(data: {
  userId: string
  type: "job" | "message" | "payment" | "system"
  title: string
  description: string
  actionUrl?: string
}): Promise<Notification> {
  const newNotification: Notification = {
    id: `notif_${Date.now()}`,
    userId: data.userId,
    type: data.type,
    title: data.title,
    description: data.description,
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: data.actionUrl,
  }

  const notifications = getStoredNotifications()
  notifications.push(newNotification)
  saveNotifications(notifications)

  return newNotification
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const notifications = getStoredNotifications()
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notifications = getStoredNotifications()
  const notificationIndex = notifications.findIndex((n) => n.id === notificationId)

  if (notificationIndex !== -1) {
    notifications[notificationIndex].read = true
    saveNotifications(notifications)
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const notifications = getStoredNotifications()
  const updatedNotifications = notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n))
  saveNotifications(updatedNotifications)
}

export async function getRecentActivity(userId: string, limit = 10): Promise<Notification[]> {
  const notifications = getStoredNotifications()
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const notifications = getStoredNotifications()
  return notifications.filter((n) => n.userId === userId && !n.read).length
}

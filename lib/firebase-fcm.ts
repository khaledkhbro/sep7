// Firebase Cloud Messaging integration
export interface FCMToken {
  id: string
  userId: string
  token: string
  deviceType: "web" | "android" | "ios"
  deviceInfo?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface NotificationPreferences {
  pushNotifications: boolean
  pushJobUpdates: boolean
  pushMessages: boolean
  pushPayments: boolean
  pushReferrals: boolean
  pushSystemAlerts: boolean
  pushMarketing: boolean
}

// Initialize Firebase messaging for web
export async function initializeFirebaseMessaging(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    // Check if service worker is supported
    if ("serviceWorker" in navigator) {
      // Register service worker for FCM
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
      console.log("[v0] Firebase messaging service worker registered:", registration)
    }

    // Request notification permission
    const permission = await Notification.requestPermission()
    console.log("[v0] Notification permission:", permission)

    if (permission === "granted") {
      // Initialize Firebase and get token
      await generateFCMToken()
    }
  } catch (error) {
    console.error("[v0] Failed to initialize Firebase messaging:", error)
  }
}

// Generate and store FCM token
export async function generateFCMToken(): Promise<string | null> {
  try {
    // Simulate Firebase token generation
    const token = `fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store token in localStorage for demo
    localStorage.setItem("fcm_token", token)

    console.log("[v0] Generated FCM token:", token)
    return token
  } catch (error) {
    console.error("[v0] Failed to generate FCM token:", error)
    return null
  }
}

// Send push notification (server-side function)
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
  notificationType: string,
): Promise<boolean> {
  try {
    // Check user preferences
    const preferences = await getUserNotificationPreferences(userId)
    if (!preferences.pushNotifications) {
      console.log("[v0] Push notifications disabled for user:", userId)
      return false
    }

    // Check specific notification type preference
    const typeEnabled = getNotificationTypeEnabled(preferences, notificationType)
    if (!typeEnabled) {
      console.log("[v0] Notification type disabled for user:", userId, notificationType)
      return false
    }

    // Get user's FCM tokens
    const tokens = await getUserFCMTokens(userId)
    if (tokens.length === 0) {
      console.log("[v0] No FCM tokens found for user:", userId)
      return false
    }

    // Send to all user's devices
    const results = await Promise.all(tokens.map((token) => sendToToken(token.token, payload)))

    const successCount = results.filter(Boolean).length
    console.log("[v0] Push notification sent to", successCount, "of", tokens.length, "devices")

    return successCount > 0
  } catch (error) {
    console.error("[v0] Failed to send push notification:", error)
    return false
  }
}

// Send notification to specific token
async function sendToToken(token: string, payload: PushNotificationPayload): Promise<boolean> {
  try {
    // Simulate Firebase Admin SDK call
    console.log("[v0] Sending push notification to token:", token.substring(0, 20) + "...")
    console.log("[v0] Payload:", payload)

    // In real implementation, this would use Firebase Admin SDK
    // const message = {
    //   token,
    //   notification: {
    //     title: payload.title,
    //     body: payload.body,
    //     icon: payload.icon,
    //   },
    //   data: payload.data,
    //   webpush: {
    //     notification: {
    //       badge: payload.badge,
    //       actions: payload.actions,
    //     }
    //   }
    // }
    //
    // const response = await admin.messaging().send(message)

    return true
  } catch (error) {
    console.error("[v0] Failed to send to token:", error)
    return false
  }
}

// Get user's FCM tokens
async function getUserFCMTokens(userId: string): Promise<FCMToken[]> {
  try {
    // Simulate database query
    const mockTokens: FCMToken[] = [
      {
        id: "1",
        userId,
        token: `fcm_token_${userId}_web`,
        deviceType: "web",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    return mockTokens.filter((token) => token.isActive)
  } catch (error) {
    console.error("[v0] Failed to get FCM tokens:", error)
    return []
  }
}

// Get user notification preferences
async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    // Simulate database query - default all enabled
    return {
      pushNotifications: true,
      pushJobUpdates: true,
      pushMessages: true,
      pushPayments: true,
      pushReferrals: true,
      pushSystemAlerts: true,
      pushMarketing: false,
    }
  } catch (error) {
    console.error("[v0] Failed to get notification preferences:", error)
    // Return safe defaults
    return {
      pushNotifications: false,
      pushJobUpdates: false,
      pushMessages: false,
      pushPayments: false,
      pushReferrals: false,
      pushSystemAlerts: false,
      pushMarketing: false,
    }
  }
}

// Check if specific notification type is enabled
function getNotificationTypeEnabled(preferences: NotificationPreferences, type: string): boolean {
  switch (type) {
    case "job":
    case "job_update":
      return preferences.pushJobUpdates
    case "message":
      return preferences.pushMessages
    case "payment":
      return preferences.pushPayments
    case "referral":
      return preferences.pushReferrals
    case "system":
      return preferences.pushSystemAlerts
    case "marketing":
      return preferences.pushMarketing
    default:
      return preferences.pushSystemAlerts // Default to system alerts
  }
}

// Create notification types for different events
export const NotificationTypes = {
  JOB_APPLICATION: "job_application",
  JOB_ACCEPTED: "job_accepted",
  JOB_COMPLETED: "job_completed",
  NEW_MESSAGE: "new_message",
  PAYMENT_RECEIVED: "payment_received",
  REFERRAL_REWARD: "referral_reward",
  SYSTEM_UPDATE: "system_update",
  MARKETING_OFFER: "marketing_offer",
} as const

// Predefined notification templates
export const NotificationTemplates = {
  [NotificationTypes.JOB_APPLICATION]: {
    title: "New Job Application",
    body: "You have received a new application for your job posting.",
    icon: "/icons/job.png",
  },
  [NotificationTypes.JOB_ACCEPTED]: {
    title: "Job Application Accepted",
    body: "Congratulations! Your job application has been accepted.",
    icon: "/icons/success.png",
  },
  [NotificationTypes.NEW_MESSAGE]: {
    title: "New Message",
    body: "You have received a new message.",
    icon: "/icons/message.png",
  },
  [NotificationTypes.PAYMENT_RECEIVED]: {
    title: "Payment Received",
    body: "You have received a payment to your wallet.",
    icon: "/icons/payment.png",
  },
  [NotificationTypes.REFERRAL_REWARD]: {
    title: "Referral Reward",
    body: "You have earned a referral reward!",
    icon: "/icons/reward.png",
  },
}

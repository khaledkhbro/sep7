"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { useNotifications } from "@/hooks/use-notifications"
import { useAuth } from "@/contexts/auth-context"

const NotificationContext = createContext<ReturnType<typeof useNotifications> | null>(null)

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications()
  const { user } = useAuth()

  // Example: Simulate receiving notifications (you would replace this with real API calls)
  useEffect(() => {
    if (!user) return

    // Simulate periodic notification updates
    const interval = setInterval(() => {
      // Example: Check for new messages, orders, etc.
      // This is where you'd make API calls to check for new activities

      // For demo purposes, randomly add notifications
      if (Math.random() > 0.95) {
        const sections = ["messages", "myJobs", "appliedJobs", "wallet"] as const
        const randomSection = sections[Math.floor(Math.random() * sections.length)]
        notifications.incrementCount(randomSection)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user, notifications])

  return <NotificationContext.Provider value={notifications}>{children}</NotificationContext.Provider>
}

"use client"

import { useState, useEffect, useCallback } from "react"

export interface NotificationCounts {
  myJobs: number
  appliedJobs: number
  favorites: number
  myServices: number
  buyerOrders: number
  sellerOrders: number
  messages: number
  dailyCoins: number
  wallet: number
  refer: number
  notifications: number
  profile: number
  settings: number
}

const STORAGE_KEY = "workhub_notification_counts"

const defaultCounts: NotificationCounts = {
  myJobs: 0,
  appliedJobs: 0,
  favorites: 0,
  myServices: 0,
  buyerOrders: 0,
  sellerOrders: 0,
  messages: 0,
  dailyCoins: 0,
  wallet: 0,
  refer: 0,
  notifications: 0,
  profile: 0,
  settings: 0,
}

export function useNotifications() {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts)

  // Load counts from localStorage on mount
  useEffect(() => {
    console.log("[v0] Loading notification counts from localStorage")
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsedCounts = JSON.parse(stored)
        console.log("[v0] Loaded notification counts:", parsedCounts)
        setCounts({ ...defaultCounts, ...parsedCounts })
      } catch (error) {
        console.error("Failed to parse notification counts:", error)
      }
    } else {
      console.log("[v0] No stored notification counts found, using defaults")
    }
  }, [])

  // Save counts to localStorage whenever they change
  useEffect(() => {
    console.log("[v0] Saving notification counts to localStorage:", counts)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts))
  }, [counts])

  // Increment notification count for a specific section
  const incrementCount = useCallback((section: keyof NotificationCounts) => {
    console.log("[v0] Incrementing notification count for section:", section)
    setCounts((prev) => {
      const newCounts = {
        ...prev,
        [section]: prev[section] + 1,
      }
      console.log("[v0] New notification counts:", newCounts)
      return newCounts
    })
  }, [])

  // Clear notification count for a specific section (when user views it)
  const clearCount = useCallback((section: keyof NotificationCounts) => {
    console.log("[v0] Clearing notification count for section:", section)
    setCounts((prev) => ({
      ...prev,
      [section]: 0,
    }))
  }, [])

  // Set specific count for a section
  const setCount = useCallback((section: keyof NotificationCounts, count: number) => {
    console.log("[v0] Setting notification count for section:", section, "to:", count)
    setCounts((prev) => ({
      ...prev,
      [section]: Math.max(0, count),
    }))
  }, [])

  // Clear all notification counts
  const clearAllCounts = useCallback(() => {
    console.log("[v0] Clearing all notification counts")
    setCounts(defaultCounts)
  }, [])

  return {
    counts,
    incrementCount,
    clearCount,
    setCount,
    clearAllNotifications: clearAllCounts, // Added alias for clearing all notifications
  }
}

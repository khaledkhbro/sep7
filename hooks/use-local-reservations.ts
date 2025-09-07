"use client"

import { useState, useEffect, useCallback } from "react"
import type { LocalReservation, LocalReservationSettings } from "@/lib/local-reservation-storage"
import {
  checkReservationStatus,
  getUserReservations,
  createReservation,
  cancelReservation,
  cleanupExpiredReservations,
  getReservationSettings,
  updateReservationSettings,
  type ReservationStatus,
} from "@/lib/local-reservation-utils"

export function useLocalReservations(userId?: string) {
  const [reservations, setReservations] = useState<LocalReservation[]>([])
  const [settings, setSettings] = useState<LocalReservationSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user reservations
  const loadReservations = useCallback(() => {
    if (!userId) {
      setReservations([])
      return
    }

    try {
      const userReservations = getUserReservations(userId)
      setReservations(userReservations)
    } catch (error) {
      console.error("Error loading reservations:", error)
      setReservations([])
    }
  }, [userId])

  // Load settings
  const loadSettings = useCallback(() => {
    try {
      const currentSettings = getReservationSettings()
      setSettings(currentSettings)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }, [])

  // Create a new reservation
  const reserve = useCallback(
    async (jobId: string, reservationMinutes?: number) => {
      if (!userId || !settings) return null

      const minutes = reservationMinutes || settings.defaultReservationMinutes
      const reservation = createReservation(jobId, userId, minutes)

      if (reservation) {
        loadReservations()
      }

      return reservation
    },
    [userId, settings, loadReservations],
  )

  // Cancel a reservation
  const cancel = useCallback(
    (reservationId: string) => {
      const success = cancelReservation(reservationId)
      if (success) {
        loadReservations()
      }
      return success
    },
    [loadReservations],
  )

  // Check if a job is reserved
  const checkJobReservation = useCallback(async (jobId: string): Promise<ReservationStatus> => {
    return checkReservationStatus(jobId)
  }, [])

  // Update settings (admin only)
  const updateSettings = useCallback((updates: Partial<Omit<LocalReservationSettings, "id" | "createdAt">>) => {
    try {
      const updated = updateReservationSettings(updates)
      setSettings(updated)
      return updated
    } catch (error) {
      console.error("Error updating settings:", error)
      return null
    }
  }, [])

  // Cleanup expired reservations
  const cleanup = useCallback(() => {
    const expired = cleanupExpiredReservations()
    if (expired.length > 0) {
      loadReservations()
    }
    return expired
  }, [loadReservations])

  // Initialize and set up periodic cleanup
  useEffect(() => {
    const initialize = async () => {
      setLoading(true)
      loadSettings()
      loadReservations()

      // Initial cleanup
      cleanup()

      setLoading(false)
    }

    initialize()

    // Set up periodic cleanup every minute
    const cleanupInterval = setInterval(cleanup, 60000)

    const handleStorageChange = (e: CustomEvent) => {
      const { key } = e.detail
      if (key === "microjob_reservations" || key === "microjob_job_reservations") {
        loadReservations()
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "microjob_reservations" || e.key === "microjob_job_reservations") {
        loadReservations()
      }
    }

    // Listen for custom events (same tab) and storage events (other tabs)
    window.addEventListener("reservationStorageChange", handleStorageChange as EventListener)
    window.addEventListener("storage", handleStorageEvent)

    return () => {
      clearInterval(cleanupInterval)
      window.removeEventListener("reservationStorageChange", handleStorageChange as EventListener)
      window.removeEventListener("storage", handleStorageEvent)
    }
  }, [loadSettings, loadReservations, cleanup])

  return {
    reservations,
    settings,
    loading,
    reserve,
    cancel,
    checkJobReservation,
    updateSettings,
    cleanup,
    refresh: () => {
      loadReservations()
      loadSettings()
    },
  }
}

// Hook for checking individual job reservation status
export function useJobReservationStatus(jobId: string) {
  const [status, setStatus] = useState<ReservationStatus>({ isReserved: false })
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    try {
      const reservationStatus = await checkReservationStatus(jobId)
      setStatus(reservationStatus)
    } catch (error) {
      console.error("Error checking job reservation status:", error)
      setStatus({ isReserved: false })
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    checkStatus()

    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    const handleStorageChange = (e: CustomEvent) => {
      const { key } = e.detail
      if (key === "microjob_job_reservations") {
        checkStatus()
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "microjob_job_reservations") {
        checkStatus()
      }
    }

    window.addEventListener("reservationStorageChange", handleStorageChange as EventListener)
    window.addEventListener("storage", handleStorageEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener("reservationStorageChange", handleStorageChange as EventListener)
      window.removeEventListener("storage", handleStorageEvent)
    }
  }, [checkStatus])

  return {
    status,
    loading,
    refresh: checkStatus,
  }
}

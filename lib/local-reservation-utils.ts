import {
  localReservationStorage,
  type LocalReservation,
  type LocalReservationSettings,
} from "./local-reservation-storage"

export interface ReservationStatus {
  isReserved: boolean
  timeLeft?: number
  expired?: boolean
  reservedBy?: string
}

export async function checkReservationStatus(jobId: string): Promise<ReservationStatus> {
  try {
    // First expire any old reservations
    localReservationStorage.expireOldReservations()

    const reservationInfo = localReservationStorage.isJobReserved(jobId)

    if (!reservationInfo.isReserved) {
      return { isReserved: false }
    }

    const now = new Date().getTime()
    const reservedUntil = new Date(reservationInfo.expiresAt!).getTime()
    const timeLeft = reservedUntil - now

    if (timeLeft <= 0) {
      return { isReserved: false, expired: true }
    }

    return {
      isReserved: true,
      timeLeft,
      reservedBy: reservationInfo.userId,
    }
  } catch (error) {
    console.error("Error checking reservation status:", error)
    return { isReserved: false }
  }
}

export function formatTimeLeft(milliseconds: number): string {
  if (milliseconds <= 0) return "Expired"

  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

export function getUserReservations(userId: string): LocalReservation[] {
  try {
    // Clean up expired reservations first
    localReservationStorage.expireOldReservations()

    return localReservationStorage.getUserActiveReservations(userId)
  } catch (error) {
    console.error("Error in getUserReservations:", error)
    return []
  }
}

export function createReservation(jobId: string, userId: string, reservationMinutes: number): LocalReservation | null {
  try {
    const settings = localReservationStorage.getSettings()

    if (!settings.isEnabled) {
      throw new Error("Reservation system is disabled")
    }

    // Check if job is already reserved
    const reservationInfo = localReservationStorage.isJobReserved(jobId)
    if (reservationInfo.isReserved) {
      throw new Error("Job is already reserved")
    }

    // Check user's current reservations
    const userReservations = localReservationStorage.getUserActiveReservations(userId)
    if (userReservations.length >= settings.maxConcurrentReservations) {
      throw new Error(`You can only reserve ${settings.maxConcurrentReservations} jobs at a time`)
    }

    // Validate reservation time
    if (reservationMinutes > settings.maxReservationMinutes) {
      throw new Error(`Reservation time cannot exceed ${settings.maxReservationMinutes} minutes`)
    }

    return localReservationStorage.createReservation(jobId, userId, reservationMinutes)
  } catch (error) {
    console.error("Error creating reservation:", error)
    return null
  }
}

export function cancelReservation(reservationId: string): boolean {
  try {
    return localReservationStorage.cancelReservation(reservationId)
  } catch (error) {
    console.error("Error cancelling reservation:", error)
    return false
  }
}

// Auto-cleanup function that should be called periodically
export function cleanupExpiredReservations(): LocalReservation[] {
  try {
    return localReservationStorage.expireOldReservations()
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error)
    return []
  }
}

// Get reservation settings
export function getReservationSettings() {
  return localReservationStorage.getSettings()
}

// Update reservation settings
export function updateReservationSettings(updates: Partial<Omit<LocalReservationSettings, "id" | "createdAt">>) {
  const currentSettings = localReservationStorage.getSettings()
  const updatedSettings = {
    ...currentSettings,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localReservationStorage.saveSettings(updatedSettings)
  return updatedSettings
}

export function getLocalReservations(): LocalReservation[] {
  return localReservationStorage.getReservations()
}

export interface ReservationViolation {
  id: string
  userId: string
  violationCount: number
  lastViolationAt: string
  totalReservations: number
  expiredReservations: number
}

export function getLocalReservationViolations(): ReservationViolation[] {
  // For now, generate mock violations based on expired reservations
  // In a real system, this would track actual violation history
  const reservations = localReservationStorage.getReservations()
  const userStats: Record<string, { total: number; expired: number; lastExpired?: string }> = {}

  reservations.forEach((reservation) => {
    if (!userStats[reservation.userId]) {
      userStats[reservation.userId] = { total: 0, expired: 0 }
    }

    userStats[reservation.userId].total++

    if (reservation.status === "expired") {
      userStats[reservation.userId].expired++
      userStats[reservation.userId].lastExpired = reservation.updatedAt
    }
  })

  return Object.entries(userStats)
    .filter(([_, stats]) => stats.expired > 0)
    .map(([userId, stats]) => ({
      id: `violation_${userId}`,
      userId,
      violationCount: stats.expired,
      lastViolationAt: stats.lastExpired || new Date().toISOString(),
      totalReservations: stats.total,
      expiredReservations: stats.expired,
    }))
}

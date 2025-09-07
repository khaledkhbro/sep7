import { apiClient } from "./api-client"

export interface ReservationStatus {
  isReserved: boolean
  timeLeft?: number
  expired?: boolean
  reservedBy?: string
}

export async function checkReservationStatus(jobId: string): Promise<ReservationStatus> {
  try {
    const response = await apiClient.request(`/jobs/${jobId}/reservation-status`)
    return response
  } catch (error) {
    console.error("Error checking reservation status:", error)
    return { isReserved: false }
  }
}

export async function expireReservation(jobId: string): Promise<boolean> {
  try {
    await apiClient.request(`/jobs/${jobId}/expire-reservation`, { method: "POST" })
    return true
  } catch (error) {
    console.error("Error expiring reservation:", error)
    return false
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

export async function getUserReservations(userId: string) {
  try {
    const reservations = await apiClient.getReservations()
    return reservations || []
  } catch (error) {
    console.error("Error in getUserReservations:", error)
    return []
  }
}

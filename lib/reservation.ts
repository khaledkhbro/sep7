import { apiClient } from "./api-client"

export interface ReservationSettings {
  id: string
  isEnabled: boolean
  defaultReservationHours: number
  maxConcurrentReservations: number
  createdAt: string
  updatedAt: string
}

export async function getReservationSettings(): Promise<ReservationSettings> {
  try {
    const data = await apiClient.request("/admin/reservation-settings")
    return data
  } catch (error) {
    console.error("Error fetching reservation settings:", error)
    return {
      id: "default",
      isEnabled: false,
      defaultReservationHours: 1,
      maxConcurrentReservations: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function updateReservationSettings(settings: Partial<ReservationSettings>): Promise<ReservationSettings> {
  try {
    const data = await apiClient.request("/admin/reservation-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
    return data
  } catch (error) {
    console.error("Error updating reservation settings:", error)
    throw error
  }
}

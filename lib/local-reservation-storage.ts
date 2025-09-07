export interface LocalReservation {
  id: string
  jobId: string
  userId: string
  reservedAt: string
  expiresAt: string
  status: "active" | "expired" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

export interface LocalReservationSettings {
  id: string
  isEnabled: boolean
  defaultReservationMinutes: number
  maxReservationMinutes: number
  maxConcurrentReservations: number
  createdAt: string
  updatedAt: string
}

class LocalReservationStorage {
  private readonly RESERVATIONS_KEY = "microjob_reservations"
  private readonly SETTINGS_KEY = "microjob_reservation_settings"
  private readonly JOB_RESERVATIONS_KEY = "microjob_job_reservations"

  // Get all reservations from localStorage
  getReservations(): LocalReservation[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(this.RESERVATIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Error loading reservations from localStorage:", error)
      return []
    }
  }

  // Save reservations to localStorage
  saveReservations(reservations: LocalReservation[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations))
      this.dispatchStorageEvent(this.RESERVATIONS_KEY, reservations)
    } catch (error) {
      console.error("Error saving reservations to localStorage:", error)
    }
  }

  // Get reservation settings
  getSettings(): LocalReservationSettings {
    if (typeof window === "undefined") {
      return this.getDefaultSettings()
    }

    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY)
      return stored ? JSON.parse(stored) : this.getDefaultSettings()
    } catch (error) {
      console.error("Error loading settings from localStorage:", error)
      return this.getDefaultSettings()
    }
  }

  // Save reservation settings
  saveSettings(settings: LocalReservationSettings): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings to localStorage:", error)
    }
  }

  // Get job reservation status (which jobs are reserved)
  getJobReservations(): Record<string, { userId: string; expiresAt: string }> {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem(this.JOB_RESERVATIONS_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("Error loading job reservations from localStorage:", error)
      return {}
    }
  }

  // Save job reservation status
  saveJobReservations(jobReservations: Record<string, { userId: string; expiresAt: string }>): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.JOB_RESERVATIONS_KEY, JSON.stringify(jobReservations))
      this.dispatchStorageEvent(this.JOB_RESERVATIONS_KEY, jobReservations)
    } catch (error) {
      console.error("Error saving job reservations to localStorage:", error)
    }
  }

  // Create a new reservation
  createReservation(jobId: string, userId: string, reservationMinutes: number): LocalReservation {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + reservationMinutes * 60 * 1000)

    const reservation: LocalReservation = {
      id: this.generateId(),
      jobId,
      userId,
      reservedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    // Add to reservations list
    const reservations = this.getReservations()
    reservations.push(reservation)
    this.saveReservations(reservations)

    // Update job reservations mapping
    const jobReservations = this.getJobReservations()
    jobReservations[jobId] = {
      userId,
      expiresAt: expiresAt.toISOString(),
    }
    this.saveJobReservations(jobReservations)

    return reservation
  }

  // Cancel a reservation
  cancelReservation(reservationId: string): boolean {
    const reservations = this.getReservations()
    const reservationIndex = reservations.findIndex((r) => r.id === reservationId)

    if (reservationIndex === -1) return false

    const reservation = reservations[reservationIndex]
    reservation.status = "cancelled"
    reservation.updatedAt = new Date().toISOString()

    this.saveReservations(reservations)

    // Remove from job reservations
    const jobReservations = this.getJobReservations()
    delete jobReservations[reservation.jobId]
    this.saveJobReservations(jobReservations)

    return true
  }

  // Check and expire old reservations
  expireOldReservations(): LocalReservation[] {
    const now = new Date()
    const reservations = this.getReservations()
    const jobReservations = this.getJobReservations()
    const expiredReservations: LocalReservation[] = []

    let hasChanges = false

    reservations.forEach((reservation) => {
      if (reservation.status === "active" && new Date(reservation.expiresAt) < now) {
        reservation.status = "expired"
        reservation.updatedAt = now.toISOString()
        expiredReservations.push(reservation)

        // Remove from job reservations
        delete jobReservations[reservation.jobId]
        hasChanges = true
      }
    })

    if (hasChanges) {
      this.saveReservations(reservations)
      this.saveJobReservations(jobReservations)
    }

    return expiredReservations
  }

  // Get user's active reservations
  getUserActiveReservations(userId: string): LocalReservation[] {
    const reservations = this.getReservations()
    return reservations.filter((r) => r.userId === userId && r.status === "active")
  }

  // Check if job is reserved
  isJobReserved(jobId: string): { isReserved: boolean; userId?: string; expiresAt?: string } {
    const jobReservations = this.getJobReservations()
    const reservation = jobReservations[jobId]

    if (!reservation) {
      return { isReserved: false }
    }

    // Check if expired
    if (new Date(reservation.expiresAt) < new Date()) {
      // Clean up expired reservation
      delete jobReservations[jobId]
      this.saveJobReservations(jobReservations)
      return { isReserved: false }
    }

    return {
      isReserved: true,
      userId: reservation.userId,
      expiresAt: reservation.expiresAt,
    }
  }

  // Get default settings
  private getDefaultSettings(): LocalReservationSettings {
    return {
      id: "default",
      isEnabled: true,
      defaultReservationMinutes: 60, // 1 hour default
      maxReservationMinutes: 1440, // 24 hours max
      maxConcurrentReservations: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // Generate a simple ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Clear all data (for testing/reset)
  clearAll(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem(this.RESERVATIONS_KEY)
    localStorage.removeItem(this.SETTINGS_KEY)
    localStorage.removeItem(this.JOB_RESERVATIONS_KEY)
  }

  private dispatchStorageEvent(key: string, data: any) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("reservationStorageChange", {
          detail: { key, data },
        }),
      )
    }
  }
}

// Export singleton instance
export const localReservationStorage = new LocalReservationStorage()

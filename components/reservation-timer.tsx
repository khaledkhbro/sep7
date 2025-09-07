"use client"

import { useState, useEffect } from "react"
import { Timer, AlertTriangle } from "lucide-react"
import { formatTimeLeft } from "@/lib/local-reservation-utils"

interface ReservationTimerProps {
  expiresAt: string
  onExpire?: () => void
  className?: string
}

export function ReservationTimer({ expiresAt, onExpire, className = "" }: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const difference = expiry - now

      if (difference <= 0) {
        setTimeLeft(0)
        setIsExpired(true)
        onExpire?.()
      } else {
        setTimeLeft(difference)
        setIsExpired(false)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    const handleStorageChange = (e: CustomEvent) => {
      const { key } = e.detail
      if (key === "microjob_job_reservations") {
        updateTimer()
      }
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "microjob_job_reservations") {
        updateTimer()
      }
    }

    window.addEventListener("reservationStorageChange", handleStorageChange as EventListener)
    window.addEventListener("storage", handleStorageEvent)

    return () => {
      clearInterval(interval)
      window.removeEventListener("reservationStorageChange", handleStorageChange as EventListener)
      window.removeEventListener("storage", handleStorageEvent)
    }
  }, [expiresAt, onExpire])

  if (isExpired) {
    return (
      <div className={`flex items-center text-red-600 ${className}`}>
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span className="font-medium">Expired</span>
      </div>
    )
  }

  const isUrgent = timeLeft < 5 * 60 * 1000 // Less than 5 minutes
  const isWarning = timeLeft < 15 * 60 * 1000 // Less than 15 minutes

  return (
    <div
      className={`flex items-center ${
        isUrgent ? "text-red-600" : isWarning ? "text-orange-600" : "text-blue-600"
      } ${className}`}
    >
      <Timer className={`h-4 w-4 mr-1 ${isUrgent ? "animate-pulse" : ""}`} />
      <span className="font-medium">{formatTimeLeft(timeLeft)}</span>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    upload: number
    download: number
  }
  uptime: number
  loadAverage: number[]
  lastUpdated: string
}

interface ServerStatus {
  database: {
    status: string
    connections: {
      active: number
      max: number
    }
    size: number
    version: string
  }
  application: {
    status: string
    activeUsers: number
    responseTime: number
    errorRate: number
    requestsPerMinute: number
  }
  webServer: {
    status: string
  }
  lastUpdated: string
}

interface HistoricalData {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export function useMonitoring(serverId = "main-server") {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/monitoring/metrics?server_id=${serverId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metrics")
      }

      setMetrics(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [serverId])

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/monitoring/status?server_id=${serverId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch status")
      }

      setStatus(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }, [serverId])

  const fetchHistoricalData = useCallback(
    async (hours = 24, interval = "1h") => {
      try {
        const response = await fetch(
          `/api/monitoring/historical?server_id=${serverId}&hours=${hours}&interval=${interval}`,
        )
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch historical data")
        }

        setHistoricalData(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [serverId],
  )

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMetrics(), fetchStatus(), fetchHistoricalData()])
  }, [fetchMetrics, fetchStatus, fetchHistoricalData])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  return {
    metrics,
    status,
    historicalData,
    isLoading,
    error,
    refreshAll,
    fetchMetrics,
    fetchStatus,
    fetchHistoricalData,
  }
}

export function useMonitoringAlerts() {
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async (activeOnly = false) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/monitoring/alerts?active=${activeOnly}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch alerts")
      }

      setAlerts(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchNotifications = useCallback(async (serverId = "main-server", unreadOnly = false) => {
    try {
      const response = await fetch(`/api/monitoring/notifications?server_id=${serverId}&unread=${unreadOnly}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch notifications")
      }

      setNotifications(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    }
  }, [])

  const resolveNotifications = useCallback(
    async (notificationIds: number[]) => {
      try {
        const response = await fetch("/api/monitoring/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notification_ids: notificationIds,
            action: "resolve",
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to resolve notifications")
        }

        // Refresh notifications after resolving
        await fetchNotifications()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      }
    },
    [fetchNotifications],
  )

  useEffect(() => {
    fetchAlerts()
    fetchNotifications()
  }, [fetchAlerts, fetchNotifications])

  return {
    alerts,
    notifications,
    isLoading,
    error,
    fetchAlerts,
    fetchNotifications,
    resolveNotifications,
  }
}

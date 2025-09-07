"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Cpu, HardDrive, MemoryStick, Network, Wifi, WifiOff } from "lucide-react"
import { useMonitoring } from "@/hooks/use-monitoring"

interface RealTimeMetricsProps {
  serverId?: string
  refreshInterval?: number
}

export default function RealTimeMetrics({ serverId = "main-server", refreshInterval = 30000 }: RealTimeMetricsProps) {
  const { metrics, status, isLoading, error, refreshAll } = useMonitoring(serverId)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // Auto-refresh metrics
    const interval = setInterval(() => {
      refreshAll().catch(() => setIsConnected(false))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshAll, refreshInterval])

  useEffect(() => {
    if (metrics) {
      setIsConnected(true)
    }
  }, [metrics])

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return "text-green-600"
    if (percentage < 80) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (percentage: number) => {
    if (percentage < 50)
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Healthy
        </Badge>
      )
    if (percentage < 80)
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Warning
        </Badge>
      )
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Critical
      </Badge>
    )
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <WifiOff className="h-5 w-5 mr-2" />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-500 mt-2">
            Make sure the monitoring API is running and the metrics collection script is active.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
          <span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
          {metrics.lastUpdated && (
            <span className="text-xs text-gray-400">
              • Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        {isLoading && (
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 animate-pulse text-blue-600" />
            <span className="text-sm text-blue-600">Updating...</span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpu.usage}%</div>
            <Progress value={metrics.cpu.usage} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{metrics.cpu.cores} cores</span>
              {metrics.cpu.temperature > 0 && <span>{metrics.cpu.temperature}°C</span>}
            </div>
            {getStatusBadge(metrics.cpu.usage)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memory.percentage}%</div>
            <Progress value={metrics.memory.percentage} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.memory.used}GB / {metrics.memory.total}GB
            </div>
            {getStatusBadge(metrics.memory.percentage)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.disk.percentage}%</div>
            <Progress value={metrics.disk.percentage} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {metrics.disk.used}GB / {metrics.disk.total}GB
            </div>
            {getStatusBadge(metrics.disk.percentage)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">↓ {metrics.network.download.toFixed(1)} MB/s</span>
                <span className="text-blue-600">↑ {metrics.network.upload.toFixed(1)} MB/s</span>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      {metrics.uptime > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Uptime</span>
                <div className="font-medium">{formatUptime(metrics.uptime)}</div>
              </div>
              {metrics.loadAverage && metrics.loadAverage.length > 0 && (
                <div>
                  <span className="text-gray-600">Load Average</span>
                  <div className="font-medium">{metrics.loadAverage.join(", ")}</div>
                </div>
              )}
              <div>
                <span className="text-gray-600">Server ID</span>
                <div className="font-medium">{serverId}</div>
              </div>
              <div>
                <span className="text-gray-600">Status</span>
                <div className="font-medium text-green-600">Online</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

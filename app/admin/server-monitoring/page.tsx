"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Server, RefreshCw, CheckCircle, Database } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import RealTimeMetrics from "@/components/monitoring/real-time-metrics"
import { useMonitoring } from "@/hooks/use-monitoring"

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
}

interface HistoricalData {
  timestamp: string
  cpu: number
  memory: number
  disk: number
  network: number
}

export default function ServerMonitoringPage() {
  const { metrics, status, historicalData, isLoading, error, refreshAll } = useMonitoring()
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshMetrics = async () => {
    try {
      await refreshAll()
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to refresh metrics:", error)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Server Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor your VPS server performance and resource usage</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          <Button onClick={refreshMetrics} disabled={isLoading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <RealTimeMetrics serverId="main-server" refreshInterval={30000} />

      {/* System Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">{formatUptime(metrics.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Load Average</span>
                  <span className="text-sm font-medium">{metrics.loadAverage.join(", ")}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">OS</span>
              <span className="text-sm font-medium">Ubuntu 22.04 LTS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Architecture</span>
              <span className="text-sm font-medium">x86_64</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PostgreSQL</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">{status.database.status}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Connections</span>
                  <span className="text-sm font-medium">
                    {status.database.connections.active}/{status.database.connections.max}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Database Size</span>
                  <span className="text-sm font-medium">{status.database.size} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version</span>
                  <span className="text-sm font-medium">{status.database.version}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Loading database status...</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Application Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next.js App</span>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">{status.application.status}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-medium">{status.application.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">{status.application.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-sm font-medium text-green-600">{status.application.errorRate}%</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">Loading application status...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Charts */}
      <Tabs defaultValue="cpu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cpu">CPU Usage</TabsTrigger>
          <TabsTrigger value="memory">Memory Usage</TabsTrigger>
          <TabsTrigger value="disk">Disk Usage</TabsTrigger>
          <TabsTrigger value="network">Network Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="cpu">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage Over Time</CardTitle>
              <CardDescription>24-hour CPU usage history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stroke="#ef4444" fill="#fecaca" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Over Time</CardTitle>
              <CardDescription>24-hour memory usage history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="memory" stroke="#3b82f6" fill="#bfdbfe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disk">
          <Card>
            <CardHeader>
              <CardTitle>Disk Usage Over Time</CardTitle>
              <CardDescription>24-hour disk usage history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="disk" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic Over Time</CardTitle>
              <CardDescription>24-hour network traffic history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="network" stroke="#8b5cf6" fill="#ddd6fe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

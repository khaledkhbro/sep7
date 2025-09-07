"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Eye, MousePointer, DollarSign, RefreshCw } from "lucide-react"

interface AdPerformanceData {
  network_name: string
  placement_name: string
  total_impressions: number
  total_clicks: number
  total_revenue: number
  ctr: number
  avg_revenue_per_click: number
}

export function AdPerformanceDashboard() {
  const [performanceData, setPerformanceData] = useState<AdPerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30")

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ads/performance?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      }
    } catch (error) {
      console.error("Failed to fetch performance data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [dateRange])

  const totalStats = performanceData.reduce(
    (acc, item) => ({
      impressions: acc.impressions + item.total_impressions,
      clicks: acc.clicks + item.total_clicks,
      revenue: acc.revenue + item.total_revenue,
    }),
    { impressions: 0, clicks: 0, revenue: 0 },
  )

  const overallCTR = totalStats.impressions > 0 ? (totalStats.clicks / totalStats.impressions) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Ad Performance Dashboard</h3>
          <p className="text-sm text-muted-foreground">Monitor your ad network performance and revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchPerformanceData} disabled={loading} size="sm">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.impressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.clicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCTR.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Network & Placement</CardTitle>
          <CardDescription>Compare performance across different ad networks and placements</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="network_name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  name === "total_revenue" ? `$${Number(value).toFixed(2)}` : Number(value).toLocaleString(),
                  name === "total_revenue" ? "Revenue" : name === "total_impressions" ? "Impressions" : "Clicks",
                ]}
              />
              <Bar dataKey="total_revenue" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Performance</CardTitle>
          <CardDescription>Breakdown by network and placement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-medium capitalize">{item.network_name}</div>
                    <div className="text-sm text-muted-foreground capitalize">{item.placement_name}</div>
                  </div>
                  <Badge variant="outline">{item.ctr.toFixed(2)}% CTR</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{item.total_impressions.toLocaleString()}</div>
                    <div className="text-muted-foreground">Impressions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{item.total_clicks.toLocaleString()}</div>
                    <div className="text-muted-foreground">Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">${item.total_revenue.toFixed(2)}</div>
                    <div className="text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">${item.avg_revenue_per_click.toFixed(4)}</div>
                    <div className="text-muted-foreground">RPC</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

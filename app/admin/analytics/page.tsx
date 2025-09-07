"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPlatformMetrics, type PlatformMetrics } from "@/lib/admin"
import { TrendingUp, Users, DollarSign, Briefcase, Download, Calendar, BarChart3 } from "lucide-react"

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"]

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const metricsData = await getPlatformMetrics()
      setMetrics(metricsData)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    // Mock export functionality
    alert("Analytics data exported successfully!")
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Analytics & Reports" description="Platform performance and insights" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </>
    )
  }

  if (!metrics) {
    return (
      <>
        <AdminHeader title="Analytics & Reports" description="Platform performance and insights" />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Analytics & Reports" description="Platform performance and insights" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={exportData} className="bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={loadAnalytics}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {metrics.userGrowth.length > 0
                    ? metrics.userGrowth[metrics.userGrowth.length - 1]?.totalUsers?.toLocaleString() || "0"
                    : "0"}
                </div>
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />+
                  {metrics.userGrowth.length > 0 ? metrics.userGrowth[metrics.userGrowth.length - 1]?.newUsers || 0 : 0}{" "}
                  this month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  $
                  {metrics.monthlyRevenue.length > 0
                    ? ((metrics.monthlyRevenue[metrics.monthlyRevenue.length - 1]?.revenue || 0) / 1000).toFixed(0)
                    : "0"}
                  K
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +18.3% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {metrics.categoryDistribution.length > 0
                    ? metrics.categoryDistribution.reduce((sum, cat) => sum + (cat.count || 0), 0).toLocaleString()
                    : "0"}
                </div>
                <div className="flex items-center text-xs text-purple-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.7% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Daily Active Users</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {metrics.dailyActiveUsers.length > 0
                    ? metrics.dailyActiveUsers[metrics.dailyActiveUsers.length - 1]?.users?.toLocaleString() || "0"
                    : "0"}
                </div>
                <div className="flex items-center text-xs text-orange-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from yesterday
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Daily Active Users */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.dailyActiveUsers.length > 0 ? (
                      <ChartContainer
                        config={{
                          users: {
                            label: "Active Users",
                            color: "#3B82F6",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.dailyActiveUsers}>
                            <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                              type="monotone"
                              dataKey="users"
                              stroke="#3B82F6"
                              strokeWidth={3}
                              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.monthlyRevenue.length > 0 ? (
                      <ChartContainer
                        config={{
                          revenue: {
                            label: "Revenue",
                            color: "#10B981",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.monthlyRevenue}>
                            <XAxis dataKey="month" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.userGrowth.length > 0 ? (
                    <ChartContainer
                      config={{
                        newUsers: {
                          label: "New Users",
                          color: "#8B5CF6",
                        },
                        totalUsers: {
                          label: "Total Users",
                          color: "#3B82F6",
                        },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.userGrowth}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="newUsers" stroke="#8B5CF6" strokeWidth={2} name="New Users" />
                          <Line
                            type="monotone"
                            dataKey="totalUsers"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            name="Total Users"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.monthlyRevenue.length > 0 ? (
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenue",
                          color: "#10B981",
                        },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.monthlyRevenue}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {metrics.categoryDistribution.length > 0 ? (
                      <ChartContainer
                        config={{
                          count: {
                            label: "Count",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={metrics.categoryDistribution}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="count"
                              label={({ category, percentage }) => `${category}: ${percentage}%`}
                            >
                              {metrics.categoryDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics.categoryDistribution.length > 0 ? (
                      metrics.categoryDistribution.map((category, index) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{category.category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{category.count} jobs</Badge>
                            <span className="text-sm text-gray-600">{category.percentage}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">No category data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

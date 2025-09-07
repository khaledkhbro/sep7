"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { serviceStorage, type StorageService } from "@/lib/local-storage"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { ArrowLeft, Eye, ShoppingCart, Star, DollarSign, Target, Zap } from "lucide-react"
import Link from "next/link"

const generateEnhancedMockData = (serviceId: string) => {
  const hourlyViews = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    views: Math.floor(Math.random() * 20) + 5,
    clicks: Math.floor(Math.random() * 10) + 2,
  }))

  const dailyViews = [
    { day: "Mon", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Tue", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Wed", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Thu", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Fri", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Sat", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
    { day: "Sun", views: Math.floor(Math.random() * 50) + 10, orders: Math.floor(Math.random() * 5) + 1 },
  ]

  const weeklyData = Array.from({ length: 12 }, (_, i) => ({
    week: `Week ${i + 1}`,
    views: Math.floor(Math.random() * 200) + 50,
    orders: Math.floor(Math.random() * 15) + 3,
    revenue: Math.floor(Math.random() * 500) + 100,
  }))

  const monthlyOrders = [
    { month: "Jul", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
    { month: "Aug", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
    { month: "Sep", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
    { month: "Oct", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
    { month: "Nov", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
    { month: "Dec", orders: Math.floor(Math.random() * 20) + 5, revenue: Math.floor(Math.random() * 1000) + 200 },
  ]

  const trafficSources = [
    { name: "Direct", value: 35, color: "#3b82f6" },
    { name: "Search", value: 28, color: "#10b981" },
    { name: "Social Media", value: 20, color: "#f59e0b" },
    { name: "Referrals", value: 12, color: "#ef4444" },
    { name: "Email", value: 5, color: "#8b5cf6" },
  ]

  const demographics = [
    { age: "18-24", percentage: 15 },
    { age: "25-34", percentage: 35 },
    { age: "35-44", percentage: 28 },
    { age: "45-54", percentage: 15 },
    { age: "55+", percentage: 7 },
  ]

  const topCountries = [
    { country: "United States", orders: 45, revenue: 2250 },
    { country: "United Kingdom", orders: 23, revenue: 1150 },
    { country: "Canada", orders: 18, revenue: 900 },
    { country: "Australia", orders: 12, revenue: 600 },
    { country: "Germany", orders: 8, revenue: 400 },
  ]

  return {
    hourlyViews,
    dailyViews,
    weeklyData,
    monthlyOrders,
    trafficSources,
    demographics,
    topCountries,
  }
}

export default function ServiceAnalyticsPage() {
  const [service, setService] = useState<StorageService | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [timeRange, setTimeRange] = useState("7days")

  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string

  useEffect(() => {
    const loadService = () => {
      try {
        const foundService = serviceStorage.getById(serviceId)

        if (!foundService) {
          console.log("[v0] Service not found:", serviceId)
          router.push("/dashboard/services")
          return
        }

        if (foundService.sellerId !== user?.id) {
          console.log("[v0] User doesn't own this service")
          router.push("/dashboard/services")
          return
        }

        setService(foundService)
        setAnalyticsData(generateEnhancedMockData(serviceId))
      } catch (error) {
        console.error("[v0] Error loading service:", error)
        router.push("/dashboard/services")
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      loadService()
    }
  }, [serviceId, user?.id, router])

  if (loading) {
    return (
      <>
        <DashboardHeader title="Service Analytics" description="Loading service analytics..." />
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </>
    )
  }

  if (!service) {
    return (
      <>
        <DashboardHeader title="Service Analytics" description="Service not found" />
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h2>
            <p className="text-gray-600 mb-4">The service you're looking for doesn't exist.</p>
            <Link href="/dashboard/services">
              <Button>Back to Services</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  const conversionRate = ((service.totalOrders / service.viewsCount) * 100).toFixed(2)
  const avgOrderValue = service.price
  const totalRevenue = service.totalOrders * service.price
  const impressionClickRate = (85.5).toFixed(1) // Mock CTR

  return (
    <>
      <DashboardHeader
        title={`Analytics: ${service.title}`}
        description="Comprehensive performance metrics and insights"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/services">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Button>
            </Link>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 3 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Service Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                <img
                  src={service.images[0] || "/placeholder.svg"}
                  alt={service.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="text-gray-600 text-sm">{service.shortDescription}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-green-600">${service.price}</span>
                    <span>⭐ {service.rating}</span>
                    <span>{service.totalOrders} orders</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.viewsCount}</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.totalOrders}</div>
                <p className="text-xs text-muted-foreground">+8% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversionRate}%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{service.rating}</div>
                <p className="text-xs text-muted-foreground">Based on reviews</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{impressionClickRate}%</div>
                <p className="text-xs text-muted-foreground">Impression to click</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="geography">Geography</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Hourly Views */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Views (Last 24 Hours)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData?.hourlyViews}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Daily Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Performance (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData?.dailyViews}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Views" />
                        <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Weekly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Trends (Last 12 Weeks)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData?.weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#3b82f6" name="Views" />
                        <Bar dataKey="orders" fill="#10b981" name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData?.trafficSources}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {analyticsData?.trafficSources.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Age Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Age Demographics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData?.demographics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Audience Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Returning Customers</span>
                      <span className="text-sm text-gray-600">68%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Session Duration</span>
                      <span className="text-sm text-gray-600">3m 24s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bounce Rate</span>
                      <span className="text-sm text-gray-600">24%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Peak Activity Time</span>
                      <span className="text-sm text-gray-600">2:00 PM - 4:00 PM</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geography" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Countries by Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData?.topCountries.map((country: any, index: number) => (
                      <div
                        key={country.country}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                          <span className="font-medium">{country.country}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{country.orders} orders</div>
                          <div className="text-sm text-gray-600">${country.revenue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Monthly Revenue */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue (Last 6 Months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData?.monthlyOrders}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Gross Revenue</span>
                      <span className="text-sm font-semibold text-green-600">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Platform Fee (5%)</span>
                      <span className="text-sm text-red-600">-${(totalRevenue * 0.05).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Processing Fee (3%)</span>
                      <span className="text-sm text-red-600">-${(totalRevenue * 0.03).toLocaleString()}</span>
                    </div>
                    <hr />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Net Revenue</span>
                      <span className="font-semibold text-green-600">${(totalRevenue * 0.92).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Order Value</span>
                      <span className="text-sm text-gray-600">${avgOrderValue}</span>
                    </div>
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

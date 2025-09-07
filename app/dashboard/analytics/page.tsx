import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"
import { TrendingUp, DollarSign, Eye, Star } from "lucide-react"

const earningsData = [
  { month: "Jan", earnings: 1200 },
  { month: "Feb", earnings: 1800 },
  { month: "Mar", earnings: 2200 },
  { month: "Apr", earnings: 1900 },
  { month: "May", earnings: 2600 },
  { month: "Jun", earnings: 2847 },
]

const viewsData = [
  { day: "Mon", views: 45 },
  { day: "Tue", views: 52 },
  { day: "Wed", views: 38 },
  { day: "Thu", views: 61 },
  { day: "Fri", views: 55 },
  { day: "Sat", views: 42 },
  { day: "Sun", views: 48 },
]

const serviceData = [
  { name: "Web Development", value: 40, color: "#3b82f6" },
  { name: "Graphic Design", value: 30, color: "#f97316" },
  { name: "Writing", value: 20, color: "#10b981" },
  { name: "Marketing", value: 10, color: "#f59e0b" },
]

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader title="Analytics" description="Track your performance and earnings across the platform." />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">+0.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$127</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.9</div>
                <p className="text-xs text-muted-foreground">Based on 156 reviews</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Earnings Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={earningsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="earnings" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Views Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Profile Views</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Service Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Service Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

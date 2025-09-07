"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Search,
} from "lucide-react"

interface Report {
  id: string
  title: string
  description: string
  type: "financial" | "user" | "system" | "security"
  status: "ready" | "generating" | "scheduled"
  createdAt: string
  size: string
  downloadUrl?: string
}

const mockReports: Report[] = [
  {
    id: "1",
    title: "Monthly Financial Report",
    description: "Complete financial overview including revenue, expenses, and profit margins",
    type: "financial",
    status: "ready",
    createdAt: "2024-01-20T10:00:00Z",
    size: "2.4 MB",
    downloadUrl: "/reports/financial-jan-2024.pdf",
  },
  {
    id: "2",
    title: "User Activity Analysis",
    description: "Detailed analysis of user engagement, retention, and behavior patterns",
    type: "user",
    status: "ready",
    createdAt: "2024-01-19T15:30:00Z",
    size: "1.8 MB",
    downloadUrl: "/reports/user-activity-jan-2024.pdf",
  },
  {
    id: "3",
    title: "System Performance Report",
    description: "Server performance, uptime statistics, and technical metrics",
    type: "system",
    status: "generating",
    createdAt: "2024-01-20T12:00:00Z",
    size: "Generating...",
  },
  {
    id: "4",
    title: "Security Audit Report",
    description: "Security incidents, threat analysis, and compliance status",
    type: "security",
    status: "scheduled",
    createdAt: "2024-01-21T09:00:00Z",
    size: "Scheduled",
  },
]

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")

  const generateReport = async (type: string) => {
    setLoading(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newReport: Report = {
      id: Date.now().toString(),
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      description: `Generated ${type} report for current period`,
      type: type as any,
      status: "ready",
      createdAt: new Date().toISOString(),
      size: "1.2 MB",
      downloadUrl: `/reports/${type}-${Date.now()}.pdf`,
    }

    setReports((prev) => [newReport, ...prev])
    setLoading(false)
    alert("Report generated successfully!")
  }

  const downloadReport = (report: Report) => {
    if (report.downloadUrl) {
      // Simulate download
      alert(`Downloading ${report.title}...`)
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchQuery === "" ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterType === "all" || report.type === filterType
    const matchesTab = activeTab === "all" || report.status === activeTab

    return matchesSearch && matchesFilter && matchesTab
  })

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type: Report["type"]) => {
    switch (type) {
      case "financial":
        return <DollarSign className="h-4 w-4 text-green-600" />
      case "user":
        return <Users className="h-4 w-4 text-blue-600" />
      case "system":
        return <TrendingUp className="h-4 w-4 text-purple-600" />
      case "security":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <>
      <AdminHeader title="Reports & Analytics" description="Generate and manage platform reports" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => generateReport("financial")}
                  disabled={loading}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="h-6 w-6" />
                  <span>Financial Report</span>
                </Button>
                <Button
                  onClick={() => generateReport("user")}
                  disabled={loading}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-6 w-6" />
                  <span>User Analytics</span>
                </Button>
                <Button
                  onClick={() => generateReport("system")}
                  disabled={loading}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-purple-600 hover:bg-purple-700"
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>System Report</span>
                </Button>
                <Button
                  onClick={() => generateReport("security")}
                  disabled={loading}
                  className="h-20 flex flex-col items-center justify-center space-y-2 bg-red-600 hover:bg-red-700"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <span>Security Audit</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="user">User Analytics</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Reports ({reports.length})</TabsTrigger>
              <TabsTrigger value="ready">Ready ({reports.filter((r) => r.status === "ready").length})</TabsTrigger>
              <TabsTrigger value="generating">
                Generating ({reports.filter((r) => r.status === "generating").length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Scheduled ({reports.filter((r) => r.status === "scheduled").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-gray-100 rounded-lg">{getTypeIcon(report.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{report.title}</h3>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(report.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {report.size}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {report.status === "ready" && (
                            <Button
                              size="sm"
                              onClick={() => downloadReport(report)}
                              className="bg-transparent"
                              variant="outline"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                          {report.status === "generating" && (
                            <div className="flex items-center text-sm text-yellow-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                              Generating...
                            </div>
                          )}
                          {report.status === "scheduled" && (
                            <div className="text-sm text-blue-600">
                              Scheduled for {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredReports.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                    <p className="text-gray-600">
                      {searchQuery || filterType !== "all"
                        ? "Try adjusting your search or filters"
                        : "Generate your first report using the buttons above"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

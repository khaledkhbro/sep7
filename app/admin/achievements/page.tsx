"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Trophy,
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  referralType: "vip" | "normal" // Added referral type field
  referralRequirement: number // Renamed from vipRequirement to be more generic
  rewardAmount: number
  isActive: boolean
  createdAt: string
}

interface AchievementRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  achievementId: string
  achievementName: string
  vipReferralsCount: number
  status: "pending" | "approved" | "rejected" | "paid"
  createdAt: string
  processedAt?: string
  processedBy?: string
}

export default function AdminAchievementsPage() {
  const { toast } = useToast()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [achievementRequests, setAchievementRequests] = useState<AchievementRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const requestsPerPage = 10

  // Dialog states
  const [createAchievementDialog, setCreateAchievementDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AchievementRequest | null>(null)
  const [requestDetailsDialog, setRequestDetailsDialog] = useState(false)

  // Form states
  const [newAchievement, setNewAchievement] = useState({
    name: "",
    description: "",
    referralType: "vip" as "vip" | "normal", // Added referral type with default
    referralRequirement: 1, // Renamed from vipRequirement
    rewardAmount: 0,
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/achievements")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

        if (errorData.missingTable) {
          toast({
            title: "Database Setup Required",
            description: `Missing table: ${errorData.missingTable}. Please run the database setup scripts first.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorData.details || errorData.error || "Failed to load achievement data",
            variant: "destructive",
          })
        }
        throw new Error(errorData.error || "Failed to fetch achievements")
      }

      const data = await response.json()
      setAchievements(data.achievements)
      setAchievementRequests(data.requests)

      console.log("[v0] Loaded achievements and requests from database")
    } catch (error) {
      console.error("[v0] Error loading data from database:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAchievement = async () => {
    if (!newAchievement.name || !newAchievement.description || newAchievement.rewardAmount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch("/api/admin/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAchievement),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

        // Show specific error message for missing database tables
        if (errorData.missingTable) {
          toast({
            title: "Database Setup Required",
            description: `Missing table: ${errorData.missingTable}. Please run the database setup scripts first.`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorData.details || errorData.error || "Failed to create achievement",
            variant: "destructive",
          })
        }
        throw new Error(errorData.error || "Failed to create achievement")
      }

      const newAchievementData = await response.json()
      setAchievements((prev) => [...prev, newAchievementData])

      setCreateAchievementDialog(false)
      setNewAchievement({
        name: "",
        description: "",
        referralType: "vip",
        referralRequirement: 1,
        rewardAmount: 0,
        isActive: true,
      })

      console.log("[v0] Created new achievement:", newAchievementData)
      toast({
        title: "Success",
        description: "Achievement created successfully",
      })
    } catch (error) {
      console.error("[v0] Error creating achievement:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: "approve" | "reject" | "pay") => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/achievement-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error(`Failed to ${action} request`)

      const updatedRequest = await response.json()
      setAchievementRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)))

      console.log("[v0] Updated request status:", { requestId, action })
      toast({
        title: "Success",
        description: `Request ${action}d successfully`,
      })
    } catch (error) {
      console.error("[v0] Error updating request:", error)
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleAchievementStatus = async (achievementId: string, isActive: boolean) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/achievements/${achievementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) throw new Error("Failed to update achievement")

      const updatedAchievement = await response.json()
      setAchievements((prev) => prev.map((ach) => (ach.id === achievementId ? updatedAchievement : ach)))

      console.log("[v0] Toggled achievement status:", { achievementId, isActive })
      toast({
        title: "Success",
        description: `Achievement ${isActive ? "activated" : "deactivated"} successfully`,
      })
    } catch (error) {
      console.error("[v0] Error updating achievement status:", error)
      toast({
        title: "Error",
        description: "Failed to update achievement status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Filter and paginate requests
  const filteredRequests = achievementRequests.filter((request) => {
    const matchesSearch =
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.achievementName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage)
  const startIndex = (currentPage - 1) * requestsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + requestsPerPage)

  // Statistics
  const stats = {
    totalAchievements: achievements.length,
    activeAchievements: achievements.filter((a) => a.isActive).length,
    totalRequests: achievementRequests.length,
    pendingRequests: achievementRequests.filter((r) => r.status === "pending").length,
    approvedRequests: achievementRequests.filter((r) => r.status === "approved").length,
    paidRequests: achievementRequests.filter((r) => r.status === "paid").length,
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      paid: "bg-green-100 text-green-800",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading achievement data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AdminHeader
        title="Achievement Management"
        description="Manage referral achievements and process reward requests"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAchievements}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active</p>
                    <p className="text-2xl font-bold text-green-900">{stats.activeAchievements}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Requests</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalRequests}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.pendingRequests}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Approved</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.approvedRequests}</p>
                  </div>
                  <Star className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Paid</p>
                    <p className="text-2xl font-bold text-green-900">{stats.paidRequests}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">Available Achievements</CardTitle>
                <Dialog open={createAchievementDialog} onOpenChange={setCreateAchievementDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Achievement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Achievement</DialogTitle>
                      <DialogDescription>Set up a new referral achievement with reward criteria</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Achievement Name</Label>
                        <Input
                          id="name"
                          value={newAchievement.name}
                          onChange={(e) => setNewAchievement((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., VIP Referrer Bronze"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAchievement.description}
                          onChange={(e) => setNewAchievement((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what users need to do to earn this achievement"
                        />
                      </div>
                      <div>
                        <Label htmlFor="referralType">Referral Type</Label>
                        <Select
                          value={newAchievement.referralType}
                          onValueChange={(value: "vip" | "normal") =>
                            setNewAchievement((prev) => ({ ...prev, referralType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select referral type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vip">VIP Referrals</SelectItem>
                            <SelectItem value="normal">Normal Referrals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="referralRequirement">
                          {newAchievement.referralType === "vip" ? "VIP" : "Normal"} Referrals Required
                        </Label>
                        <Input
                          id="referralRequirement"
                          type="number"
                          min="1"
                          value={newAchievement.referralRequirement}
                          onChange={(e) =>
                            setNewAchievement((prev) => ({
                              ...prev,
                              referralRequirement: Number.parseInt(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="rewardAmount">Reward Amount ($)</Label>
                        <Input
                          id="rewardAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newAchievement.rewardAmount}
                          onChange={(e) =>
                            setNewAchievement((prev) => ({
                              ...prev,
                              rewardAmount: Number.parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={newAchievement.isActive}
                          onCheckedChange={(checked) => setNewAchievement((prev) => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleCreateAchievement}
                          disabled={actionLoading}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create Achievement
                        </Button>
                        <Button variant="outline" onClick={() => setCreateAchievementDialog(false)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No achievements created yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {achievements.map((achievement) => (
                      <Card key={achievement.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Trophy className="h-5 w-5 text-yellow-500" />
                              <h3 className="font-semibold text-gray-900">{achievement.name}</h3>
                            </div>
                            <Switch
                              checked={achievement.isActive}
                              onCheckedChange={(checked) => toggleAchievementStatus(achievement.id, checked)}
                              disabled={actionLoading}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type:</span>
                              <Badge variant={achievement.referralType === "vip" ? "default" : "secondary"}>
                                {achievement.referralType === "vip" ? "VIP" : "Normal"} Referrals
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Requirement:</span>
                              <span className="font-medium">{achievement.referralRequirement} referrals</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Reward:</span>
                              <span className="font-medium text-green-600">
                                ${(achievement.rewardAmount || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <Badge variant={achievement.isActive ? "default" : "secondary"}>
                                {achievement.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievement Requests */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">Achievement Requests</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Review and process user achievement applications</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {achievementRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No achievement requests yet</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-purple-600 hover:bg-purple-600">
                          <TableHead className="text-white font-semibold">#</TableHead>
                          <TableHead className="text-white font-semibold">User</TableHead>
                          <TableHead className="text-white font-semibold">Achievement</TableHead>
                          <TableHead className="text-white font-semibold">VIP Referrals</TableHead>
                          <TableHead className="text-white font-semibold">Status</TableHead>
                          <TableHead className="text-white font-semibold">Requested</TableHead>
                          <TableHead className="text-white font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRequests.map((request, index) => (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold w-fit">
                                {String(startIndex + index + 1).padStart(2, "0")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-gray-900">{request.userName}</p>
                                <p className="text-sm text-gray-500">{request.userEmail}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{request.achievementName}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {request.vipReferralsCount}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(request.status)}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" disabled={actionLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request)
                                      setRequestDetailsDialog(true)
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {request.status === "pending" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleRequestAction(request.id, "approve")}
                                        className="text-green-600"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRequestAction(request.id, "reject")}
                                        className="text-red-600"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {request.status === "approved" && (
                                    <DropdownMenuItem
                                      onClick={() => handleRequestAction(request.id, "pay")}
                                      className="text-blue-600"
                                    >
                                      <DollarSign className="mr-2 h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + requestsPerPage, filteredRequests.length)} of{" "}
                        {filteredRequests.length} requests
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="text-gray-600 border-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === pageNum ? "bg-purple-600 text-white" : "text-gray-600 border-gray-300"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="text-gray-600 border-gray-300"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={requestDetailsDialog} onOpenChange={setRequestDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Achievement Request Details</DialogTitle>
            <DialogDescription>Review the details of this achievement request</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700">User Information:</h4>
                <div className="bg-gray-50 p-3 rounded border space-y-1">
                  <p className="text-sm">
                    <strong>Name:</strong> {selectedRequest.userName}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> {selectedRequest.userEmail}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700">Achievement:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded border">{selectedRequest.achievementName}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700">VIP Referrals Count:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded border">{selectedRequest.vipReferralsCount}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700">Status:</h4>
                <Badge className={getStatusBadge(selectedRequest.status)}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700">Requested On:</h4>
                <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>

              {selectedRequest.processedAt && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Processed On:</h4>
                  <p className="text-sm">{new Date(selectedRequest.processedAt).toLocaleString()}</p>
                </div>
              )}

              {selectedRequest.status === "pending" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, "approve")
                      setRequestDetailsDialog(false)
                    }}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, "reject")
                      setRequestDetailsDialog(false)
                    }}
                    disabled={actionLoading}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedRequest.status === "approved" && (
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      handleRequestAction(selectedRequest.id, "pay")
                      setRequestDetailsDialog(false)
                    }}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  Gift,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Search,
  Loader2,
  Crown,
  Trophy,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ReferralTarget {
  id: number
  packageTitle: string
  targetUser: number
  prizeType: string
  prizeTitle: string
  image: string
  status: string
  completions: number
}

interface ReferralSettings {
  referPageTitle: string
  referPageText: string
  status: boolean
  [key: string]: any
}

interface UserProgress {
  targetId: number
  currentProgress: number
  isCompleted: boolean
  appliedForPrize: boolean
}

interface ReferredUser {
  id: string
  joiningDate: string
  userId: string
  fullName: string
  email: string
  country: string
  status: "completed" | "pending"
  type: "VIP" | "Regular"
  vipMethod?: "deposit" | "job_completion"
  vipAchievedAt?: string
}

interface ReferralData {
  referralCode: string | null
  statistics: {
    total: number
    completed: number
    pending: number
    vip: number
  }
  referrals: ReferredUser[]
}

interface Achievement {
  id: string
  name: string
  description: string
  vipRequirement: number
  rewardAmount: number
  isActive: boolean
}

interface UserAchievementRequest {
  id: string
  achievementId: string
  vipReferralsCount: number
  status: "pending" | "approved" | "rejected" | "paid"
  createdAt: string
}

export default function ReferPage() {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    referPageTitle: "VIP Refer & Earn",
    referPageText: "",
    status: true,
  })
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: null,
    statistics: { total: 0, completed: 0, pending: 0, vip: 0 },
    referrals: [],
  })
  const [dataLoading, setDataLoading] = useState(true)

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userAchievementRequests, setUserAchievementRequests] = useState<UserAchievementRequest[]>([])
  const [loadingAchievements, setLoadingAchievements] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadAuthenticatedUser = () => {
      try {
        const userData = localStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          setCurrentUser(user)
          console.log("[v0] Loaded authenticated user for referrals:", user)
        }
      } catch (error) {
        console.error("[v0] Error loading authenticated user:", error)
      }
    }

    loadAuthenticatedUser()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.id) {
        console.log("[v0] Waiting for user authentication...")
        return
      }

      try {
        setDataLoading(true)

        console.log("[v0] Loading referral data from database for user:", currentUser.id)

        const response = await fetch(`/api/dashboard/referrals?userId=${currentUser.id}`)
        if (!response.ok) throw new Error("Failed to fetch referral data")

        const data = await response.json()

        setReferralData({
          referralCode: data.referralCode,
          statistics: data.statistics,
          referrals: data.referrals.map((ref: any) => ({
            id: ref.id,
            joiningDate: ref.joining_date,
            userId: ref.user_id,
            fullName: ref.full_name,
            email: ref.email,
            country: ref.country,
            status: ref.status,
            type: ref.is_vip ? "VIP" : "Regular",
            vipMethod: ref.vip_method,
            vipAchievedAt: ref.vip_achieved_at,
          })),
        })

        setReferralLink(`${window.location.origin}/register?ref=${data.referralCode}`)
        setAchievements(data.achievements)
        setUserAchievementRequests(data.userRequests)

        console.log("[v0] Loaded referral data from database:", data)
        setIsInitialized(true)
      } catch (error) {
        console.error("[v0] Error loading referral data:", error)
        toast({
          title: "Error",
          description: "Failed to load referral data from database. Please refresh the page.",
          variant: "destructive",
        })
        setIsInitialized(true)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [toast, currentUser]) // Add currentUser as dependency

  const handleApplyForAchievement = async (achievementId: string) => {
    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "Please log in to apply for achievements.",
        variant: "destructive",
      })
      return
    }

    setLoadingAchievements(true)
    try {
      console.log("[v0] Applying for achievement:", achievementId)

      const response = await fetch("/api/dashboard/achievement-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          achievementId,
          vipReferralsCount: referralData.statistics.vip,
        }),
      })

      if (!response.ok) throw new Error("Failed to apply for achievement")

      const newRequest = await response.json()
      setUserAchievementRequests((prev) => [...prev, newRequest])

      console.log("[v0] Achievement application saved:", newRequest)

      toast({
        title: "Success!",
        description: "Achievement application submitted successfully. Admin will review your request.",
      })
    } catch (error) {
      console.error("[v0] Error applying for achievement:", error)
      toast({
        title: "Error",
        description: "Failed to apply for achievement. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAchievements(false)
    }
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  const filteredUsers = referralData.referrals.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userId.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.country.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter =
      filterType === "all" ||
      (filterType === "vip" && user.type === "VIP") ||
      (filterType === "regular" && user.type === "Regular")
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

  const vipUsers = referralData.referrals.filter((user) => user.type === "VIP")
  const regularUsers = referralData.referrals.filter((user) => user.type === "Regular")

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading user authentication...</p>
        </div>
      </div>
    )
  }

  if (!isInitialized || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading referral data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        title={referralSettings.referPageTitle}
        description="Earn money by referring friends and completing achievements"
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-end">
            {/* <Button
              onClick={regenerateFakeData}
              variant="outline"
              className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 text-green-700 hover:from-green-100 hover:to-blue-100"
            >
              🎲 Regenerate Fake Data
            </Button> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-blue-900">{referralData.statistics.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Completed Referrals</p>
                    <p className="text-2xl font-bold text-green-900">{referralData.statistics.completed}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">VIP Referrals</p>
                    <p className="text-2xl font-bold text-orange-900">{referralData.statistics.vip}</p>
                  </div>
                  <Crown className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Pending Referrals</p>
                    <p className="text-2xl font-bold text-purple-900">{referralData.statistics.pending}</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {achievements.length > 0 && (
            <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-gray-900 to-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
                  Achievement Rewards
                </CardTitle>
                <p className="text-sm text-gray-300">Earn extra bonuses by reaching VIP referral milestones</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {achievements.map((achievement) => {
                    const userRequest = userAchievementRequests.find((req) => req.achievementId === achievement.id)
                    const canApply = referralData.statistics.vip >= achievement.vipRequirement && !userRequest
                    const hasApplied = !!userRequest
                    const isCompleted = referralData.statistics.vip >= achievement.vipRequirement
                    const progress = Math.min((referralData.statistics.vip / achievement.vipRequirement) * 100, 100)

                    return (
                      <div
                        key={achievement.id}
                        className="flex-shrink-0 w-72 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg p-6 relative overflow-hidden"
                      >
                        <div className="text-center mb-4">
                          <div className="text-white text-lg font-semibold mb-2">
                            invite {achievement.vipRequirement} person{achievement.vipRequirement !== 1 ? "s" : ""}
                          </div>
                          {isCompleted && (
                            <div className="bg-green-600 text-white text-sm px-3 py-1 rounded-full inline-block mb-3">
                              Target Reached
                            </div>
                          )}
                        </div>

                        <div className="text-center mb-4">
                          {hasApplied ? (
                            <div
                              className={`px-6 py-2 rounded-lg text-sm font-medium ${
                                userRequest.status === "paid"
                                  ? "bg-green-600 text-white"
                                  : userRequest.status === "approved"
                                    ? "bg-blue-600 text-white"
                                    : userRequest.status === "rejected"
                                      ? "bg-red-600 text-white"
                                      : "bg-yellow-600 text-white"
                              }`}
                            >
                              {userRequest.status === "paid"
                                ? "Reward Paid"
                                : userRequest.status === "approved"
                                  ? "Approved"
                                  : userRequest.status === "rejected"
                                    ? "Rejected"
                                    : "Pending Review"}
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleApplyForAchievement(achievement.id)}
                              disabled={!canApply || loadingAchievements}
                              className={`px-6 py-2 rounded-lg font-medium ${
                                canApply
                                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                                  : "bg-gray-500 text-gray-300 cursor-not-allowed"
                              }`}
                            >
                              {canApply ? "Apply For Prize" : "Not Eligible"}
                            </Button>
                          )}
                        </div>

                        <div className="text-center text-white text-sm mb-4">
                          get ${achievement.rewardAmount.toFixed(2)} USD
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex justify-between items-center text-white text-xs mb-2">
                            <span>
                              {referralData.statistics.vip} / {achievement.vipRequirement}
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Referred Users Directory
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Track and communicate with users you've referred</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="default" size="sm" onClick={() => setFilterType("all")} className="text-xs">
                    All ({referralData.statistics.total})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterType("vip")}
                    className="text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    VIP ({vipUsers.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterType("regular")}
                    className="text-xs bg-green-600 hover:bg-green-700"
                  >
                    Regular ({regularUsers.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {referralData.referrals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referrals Yet</h3>
                  <p className="text-gray-600">Share your referral link to start earning rewards!</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joining Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Full Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Country
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedUsers.map((user, index) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.joiningDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                                {user.userId}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    user.type === "VIP"
                                      ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                                  }`}
                                >
                                  <span className="text-white text-xs font-bold">
                                    {user.fullName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">{user.fullName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border">
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.country}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={user.type === "VIP" ? "default" : "secondary"}
                                className={
                                  user.type === "VIP"
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                                }
                              >
                                {user.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link href={`/dashboard/messages?user=${user.userId}`}>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  Chat
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of{" "}
                        {filteredUsers.length} users
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
                                  currentPage === pageNum ? "bg-blue-600 text-white" : "text-gray-600 border-gray-300"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                          {totalPages > 5 && (
                            <>
                              <span className="text-gray-400">...</span>
                              <Button
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === totalPages
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 border-gray-300"
                                }`}
                              >
                                {totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="text-gray-600 border-gray-300"
                        >
                          Next
                          <ChevronRight className="w-4 w-4 ml-1" />
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
    </>
  )
}

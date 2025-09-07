"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Trophy, Star, Users, Gift, CheckCircle, Clock, Target, Award, Loader2 } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  referralType: "vip" | "normal"
  referralRequirement: number
  rewardAmount: number
  isActive: boolean
  userProgress?: number
  isCompleted?: boolean
  canClaim?: boolean
}

interface UserStats {
  totalReferrals: number
  vipReferrals: number
  normalReferrals: number
  totalEarnings: number
  completedAchievements: number
}

export default function UserAchievementsPage() {
  const { toast } = useToast()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    totalReferrals: 0,
    vipReferrals: 0,
    normalReferrals: 0,
    totalEarnings: 0,
    completedAchievements: 0,
  })
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    loadAchievements()
  }, [])

  const loadAchievements = async () => {
    setLoading(true)
    try {
      // Load achievements with user progress
      const response = await fetch("/api/user/achievements")
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements || [])
        setUserStats(data.userStats || userStats)
      }
    } catch (error) {
      console.error("Error loading achievements:", error)
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const claimAchievement = async (achievementId: string) => {
    setClaiming(achievementId)
    try {
      const response = await fetch("/api/user/achievements/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId }),
      })

      if (response.ok) {
        await loadAchievements()
        toast({
          title: "Success!",
          description: "Achievement claimed successfully!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to claim achievement",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim achievement",
        variant: "destructive",
      })
    } finally {
      setClaiming(null)
    }
  }

  const getProgressPercentage = (achievement: Achievement) => {
    const progress = achievement.userProgress || 0
    return Math.min((progress / achievement.referralRequirement) * 100, 100)
  }

  const getAchievementIcon = (referralType: string) => {
    return referralType === "vip" ? (
      <Star className="h-6 w-6 text-yellow-500" />
    ) : (
      <Users className="h-6 w-6 text-blue-500" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Your Achievements</h1>
        <p className="text-gray-600">Track your referral progress and claim rewards</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalReferrals}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">VIP Referrals</p>
                <p className="text-2xl font-bold text-yellow-900">{userStats.vipReferrals}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Normal Referrals</p>
                <p className="text-2xl font-bold text-blue-900">{userStats.normalReferrals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{userStats.completedAchievements}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Earnings</p>
                <p className="text-2xl font-bold text-purple-900">${userStats.totalEarnings.toFixed(2)}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Achievements</h2>

        {achievements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Achievements Available</h3>
              <p className="text-gray-500">Check back later for new achievements to unlock!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`border-2 ${
                  achievement.isCompleted
                    ? "border-green-200 bg-green-50"
                    : achievement.canClaim
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-gray-200"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getAchievementIcon(achievement.referralType)}
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        <Badge variant={achievement.referralType === "vip" ? "default" : "secondary"} className="mt-1">
                          {achievement.referralType === "vip" ? "VIP" : "Normal"} Referrals
                        </Badge>
                      </div>
                    </div>
                    {achievement.isCompleted && <CheckCircle className="h-6 w-6 text-green-500" />}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{achievement.description}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">
                        {achievement.userProgress || 0} / {achievement.referralRequirement}
                      </span>
                    </div>
                    <Progress value={getProgressPercentage(achievement)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      <span className="text-gray-500">Reward: </span>
                      <span className="font-semibold text-green-600">${achievement.rewardAmount.toFixed(2)}</span>
                    </div>

                    {achievement.isCompleted ? (
                      <Badge variant="default" className="bg-green-600">
                        <Award className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : achievement.canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => claimAchievement(achievement.id)}
                        disabled={claiming === achievement.id}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {claiming === achievement.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Gift className="h-4 w-4 mr-1" />
                        )}
                        Claim
                      </Button>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

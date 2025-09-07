"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  getUserCoinData,
  collectDailyCoins,
  getCoinSystemSettings,
  getDailyRewardSettings,
  cashoutCoins,
  type UserCoinData,
  type CoinSystemSettings,
  type DailyRewardSettings,
} from "@/lib/coin-system"
import { addWalletTransaction } from "@/lib/wallet"
import {
  Coins,
  Calendar,
  Flame,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  Lock,
  Sparkles,
  DollarSign,
  Zap,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function DailyCoinsPage() {
  const { user } = useAuth()
  const [coinData, setCoinData] = useState<UserCoinData | null>(null)
  const [coinSettings, setCoinSettings] = useState<CoinSystemSettings | null>(null)
  const [rewardSettings, setRewardSettings] = useState<DailyRewardSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [cashingOut, setCashingOut] = useState(false)
  const [nextCollectionTime, setNextCollectionTime] = useState<string>("")

  useEffect(() => {
    if (user?.id) {
      loadCoinData()
    }
  }, [user?.id])

  const loadCoinData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [userData, settings, rewards] = await Promise.all([
        getUserCoinData(user.id),
        getCoinSystemSettings(),
        getDailyRewardSettings(),
      ])
      setCoinData(userData)
      setCoinSettings(settings)
      setRewardSettings(rewards)

      // Calculate next collection time
      if (userData.lastCollectionDate) {
        const nextCollection = new Date(userData.lastCollectionDate)
        nextCollection.setDate(nextCollection.getDate() + 1)
        nextCollection.setHours(0, 0, 0, 0)
        setNextCollectionTime(nextCollection.toISOString())
      }
    } catch (error) {
      console.error("Failed to load coin data:", error)
      toast.error("Failed to load coin data")
    } finally {
      setLoading(false)
    }
  }

  const handleCollectCoins = async () => {
    if (!user?.id) return

    setCollecting(true)
    try {
      const result = await collectDailyCoins(user.id)

      if (result.success) {
        toast.success(result.message)
        setNextCollectionTime(result.nextCollectionTime)
        loadCoinData()
      } else {
        toast.error(result.message)
        setNextCollectionTime(result.nextCollectionTime)
      }
    } catch (error) {
      console.error("Failed to collect coins:", error)
      toast.error("Failed to collect coins")
    } finally {
      setCollecting(false)
    }
  }

  const handleCashout = async () => {
    if (!user?.id || !coinData || !coinSettings) return

    if (coinData.availableCoins < coinSettings.minCashoutCoins) {
      toast.error(`Minimum cashout is ${coinSettings.minCashoutCoins} coins`)
      return
    }

    setCashingOut(true)
    try {
      const cashout = await cashoutCoins(user.id, coinData.availableCoins)

      // Add to wallet as earnings
      await addWalletTransaction({
        userId: user.id,
        type: "earning",
        amount: cashout.netAmount,
        description: `Coin cashout: ${cashout.coinsAmount} coins`,
        referenceId: cashout.id,
        referenceType: "coin_cashout",
      })

      toast.success(`Successfully cashed out ${cashout.coinsAmount} coins for $${cashout.netAmount.toFixed(2)}!`)
      loadCoinData()
    } catch (error) {
      console.error("Failed to cashout coins:", error)
      toast.error("Failed to cashout coins")
    } finally {
      setCashingOut(false)
    }
  }

  const canCollectToday = () => {
    if (!coinData?.lastCollectionDate) return true
    const today = new Date().toDateString()
    const lastCollection = new Date(coinData.lastCollectionDate).toDateString()
    return today !== lastCollection
  }

  const getWeeklyRewards = () => {
    if (!rewardSettings) return []

    const rewards = []
    const customRewards = rewardSettings.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]

    for (let day = 1; day <= 7; day++) {
      const dayIndex = day - 1
      const totalReward = customRewards[dayIndex] || 20

      rewards.push({
        day,
        baseReward: totalReward,
        streakBonus: 0, // No bonus with custom rewards
        totalReward,
        isCompleted: coinData ? day <= coinData.currentStreak : false,
        isToday: day === (coinData?.currentStreak || 0) + 1 && canCollectToday(),
      })
    }
    return rewards
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!coinSettings?.isEnabled) {
    return (
      <>
        <DashboardHeader title="Daily Coins" description="Collect coins daily and build your streak" />
        <div className="flex-1 overflow-auto p-6">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Coin System Disabled</h3>
              <p className="text-gray-600">The daily coin collection system is currently disabled.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!coinData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load coin data</p>
      </div>
    )
  }

  const weeklyRewards = getWeeklyRewards()
  const timeUntilNext = nextCollectionTime ? formatDistanceToNow(new Date(nextCollectionTime), { addSuffix: true }) : ""
  const usdValue = coinData.availableCoins * coinSettings.coinToUsdRate

  return (
    <>
      <DashboardHeader title="Daily Coins" description="Collect coins daily and build your streak" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Current Streak & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-700">{coinData.currentStreak}</span>
                </div>
                <p className="text-sm text-orange-600 font-medium">Day Streak</p>
                <p className="text-xs text-orange-500 mt-1">Longest: {coinData.longestStreak} days</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="h-6 w-6 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-700">{coinData.availableCoins.toLocaleString()}</span>
                </div>
                <p className="text-sm text-yellow-600 font-medium">Available Coins</p>
                <p className="text-xs text-yellow-500 mt-1">${usdValue.toFixed(4)} USD</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  <span className="text-2xl font-bold text-green-700">{coinData.totalCollected.toLocaleString()}</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Total Collected</p>
                <p className="text-xs text-green-500 mt-1">All time earnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Collection Interface */}
          <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200">
            <CardContent className="p-8 text-center">
              {canCollectToday() ? (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-lg font-semibold text-gray-900">{coinData.currentStreak + 1} day streak</span>
                  </div>
                  <p className="text-gray-600 mb-6">Come back tomorrow and win coins to the next level</p>

                  <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Coins className="h-12 w-12 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-purple-700 mb-2">
                      +
                      {weeklyRewards.find((r) => r.isToday)?.totalReward ||
                        rewardSettings?.customDailyRewards?.[0] ||
                        20}
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Today's Reward
                    </Badge>
                  </div>

                  <Button
                    onClick={handleCollectCoins}
                    disabled={collecting}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                  >
                    {collecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Collecting...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-5 w-5" />
                        Collect Daily Coins
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="h-6 w-6 text-orange-500" />
                    <span className="text-lg font-semibold text-gray-900">{coinData.currentStreak} day streak</span>
                  </div>
                  <p className="text-gray-600 mb-6">You've already collected today's coins!</p>

                  <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-600 mb-2">Completed</div>
                    <Badge variant="outline" className="border-gray-300 text-gray-600">
                      Come back {timeUntilNext}
                    </Badge>
                  </div>

                  <Button disabled size="lg" className="px-8 py-3 text-lg">
                    <Lock className="mr-2 h-5 w-5" />
                    Already Collected
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  {coinData.currentStreak}/7 days
                </Badge>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {weeklyRewards.map((reward) => (
                  <Card
                    key={reward.day}
                    className={`text-center p-3 transition-all ${
                      reward.isCompleted
                        ? "bg-green-50 border-green-200"
                        : reward.isToday
                          ? "bg-purple-50 border-purple-200 ring-2 ring-purple-300"
                          : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">Day {reward.day}</div>
                    <div className="flex items-center justify-center mb-1">
                      {reward.isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : reward.isToday ? (
                        <Sparkles className="h-6 w-6 text-purple-500" />
                      ) : (
                        <Coins className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        reward.isCompleted ? "text-green-600" : reward.isToday ? "text-purple-600" : "text-gray-500"
                      }`}
                    >
                      +{reward.totalReward}
                    </div>
                  </Card>
                ))}
              </div>

              <Progress value={(coinData.currentStreak / 7) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Cashout Section */}
          {coinData.availableCoins >= coinSettings.minCashoutCoins && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Ready to Cash Out!</h3>
                    <p className="text-green-600 text-sm mb-1">
                      You have {coinData.availableCoins.toLocaleString()} coins available
                    </p>
                    <p className="text-green-500 text-xs">
                      Cash out value: ${(coinData.availableCoins * coinSettings.coinToUsdRate).toFixed(2)}
                      {coinSettings.cashoutFeePercentage > 0 && (
                        <span className="text-orange-600">
                          {" "}
                          ($
                          {(
                            coinData.availableCoins *
                            coinSettings.coinToUsdRate *
                            (1 - coinSettings.cashoutFeePercentage / 100)
                          ).toFixed(2)}{" "}
                          after {coinSettings.cashoutFeePercentage}% fee)
                        </span>
                      )}
                    </p>
                  </div>
                  <Button onClick={handleCashout} disabled={cashingOut} className="bg-green-600 hover:bg-green-700">
                    {cashingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Cash Out
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-600">{coinData.totalCollected.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total Collected</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-orange-600">{coinData.longestStreak}</div>
                <div className="text-xs text-gray-600">Longest Streak</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-green-600">{coinData.totalCashedOut.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Coins Cashed Out</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-600">
                  ${(coinData.totalCashedOut * coinSettings.coinToUsdRate).toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Total Earned</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

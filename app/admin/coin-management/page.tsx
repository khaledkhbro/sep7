"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  getCoinSystemSettings,
  updateCoinSystemSettings,
  getDailyRewardSettings,
  updateDailyRewardSettings,
  getCoinStats,
  type CoinSystemSettings,
  type DailyRewardSettings,
  type CoinStats,
} from "@/lib/coin-system"
import {
  Coins,
  Settings,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Gift,
  Target,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

export default function CoinManagementPage() {
  const [coinSettings, setCoinSettings] = useState<CoinSystemSettings | null>(null)
  const [rewardSettings, setRewardSettings] = useState<DailyRewardSettings | null>(null)
  const [coinStats, setCoinStats] = useState<CoinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCoinData()
  }, [])

  const loadCoinData = async () => {
    setLoading(true)
    try {
      const [settings, rewards, stats] = await Promise.all([
        getCoinSystemSettings(),
        getDailyRewardSettings(),
        getCoinStats(),
      ])
      setCoinSettings(settings)
      setRewardSettings(rewards)
      setCoinStats(stats)
    } catch (error) {
      console.error("Failed to load coin data:", error)
      toast.error("Failed to load coin system data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!coinSettings || !rewardSettings) return

    setSaving(true)
    try {
      await Promise.all([updateCoinSystemSettings(coinSettings), updateDailyRewardSettings(rewardSettings)])
      toast.success("Coin system settings saved successfully!")
      loadCoinData()
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    if (!coinSettings || !rewardSettings) return

    setCoinSettings({
      ...coinSettings,
      isEnabled: true,
      coinToUsdRate: 0.0001, // 100 coins = $0.01
      maxCoinsPerDay: 1000,
      minCashoutCoins: 1000,
    })

    setRewardSettings({
      ...rewardSettings,
      baseReward: 20,
      streakMultiplier: 1.5,
      maxStreakBonus: 100,
      streakResetHours: 48,
      customDailyRewards: [32, 50, 12, 75, 25, 90, 100],
    })

    toast.info("Settings reset to defaults")
  }

  const updateCustomReward = (dayIndex: number, amount: number) => {
    if (!rewardSettings) return

    const newRewards = [...(rewardSettings.customDailyRewards || [32, 50, 12, 75, 25, 90, 100])]
    newRewards[dayIndex] = amount

    setRewardSettings({
      ...rewardSettings,
      customDailyRewards: newRewards,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!coinSettings || !rewardSettings || !coinStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Failed to load coin system data</p>
      </div>
    )
  }

  return (
    <>
      <AdminHeader
        title="Coin Management"
        description="Configure daily rewards, coin economy, and user engagement system"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* System Status & Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className={`border-2 ${coinSettings.isEnabled ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {coinSettings.isEnabled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 font-semibold">Active</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700 font-semibold">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Coins className={`h-6 w-6 ${coinSettings.isEnabled ? "text-green-600" : "text-red-600"}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Coins Distributed</p>
                    <p className="text-xl font-bold text-blue-600">
                      {coinStats.totalCoinsDistributed.toLocaleString()}
                    </p>
                  </div>
                  <Gift className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Collectors</p>
                    <p className="text-xl font-bold text-purple-600">{coinStats.activeCollectors.toLocaleString()}</p>
                  </div>
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Coins Cashed Out</p>
                    <p className="text-xl font-bold text-green-600">{coinStats.totalCoinsCashedOut.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="system" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="system">System Settings</TabsTrigger>
              <TabsTrigger value="rewards">Daily Rewards</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Coin System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-900">Enable Coin System</h3>
                      <p className="text-sm text-gray-600">Allow users to collect daily coins and earn rewards</p>
                    </div>
                    <Switch
                      checked={coinSettings.isEnabled}
                      onCheckedChange={(checked) => setCoinSettings({ ...coinSettings, isEnabled: checked })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="coinRate">Coin to USD Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="coinRate"
                          type="number"
                          step="0.00001"
                          value={coinSettings.coinToUsdRate}
                          onChange={(e) =>
                            setCoinSettings({
                              ...coinSettings,
                              coinToUsdRate: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="flex-1"
                        />
                        <Badge variant="outline">{Math.round(1 / coinSettings.coinToUsdRate)} coins = $1</Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Current: {Math.round(1 / coinSettings.coinToUsdRate)} coins = $1.00
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxCoins">Max Coins Per Day</Label>
                      <Input
                        id="maxCoins"
                        type="number"
                        value={coinSettings.maxCoinsPerDay}
                        onChange={(e) =>
                          setCoinSettings({
                            ...coinSettings,
                            maxCoinsPerDay: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Maximum coins a user can earn in 24 hours</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minCashout">Minimum Cashout (Coins)</Label>
                      <Input
                        id="minCashout"
                        type="number"
                        value={coinSettings.minCashoutCoins}
                        onChange={(e) =>
                          setCoinSettings({
                            ...coinSettings,
                            minCashoutCoins: Number.parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        Minimum coins required to cash out ($
                        {(coinSettings.minCashoutCoins * coinSettings.coinToUsdRate).toFixed(2)})
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cashoutFee">Cashout Fee (%)</Label>
                      <Input
                        id="cashoutFee"
                        type="number"
                        step="0.1"
                        value={coinSettings.cashoutFeePercentage}
                        onChange={(e) =>
                          setCoinSettings({
                            ...coinSettings,
                            cashoutFeePercentage: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Fee charged when users cash out coins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Reward Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Custom Daily Rewards</h3>
                    <p className="text-sm text-gray-600">Set specific coin amounts for each day of the week</p>

                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const dayIndex = day - 1
                        const currentRewards = rewardSettings?.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]
                        const rewardAmount = currentRewards[dayIndex] || 20

                        return (
                          <div key={day} className="space-y-2">
                            <Label htmlFor={`day${day}`} className="text-sm font-medium">
                              Day {day}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <Input
                                id={`day${day}`}
                                type="number"
                                min="1"
                                max="1000"
                                value={rewardAmount}
                                onChange={(e) => updateCustomReward(dayIndex, Number.parseInt(e.target.value) || 20)}
                                className="w-full"
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              ${(rewardAmount * coinSettings.coinToUsdRate).toFixed(4)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="resetHours">Streak Reset (Hours)</Label>
                      <Input
                        id="resetHours"
                        type="number"
                        value={rewardSettings.streakResetHours}
                        onChange={(e) =>
                          setRewardSettings({
                            ...rewardSettings,
                            streakResetHours: Number.parseInt(e.target.value) || 24,
                          })
                        }
                      />
                      <p className="text-xs text-gray-500">Hours after which streak resets if no collection</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Total Weekly Coins</Label>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-600">
                          {(rewardSettings?.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]).reduce(
                            (sum, amount) => sum + amount,
                            0,
                          )}{" "}
                          coins
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Total if user collects all 7 days ($
                        {(
                          (rewardSettings?.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]).reduce(
                            (sum, amount) => sum + amount,
                            0,
                          ) * coinSettings.coinToUsdRate
                        ).toFixed(4)}
                        )
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Reward Preview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const dayIndex = day - 1
                        const currentRewards = rewardSettings?.customDailyRewards || [32, 50, 12, 75, 25, 90, 100]
                        const totalReward = currentRewards[dayIndex] || 20

                        return (
                          <Card
                            key={day}
                            className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                          >
                            <div className="text-sm font-medium text-gray-600">Day {day}</div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Coins className="h-4 w-4 text-yellow-500" />
                              <span className="font-bold text-yellow-600">+{totalReward}</span>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              ${(totalReward * coinSettings.coinToUsdRate).toFixed(4)}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Today's Collections</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {coinStats.todayCollections.toLocaleString()}
                        </p>
                      </div>
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Streak</p>
                        <p className="text-2xl font-bold text-purple-600">{coinStats.averageStreak.toFixed(1)} days</p>
                      </div>
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total USD Value</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${(coinStats.totalCoinsDistributed * coinSettings.coinToUsdRate).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {coinStats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Coins className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.username}</p>
                            <p className="text-sm text-gray-600">{activity.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-yellow-600">+{activity.coins} coins</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button onClick={handleSaveSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button variant="outline" onClick={handleResetToDefaults} disabled={saving}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(coinSettings.updatedAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

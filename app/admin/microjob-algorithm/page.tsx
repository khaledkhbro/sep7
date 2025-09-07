"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, RotateCcw, Zap, BarChart3, Settings, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  getMicrojobAlgorithmSettings,
  updateMicrojobAlgorithmSettings,
  getMicrojobRotationStats,
  type MicrojobAlgorithmSettings,
} from "@/lib/microjob-algorithm"

export default function MicrojobAlgorithmPage() {
  const [settings, setSettings] = useState<MicrojobAlgorithmSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState({
    totalJobs: 0,
    averageFrontPageTime: 0,
    currentCycle: 1,
    nextRotationIn: 0,
  })

  useEffect(() => {
    loadSettings()
    loadStats()

    // Refresh stats every minute when time rotation is active
    const interval = setInterval(() => {
      if (settings?.algorithm_type === "time_rotation" && settings?.is_enabled) {
        loadStats()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [settings?.algorithm_type, settings?.is_enabled])

  const loadSettings = async () => {
    try {
      const data = await getMicrojobAlgorithmSettings()
      setSettings(data)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load algorithm settings")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await getMicrojobRotationStats()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleSettingUpdate = async (field: string, value: any) => {
    if (!settings) return

    setUpdating(true)
    try {
      const updatedSettings = await updateMicrojobAlgorithmSettings({
        ...settings,
        [field]: value,
      })
      setSettings(updatedSettings)

      if (field === "algorithm_type") {
        toast.success(`Switched to ${value === "newest_first" ? "Newest First" : "Time Rotation"} algorithm`)
      } else if (field === "is_enabled") {
        toast.success(`Algorithm ${value ? "enabled" : "disabled"}`)
      } else if (field === "rotation_hours") {
        toast.success(`Rotation time updated to ${value} hours`)
      }

      // Reload stats after algorithm change
      if (field === "algorithm_type" || field === "rotation_hours") {
        setTimeout(loadStats, 1000)
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setUpdating(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Microjob Algorithm Control</h1>
          <p className="text-gray-600 mt-1">Manage how microjobs are displayed and prioritized on the /jobs page</p>
        </div>
        <Badge
          variant={settings?.is_enabled ? "default" : "secondary"}
          className={settings?.is_enabled ? "bg-green-600" : ""}
        >
          {settings?.is_enabled ? "Active" : "Disabled"}
        </Badge>
      </div>

      {/* Algorithm Selection */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Algorithm Selection</span>
          </CardTitle>
          <CardDescription>
            Choose which algorithm to use for displaying microjobs. Only one can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enable Algorithm</h3>
              <p className="text-sm text-gray-600">
                {settings?.is_enabled
                  ? "Algorithm is active and controlling job display order"
                  : "Algorithm is disabled - jobs display in default order"}
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(enabled) => handleSettingUpdate("is_enabled", enabled)}
              disabled={updating}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="pt-4 border-t border-blue-200">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Algorithm Type</Label>
            <Select
              value={settings?.algorithm_type || "newest_first"}
              onValueChange={(value) => handleSettingUpdate("algorithm_type", value)}
              disabled={updating || !settings?.is_enabled}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest_first">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span>Newest First Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="time_rotation">
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4 text-green-500" />
                    <span>Time-Based Rotation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Newest First Option */}
        <Card
          className={`border-2 ${settings?.algorithm_type === "newest_first" ? "border-orange-200 bg-orange-50/50" : "border-gray-200"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Option 1: Newest First Priority</span>
            </CardTitle>
            <CardDescription>New microjobs and worker updates get priority placement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">New microjobs show first</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Worker updates boost job priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Real-time priority adjustment</span>
              </div>
            </div>

            {settings?.algorithm_type === "newest_first" && settings?.is_enabled && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-orange-800">Currently Active</span>
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  Jobs are being sorted by newest posts and recent worker updates
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Rotation Option */}
        <Card
          className={`border-2 ${settings?.algorithm_type === "time_rotation" ? "border-green-200 bg-green-50/50" : "border-gray-200"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RotateCcw className="h-5 w-5 text-green-500" />
              <span>Option 2: Time-Based Rotation</span>
            </CardTitle>
            <CardDescription>All microjobs get equal front page time in rotation cycles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Fair rotation for all jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Configurable rotation time</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">Front page time tracking</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Rotation Time (Hours)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={settings?.rotation_hours || 8}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (value >= 1 && value <= 24) {
                      handleSettingUpdate("rotation_hours", value)
                    }
                  }}
                  disabled={updating || settings?.algorithm_type !== "time_rotation"}
                  className="w-20 text-center"
                />
                <span className="text-sm text-gray-600">hours per cycle</span>
              </div>
              <p className="text-xs text-gray-500">Each job gets equal time on the front page within this period</p>
            </div>

            {settings?.algorithm_type === "time_rotation" && settings?.is_enabled && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Currently Active</span>
                </div>
                <p className="text-xs text-green-700 mt-1">Jobs are rotating every {settings.rotation_hours} hours</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics Dashboard */}
      {settings?.algorithm_type === "time_rotation" && settings?.is_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Rotation Statistics</span>
            </CardTitle>
            <CardDescription>Real-time data about the time-based rotation system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{stats.totalJobs}</div>
                <div className="text-sm text-gray-600">Total Jobs in Rotation</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(Math.round(stats.averageFrontPageTime))}
                </div>
                <div className="text-sm text-gray-600">Avg. Front Page Time</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{stats.currentCycle}</div>
                <div className="text-sm text-gray-600">Current Cycle</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{formatTime(stats.nextRotationIn)}</div>
                <div className="text-sm text-gray-600">Next Rotation In</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">How Time Rotation Works</span>
              </div>
              <p className="text-xs text-gray-600">
                Every {settings.rotation_hours} hours, jobs that haven't been on the front page recently get priority.
                This ensures all {stats.totalJobs} jobs get equal visibility over time, giving every job a fair chance
                to be seen by potential workers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${settings?.is_enabled ? "bg-green-100" : "bg-gray-100"}`}>
                <TrendingUp className={`h-6 w-6 ${settings?.is_enabled ? "text-green-600" : "text-gray-400"}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
                <p className="text-sm text-gray-600">
                  {settings?.is_enabled
                    ? `${settings.algorithm_type === "newest_first" ? "Newest First" : "Time Rotation"} algorithm is active`
                    : "No algorithm active - jobs display in default order"}
                </p>
              </div>
            </div>
            <Badge
              variant={settings?.is_enabled ? "default" : "secondary"}
              className={`${settings?.is_enabled ? "bg-green-600" : ""} text-sm px-3 py-1`}
            >
              {settings?.is_enabled ? "ACTIVE" : "DISABLED"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  getScreenshotPricingTiers,
  getScreenshotPricingSettings,
  updateScreenshotPricingTier,
  updateScreenshotPricingSetting,
  type ScreenshotPricingTier,
  type ScreenshotPricingSettings,
} from "@/lib/screenshot-pricing"
import {
  Camera,
  Settings,
  DollarSign,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Download,
  Calculator,
  Zap,
  TrendingUp,
  Copy,
  Eye,
  EyeOff,
  Percent,
  Hash,
  Globe,
  Shield,
} from "lucide-react"

const PRICING_PRESETS = {
  free_first: {
    name: "First Free",
    description: "First screenshot free, then increasing percentages",
    tiers: [
      { screenshot_number: 1, percentage_fee: 0, is_free: true },
      { screenshot_number: 2, percentage_fee: 2, is_free: false },
      { screenshot_number: 3, percentage_fee: 4, is_free: false },
      { screenshot_number: 4, percentage_fee: 6, is_free: false },
      { screenshot_number: 5, percentage_fee: 8, is_free: false },
    ],
  },
  progressive: {
    name: "Progressive",
    description: "Gradually increasing fees for all screenshots",
    tiers: [
      { screenshot_number: 1, percentage_fee: 1, is_free: false },
      { screenshot_number: 2, percentage_fee: 3, is_free: false },
      { screenshot_number: 3, percentage_fee: 5, is_free: false },
      { screenshot_number: 4, percentage_fee: 7, is_free: false },
      { screenshot_number: 5, percentage_fee: 10, is_free: false },
    ],
  },
  flat_rate: {
    name: "Flat Rate",
    description: "Same percentage for all screenshots",
    tiers: [
      { screenshot_number: 1, percentage_fee: 3, is_free: false },
      { screenshot_number: 2, percentage_fee: 3, is_free: false },
      { screenshot_number: 3, percentage_fee: 3, is_free: false },
      { screenshot_number: 4, percentage_fee: 3, is_free: false },
      { screenshot_number: 5, percentage_fee: 3, is_free: false },
    ],
  },
  premium: {
    name: "Premium",
    description: "Higher fees for quality assurance",
    tiers: [
      { screenshot_number: 1, percentage_fee: 5, is_free: false },
      { screenshot_number: 2, percentage_fee: 8, is_free: false },
      { screenshot_number: 3, percentage_fee: 12, is_free: false },
      { screenshot_number: 4, percentage_fee: 15, is_free: false },
      { screenshot_number: 5, percentage_fee: 20, is_free: false },
    ],
  },
}

export default function ScreenshotPricingPage() {
  const [tiers, setTiers] = useState<ScreenshotPricingTier[]>([])
  const [settings, setSettings] = useState<ScreenshotPricingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingTiers, setEditingTiers] = useState<Record<number, ScreenshotPricingTier>>({})
  const [previewJobCost, setPreviewJobCost] = useState(100)
  const [showInactive, setShowInactive] = useState(true)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedTiers, setSelectedTiers] = useState<number[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tiersData, settingsData] = await Promise.all([getScreenshotPricingTiers(), getScreenshotPricingSettings()])
      setTiers(tiersData)
      setSettings(settingsData)

      const editingState: Record<number, ScreenshotPricingTier> = {}
      tiersData.forEach((tier) => {
        editingState[tier.id] = { ...tier }
      })
      setEditingTiers(editingState)
    } catch (error) {
      console.error("Failed to load screenshot pricing data:", error)
      toast.error("Failed to load screenshot pricing settings")
    } finally {
      setLoading(false)
    }
  }

  const updateTierField = (tierId: number, field: keyof ScreenshotPricingTier, value: any) => {
    setEditingTiers((prev) => ({
      ...prev,
      [tierId]: {
        ...prev[tierId],
        [field]: value,
      },
    }))
  }

  const saveTier = async (tierId: number) => {
    setSaving(`tier-${tierId}`)
    try {
      const tierData = editingTiers[tierId]
      await updateScreenshotPricingTier(tierId, {
        percentage_fee: tierData.percentage_fee,
        is_free: tierData.is_free,
        is_active: tierData.is_active,
      })

      setTiers((prev) => prev.map((tier) => (tier.id === tierId ? { ...tier, ...tierData } : tier)))

      toast.success(`Screenshot ${tierData.screenshot_number} pricing updated successfully`)
    } catch (error) {
      console.error("Failed to update tier:", error)
      toast.error("Failed to update screenshot pricing tier")
    } finally {
      setSaving(null)
    }
  }

  const updateSetting = async (settingName: keyof ScreenshotPricingSettings, value: number) => {
    if (!settings) return

    setSaving(`setting-${settingName}`)
    try {
      await updateScreenshotPricingSetting(settingName, value)

      setSettings((prev) => (prev ? { ...prev, [settingName]: value } : null))
      toast.success("Setting updated successfully")
    } catch (error) {
      console.error("Failed to update setting:", error)
      toast.error("Failed to update setting")
    } finally {
      setSaving(null)
    }
  }

  const hasChanges = (tierId: number) => {
    const original = tiers.find((t) => t.id === tierId)
    const edited = editingTiers[tierId]
    if (!original || !edited) return false

    return (
      original.percentage_fee !== edited.percentage_fee ||
      original.is_free !== edited.is_free ||
      original.is_active !== edited.is_active
    )
  }

  const applyPreset = async (presetKey: string) => {
    const preset = PRICING_PRESETS[presetKey as keyof typeof PRICING_PRESETS]
    if (!preset) return

    setSaving("preset")
    try {
      // Update all tiers with preset values
      for (const presetTier of preset.tiers) {
        const existingTier = tiers.find((t) => t.screenshot_number === presetTier.screenshot_number)
        if (existingTier) {
          await updateScreenshotPricingTier(existingTier.id, {
            percentage_fee: presetTier.percentage_fee,
            is_free: presetTier.is_free,
            is_active: true,
          })
        }
      }

      await loadData()
      toast.success(`Applied "${preset.name}" preset successfully`)
    } catch (error) {
      console.error("Failed to apply preset:", error)
      toast.error("Failed to apply preset")
    } finally {
      setSaving(null)
    }
  }

  const bulkUpdateTiers = async (updates: Partial<ScreenshotPricingTier>) => {
    if (selectedTiers.length === 0) return

    setSaving("bulk")
    try {
      for (const tierId of selectedTiers) {
        await updateScreenshotPricingTier(tierId, updates)
      }

      await loadData()
      setSelectedTiers([])
      setBulkEditMode(false)
      toast.success(`Updated ${selectedTiers.length} tiers successfully`)
    } catch (error) {
      console.error("Failed to bulk update:", error)
      toast.error("Failed to update tiers")
    } finally {
      setSaving(null)
    }
  }

  const exportSettings = () => {
    const data = {
      settings,
      tiers: tiers.map((tier) => ({
        screenshot_number: tier.screenshot_number,
        percentage_fee: tier.percentage_fee,
        is_free: tier.is_free,
        is_active: tier.is_active,
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `screenshot-pricing-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Settings exported successfully")
  }

  const calculatePreviewCosts = () => {
    let totalCost = 0
    const breakdown: Array<{ screenshot: number; cost: number; percentage: number; isFree: boolean }> = []

    tiers.forEach((tier) => {
      if (tier.is_active) {
        const cost = tier.is_free ? 0 : (previewJobCost * tier.percentage_fee) / 100
        totalCost += cost
        breakdown.push({
          screenshot: tier.screenshot_number,
          cost,
          percentage: tier.percentage_fee,
          isFree: tier.is_free,
        })
      }
    })

    return { totalCost, breakdown }
  }

  const addNewTier = async () => {
    if (!settings) return

    const nextScreenshotNumber = Math.max(...tiers.map((t) => t.screenshot_number), 0) + 1

    if (nextScreenshotNumber > settings.max_screenshots_allowed) {
      toast.error(`Cannot add more tiers. Maximum screenshots allowed is ${settings.max_screenshots_allowed}`)
      return
    }

    setSaving("add-tier")
    try {
      // Create new tier with default values
      const newTier: ScreenshotPricingTier = {
        id: Date.now(), // Simple ID generation for localStorage
        screenshot_number: nextScreenshotNumber,
        percentage_fee: 2, // Default 2% fee
        is_free: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Add to localStorage
      const currentTiers = JSON.parse(localStorage.getItem("screenshot_pricing_tiers") || "[]")
      currentTiers.push(newTier)
      localStorage.setItem("screenshot_pricing_tiers", JSON.stringify(currentTiers))

      // Update state
      setTiers((prev) => [...prev, newTier])
      setEditingTiers((prev) => ({
        ...prev,
        [newTier.id]: { ...newTier },
      }))

      toast.success(`Added Screenshot ${nextScreenshotNumber} pricing tier`)
    } catch (error) {
      console.error("Failed to add new tier:", error)
      toast.error("Failed to add new pricing tier")
    } finally {
      setSaving(null)
    }
  }

  const removeTier = async (tierId: number) => {
    setSaving(`remove-${tierId}`)
    try {
      // Remove from localStorage
      const currentTiers = JSON.parse(localStorage.getItem("screenshot_pricing_tiers") || "[]")
      const updatedTiers = currentTiers.filter((tier: ScreenshotPricingTier) => tier.id !== tierId)
      localStorage.setItem("screenshot_pricing_tiers", JSON.stringify(updatedTiers))

      // Update state
      setTiers((prev) => prev.filter((tier) => tier.id !== tierId))
      setEditingTiers((prev) => {
        const newState = { ...prev }
        delete newState[tierId]
        return newState
      })

      const removedTier = tiers.find((t) => t.id === tierId)
      toast.success(`Removed Screenshot ${removedTier?.screenshot_number} pricing tier`)
    } catch (error) {
      console.error("Failed to remove tier:", error)
      toast.error("Failed to remove pricing tier")
    } finally {
      setSaving(null)
    }
  }

  const { totalCost: previewTotalCost, breakdown: previewBreakdown } = calculatePreviewCosts()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-blue-50">
      <AdminHeader
        title="Screenshot Pricing Management"
        description="Advanced configuration for dynamic screenshot pricing with presets, bulk operations, and real-time previews"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Pricing Tiers
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-900">
                    <Globe className="h-5 w-5" />
                    <span>Global Screenshot Settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportSettings}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadData}
                      disabled={loading}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-4 bg-white/70 border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Hash className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-blue-800">Maximum Screenshots</Label>
                          <p className="text-xs text-blue-600">Global limit per job</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={settings.max_screenshots_allowed}
                          onChange={(e) => {
                            const newValue = Number.parseInt(e.target.value)
                            setSettings((prev) => (prev ? { ...prev, max_screenshots_allowed: newValue } : null))
                          }}
                          className="h-10 border-blue-300 focus:border-blue-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateSetting("max_screenshots_allowed", settings.max_screenshots_allowed)}
                          disabled={saving === "setting-max_screenshots_allowed"}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {saving === "setting-max_screenshots_allowed" ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white/70 border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-green-800">Default Screenshot Fee</Label>
                          <p className="text-xs text-green-600">Fallback fixed price</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settings.default_screenshot_fee}
                          onChange={(e) => {
                            const newValue = Number.parseFloat(e.target.value)
                            setSettings((prev) => (prev ? { ...prev, default_screenshot_fee: newValue } : null))
                          }}
                          className="h-10 border-green-300 focus:border-green-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateSetting("default_screenshot_fee", settings.default_screenshot_fee)}
                          disabled={saving === "setting-default_screenshot_fee"}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {saving === "setting-default_screenshot_fee" ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white/70 border border-purple-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Percent className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-purple-800">Percentage Pricing</Label>
                          <p className="text-xs text-purple-600">Enable dynamic pricing</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Switch
                          checked={settings.enable_percentage_pricing}
                          onCheckedChange={(checked) => {
                            setSettings((prev) => (prev ? { ...prev, enable_percentage_pricing: checked } : null))
                            updateSetting("enable_percentage_pricing", checked ? 1 : 0)
                          }}
                          disabled={saving === "setting-enable_percentage_pricing"}
                        />
                        <Badge variant={settings.enable_percentage_pricing ? "default" : "secondary"}>
                          {settings.enable_percentage_pricing ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </Card>

                    <Card className="p-4 bg-white/70 border border-orange-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Shield className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-orange-800">Platform Fee</Label>
                          <p className="text-xs text-orange-600">Additional platform charge</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settings.platform_screenshot_fee}
                          onChange={(e) => {
                            const newValue = Number.parseFloat(e.target.value)
                            setSettings((prev) => (prev ? { ...prev, platform_screenshot_fee: newValue } : null))
                          }}
                          className="h-10 border-orange-300 focus:border-orange-500"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateSetting("platform_screenshot_fee", settings.platform_screenshot_fee)}
                          disabled={saving === "setting-platform_screenshot_fee"}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {saving === "setting-platform_screenshot_fee" ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Camera className="h-5 w-5 text-purple-600" />
                      <span>Screenshot Pricing Tiers</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure individual pricing for each screenshot number with advanced controls
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={addNewTier}
                      disabled={saving === "add-tier" || !settings || tiers.length >= settings.max_screenshots_allowed}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {saving === "add-tier" ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      Add Tier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInactive(!showInactive)}
                      className="border-gray-300"
                    >
                      {showInactive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showInactive ? "Hide Inactive" : "Show All"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkEditMode(!bulkEditMode)}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {bulkEditMode ? "Exit Bulk" : "Bulk Edit"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Hash className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900">Pricing Tiers Overview</h4>
                        <p className="text-sm text-blue-700">
                          {tiers.length} of {settings?.max_screenshots_allowed || 5} maximum tiers configured
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {tiers.filter((t) => t.is_active).length} Active
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        {tiers.filter((t) => !t.is_active).length} Inactive
                      </Badge>
                    </div>
                  </div>
                </Card>

                {bulkEditMode && (
                  <Card className="mb-6 p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-purple-900">Bulk Edit Mode</h4>
                        <p className="text-sm text-purple-700">
                          Select tiers and apply changes to multiple items at once
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {selectedTiers.length} selected
                      </Badge>
                    </div>
                    {selectedTiers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => bulkUpdateTiers({ is_active: true })}
                          disabled={saving === "bulk"}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Enable All
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => bulkUpdateTiers({ is_active: false })}
                          disabled={saving === "bulk"}
                          variant="outline"
                        >
                          Disable All
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => bulkUpdateTiers({ is_free: true })}
                          disabled={saving === "bulk"}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Make Free
                        </Button>
                        <Button size="sm" onClick={() => setSelectedTiers([])} variant="outline">
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </Card>
                )}

                <div className="space-y-4">
                  {tiers
                    .filter((tier) => showInactive || tier.is_active)
                    .sort((a, b) => a.screenshot_number - b.screenshot_number)
                    .map((tier) => {
                      const editing = editingTiers[tier.id]
                      const changed = hasChanges(tier.id)
                      const isSelected = selectedTiers.includes(tier.id)

                      return (
                        <Card
                          key={tier.id}
                          className={`border-2 transition-all duration-200 ${
                            changed
                              ? "border-orange-200 bg-orange-50"
                              : isSelected
                                ? "border-purple-300 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                {bulkEditMode && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTiers((prev) => [...prev, tier.id])
                                      } else {
                                        setSelectedTiers((prev) => prev.filter((id) => id !== tier.id))
                                      }
                                    }}
                                    className="w-4 h-4 text-purple-600 rounded"
                                  />
                                )}
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                                  <span className="font-bold text-purple-700 text-lg">{tier.screenshot_number}</span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">Screenshot {tier.screenshot_number}</h4>
                                  <p className="text-sm text-gray-600">
                                    Configure pricing for the {tier.screenshot_number}
                                    {tier.screenshot_number === 1
                                      ? "st"
                                      : tier.screenshot_number === 2
                                        ? "nd"
                                        : tier.screenshot_number === 3
                                          ? "rd"
                                          : "th"}{" "}
                                    screenshot requirement
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {tier.screenshot_number > 3 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTier(tier.id)}
                                    disabled={saving === `remove-${tier.id}`}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    {saving === `remove-${tier.id}` ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Remove"
                                    )}
                                  </Button>
                                )}
                                {changed && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 animate-pulse">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Unsaved
                                  </Badge>
                                )}
                                {tier.is_active ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                              <Card className="p-4 bg-white/50">
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Free Screenshot</Label>
                                <div className="flex items-center justify-between">
                                  <Switch
                                    checked={editing?.is_free || false}
                                    onCheckedChange={(checked) => updateTierField(tier.id, "is_free", checked)}
                                  />
                                  <Badge variant={editing?.is_free ? "default" : "secondary"} className="text-xs">
                                    {editing?.is_free ? "FREE" : "PAID"}
                                  </Badge>
                                </div>
                              </Card>

                              <Card className="p-4 bg-white/50">
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Percentage Fee</Label>
                                <div className="relative">
                                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editing?.percentage_fee || 0}
                                    onChange={(e) =>
                                      updateTierField(tier.id, "percentage_fee", Number.parseFloat(e.target.value))
                                    }
                                    disabled={editing?.is_free}
                                    className="pl-10 h-10"
                                    placeholder="0.00"
                                  />
                                </div>
                              </Card>

                              <Card className="p-4 bg-white/50">
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                                <div className="flex items-center justify-between">
                                  <Switch
                                    checked={editing?.is_active || false}
                                    onCheckedChange={(checked) => updateTierField(tier.id, "is_active", checked)}
                                  />
                                  <Badge variant={editing?.is_active ? "default" : "secondary"} className="text-xs">
                                    {editing?.is_active ? "ON" : "OFF"}
                                  </Badge>
                                </div>
                              </Card>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => saveTier(tier.id)}
                                  disabled={!changed || saving === `tier-${tier.id}`}
                                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                >
                                  {saving === `tier-${tier.id}` ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Enhanced Preview */}
                            <Card className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 mb-2">Cost Preview</h5>
                                  {editing?.is_free ? (
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                      <span className="text-green-700 font-medium">
                                        This screenshot will be FREE for users
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-gray-700">
                                        Users pay{" "}
                                        <strong className="text-purple-600">{editing?.percentage_fee || 0}%</strong> of
                                        total job cost
                                      </p>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>
                                          $50 job →{" "}
                                          <strong className="text-green-600">
                                            ${(((editing?.percentage_fee || 0) / 100) * 50).toFixed(2)}
                                          </strong>
                                        </span>
                                        <span>
                                          $100 job →{" "}
                                          <strong className="text-green-600">
                                            ${(((editing?.percentage_fee || 0) / 100) * 100).toFixed(2)}
                                          </strong>
                                        </span>
                                        <span>
                                          $200 job →{" "}
                                          <strong className="text-green-600">
                                            ${(((editing?.percentage_fee || 0) / 100) * 200).toFixed(2)}
                                          </strong>
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                              </div>
                            </Card>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Pricing Presets</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Quick setup with pre-configured pricing strategies for common use cases
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(PRICING_PRESETS).map(([key, preset]) => (
                    <Card key={key} className="border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{preset.name}</h4>
                            <p className="text-sm text-gray-600">{preset.description}</p>
                          </div>
                          <Button
                            onClick={() => applyPreset(key)}
                            disabled={saving === "preset"}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {saving === "preset" ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Apply"}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {preset.tiers.map((tier, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium">Screenshot {tier.screenshot_number}</span>
                              <div className="flex items-center gap-2">
                                {tier.is_free ? (
                                  <Badge className="bg-green-100 text-green-700 text-xs">FREE</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    {tier.percentage_fee}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span>Cost Calculator & Preview</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  See how your pricing settings affect user costs with real-time calculations
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Job Cost for Preview:</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={previewJobCost}
                      onChange={(e) => setPreviewJobCost(Number.parseFloat(e.target.value) || 100)}
                      className="w-32"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-4">Screenshot Cost Breakdown</h4>
                    <div className="space-y-3">
                      {previewBreakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/70 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">{item.screenshot}</span>
                            </div>
                            <span className="text-sm font-medium">Screenshot {item.screenshot}</span>
                          </div>
                          <div className="text-right">
                            {item.isFree ? (
                              <Badge className="bg-green-100 text-green-700">FREE</Badge>
                            ) : (
                              <div className="text-sm">
                                <span className="font-semibold text-blue-900">${item.cost.toFixed(2)}</span>
                                <span className="text-gray-600 ml-1">({item.percentage}%)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-4">Total Cost Summary</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 px-4 bg-white/70 rounded-lg">
                        <span className="text-sm font-medium">Base Job Cost</span>
                        <span className="font-semibold text-green-900">${previewJobCost.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 px-4 bg-white/70 rounded-lg">
                        <span className="text-sm font-medium">Screenshot Fees</span>
                        <span className="font-semibold text-green-900">${previewTotalCost.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-3 px-4 bg-green-100 rounded-lg">
                        <span className="font-semibold text-green-900">Total Cost</span>
                        <span className="text-xl font-bold text-green-900">
                          ${(previewJobCost + previewTotalCost).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-center text-sm text-green-700">
                        Additional cost: {((previewTotalCost / previewJobCost) * 100).toFixed(1)}% of base job
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

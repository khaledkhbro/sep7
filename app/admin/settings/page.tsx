"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Globe,
  Users,
  CreditCard,
  Save,
  Percent,
  MessageSquare,
  DollarSign,
  Mail,
  Clock,
  TrendingUp,
  ToggleLeft,
  Key,
  RefreshCw,
  Monitor,
  BarChart3,
  Tag,
  Facebook,
  Code,
} from "lucide-react"
import { toast } from "sonner"
import { AdminHeader } from "@/components/admin/admin-header"
import { getAdminFeeSettings, updateAdminFeeSettings, type AdminFeeSettings } from "@/lib/wallet"
import { currencyService, type Currency, type ExchangeRate } from "@/lib/currency"
import {
  getSupportPricingSettings,
  updateSupportPricingSettings,
  type SupportPricingSettings,
} from "@/lib/admin-commission"
import type { RevisionSettings } from "@/lib/admin-settings"
import { SellerLevelAdmin } from "@/components/admin/seller-level-admin"

const SETTINGS_KEYS = {
  PLATFORM: "admin_platform_settings",
  USER: "admin_user_settings",
  PAYMENT: "admin_payment_settings",
  FEATURE: "admin_feature_settings",
  OAUTH: "admin_oauth_settings",
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [feeLoading, setFeeLoading] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [currencyLoading, setCurrencyLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [exchangeRates, setExchangeRates] = useState<
    (ExchangeRate & { from_currency: Currency; to_currency: Currency })[]
  >([])
  const [editingRate, setEditingRate] = useState<string | null>(null)

  const [feeSettings, setFeeSettings] = useState<{
    deposit: AdminFeeSettings | null
    withdrawal: AdminFeeSettings | null
    transaction: AdminFeeSettings | null
    chat_transfer: AdminFeeSettings | null
    tip: AdminFeeSettings | null
  }>({
    deposit: null,
    withdrawal: null,
    transaction: null,
    chat_transfer: null,
    tip: null,
  })

  const [platformSettings, setPlatformSettings] = useState({
    siteName: "MicroJob Marketplace",
    siteDescription: "Connect with skilled freelancers for your projects",
    supportEmail: "support@marketplace.com",
    currency: "USD",
    timezone: "UTC",
    maintenanceMode: false,
  })

  const [userSettings, setUserSettings] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    requireProfileCompletion: false,
    maxJobsPerUser: 50,
    maxServicesPerUser: 20,
  })

  const [paymentSettings, setPaymentSettings] = useState({
    platformFeePercentage: 5,
    minimumWithdrawal: 10,
    paymentMethods: ["stripe", "paypal"],
    autoPayoutEnabled: true,
    payoutSchedule: "weekly",
  })

  const [featureSettings, setFeatureSettings] = useState({
    enableMicrojobs: true,
    enableMarketplace: true,
    enableWallet: true,
    enableReferrals: true,
    enableReviews: true,
    enableChat: false,
  })

  const [supportPricingSettings, setSupportPricingSettings] = useState<{
    free: SupportPricingSettings | null
    priority: SupportPricingSettings | null
  }>({
    free: null,
    priority: null,
  })

  const [revisionSettings, setRevisionSettings] = useState<RevisionSettings | null>(null)
  const [revisionSettingsLoaded, setRevisionSettingsLoaded] = useState(false)

  const [reservationSettings, setReservationSettings] = useState({
    isEnabled: true,
    defaultReservationMinutes: 60,
    maxReservationMinutes: 1440,
    timeUnit: "hours" as "minutes" | "hours",
  })

  const [oauthSettings, setOauthSettings] = useState({
    googleEnabled: false,
    googleClientId: "",
    googleClientSecret: "",
    facebookEnabled: false,
    facebookAppId: "",
    facebookAppSecret: "",
    twitterEnabled: false,
    twitterApiKey: "",
    twitterApiSecret: "",
    redirectUrl: "",
  })

  const [settings, setSettings] = useState({
    adsense_enabled: false,
    adsense_publisher_id: "",
    adsense_auto_ads_code: "",
    ezoic_enabled: false,
    ezoic_site_id: "",
    ezoic_script: "",
    propellerads_enabled: false,
    propellerads_zone_id: "",
    propellerads_script: "",
    adsterra_enabled: false,
    adsterra_publisher_id: "",
    adsterra_script: "",
    ads_header_enabled: false,
    ads_sidebar_enabled: false,
    ads_footer_enabled: false,
    ads_content_enabled: false,
    ga4_enabled: false,
    ga4_measurement_id: "",
    ga4_stream_id: "",
    gtm_enabled: false,
    gtm_container_id: "",
    facebook_pixel_enabled: false,
    facebook_pixel_id: "",
    custom_analytics_enabled: false,
    custom_head_scripts: "",
    custom_body_scripts: "",
    analytics_cookie_consent: false,
    analytics_anonymize_ip: false,
    analytics_respect_dnt: false,
  })

  const loadCurrencyData = async () => {
    try {
      const [currenciesData, ratesData] = await Promise.all([
        currencyService.getCurrencies(),
        currencyService.getAllExchangeRates(),
      ])

      setCurrencies(currenciesData)
      setExchangeRates(ratesData)
    } catch (error) {
      console.error("Error loading currency data:", error)
      toast.error("Failed to load currency data")
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const revisionResponse = await fetch("/api/admin/revision-settings")
        if (revisionResponse.ok) {
          const revisionData = await revisionResponse.json()
          setRevisionSettings(revisionData)
          setRevisionSettingsLoaded(true)
          console.log("[v0] Loaded revision settings from API:", revisionData)
        } else {
          console.error("Failed to load revision settings from API")
          setRevisionSettings({
            maxRevisionRequests: 2,
            revisionRequestTimeoutValue: 24,
            revisionRequestTimeoutUnit: "hours",
            rejectionResponseTimeoutValue: 24,
            rejectionResponseTimeoutUnit: "hours",
            enableAutomaticRefunds: true,
            refundOnRevisionTimeout: true,
            refundOnRejectionTimeout: true,
            enableRevisionWarnings: true,
            revisionPenaltyEnabled: false,
            revisionPenaltyAmount: 0,
          })
          setRevisionSettingsLoaded(true)
          toast.error("Failed to load revision settings")
        }

        // Load existing settings
        const savedPlatform = localStorage.getItem(SETTINGS_KEYS.PLATFORM)
        if (savedPlatform) {
          setPlatformSettings(JSON.parse(savedPlatform))
        }

        const savedUser = localStorage.getItem(SETTINGS_KEYS.USER)
        if (savedUser) {
          setUserSettings(JSON.parse(savedUser))
        }

        const savedPayment = localStorage.getItem(SETTINGS_KEYS.PAYMENT)
        if (savedPayment) {
          setPaymentSettings(JSON.parse(savedPayment))
        }

        const savedFeature = localStorage.getItem(SETTINGS_KEYS.FEATURE)
        if (savedFeature) {
          setFeatureSettings(JSON.parse(savedFeature))
        }

        const savedReservation = localStorage.getItem("admin_reservation_settings")
        if (savedReservation) {
          const parsed = JSON.parse(savedReservation)
          setReservationSettings({
            ...parsed,
            timeUnit: parsed.defaultReservationMinutes >= 60 ? "hours" : "minutes",
          })
        }

        // Load fee settings
        const [depositFees, withdrawalFees, transactionFees, chatTransferFees, tipFees] = await Promise.all([
          getAdminFeeSettings("deposit"),
          getAdminFeeSettings("withdrawal"),
          getAdminFeeSettings("transaction"),
          getAdminFeeSettings("chat_transfer"),
          getAdminFeeSettings("tip"),
        ])

        setFeeSettings({
          deposit: depositFees,
          withdrawal: withdrawalFees,
          transaction: transactionFees,
          chat_transfer: chatTransferFees,
          tip: tipFees,
        })

        const supportSettings = await getSupportPricingSettings()
        const freeSupport = supportSettings.find((s) => s.supportType === "free")
        const prioritySupport = supportSettings.find((s) => s.supportType === "priority")

        setSupportPricingSettings({
          free: freeSupport || null,
          priority: prioritySupport || null,
        })
      } catch (error) {
        console.error("Error loading settings:", error)
        setRevisionSettingsLoaded(true)
      }
    }

    loadSettings()
    loadCurrencyData()
  }, [])

  const handleSaveSettings = async (settingsType: string) => {
    try {
      let settingsData
      let settingsKey

      switch (settingsType) {
        case "platform":
          settingsData = platformSettings
          settingsKey = SETTINGS_KEYS.PLATFORM
          break
        case "users":
          settingsData = userSettings
          settingsKey = SETTINGS_KEYS.USER
          break
        case "payments":
          settingsData = paymentSettings
          settingsKey = SETTINGS_KEYS.PAYMENT
          break
        case "oauth":
          settingsData = oauthSettings
          settingsKey = SETTINGS_KEYS.OAUTH
          break
        case "features":
          settingsData = featureSettings
          settingsKey = SETTINGS_KEYS.FEATURE
          break
        default:
          throw new Error("Invalid settings type")
      }

      console.log(`[v0] Saving ${settingsType} settings:`, settingsData)

      // Save to localStorage
      localStorage.setItem(settingsKey, JSON.stringify(settingsData))

      // Make API call to save settings
      const response = await fetch(`/api/admin/${settingsType}-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      console.log(`[v0] ${settingsType} settings saved successfully`)
      toast.success(`${settingsType} settings have been saved successfully.`)
    } catch (error) {
      console.error(`[v0] Error saving ${settingsType} settings:`, error)
      toast.error(
        `Failed to save ${settingsType} settings: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFeeSettings = async () => {
    setFeeLoading(true)
    try {
      const promises = []

      if (feeSettings.deposit) {
        promises.push(updateAdminFeeSettings("deposit", feeSettings.deposit))
      }
      if (feeSettings.withdrawal) {
        promises.push(updateAdminFeeSettings("withdrawal", feeSettings.withdrawal))
      }
      if (feeSettings.transaction) {
        promises.push(updateAdminFeeSettings("transaction", feeSettings.transaction))
      }
      if (feeSettings.chat_transfer) {
        promises.push(updateAdminFeeSettings("chat_transfer", feeSettings.chat_transfer))
      }
      if (feeSettings.tip) {
        promises.push(updateAdminFeeSettings("tip", feeSettings.tip))
      }

      await Promise.all(promises)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Fee settings saved:", feeSettings)
      toast.success("Fee settings have been saved successfully.")
    } catch (error) {
      console.error("Error saving fee settings:", error)
      toast.error("Failed to save fee settings. Please try again.")
    } finally {
      setFeeLoading(false)
    }
  }

  const handleSaveSupportPricing = async () => {
    setSupportLoading(true)
    try {
      const promises = []

      if (supportPricingSettings.free) {
        promises.push(updateSupportPricingSettings("free", supportPricingSettings.free))
      }
      if (supportPricingSettings.priority) {
        promises.push(updateSupportPricingSettings("priority", supportPricingSettings.priority))
      }

      await Promise.all(promises)

      console.log("[v0] Support pricing saved:", supportPricingSettings)
      toast.success("Support pricing settings have been saved successfully.")
    } catch (error) {
      console.error("Error saving support pricing:", error)
      toast.error("Failed to save support pricing. Please try again.")
    } finally {
      setSupportLoading(false)
    }
  }

  const saveRevisionSettings = async () => {
    setLoading(true)
    console.log("[v0] Saving revision settings:", revisionSettings)

    try {
      const response = await fetch("/api/admin/revision-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(revisionSettings),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || "Failed to save settings" }
        }
        throw new Error(errorData.error || "Failed to save settings")
      }

      const result = await response.json()
      console.log("[v0] Revision settings saved successfully:", result)
      toast.success("Revision settings saved successfully")
    } catch (error) {
      console.error("[v0] Failed to save revision settings:", error)
      toast.error(`Failed to save revision settings: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const updateFeeSettings = (
    feeType: "deposit" | "withdrawal" | "transaction" | "chat_transfer" | "tip",
    updates: Partial<AdminFeeSettings>,
  ) => {
    setFeeSettings((prev) => ({
      ...prev,
      [feeType]: prev[feeType] ? { ...prev[feeType], ...updates } : null,
    }))
  }

  const updateSupportPricing = (supportType: "free" | "priority", updates: Partial<SupportPricingSettings>) => {
    setSupportPricingSettings((prev) => ({
      ...prev,
      [supportType]: prev[supportType] ? { ...prev[supportType], ...updates } : null,
    }))
  }

  const getSettings = (type: keyof typeof SETTINGS_KEYS) => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEYS[type])
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error(`Error getting ${type} settings:`, error)
      return null
    }
  }

  const handleUpdateExchangeRate = async (
    fromCode: string,
    toCode: string,
    customRate: number | null,
    useCustom: boolean,
  ) => {
    setCurrencyLoading(true)
    try {
      await currencyService.updateExchangeRate(fromCode, toCode, customRate, useCustom)
      await loadCurrencyData()
      toast.success(`Exchange rate updated for ${fromCode} to ${toCode}`)
      setEditingRate(null)
    } catch (error) {
      console.error("Error updating exchange rate:", error)
      toast.error("Failed to update exchange rate")
    } finally {
      setCurrencyLoading(false)
    }
  }

  const handleRefreshLiveRates = async () => {
    setCurrencyLoading(true)
    try {
      await currencyService.updateLiveRates()
      await loadCurrencyData()
      toast.success("Live exchange rates refreshed")
    } catch (error) {
      console.error("Error refreshing live rates:", error)
      toast.error("Failed to refresh live rates")
    } finally {
      setCurrencyLoading(false)
    }
  }

  const formatRate = (rate: number | undefined | null) => {
    if (rate == null || isNaN(rate)) {
      return "0.000000"
    }
    return rate.toFixed(6)
  }

  const handleSaveReservationSettings = async () => {
    setReservationLoading(true)
    try {
      // Convert to minutes if needed
      const settingsToSave = {
        ...reservationSettings,
        defaultReservationMinutes:
          reservationSettings.timeUnit === "hours"
            ? reservationSettings.defaultReservationMinutes * 60
            : reservationSettings.defaultReservationMinutes,
        maxReservationMinutes:
          reservationSettings.timeUnit === "hours" && reservationSettings.maxReservationMinutes < 60
            ? reservationSettings.maxReservationMinutes * 60
            : reservationSettings.maxReservationMinutes,
      }

      // Save to localStorage
      localStorage.setItem("admin_reservation_settings", JSON.stringify(settingsToSave))

      // Also update the local reservation storage
      if (typeof window !== "undefined") {
        const { updateReservationSettings } = await import("@/lib/local-reservation-utils")
        updateReservationSettings({
          isEnabled: settingsToSave.isEnabled,
          defaultReservationMinutes: settingsToSave.defaultReservationMinutes,
          maxReservationMinutes: settingsToSave.maxReservationMinutes,
          maxConcurrentReservations: settingsToSave.maxConcurrentReservations,
        })
      }

      console.log("[v0] Reservation settings saved:", settingsToSave)
      toast.success("Reservation settings have been saved successfully.")
    } catch (error) {
      console.error("Error saving reservation settings:", error)
      toast.error("Failed to save reservation settings. Please try again.")
    } finally {
      setReservationLoading(false)
    }
  }

  return (
    <>
      <AdminHeader title="Settings" description="Manage platform configuration and preferences" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <Tabs defaultValue="platform" className="space-y-6">
            <TabsList className="grid w-full grid-cols-12">
              <TabsTrigger value="platform" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Platform
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Fees
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Support
              </TabsTrigger>
              <TabsTrigger value="currency" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Currency
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reservations
              </TabsTrigger>
              <TabsTrigger value="seller-levels" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Seller Levels
              </TabsTrigger>
              <TabsTrigger value="oauth" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                OAuth
              </TabsTrigger>
              <TabsTrigger value="ads" className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Ad Networks
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <ToggleLeft className="w-4 h-4" />
                Features
              </TabsTrigger>
            </TabsList>

            {/* Platform Settings */}
            <TabsContent value="platform">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Platform Settings
                  </CardTitle>
                  <CardDescription>Configure basic platform information and global settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input
                        id="siteName"
                        value={platformSettings.siteName}
                        onChange={(e) => setPlatformSettings((prev) => ({ ...prev, siteName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={platformSettings.supportEmail}
                        onChange={(e) => setPlatformSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={platformSettings.siteDescription}
                      onChange={(e) => setPlatformSettings((prev) => ({ ...prev, siteDescription: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <Select
                        value={platformSettings.currency}
                        onValueChange={(value) => setPlatformSettings((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Default Timezone</Label>
                      <Select
                        value={platformSettings.timezone}
                        onValueChange={(value) => setPlatformSettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST - Eastern Time</SelectItem>
                          <SelectItem value="PST">PST - Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Temporarily disable public access to the platform</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatformSettings((prev) => ({ ...prev, maintenanceMode: checked }))
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("platform")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Platform Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Settings */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    User Management Settings
                  </CardTitle>
                  <CardDescription>Configure user registration, verification, and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Allow New Registrations</Label>
                        <p className="text-sm text-gray-500">Enable or disable new user sign-ups</p>
                      </div>
                      <Switch
                        checked={userSettings.allowRegistration}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({ ...prev, allowRegistration: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Email Verification</Label>
                        <p className="text-sm text-gray-500">
                          Users must verify their email before accessing the platform
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.requireEmailVerification}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({ ...prev, requireEmailVerification: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Profile Completion</Label>
                        <p className="text-sm text-gray-500">
                          Force users to complete their profile before posting jobs/services
                        </p>
                      </div>
                      <Switch
                        checked={userSettings.requireProfileCompletion}
                        onCheckedChange={(checked) =>
                          setUserSettings((prev) => ({ ...prev, requireProfileCompletion: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxJobs">Max Jobs Per User</Label>
                      <Input
                        id="maxJobs"
                        type="number"
                        value={userSettings.maxJobsPerUser}
                        onChange={(e) =>
                          setUserSettings((prev) => ({ ...prev, maxJobsPerUser: Number.parseInt(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxServices">Max Services Per User</Label>
                      <Input
                        id="maxServices"
                        type="number"
                        value={userSettings.maxServicesPerUser}
                        onChange={(e) =>
                          setUserSettings((prev) => ({ ...prev, maxServicesPerUser: Number.parseInt(e.target.value) }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("users")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save User Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Payment Settings
                  </CardTitle>
                  <CardDescription>Configure payment processing, fees, and payout settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="platformFee">Platform Fee (%)</Label>
                      <Input
                        id="platformFee"
                        type="number"
                        step="0.1"
                        value={paymentSettings.platformFeePercentage}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({
                            ...prev,
                            platformFeePercentage: Number.parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minWithdrawal">Minimum Withdrawal ($)</Label>
                      <Input
                        id="minWithdrawal"
                        type="number"
                        value={paymentSettings.minimumWithdrawal}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({
                            ...prev,
                            minimumWithdrawal: Number.parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Methods</Label>
                    <div className="flex gap-2">
                      <Badge variant={paymentSettings.paymentMethods.includes("stripe") ? "default" : "outline"}>
                        Stripe
                      </Badge>
                      <Badge variant={paymentSettings.paymentMethods.includes("paypal") ? "default" : "outline"}>
                        PayPal
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto Payout</Label>
                      <p className="text-sm text-gray-500">Automatically process payouts based on schedule</p>
                    </div>
                    <Switch
                      checked={paymentSettings.autoPayoutEnabled}
                      onCheckedChange={(checked) =>
                        setPaymentSettings((prev) => ({ ...prev, autoPayoutEnabled: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <Select
                      value={paymentSettings.payoutSchedule}
                      onValueChange={(value) => setPaymentSettings((prev) => ({ ...prev, payoutSchedule: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("payments")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Payment Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-orange-600" />
                    Fee Management
                  </CardTitle>
                  <CardDescription>
                    Configure platform fees for deposits, withdrawals, transactions, chat transfers, and tips
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tip Fees */}
                  {feeSettings.tip && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Tip Settings</h3>
                          <p className="text-sm text-gray-500">Configure tip limits and fees for work proof tips</p>
                        </div>
                        <Switch
                          checked={feeSettings.tip.isActive}
                          onCheckedChange={(checked) => updateFeeSettings("tip", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Tip Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeSettings.tip.feePercentage}
                            onChange={(e) =>
                              updateFeeSettings("tip", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.tip.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Tip Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.tip.feeFixed}
                            onChange={(e) => updateFeeSettings("tip", { feeFixed: Number.parseFloat(e.target.value) })}
                            disabled={!feeSettings.tip.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Tip ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.tip.minimumFee}
                            onChange={(e) =>
                              updateFeeSettings("tip", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.tip.isActive}
                            placeholder="0.50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Tip ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.tip.maximumFee || ""}
                            onChange={(e) =>
                              updateFeeSettings("tip", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!feeSettings.tip.isActive}
                            placeholder="100.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Deposit Fees */}
                  {feeSettings.deposit && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Deposit Fees</h3>
                          <p className="text-sm text-gray-500">Configure deposit fees for transactions</p>
                        </div>
                        <Switch
                          checked={feeSettings.deposit.isActive}
                          onCheckedChange={(checked) => updateFeeSettings("deposit", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Deposit Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeSettings.deposit.feePercentage}
                            onChange={(e) =>
                              updateFeeSettings("deposit", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.deposit.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Deposit Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.deposit.feeFixed}
                            onChange={(e) =>
                              updateFeeSettings("deposit", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.deposit.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Deposit ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.deposit.minimumFee}
                            onChange={(e) =>
                              updateFeeSettings("deposit", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.deposit.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Deposit ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.deposit.maximumFee || ""}
                            onChange={(e) =>
                              updateFeeSettings("deposit", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!feeSettings.deposit.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Withdrawal Fees */}
                  {feeSettings.withdrawal && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Withdrawal Fees</h3>
                          <p className="text-sm text-gray-500">Configure withdrawal fees for transactions</p>
                        </div>
                        <Switch
                          checked={feeSettings.withdrawal.isActive}
                          onCheckedChange={(checked) => updateFeeSettings("withdrawal", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Withdrawal Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeSettings.withdrawal.feePercentage}
                            onChange={(e) =>
                              updateFeeSettings("withdrawal", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.withdrawal.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Withdrawal Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.withdrawal.feeFixed}
                            onChange={(e) =>
                              updateFeeSettings("withdrawal", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.withdrawal.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Withdrawal ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.withdrawal.minimumFee}
                            onChange={(e) =>
                              updateFeeSettings("withdrawal", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.withdrawal.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Withdrawal ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.withdrawal.maximumFee || ""}
                            onChange={(e) =>
                              updateFeeSettings("withdrawal", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!feeSettings.withdrawal.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction Fees */}
                  {feeSettings.transaction && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Transaction Fees</h3>
                          <p className="text-sm text-gray-500">Configure transaction fees for transactions</p>
                        </div>
                        <Switch
                          checked={feeSettings.transaction.isActive}
                          onCheckedChange={(checked) => updateFeeSettings("transaction", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Transaction Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeSettings.transaction.feePercentage}
                            onChange={(e) =>
                              updateFeeSettings("transaction", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.transaction.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Transaction Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.transaction.feeFixed}
                            onChange={(e) =>
                              updateFeeSettings("transaction", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.transaction.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Transaction ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.transaction.minimumFee}
                            onChange={(e) =>
                              updateFeeSettings("transaction", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.transaction.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Transaction ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.transaction.maximumFee || ""}
                            onChange={(e) =>
                              updateFeeSettings("transaction", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!feeSettings.transaction.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Transfer Fees */}
                  {feeSettings.chat_transfer && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Chat Transfer Fees</h3>
                          <p className="text-sm text-gray-500">Configure chat transfer fees for transactions</p>
                        </div>
                        <Switch
                          checked={feeSettings.chat_transfer.isActive}
                          onCheckedChange={(checked) => updateFeeSettings("chat_transfer", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Chat Transfer Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={feeSettings.chat_transfer.feePercentage}
                            onChange={(e) =>
                              updateFeeSettings("chat_transfer", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.chat_transfer.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Chat Transfer Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.chat_transfer.feeFixed}
                            onChange={(e) =>
                              updateFeeSettings("chat_transfer", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.chat_transfer.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Chat Transfer ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.chat_transfer.minimumFee}
                            onChange={(e) =>
                              updateFeeSettings("chat_transfer", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!feeSettings.chat_transfer.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Chat Transfer ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={feeSettings.chat_transfer.maximumFee || ""}
                            onChange={(e) =>
                              updateFeeSettings("chat_transfer", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!feeSettings.chat_transfer.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveFeeSettings} disabled={feeLoading}>
                      {feeLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Fee Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Settings */}
            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-red-600" />
                    Support Pricing
                  </CardTitle>
                  <CardDescription>Configure pricing for support services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Free Support */}
                  {supportPricingSettings.free && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Free Support</h3>
                          <p className="text-sm text-gray-500">Configure pricing for free support</p>
                        </div>
                        <Switch
                          checked={supportPricingSettings.free.isActive}
                          onCheckedChange={(checked) => updateSupportPricing("free", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Free Support Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={supportPricingSettings.free.feePercentage}
                            onChange={(e) =>
                              updateSupportPricing("free", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.free.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Free Support Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.free.feeFixed}
                            onChange={(e) =>
                              updateSupportPricing("free", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.free.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Free Support ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.free.minimumFee}
                            onChange={(e) =>
                              updateSupportPricing("free", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.free.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Free Support ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.free.maximumFee || ""}
                            onChange={(e) =>
                              updateSupportPricing("free", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!supportPricingSettings.free.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Priority Support */}
                  {supportPricingSettings.priority && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">Priority Support</h3>
                          <p className="text-sm text-gray-500">Configure pricing for priority support</p>
                        </div>
                        <Switch
                          checked={supportPricingSettings.priority.isActive}
                          onCheckedChange={(checked) => updateSupportPricing("priority", { isActive: checked })}
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Priority Support Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={supportPricingSettings.priority.feePercentage}
                            onChange={(e) =>
                              updateSupportPricing("priority", { feePercentage: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.priority.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fixed Priority Support Fee ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.priority.feeFixed}
                            onChange={(e) =>
                              updateSupportPricing("priority", { feeFixed: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.priority.isActive}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Priority Support ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.priority.minimumFee}
                            onChange={(e) =>
                              updateSupportPricing("priority", { minimumFee: Number.parseFloat(e.target.value) })
                            }
                            disabled={!supportPricingSettings.priority.isActive}
                            placeholder="10.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maximum Priority Support ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={supportPricingSettings.priority.maximumFee || ""}
                            onChange={(e) =>
                              updateSupportPricing("priority", {
                                maximumFee: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                              })
                            }
                            disabled={!supportPricingSettings.priority.isActive}
                            placeholder="1000.00"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSupportPricing} disabled={supportLoading}>
                      {supportLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Support Pricing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Currency Settings */}
            <TabsContent value="currency">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                    Currency Management
                  </CardTitle>
                  <CardDescription>Configure exchange rates and default currency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Default Currency</h3>
                        <p className="text-sm text-gray-500">Set the default currency for the platform</p>
                      </div>
                      <Select
                        value={platformSettings.currency}
                        onValueChange={(value) => setPlatformSettings((prev) => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Exchange Rates</h3>
                    <p className="text-sm text-gray-500">Manage exchange rates between currencies</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {exchangeRates.map((rate) => (
                      <div key={`${rate.from_currency.code}-${rate.to_currency.code}`} className="space-y-2">
                        <Label>{`${rate.from_currency.code} to ${rate.to_currency.code}`}</Label>
                        <Input
                          type="number"
                          step="0.000001"
                          value={formatRate(rate?.rate)}
                          onChange={(e) => {
                            const newRate = Number.parseFloat(e.target.value)
                            if (!isNaN(newRate)) {
                              handleUpdateExchangeRate(rate.from_currency.code, rate.to_currency.code, newRate, true)
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleRefreshLiveRates} disabled={currencyLoading}>
                      {currencyLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh Live Rates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-teal-600" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>Configure notification preferences and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Notifications</h3>
                        <p className="text-sm text-gray-500">Enable or disable platform notifications</p>
                      </div>
                      <Switch
                        checked={true} // Placeholder for actual notification settings
                        onCheckedChange={(checked) => console.log("Notifications enabled:", checked)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Notification Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reservation Settings */}
            <TabsContent value="reservations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    Reservation Settings
                  </CardTitle>
                  <CardDescription>Configure reservation preferences and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Reservation Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Reservations</h3>
                        <p className="text-sm text-gray-500">Enable or disable job reservations</p>
                      </div>
                      <Switch
                        checked={reservationSettings.isEnabled}
                        onCheckedChange={(checked) =>
                          setReservationSettings((prev) => ({ ...prev, isEnabled: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="defaultReservationMinutes">Default Reservation Duration</Label>
                      <Input
                        id="defaultReservationMinutes"
                        type="number"
                        value={reservationSettings.defaultReservationMinutes}
                        onChange={(e) =>
                          setReservationSettings((prev) => ({
                            ...prev,
                            defaultReservationMinutes: Number.parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxReservationMinutes">Maximum Reservation Duration</Label>
                      <Input
                        id="maxReservationMinutes"
                        type="number"
                        value={reservationSettings.maxReservationMinutes}
                        onChange={(e) =>
                          setReservationSettings((prev) => ({
                            ...prev,
                            maxReservationMinutes: Number.parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeUnit">Time Unit</Label>
                      <Select
                        value={reservationSettings.timeUnit}
                        onValueChange={(value) => setReservationSettings((prev) => ({ ...prev, timeUnit: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveReservationSettings} disabled={reservationLoading}>
                      {reservationLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Reservation Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Seller Levels Settings */}
            <TabsContent value="seller-levels">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    Seller Levels Management
                  </CardTitle>
                  <CardDescription>Configure seller levels and their associated benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SellerLevelAdmin />
                </CardContent>
              </Card>
            </TabsContent>

            {/* OAuth Settings */}
            <TabsContent value="oauth">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-600" />
                    OAuth Settings
                  </CardTitle>
                  <CardDescription>Configure OAuth integration for social logins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* OAuth Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Google OAuth</h3>
                        <p className="text-sm text-gray-500">Enable or disable Google OAuth integration</p>
                      </div>
                      <Switch
                        checked={oauthSettings.googleEnabled}
                        onCheckedChange={(checked) => setOauthSettings((prev) => ({ ...prev, googleEnabled: checked }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="googleClientId">Google Client ID</Label>
                        <Input
                          id="googleClientId"
                          value={oauthSettings.googleClientId}
                          onChange={(e) => setOauthSettings((prev) => ({ ...prev, googleClientId: e.target.value }))}
                          disabled={!oauthSettings.googleEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="googleClientSecret">Google Client Secret</Label>
                        <Input
                          id="googleClientSecret"
                          value={oauthSettings.googleClientSecret}
                          onChange={(e) =>
                            setOauthSettings((prev) => ({ ...prev, googleClientSecret: e.target.value }))
                          }
                          disabled={!oauthSettings.googleEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Facebook OAuth</h3>
                        <p className="text-sm text-gray-500">Enable or disable Facebook OAuth integration</p>
                      </div>
                      <Switch
                        checked={oauthSettings.facebookEnabled}
                        onCheckedChange={(checked) =>
                          setOauthSettings((prev) => ({ ...prev, facebookEnabled: checked }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="facebookAppId">Facebook App ID</Label>
                        <Input
                          id="facebookAppId"
                          value={oauthSettings.facebookAppId}
                          onChange={(e) => setOauthSettings((prev) => ({ ...prev, facebookAppId: e.target.value }))}
                          disabled={!oauthSettings.facebookEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="facebookAppSecret">Facebook App Secret</Label>
                        <Input
                          id="facebookAppSecret"
                          value={oauthSettings.facebookAppSecret}
                          onChange={(e) => setOauthSettings((prev) => ({ ...prev, facebookAppSecret: e.target.value }))}
                          disabled={!oauthSettings.facebookEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Twitter OAuth</h3>
                        <p className="text-sm text-gray-500">Enable or disable Twitter OAuth integration</p>
                      </div>
                      <Switch
                        checked={oauthSettings.twitterEnabled}
                        onCheckedChange={(checked) =>
                          setOauthSettings((prev) => ({ ...prev, twitterEnabled: checked }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="twitterApiKey">Twitter API Key</Label>
                        <Input
                          id="twitterApiKey"
                          value={oauthSettings.twitterApiKey}
                          onChange={(e) => setOauthSettings((prev) => ({ ...prev, twitterApiKey: e.target.value }))}
                          disabled={!oauthSettings.twitterEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitterApiSecret">Twitter API Secret</Label>
                        <Input
                          id="twitterApiSecret"
                          value={oauthSettings.twitterApiSecret}
                          onChange={(e) => setOauthSettings((prev) => ({ ...prev, twitterApiSecret: e.target.value }))}
                          disabled={!oauthSettings.twitterEnabled}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">Redirect URL</Label>
                    <Input
                      id="redirectUrl"
                      value={oauthSettings.redirectUrl}
                      onChange={(e) => setOauthSettings((prev) => ({ ...prev, redirectUrl: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("oauth")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save OAuth Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Settings */}
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5 text-gray-600" />
                    Feature Management
                  </CardTitle>
                  <CardDescription>Configure platform features and their availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Feature Preferences */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Microjobs</h3>
                        <p className="text-sm text-gray-500">Enable or disable microjobs feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableMicrojobs}
                        onCheckedChange={(checked) =>
                          setFeatureSettings((prev) => ({ ...prev, enableMicrojobs: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Marketplace</h3>
                        <p className="text-sm text-gray-500">Enable or disable marketplace feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableMarketplace}
                        onCheckedChange={(checked) =>
                          setFeatureSettings((prev) => ({ ...prev, enableMarketplace: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Wallet</h3>
                        <p className="text-sm text-gray-500">Enable or disable wallet feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableWallet}
                        onCheckedChange={(checked) =>
                          setFeatureSettings((prev) => ({ ...prev, enableWallet: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Referrals</h3>
                        <p className="text-sm text-gray-500">Enable or disable referrals feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableReferrals}
                        onCheckedChange={(checked) =>
                          setFeatureSettings((prev) => ({ ...prev, enableReferrals: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Reviews</h3>
                        <p className="text-sm text-gray-500">Enable or disable reviews feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableReviews}
                        onCheckedChange={(checked) =>
                          setFeatureSettings((prev) => ({ ...prev, enableReviews: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Enable Chat</h3>
                        <p className="text-sm text-gray-500">Enable or disable chat feature</p>
                      </div>
                      <Switch
                        checked={featureSettings.enableChat}
                        onCheckedChange={(checked) => setFeatureSettings((prev) => ({ ...prev, enableChat: checked }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("features")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Feature Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ads" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Ad Network Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure ad networks to monetize your platform. Enable and configure different ad providers.
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Google AdSense */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Google AdSense</CardTitle>
                            <CardDescription>Display contextual ads from Google</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.adsense_enabled || false}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, adsense_enabled: checked }))}
                        />
                      </div>
                    </CardHeader>
                    {settings.adsense_enabled && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="adsense-publisher-id">Publisher ID</Label>
                            <Input
                              id="adsense-publisher-id"
                              placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                              value={settings.adsense_publisher_id || ""}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, adsense_publisher_id: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="adsense-auto-ads">Auto Ads Code</Label>
                            <Textarea
                              id="adsense-auto-ads"
                              placeholder="<script async src=&quot;https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx&quot; crossorigin=&quot;anonymous&quot;></script>"
                              value={settings.adsense_auto_ads_code || ""}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, adsense_auto_ads_code: e.target.value }))
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Ezoic */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Ezoic</CardTitle>
                            <CardDescription>AI-powered ad optimization platform</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.ezoic_enabled || false}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, ezoic_enabled: checked }))}
                        />
                      </div>
                    </CardHeader>
                    {settings.ezoic_enabled && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="ezoic-site-id">Site ID</Label>
                            <Input
                              id="ezoic-site-id"
                              placeholder="Your Ezoic Site ID"
                              value={settings.ezoic_site_id || ""}
                              onChange={(e) => setSettings((prev) => ({ ...prev, ezoic_site_id: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="ezoic-script">Ezoic Script</Label>
                            <Textarea
                              id="ezoic-script"
                              placeholder="<script>window.ezstandalone = window.ezstandalone || {}; ezstandalone.cmd = ezstandalone.cmd || [];</script>"
                              value={settings.ezoic_script || ""}
                              onChange={(e) => setSettings((prev) => ({ ...prev, ezoic_script: e.target.value }))}
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* PropellerAds */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">PropellerAds</CardTitle>
                            <CardDescription>Multi-format advertising network</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.propellerads_enabled || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, propellerads_enabled: checked }))
                          }
                        />
                      </div>
                    </CardHeader>
                    {settings.propellerads_enabled && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="propellerads-zone-id">Zone ID</Label>
                            <Input
                              id="propellerads-zone-id"
                              placeholder="Your PropellerAds Zone ID"
                              value={settings.propellerads_zone_id || ""}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, propellerads_zone_id: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="propellerads-script">PropellerAds Script</Label>
                            <Textarea
                              id="propellerads-script"
                              placeholder="<script>(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://iclickcdn.com/tag.min.js',ZONE_ID,document.head)</script>"
                              value={settings.propellerads_script || ""}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, propellerads_script: e.target.value }))
                              }
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Adsterra */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Adsterra</CardTitle>
                            <CardDescription>Global advertising network</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.adsterra_enabled || false}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, adsterra_enabled: checked }))}
                        />
                      </div>
                    </CardHeader>
                    {settings.adsterra_enabled && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="adsterra-publisher-id">Publisher ID</Label>
                            <Input
                              id="adsterra-publisher-id"
                              placeholder="Your Adsterra Publisher ID"
                              value={settings.adsterra_publisher_id || ""}
                              onChange={(e) =>
                                setSettings((prev) => ({ ...prev, adsterra_publisher_id: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="adsterra-script">Adsterra Script</Label>
                            <Textarea
                              id="adsterra-script"
                              placeholder="<script type=&quot;text/javascript&quot;>atOptions = {'key' : 'your-key-here','format' : 'iframe','height' : 250,'width' : 300,'params' : {}};</script>"
                              value={settings.adsterra_script || ""}
                              onChange={(e) => setSettings((prev) => ({ ...prev, adsterra_script: e.target.value }))}
                              rows={3}
                            />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Ad Placement Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Ad Placement Settings</CardTitle>
                      <CardDescription>Configure where ads should appear on your site</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Header Ads</Label>
                            <p className="text-sm text-muted-foreground">Show ads in the header area</p>
                          </div>
                          <Switch
                            checked={settings.ads_header_enabled || false}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({ ...prev, ads_header_enabled: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Sidebar Ads</Label>
                            <p className="text-sm text-muted-foreground">Show ads in sidebar areas</p>
                          </div>
                          <Switch
                            checked={settings.ads_sidebar_enabled || false}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({ ...prev, ads_sidebar_enabled: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Footer Ads</Label>
                            <p className="text-sm text-muted-foreground">Show ads in the footer area</p>
                          </div>
                          <Switch
                            checked={settings.ads_footer_enabled || false}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({ ...prev, ads_footer_enabled: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Content Ads</Label>
                            <p className="text-sm text-muted-foreground">Show ads within content areas</p>
                          </div>
                          <Switch
                            checked={settings.ads_content_enabled || false}
                            onCheckedChange={(checked) =>
                              setSettings((prev) => ({ ...prev, ads_content_enabled: checked }))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Analytics Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure Google Analytics and other tracking services to monitor your platform performance.
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* Google Analytics 4 */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Google Analytics 4</CardTitle>
                            <CardDescription>Track website traffic and user behavior</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.ga4_enabled || false}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, ga4_enabled: checked }))}
                        />
                      </div>
                    </CardHeader>
                    {settings.ga4_enabled && (
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="ga4-measurement-id">Measurement ID</Label>
                            <Input
                              id="ga4-measurement-id"
                              placeholder="G-XXXXXXXXXX"
                              value={settings.ga4_measurement_id || ""}
                              onChange={(e) => setSettings((prev) => ({ ...prev, ga4_measurement_id: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Find this in your Google Analytics property settings
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="ga4-stream-id">Data Stream ID (Optional)</Label>
                            <Input
                              id="ga4-stream-id"
                              placeholder="1234567890"
                              value={settings.ga4_stream_id || ""}
                              onChange={(e) => setSettings((prev) => ({ ...prev, ga4_stream_id: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground mt-1">Used for enhanced ecommerce tracking</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Google Tag Manager */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Google Tag Manager</CardTitle>
                            <CardDescription>Manage tracking codes and marketing tags</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.gtm_enabled || false}
                          onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, gtm_enabled: checked }))}
                        />
                      </div>
                    </CardHeader>
                    {settings.gtm_enabled && (
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="gtm-container-id">Container ID</Label>
                          <Input
                            id="gtm-container-id"
                            placeholder="GTM-XXXXXXX"
                            value={settings.gtm_container_id || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, gtm_container_id: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Find this in your Google Tag Manager container settings
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Facebook Pixel */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Facebook className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Facebook Pixel</CardTitle>
                            <CardDescription>Track conversions and optimize Facebook ads</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.facebook_pixel_enabled || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, facebook_pixel_enabled: checked }))
                          }
                        />
                      </div>
                    </CardHeader>
                    {settings.facebook_pixel_enabled && (
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="facebook-pixel-id">Pixel ID</Label>
                          <Input
                            id="facebook-pixel-id"
                            placeholder="123456789012345"
                            value={settings.facebook_pixel_id || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, facebook_pixel_id: e.target.value }))}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Find this in your Facebook Events Manager
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Custom Analytics */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Custom Analytics</CardTitle>
                            <CardDescription>Add custom tracking scripts and analytics codes</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={settings.custom_analytics_enabled || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, custom_analytics_enabled: checked }))
                          }
                        />
                      </div>
                    </CardHeader>
                    {settings.custom_analytics_enabled && (
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="custom-head-scripts">Head Scripts</Label>
                          <Textarea
                            id="custom-head-scripts"
                            placeholder="<!-- Custom analytics scripts for <head> section -->"
                            value={settings.custom_head_scripts || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, custom_head_scripts: e.target.value }))}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Scripts added here will be included in the HTML head section
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="custom-body-scripts">Body Scripts</Label>
                          <Textarea
                            id="custom-body-scripts"
                            placeholder="<!-- Custom analytics scripts for <body> section -->"
                            value={settings.custom_body_scripts || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, custom_body_scripts: e.target.value }))}
                            rows={4}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Scripts added here will be included at the end of the body section
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Privacy & Compliance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Privacy & Compliance</CardTitle>
                      <CardDescription>Configure privacy settings for analytics tracking</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Cookie Consent Required</Label>
                          <p className="text-sm text-muted-foreground">Require user consent before tracking</p>
                        </div>
                        <Switch
                          checked={settings.analytics_cookie_consent || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, analytics_cookie_consent: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Anonymize IP Addresses</Label>
                          <p className="text-sm text-muted-foreground">Anonymize visitor IP addresses for privacy</p>
                        </div>
                        <Switch
                          checked={settings.analytics_anonymize_ip || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, analytics_anonymize_ip: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Respect Do Not Track</Label>
                          <p className="text-sm text-muted-foreground">Honor browser Do Not Track settings</p>
                        </div>
                        <Switch
                          checked={settings.analytics_respect_dnt || false}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({ ...prev, analytics_respect_dnt: checked }))
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

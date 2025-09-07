"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Save, RefreshCw, User, Bell, Shield, Eye } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Account Settings State
  const [accountSettings, setAccountSettings] = useState({
    language: "en",
    timezone: "UTC",
    currency: "USD",
    twoFactorEnabled: false,
  })

  // Notification Settings State - Default push notifications to true
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    messageNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    pushNotifications: true, // Changed from false to true
    pushJobUpdates: true, // Changed from false to true
    pushMessages: true, // Changed from false to true
    pushPayments: true, // Changed from false to true
    pushReferrals: true, // Changed from false to true
    pushSystemAlerts: true, // Changed from false to true
    pushMarketing: false,
  })

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    allowDirectMessages: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log("[v0] Loading user settings...")
      const response = await fetch("/api/dashboard/settings")
      if (!response.ok) {
        throw new Error("Failed to load settings")
      }

      const settings = await response.json()
      console.log("[v0] Loaded settings:", settings)

      // Update state with loaded settings
      setAccountSettings({
        language: settings.language || "en",
        timezone: settings.timezone || "UTC",
        currency: settings.currency || "USD",
        twoFactorEnabled: settings.twoFactorEnabled || false,
      })

      setNotificationSettings({
        emailNotifications: settings.emailNotifications ?? true,
        jobAlerts: settings.jobAlerts ?? true,
        messageNotifications: settings.messageNotifications ?? true,
        marketingEmails: settings.marketingEmails ?? false,
        weeklyDigest: settings.weeklyDigest ?? true,
        pushNotifications: settings.pushNotifications ?? true,
        pushJobUpdates: settings.pushJobUpdates ?? true,
        pushMessages: settings.pushMessages ?? true,
        pushPayments: settings.pushPayments ?? true,
        pushReferrals: settings.pushReferrals ?? true,
        pushSystemAlerts: settings.pushSystemAlerts ?? true,
        pushMarketing: settings.pushMarketing ?? false,
      })

      setPrivacySettings({
        profileVisibility: settings.profileVisibility || "public",
        showEmail: settings.showEmail ?? false,
        showPhone: settings.showPhone ?? false,
        allowDirectMessages: settings.allowDirectMessages ?? true,
      })
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSaveSettings = async (section: string) => {
    setLoading(true)
    try {
      console.log(`[v0] Saving ${section} settings...`)

      let settingsToSave = {}
      switch (section) {
        case "Account":
          settingsToSave = accountSettings
          break
        case "Notification":
          settingsToSave = notificationSettings
          break
        case "Privacy":
          settingsToSave = privacySettings
          break
        case "Security":
          settingsToSave = accountSettings // Security settings are part of account
          break
        default:
          settingsToSave = { ...accountSettings, ...notificationSettings, ...privacySettings }
      }

      const response = await fetch("/api/dashboard/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section,
          settings: settingsToSave,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      const result = await response.json()
      console.log("[v0] Settings saved successfully:", result)

      toast({
        title: "Settings Updated",
        description: `${section} settings have been saved successfully.`,
      })
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <>
        <DashboardHeader title="Settings" description="Manage your account preferences and privacy settings." />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Settings" description="Manage your account preferences and privacy settings." />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Account Preferences
                  </CardTitle>
                  <CardDescription>Configure your account language, timezone, and currency preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={accountSettings.language}
                        onValueChange={(value) => setAccountSettings((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={accountSettings.timezone}
                        onValueChange={(value) => setAccountSettings((prev) => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">EST - Eastern Time</SelectItem>
                          <SelectItem value="PST">PST - Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Preferred Currency</Label>
                    <Select
                      value={accountSettings.currency}
                      onValueChange={(value) => setAccountSettings((prev) => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("Account")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Account Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-green-600" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Job Alerts</Label>
                          <p className="text-sm text-gray-500">Get notified about new job opportunities</p>
                        </div>
                        <Switch
                          checked={notificationSettings.jobAlerts}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, jobAlerts: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Message Notifications</Label>
                          <p className="text-sm text-gray-500">Get notified about new messages</p>
                        </div>
                        <Switch
                          checked={notificationSettings.messageNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, messageNotifications: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Marketing Emails</Label>
                          <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
                        </div>
                        <Switch
                          checked={notificationSettings.marketingEmails}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, marketingEmails: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Weekly Digest</Label>
                          <p className="text-sm text-gray-500">Receive a weekly summary of your activity</p>
                        </div>
                        <Switch
                          checked={notificationSettings.weeklyDigest}
                          onCheckedChange={(checked) =>
                            setNotificationSettings((prev) => ({ ...prev, weeklyDigest: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Push Notifications Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>

                    {notificationSettings.pushNotifications && (
                      <div className="space-y-4 pl-4 border-l-2 border-green-100">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Job Updates</Label>
                            <p className="text-sm text-gray-500">New jobs, applications, and status changes</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushJobUpdates}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushJobUpdates: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Messages</Label>
                            <p className="text-sm text-gray-500">New messages and chat notifications</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushMessages}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushMessages: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Payments</Label>
                            <p className="text-sm text-gray-500">Payment confirmations and wallet updates</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushPayments}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushPayments: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Referrals</Label>
                            <p className="text-sm text-gray-500">Referral rewards and achievement updates</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushReferrals}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushReferrals: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>System Alerts</Label>
                            <p className="text-sm text-gray-500">Important system updates and maintenance</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushSystemAlerts}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushSystemAlerts: checked }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Marketing</Label>
                            <p className="text-sm text-gray-500">Promotional offers and platform updates</p>
                          </div>
                          <Switch
                            checked={notificationSettings.pushMarketing}
                            onCheckedChange={(checked) =>
                              setNotificationSettings((prev) => ({ ...prev, pushMarketing: checked }))
                            }
                          />
                        </div>
                      </div>
                    )}

                    {!notificationSettings.pushNotifications && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Enable push notifications to receive instant updates on your device.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("Notification")} disabled={loading}>
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

            {/* Privacy Settings */}
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>Control who can see your information and contact you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility">Profile Visibility</Label>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => setPrivacySettings((prev) => ({ ...prev, profileVisibility: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                        <SelectItem value="registered">Registered Users Only</SelectItem>
                        <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-gray-500">Display your email on your public profile</p>
                      </div>
                      <Switch
                        checked={privacySettings.showEmail}
                        onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showEmail: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Show Phone Number</Label>
                        <p className="text-sm text-gray-500">Display your phone number on your public profile</p>
                      </div>
                      <Switch
                        checked={privacySettings.showPhone}
                        onCheckedChange={(checked) => setPrivacySettings((prev) => ({ ...prev, showPhone: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Allow Direct Messages</Label>
                        <p className="text-sm text-gray-500">Let other users send you direct messages</p>
                      </div>
                      <Switch
                        checked={privacySettings.allowDirectMessages}
                        onCheckedChange={(checked) =>
                          setPrivacySettings((prev) => ({ ...prev, allowDirectMessages: checked }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("Privacy")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Privacy Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Change Password</Label>
                      <p className="text-sm text-gray-500 mb-3">Update your account password</p>
                      <div className="space-y-3">
                        <Input type="password" placeholder="Current password" />
                        <Input type="password" placeholder="New password" />
                        <Input type="password" placeholder="Confirm new password" />
                        <Button variant="outline">Update Password</Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch
                        checked={accountSettings.twoFactorEnabled}
                        onCheckedChange={(checked) =>
                          setAccountSettings((prev) => ({ ...prev, twoFactorEnabled: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-red-600">Danger Zone</Label>
                      <p className="text-sm text-gray-500 mb-3">Irreversible actions</p>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveSettings("Security")} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

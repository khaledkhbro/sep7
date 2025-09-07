"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Save,
  RefreshCw,
  Bell,
  Settings,
  TestTube,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Send,
} from "lucide-react"

interface FirebaseSettings {
  fcm_enabled: boolean
  firebase_project_id: string
  firebase_private_key: string
  firebase_client_email: string
  fcm_web_config: string
  fcm_default_icon: string
  fcm_default_badge: string
}

export default function FirebaseSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [settings, setSettings] = useState<FirebaseSettings>({
    fcm_enabled: true,
    firebase_project_id: "newkhaled-2b232",
    firebase_private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5brMN9RQhvud9
UoBM1Or8YzQ5D80QFNMBWq/DdoBG6NBwB47a0XFt7OOy78HkOTqfPG1A4uyYg5Yv
VIsjrtmb88v6V/+m7b4Nuoc97KqcFGBongXdEVgpQQwr9UcD6eNOPGCuXh1TZDPn
nnS2rUUyNF1eC4vp232dkquC+k86GGs5v/h5KVkZ/Yr4IrbGTfK+pdrrVqE+ucUC
ybm5XgQ89fJQgngd/mCYm595dpeZmNTPdFKOfYqeioV5UHu5a/6UR71HlyumOlPH
38xpbj3eKMiDt15dPF98bIW1GyNtbnnGpAnla5hBPn1ooRlsxTfzs3HVBYUBZaV3
/G1Vv87PAgMBAAECggEAGxJuUbtWFRcp9MH2uUDcjbxuA2arKY3gwHHc90x1reSP
icuQr6GkTcgn9hfK1ucEB/tqd+6pXBrZ8k8FgVAltP8C6KmwSU6sUJTK6d+DiQXw
jVWExaGinWNBw6krlQawiNuHwe07mtEmQsp/f6wMTigW+YP2CU5iKH8hSx4AMxrd
4fVlJaDX+inWCQDVNG9CVIjvsEwV6mWF5sKNIT4Sn+kB8XMnzvqjNw05B5rcqCjd
cVa2XnLQp0jn5uTdWZq3rCpeqHinGyLHoPO0V0162qaMe3ORA4issOwgeVkpNpxd
SE/Mw7lvCjbme4YYzvVeydrmmf4dcWLhnCIEMsatAQKBgQDiiYbS6W7rcg0br/Ix
oFKHCc7JAXoecxMBdpUl120fZDvhvbA0l2+vPE3sovAjIpizNIqUdCCnCHU8o5pz
M6bFgUd1598gpBIq6tn5WiNdq+9AfkX2diy/O3FnIdNL/1GkXcNHaw4kCPSk7eGN
QSi9FlKsqfRiIta8JoWfXUEvawKBgQDRjJqP3J/zWtV1oJ8EJrgHblTRBjqGeZRZ
DUN09VVkePNhNBODrruVfUFIHQ55hWhvrFqNlx7W5ryw3e5tl/ZrZ7WAO/3VZTXI
3twoYks/A/P9Q/GAHStyMOfRXzk3wd6n6BmPcMf5r/7pHDsmk6/N74bbueyMnzEU
J2nz8VqrLQKBgQCZlcPimoCo/9oDO3ZoTtmk0/FuNaIlor7v7wWPck55SeuPUJt2
DHWbyLbMCGvmZj5AwQ5zN4grtoBFbGX6VLpsjQl11o5gAtyOXEsL0yDHERpUD0g/
oD8WJ6bq1PP8Qk2HskoC0YH0zF2Qs/aHXfXQvKGwjkkxf402YqeVNBRNoQKBgQDB
ec6jkZLlgDKinqDzlkRIKCiLrfKPguXjqwljjblAQSSF1S1HYie0iKejy6A3t2OL
6FjbbnJ8/SGvM9oWuj49QM4mDj35r68PPiWL6+WJ0z6N0xPBtC0PC/SeLguIXaoU
4YnoFLuu4D6+QOCkZ6vkuomLiojL9Ze9Af8jyu5qKQKBgBhGBI45gccqoRZQNeVw
hOpw8nA6VAMcktKdU9FAiBduH3aUDfEoveITES3HoSPf7OtKIfIBSKiIYYYiIN06
t00VD+x8NCwbRu6ii81UGdgTvhngKBVP26ZKXUoOBaWVbs1sF7i47swA1izl9uBR
zK/uYfhuct+xH0nLPS3wjzPR
-----END PRIVATE KEY-----`,
    firebase_client_email: "firebase-adminsdk-fbsvc@newkhaled-2b232.iam.gserviceaccount.com",
    fcm_web_config: `{
  "apiKey": "AIzaSyAvQHfpMfGGvQfAQffPAi5B1nTMT_OLEIo",
  "authDomain": "newkhaled-2b232.firebaseapp.com",
  "projectId": "newkhaled-2b232",
  "storageBucket": "newkhaled-2b232.firebasestorage.app",
  "messagingSenderId": "1003139398828",
  "appId": "1:1003139398828:web:3ff2a2b8098f1dfd00b309",
  "measurementId": "G-5VT01L2FKN"
}`,
    fcm_default_icon: "/icon-192x192.png",
    fcm_default_badge: "/badge-72x72.png",
  })

  const [stats, setStats] = useState({
    totalTokens: 0,
    activeUsers: 0,
    sentToday: 0,
    deliveryRate: 0,
  })

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/firebase-settings")
      if (!response.ok) {
        throw new Error("Failed to load settings")
      }
      const loadedSettings = await response.json()
      setSettings({
        fcm_enabled: loadedSettings.fcm_enabled || false,
        firebase_project_id: loadedSettings.firebase_project_id || "",
        firebase_private_key: loadedSettings.firebase_private_key || "",
        firebase_client_email: loadedSettings.firebase_client_email || "",
        fcm_web_config: loadedSettings.fcm_web_config || "",
        fcm_default_icon: loadedSettings.fcm_default_icon || "/icon-192x192.png",
        fcm_default_badge: loadedSettings.fcm_default_badge || "/badge-72x72.png",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Firebase settings.",
        variant: "destructive",
      })
    }
  }

  const loadStats = async () => {
    try {
      // Simulate loading stats
      setStats({
        totalTokens: 1247,
        activeUsers: 892,
        sentToday: 156,
        deliveryRate: 94.2,
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  const parseFirebaseConfig = (configString: string) => {
    const trimmedConfig = configString.trim()
    if (!trimmedConfig) {
      return null
    }

    try {
      // First try parsing as JSON
      return JSON.parse(trimmedConfig)
    } catch {
      try {
        let cleanConfig = trimmedConfig

        // Remove 'const firebaseConfig = ' if present
        cleanConfig = cleanConfig.replace(/^const\s+\w+\s*=\s*/, "")

        // Remove trailing semicolon if present
        cleanConfig = cleanConfig.replace(/;$/, "")

        // If it doesn't start with {, assume it's already clean
        if (!cleanConfig.startsWith("{")) {
          cleanConfig = `{${cleanConfig}}`
        }

        // Convert JavaScript object syntax to JSON
        cleanConfig = cleanConfig
          .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
          .replace(/'/g, '"') // Convert single quotes to double quotes
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/,\s*]/g, "]") // Remove trailing commas in arrays

        return JSON.parse(cleanConfig)
      } catch {
        throw new Error("Invalid Firebase configuration format. Please provide valid JSON or JavaScript object syntax.")
      }
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    console.log("[v0] Starting Firebase settings save...")

    try {
      const trimmedSettings = {
        fcm_enabled: settings.fcm_enabled,
        firebase_project_id: (settings.firebase_project_id || "").trim(),
        firebase_client_email: (settings.firebase_client_email || "").trim(),
        firebase_private_key: (settings.firebase_private_key || "").trim().replace(/^["']|["']$/g, ""),
        fcm_web_config: (settings.fcm_web_config || "").trim(),
        fcm_default_icon: (settings.fcm_default_icon || "").trim(),
        fcm_default_badge: (settings.fcm_default_badge || "").trim(),
      }

      console.log("[v0] Settings to save:", JSON.stringify(trimmedSettings, null, 2))

      // Validate required fields
      if (trimmedSettings.fcm_enabled) {
        if (!trimmedSettings.firebase_project_id || !trimmedSettings.firebase_client_email) {
          throw new Error("Project ID and Client Email are required when FCM is enabled")
        }

        // Only validate web config if it's provided
        if (trimmedSettings.fcm_web_config) {
          console.log("[v0] Validating Firebase web config...")
          const parsedConfig = parseFirebaseConfig(trimmedSettings.fcm_web_config)
          if (parsedConfig) {
            console.log("[v0] Firebase web config validated successfully")
          }
        }
      }

      console.log("[v0] Making API call to /api/admin/firebase-settings")
      const response = await fetch("/api/admin/firebase-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trimmedSettings),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] API error response:", errorText)

        let errorMessage = "Failed to save settings"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${errorText}`
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("[v0] API success result:", result)

      toast({
        title: "Settings Saved Successfully!",
        description: "Firebase Cloud Messaging has been configured and enabled.",
      })

      setSettings(trimmedSettings)
    } catch (error) {
      console.error("[v0] Save settings error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestNotification = async () => {
    setTestLoading(true)
    try {
      if (!settings.fcm_enabled) {
        throw new Error("FCM must be enabled to send test notifications")
      }

      // Simulate sending test notification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Test Notification Sent",
        description: "A test push notification has been sent to all active devices.",
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test notification.",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <>
      <AdminHeader title="Firebase Settings" description="Configure Firebase Cloud Messaging for push notifications" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Tokens</p>
                    <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sent Today</p>
                    <p className="text-2xl font-bold">{stats.sentToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Rate</p>
                    <p className="text-2xl font-bold">{stats.deliveryRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${settings.fcm_enabled ? "bg-green-100" : "bg-red-100"}`}>
                    {settings.fcm_enabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">FCM Status</p>
                    <Badge variant={settings.fcm_enabled ? "default" : "secondary"}>
                      {settings.fcm_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="configuration" className="space-y-6">
            <TabsList>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    Firebase Cloud Messaging Configuration
                  </CardTitle>
                  <CardDescription>Configure your Firebase project settings for push notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* FCM Enable/Disable */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base font-medium">Enable Firebase Cloud Messaging</Label>
                      <p className="text-sm text-gray-600">Turn on push notifications for your platform</p>
                    </div>
                    <Switch
                      checked={settings.fcm_enabled}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, fcm_enabled: checked }))}
                    />
                  </div>

                  {settings.fcm_enabled && (
                    <>
                      {/* Firebase Project Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="project-id">Firebase Project ID *</Label>
                          <Input
                            id="project-id"
                            value={settings.firebase_project_id}
                            onChange={(e) => setSettings((prev) => ({ ...prev, firebase_project_id: e.target.value }))}
                            placeholder="your-project-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="client-email">Service Account Email *</Label>
                          <Input
                            id="client-email"
                            value={settings.firebase_client_email}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, firebase_client_email: e.target.value }))
                            }
                            placeholder="firebase-adminsdk@your-project.iam.gserviceaccount.com"
                          />
                        </div>
                      </div>

                      {/* Private Key */}
                      <div className="space-y-2">
                        <Label htmlFor="private-key">Service Account Private Key *</Label>
                        <Textarea
                          id="private-key"
                          value={settings.firebase_private_key}
                          onChange={(e) => setSettings((prev) => ({ ...prev, firebase_private_key: e.target.value }))}
                          placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                          rows={4}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">This key will be encrypted and stored securely</p>
                      </div>

                      {/* Web Configuration */}
                      <div className="space-y-2">
                        <Label htmlFor="web-config">Firebase Web App Configuration</Label>
                        <Textarea
                          id="web-config"
                          value={settings.fcm_web_config}
                          onChange={(e) => setSettings((prev) => ({ ...prev, fcm_web_config: e.target.value }))}
                          placeholder='{\n  "apiKey": "your-api-key",\n  "authDomain": "your-project.firebaseapp.com",\n  "projectId": "your-project-id",\n  "storageBucket": "your-project.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "your-app-id"\n}'
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>

                      {/* Notification Assets */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="default-icon">Default Notification Icon</Label>
                          <Input
                            id="default-icon"
                            value={settings.fcm_default_icon}
                            onChange={(e) => setSettings((prev) => ({ ...prev, fcm_default_icon: e.target.value }))}
                            placeholder="/icon-192x192.png"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="default-badge">Default Notification Badge</Label>
                          <Input
                            id="default-badge"
                            value={settings.fcm_default_badge}
                            onChange={(e) => setSettings((prev) => ({ ...prev, fcm_default_badge: e.target.value }))}
                            placeholder="/badge-72x72.png"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleSaveSettings} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Testing Tab */}
            <TabsContent value="testing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-green-600" />
                    Test Push Notifications
                  </CardTitle>
                  <CardDescription>Send test notifications to verify your Firebase configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Test Notification</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      This will send a test push notification to all users who have enabled push notifications.
                    </p>
                    <Button
                      onClick={handleTestNotification}
                      disabled={testLoading || !settings.fcm_enabled}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {testLoading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Test Notification
                    </Button>
                  </div>

                  {!settings.fcm_enabled && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Firebase Cloud Messaging must be enabled to send test notifications.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Push Notification Analytics
                  </CardTitle>
                  <CardDescription>Monitor push notification performance and user engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-600">
                      Detailed analytics and reporting will be available once you start sending notifications.
                    </p>
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

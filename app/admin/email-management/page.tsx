"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Mail, Settings, Plus, Edit, Send, BarChart3 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EmailProvider {
  id: number
  name: string
  type: string
  provider: string
  is_active: boolean
  is_primary: boolean
  priority: number
  config: any
  daily_limit: number
  monthly_limit: number
  current_daily_usage: number
  current_monthly_usage: number
  status: string
  last_error?: string
}

interface EmailTemplate {
  id: number
  name: string
  type: string
  subject: string
  html_content: string
  text_content: string
  variables: string[]
  is_active: boolean
  is_default: boolean
}

interface EmailStats {
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  delivery_rate: number
  open_rate: number
  click_rate: number
}

export default function EmailManagementPage() {
  const [providers, setProviders] = useState<EmailProvider[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [testEmail, setTestEmail] = useState("")

  const [newProvider, setNewProvider] = useState({
    name: "",
    type: "api",
    provider: "sendgrid",
    daily_limit: 1000,
    monthly_limit: 30000,
    api_key: "",
    host: "",
    port: 587,
    username: "",
    password: "",
  })

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    type: "user_onboarding",
    subject: "",
    html_content: "",
    text_content: "",
    variables: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const storedProviders = localStorage.getItem("email-providers")
      const storedTemplates = localStorage.getItem("email-templates")
      const storedStats = localStorage.getItem("email-stats")

      if (storedProviders) {
        setProviders(JSON.parse(storedProviders))
      } else {
        const defaultProviders: EmailProvider[] = [
          {
            id: 1,
            name: "SendGrid Production",
            type: "api",
            provider: "sendgrid",
            is_active: true,
            is_primary: true,
            priority: 1,
            config: { api_key: "SG.***" },
            daily_limit: 10000,
            monthly_limit: 300000,
            current_daily_usage: 2847,
            current_monthly_usage: 45623,
            status: "active",
          },
          {
            id: 2,
            name: "Amazon SES Backup",
            type: "api",
            provider: "ses",
            is_active: true,
            is_primary: false,
            priority: 2,
            config: { access_key: "AKIA***", secret_key: "***" },
            daily_limit: 5000,
            monthly_limit: 150000,
            current_daily_usage: 0,
            current_monthly_usage: 0,
            status: "active",
          },
          {
            id: 3,
            name: "Mailgun Marketing",
            type: "api",
            provider: "mailgun",
            is_active: false,
            is_primary: false,
            priority: 3,
            config: { api_key: "key-***", domain: "mg.example.com" },
            daily_limit: 1000,
            monthly_limit: 30000,
            current_daily_usage: 0,
            current_monthly_usage: 0,
            status: "suspended",
            last_error: "API key expired",
          },
          {
            id: 4,
            name: "Gmail SMTP",
            type: "smtp",
            provider: "gmail",
            is_active: true,
            is_primary: false,
            priority: 4,
            config: { host: "smtp.gmail.com", port: 587, username: "noreply@example.com" },
            daily_limit: 500,
            monthly_limit: 15000,
            current_daily_usage: 23,
            current_monthly_usage: 1247,
            status: "active",
          },
        ]
        setProviders(defaultProviders)
        localStorage.setItem("email-providers", JSON.stringify(defaultProviders))
      }

      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates))
      } else {
        const defaultTemplates: EmailTemplate[] = [
          {
            id: 1,
            name: "Welcome Email",
            type: "user_onboarding",
            subject: "Welcome to {{platform_name}}!",
            html_content: "<h1>Welcome {{user_name}}!</h1><p>Thanks for joining us.</p>",
            text_content: "Welcome {{user_name}}! Thanks for joining us.",
            variables: ["platform_name", "user_name", "verification_link"],
            is_active: true,
            is_default: true,
          },
          {
            id: 2,
            name: "Job Notification",
            type: "job_alert",
            subject: "New job posted: {{job_title}}",
            html_content: "<h2>{{job_title}}</h2><p>Budget: {{job_budget}}</p>",
            text_content: "New job: {{job_title}} - Budget: {{job_budget}}",
            variables: ["job_title", "job_budget", "job_description", "employer_name"],
            is_active: true,
            is_default: false,
          },
          {
            id: 3,
            name: "Payment Confirmation",
            type: "transaction",
            subject: "Payment received - ${{amount}}",
            html_content: "<h2>Payment Confirmed</h2><p>Amount: ${{amount}}</p>",
            text_content: "Payment confirmed: ${{amount}}",
            variables: ["amount", "transaction_id", "payment_method"],
            is_active: true,
            is_default: false,
          },
          {
            id: 4,
            name: "Password Reset",
            type: "security",
            subject: "Reset your password",
            html_content: "<h2>Password Reset</h2><p><a href='{{reset_link}}'>Click here</a></p>",
            text_content: "Reset your password: {{reset_link}}",
            variables: ["reset_link", "user_name", "expiry_time"],
            is_active: true,
            is_default: false,
          },
        ]
        setTemplates(defaultTemplates)
        localStorage.setItem("email-templates", JSON.stringify(defaultTemplates))
      }

      if (storedStats) {
        setStats(JSON.parse(storedStats))
      } else {
        const defaultStats: EmailStats = {
          total_sent: 127543,
          total_delivered: 125891,
          total_opened: 89124,
          total_clicked: 23456,
          delivery_rate: 98.7,
          open_rate: 70.8,
          click_rate: 18.4,
        }
        setStats(defaultStats)
        localStorage.setItem("email-stats", JSON.stringify(defaultStats))
      }
    } catch (error) {
      console.error("Failed to fetch email data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProviderToggle = async (providerId: number, field: string, value: boolean) => {
    try {
      const updatedProviders = providers.map((provider) => {
        if (provider.id === providerId) {
          if (field === "is_primary" && value) {
            setProviders((prev) => prev.map((p) => ({ ...p, is_primary: false })))
          }
          return { ...provider, [field]: value }
        }
        return provider
      })

      setProviders(updatedProviders)
      localStorage.setItem("email-providers", JSON.stringify(updatedProviders))
    } catch (error) {
      console.error("Failed to update provider:", error)
    }
  }

  const handleSendTestEmail = async (providerId: number) => {
    if (!testEmail) return

    try {
      const provider = providers.find((p) => p.id === providerId)
      if (!provider || !provider.is_active) {
        alert("Provider is not active")
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const updatedProviders = providers.map((p) => {
        if (p.id === providerId) {
          return {
            ...p,
            current_daily_usage: p.current_daily_usage + 1,
            current_monthly_usage: p.current_monthly_usage + 1,
          }
        }
        return p
      })

      setProviders(updatedProviders)
      localStorage.setItem("email-providers", JSON.stringify(updatedProviders))

      alert(`Test email sent successfully via ${provider.name}!`)
      setTestEmail("")
    } catch (error) {
      console.error("Failed to send test email:", error)
      alert("Failed to send test email")
    }
  }

  const regenerateData = () => {
    localStorage.removeItem("email-providers")
    localStorage.removeItem("email-templates")
    localStorage.removeItem("email-stats")
    fetchData()
  }

  const handleAddProvider = () => {
    const provider: EmailProvider = {
      id: Math.max(...providers.map((p) => p.id), 0) + 1,
      name: newProvider.name,
      type: newProvider.type,
      provider: newProvider.provider,
      is_active: true,
      is_primary: false,
      priority: providers.length + 1,
      config:
        newProvider.type === "api"
          ? { api_key: newProvider.api_key }
          : {
              host: newProvider.host,
              port: newProvider.port,
              username: newProvider.username,
              password: newProvider.password,
            },
      daily_limit: newProvider.daily_limit,
      monthly_limit: newProvider.monthly_limit,
      current_daily_usage: 0,
      current_monthly_usage: 0,
      status: "active",
    }

    const updatedProviders = [...providers, provider]
    setProviders(updatedProviders)
    localStorage.setItem("email-providers", JSON.stringify(updatedProviders))

    setNewProvider({
      name: "",
      type: "api",
      provider: "sendgrid",
      daily_limit: 1000,
      monthly_limit: 30000,
      api_key: "",
      host: "",
      port: 587,
      username: "",
      password: "",
    })
    setShowProviderDialog(false)
  }

  const handleAddTemplate = () => {
    const template: EmailTemplate = {
      id: Math.max(...templates.map((t) => t.id), 0) + 1,
      name: newTemplate.name,
      type: newTemplate.type,
      subject: newTemplate.subject,
      html_content: newTemplate.html_content,
      text_content: newTemplate.text_content,
      variables: newTemplate.variables
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v),
      is_active: true,
      is_default: false,
    }

    const updatedTemplates = [...templates, template]
    setTemplates(updatedTemplates)
    localStorage.setItem("email-templates", JSON.stringify(updatedTemplates))

    setNewTemplate({
      name: "",
      type: "user_onboarding",
      subject: "",
      html_content: "",
      text_content: "",
      variables: "",
    })
    setShowTemplateDialog(false)
  }

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    return limit > 0 ? Math.round((current / limit) * 100) : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">Configure email providers and manage templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={regenerateData}>
            🔄 Regenerate Data
          </Button>
          <Button onClick={() => setShowProviderDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.delivery_rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open_rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.click_rate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Email Providers</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <Badge className={getProviderStatusColor(provider.status)}>{provider.status}</Badge>
                      {provider.is_primary && <Badge variant="outline">Primary</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={provider.is_active}
                        onCheckedChange={(checked) => handleProviderToggle(provider.id, "is_active", checked)}
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {provider.type.toUpperCase()} • {provider.provider}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {provider.last_error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{provider.last_error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Daily Usage</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${getUsagePercentage(provider.current_daily_usage, provider.daily_limit)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {provider.current_daily_usage} / {provider.daily_limit}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Monthly Usage</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${getUsagePercentage(provider.current_monthly_usage, provider.monthly_limit)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {provider.current_monthly_usage} / {provider.monthly_limit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSendTestEmail(provider.id)}
                      disabled={!testEmail || !provider.is_active}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.type} • {template.subject}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {template.is_default && <Badge variant="outline">Default</Badge>}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Variables</Label>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue Status</CardTitle>
              <CardDescription>Monitor email delivery status and queue health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Email queue monitoring will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Email Provider</DialogTitle>
            <DialogDescription>Configure a new email service provider</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider-name">Provider Name</Label>
                <Input
                  id="provider-name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                  placeholder="e.g., SendGrid Production"
                />
              </div>
              <div>
                <Label htmlFor="provider-type">Type</Label>
                <Select
                  value={newProvider.type}
                  onValueChange={(value) => setNewProvider({ ...newProvider, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="smtp">SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider-service">Service</Label>
                <Select
                  value={newProvider.provider}
                  onValueChange={(value) => setNewProvider({ ...newProvider, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="ses">Amazon SES</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="resend">Resend</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="daily-limit">Daily Limit</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  value={newProvider.daily_limit}
                  onChange={(e) =>
                    setNewProvider({ ...newProvider, daily_limit: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="monthly-limit">Monthly Limit</Label>
              <Input
                id="monthly-limit"
                type="number"
                value={newProvider.monthly_limit}
                onChange={(e) =>
                  setNewProvider({ ...newProvider, monthly_limit: Number.parseInt(e.target.value) || 0 })
                }
              />
            </div>

            {newProvider.type === "api" ? (
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={newProvider.api_key}
                  onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                  placeholder="Enter API key"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={newProvider.host}
                    onChange={(e) => setNewProvider({ ...newProvider, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={newProvider.port}
                    onChange={(e) => setNewProvider({ ...newProvider, port: Number.parseInt(e.target.value) || 587 })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={newProvider.username}
                    onChange={(e) => setNewProvider({ ...newProvider, username: e.target.value })}
                    placeholder="your-email@domain.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={newProvider.password}
                    onChange={(e) => setNewProvider({ ...newProvider, password: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddProvider} disabled={!newProvider.name}>
              Add Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Email Template</DialogTitle>
            <DialogDescription>Create a new email template</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div>
                <Label htmlFor="template-type">Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_onboarding">User Onboarding</SelectItem>
                    <SelectItem value="job_alert">Job Alert</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={newTemplate.subject}
                onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                placeholder="e.g., Welcome to {{platform_name}}!"
              />
            </div>

            <div>
              <Label htmlFor="template-html">HTML Content</Label>
              <Textarea
                id="template-html"
                value={newTemplate.html_content}
                onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                placeholder="<h1>Welcome {{user_name}}!</h1><p>Thanks for joining us.</p>"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="template-text">Text Content</Label>
              <Textarea
                id="template-text"
                value={newTemplate.text_content}
                onChange={(e) => setNewTemplate({ ...newTemplate, text_content: e.target.value })}
                placeholder="Welcome {{user_name}}! Thanks for joining us."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="template-variables">Variables (comma-separated)</Label>
              <Input
                id="template-variables"
                value={newTemplate.variables}
                onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                placeholder="user_name, platform_name, verification_link"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate} disabled={!newTemplate.name || !newTemplate.subject}>
              Add Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

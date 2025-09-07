"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Save, Users } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const defaultReferralSettings = {
  // Commission Settings
  firstDepositCommission: 5.0,
  firstDepositCommissionEnabled: true,
  firstPurchaseCommission: 1.0,
  firstPurchaseCommissionEnabled: true,
  firstPurchasePeriodValue: 3,
  firstPurchasePeriodUnit: "days",
  microjobWorkBonus: 2.0,
  microjobWorkBonusEnabled: true,
  signUpBonus: 0.005,
  signUpBonusEnabled: true,
  lifetimeCommissionMin: 0.05,
  lifetimeCommissionMax: 20.0,
  lifetimeCommissionEnabled: true,

  // Page Content
  referPageTitle: "Vip Refer",
  referPageText: `* Every Successfully Vip Refer For You Earn $

* To Become a Vip Refer * Refer Have To Complete 3 Job ✅ Or

* Refer have to Deposit Any Amount ✅

* Every refers and Vip Refer from You get lifetime commission it's can be ( 0.05-20% )✅`,

  // System Settings
  status: true,
  requireJobCompletion: true,
  requireDeposit: false,
  minJobsForVip: 3,
  createdAt: "2021-10-07 17:56:00",
}

export default function ReferralSettingsPage() {
  const { toast } = useToast()
  const [referralSettings, setReferralSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/admin/referral-settings")
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to fetch settings")
        }

        const data = await response.json()
        setReferralSettings(data)
        setIsInitialized(true)
      } catch (error) {
        console.error("Error loading referral data:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load referral settings from database"
        toast({
          title: "Database Setup Required",
          description: errorMessage.includes("does not exist")
            ? "The referral_settings table doesn't exist. Please run the database setup scripts first."
            : errorMessage,
          variant: "destructive",
        })
        setReferralSettings(defaultReferralSettings)
        setIsInitialized(true)
      }
    }

    loadData()
  }, [toast])

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/referral-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(referralSettings),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to save settings")
      }

      const savedSettings = await response.json()
      setReferralSettings(savedSettings)

      toast({
        title: "Settings Saved",
        description: "All referral settings have been updated and saved successfully.",
      })
    } catch (error) {
      console.error("Error saving referral settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save referral settings to database"
      toast({
        title: "Database Setup Required",
        description: errorMessage.includes("does not exist")
          ? "The referral_settings table doesn't exist. Please run the database setup scripts first."
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateReferralSettings = (updates: any) => {
    setReferralSettings({ ...referralSettings, ...updates })
  }

  const getTimePeriodText = () => {
    const value = referralSettings.firstPurchasePeriodValue || 3
    const unit = referralSettings.firstPurchasePeriodUnit || "days"
    return `${value} ${unit}`
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Referral Settings</h1>
          <p className="text-gray-600 mt-2">Configure commission rates and system behavior</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-red-600 border-red-200 px-4 py-2">
            <Users className="w-4 h-4 mr-2" />
            Admin Panel
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-bold text-gray-900">{referralSettings.status ? "Active" : "Inactive"}</p>
              </div>
              <div className={`w-8 h-8 rounded-full ${referralSettings.status ? "bg-green-500" : "bg-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Types</p>
                <p className="text-2xl font-bold text-gray-900">6</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">Commission & System Configuration</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Configure commission rates and system behavior</p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Commission Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Commission Settings</h3>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Financial
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium">First Deposit Commission (%)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Commission earned when referral makes their first deposit
                  </p>
                  <Input
                    type="number"
                    step="0.1"
                    value={referralSettings.firstDepositCommission}
                    onChange={(e) =>
                      updateReferralSettings({
                        firstDepositCommission: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={!referralSettings.firstDepositCommissionEnabled}
                    className={!referralSettings.firstDepositCommissionEnabled ? "opacity-50" : ""}
                  />
                </div>
                <Switch
                  checked={referralSettings.firstDepositCommissionEnabled}
                  onCheckedChange={(checked) => updateReferralSettings({ firstDepositCommissionEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium">First Purchase Commission ({getTimePeriodText()}) (%)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Commission earned when referral makes first marketplace purchase within {getTimePeriodText()}
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-400">Time Period</Label>
                        <Input
                          type="number"
                          min="1"
                          value={referralSettings.firstPurchasePeriodValue || 3}
                          onChange={(e) =>
                            updateReferralSettings({
                              firstPurchasePeriodValue: Number.parseInt(e.target.value) || 1,
                            })
                          }
                          disabled={!referralSettings.firstPurchaseCommissionEnabled}
                          className={!referralSettings.firstPurchaseCommissionEnabled ? "opacity-50" : ""}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400">Unit</Label>
                        <Select
                          value={referralSettings.firstPurchasePeriodUnit || "days"}
                          onValueChange={(value) => updateReferralSettings({ firstPurchasePeriodUnit: value })}
                          disabled={!referralSettings.firstPurchaseCommissionEnabled}
                        >
                          <SelectTrigger
                            className={!referralSettings.firstPurchaseCommissionEnabled ? "opacity-50" : ""}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Commission %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={referralSettings.firstPurchaseCommission}
                        onChange={(e) =>
                          updateReferralSettings({
                            firstPurchaseCommission: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={!referralSettings.firstPurchaseCommissionEnabled}
                        className={!referralSettings.firstPurchaseCommissionEnabled ? "opacity-50" : ""}
                      />
                    </div>
                  </div>
                </div>
                <Switch
                  checked={referralSettings.firstPurchaseCommissionEnabled}
                  onCheckedChange={(checked) => updateReferralSettings({ firstPurchaseCommissionEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium">Microjob Work Bonus (%)</Label>
                  <p className="text-xs text-gray-500 mb-2">Commission earned from referral's microjob earnings</p>
                  <Input
                    type="number"
                    step="0.1"
                    value={referralSettings.microjobWorkBonus}
                    onChange={(e) =>
                      updateReferralSettings({
                        microjobWorkBonus: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={!referralSettings.microjobWorkBonusEnabled}
                    className={!referralSettings.microjobWorkBonusEnabled ? "opacity-50" : ""}
                  />
                </div>
                <Switch
                  checked={referralSettings.microjobWorkBonusEnabled}
                  onCheckedChange={(checked) => updateReferralSettings({ microjobWorkBonusEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium text-green-800">Sign-up Bonus (Fixed Amount $)</Label>
                  <p className="text-xs text-green-600 mb-2">
                    Fixed dollar amount given to referrer when someone signs up with their referral link (no other
                    requirements)
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">$</span>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={referralSettings.signUpBonus}
                      onChange={(e) =>
                        updateReferralSettings({
                          signUpBonus: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={!referralSettings.signUpBonusEnabled}
                      className={`${!referralSettings.signUpBonusEnabled ? "opacity-50" : ""} bg-white`}
                      placeholder="0.005"
                    />
                  </div>
                  <p className="text-xs text-green-500 mt-1">
                    💡 This is paid immediately when someone signs up - no deposit or job completion required
                  </p>
                </div>
                <Switch
                  checked={referralSettings.signUpBonusEnabled}
                  onCheckedChange={(checked) => updateReferralSettings({ signUpBonusEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 mr-4">
                  <Label className="text-sm font-medium">Lifetime Commission Range (%)</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Ongoing percentage commission from ALL future activities of referred users (jobs, purchases,
                    deposits, etc.)
                  </p>
                  <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-3">
                    <strong>How it works:</strong> You earn a percentage (between min-max range) of everything your
                    referred users do on the platform for their entire lifetime. This includes their job earnings,
                    marketplace purchases, and any other transactions.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-400">Min % (e.g., 0.05% = $0.05 per $100)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={referralSettings.lifetimeCommissionMin}
                        onChange={(e) =>
                          updateReferralSettings({
                            lifetimeCommissionMin: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={!referralSettings.lifetimeCommissionEnabled}
                        className={!referralSettings.lifetimeCommissionEnabled ? "opacity-50" : ""}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Max % (e.g., 20% = $20 per $100)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={referralSettings.lifetimeCommissionMax}
                        onChange={(e) =>
                          updateReferralSettings({
                            lifetimeCommissionMax: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        disabled={!referralSettings.lifetimeCommissionEnabled}
                        className={!referralSettings.lifetimeCommissionEnabled ? "opacity-50" : ""}
                      />
                    </div>
                  </div>
                </div>
                <Switch
                  checked={referralSettings.lifetimeCommissionEnabled}
                  onCheckedChange={(checked) => updateReferralSettings({ lifetimeCommissionEnabled: checked })}
                />
              </div>
            </div>
          </div>

          {/* System Behavior */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">System Behavior</h3>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Rules
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Referral System Status</Label>
                  <p className="text-xs text-gray-500">Enable or disable the entire referral system</p>
                </div>
                <Switch
                  checked={referralSettings.status}
                  onCheckedChange={(checked) => updateReferralSettings({ status: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Require Job Completion</Label>
                  <p className="text-xs text-gray-500">Require job completion for VIP status</p>
                </div>
                <Switch
                  checked={referralSettings.requireJobCompletion}
                  onCheckedChange={(checked) => updateReferralSettings({ requireJobCompletion: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Require Deposit</Label>
                  <p className="text-xs text-gray-500">Require deposit for VIP status</p>
                </div>
                <Switch
                  checked={referralSettings.requireDeposit}
                  onCheckedChange={(checked) => updateReferralSettings({ requireDeposit: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Minimum Jobs for VIP</Label>
                <Input
                  type="number"
                  min="1"
                  value={referralSettings.minJobsForVip}
                  onChange={(e) =>
                    updateReferralSettings({
                      minJobsForVip: Number.parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Page Content</h3>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                Display
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Referral Page Title</Label>
                <Input
                  value={referralSettings.referPageTitle}
                  onChange={(e) =>
                    updateReferralSettings({
                      referPageTitle: e.target.value,
                    })
                  }
                  placeholder="Enter page title"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Referral Page Content</Label>
                <Textarea
                  rows={10}
                  value={referralSettings.referPageText}
                  onChange={(e) =>
                    updateReferralSettings({
                      referPageText: e.target.value,
                    })
                  }
                  placeholder="Enter the content that will be displayed on the referral page"
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

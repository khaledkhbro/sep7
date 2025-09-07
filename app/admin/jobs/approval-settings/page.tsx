"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, ArrowLeft, Clock } from "lucide-react"
import { toast } from "sonner"

type TimePeriod = {
  id: string
  label: string
  value: number
  days: number
  hours: number
  minutes: number
}

export default function ApprovalSettingsPage() {
  const router = useRouter()
  const [customTimePeriods, setCustomTimePeriods] = useState<TimePeriod[]>([])
  const [defaultTimeOptions, setDefaultTimeOptions] = useState<TimePeriod[]>([])
  const [defaultManualApprovalDays, setDefaultManualApprovalDays] = useState(1)
  const [allowManualApprovalTimeSelection, setAllowManualApprovalTimeSelection] = useState(true)
  const [loadingApprovalSettings, setLoadingApprovalSettings] = useState(false)
  const [loadingDefaultDays, setLoadingDefaultDays] = useState(false)

  const [isAddingTimePeriod, setIsAddingTimePeriod] = useState(false)
  const [newTimePeriod, setNewTimePeriod] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    label: "",
  })

  const [isAddingDefaultOption, setIsAddingDefaultOption] = useState(false)
  const [newDefaultOption, setNewDefaultOption] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    label: "",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const storedDefaults = localStorage.getItem("admin_default_time_options")
      if (storedDefaults) {
        const defaults = JSON.parse(storedDefaults)
        setDefaultTimeOptions(defaults)
      } else {
        const initialDefaults: TimePeriod[] = [
          { id: "test", label: "1 minute (TEST)", value: 0.000694, days: 0, hours: 0, minutes: 1 },
          { id: "1day", label: "1 day", value: 1, days: 1, hours: 0, minutes: 0 },
          { id: "2days", label: "2 days", value: 2, days: 2, hours: 0, minutes: 0 },
          { id: "3days", label: "3 days", value: 3, days: 3, hours: 0, minutes: 0 },
          { id: "4days", label: "4 days", value: 4, days: 4, hours: 0, minutes: 0 },
          { id: "5days", label: "5 days", value: 5, days: 5, hours: 0, minutes: 0 },
          { id: "6days", label: "6 days", value: 6, days: 6, hours: 0, minutes: 0 },
          { id: "7days", label: "7 days", value: 7, days: 7, hours: 0, minutes: 0 },
        ]
        setDefaultTimeOptions(initialDefaults)
        localStorage.setItem("admin_default_time_options", JSON.stringify(initialDefaults))
      }

      const stored = localStorage.getItem("admin_custom_time_periods")
      if (stored) {
        const periods = JSON.parse(stored)
        setCustomTimePeriods(periods)
      }

      const response = await fetch("/api/admin/approval-settings")
      if (response.ok) {
        const settings = await response.json()
        setAllowManualApprovalTimeSelection(settings.allowManualApprovalTimeSelection)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveCustomTimePeriods = (periods: TimePeriod[]) => {
    try {
      localStorage.setItem("admin_custom_time_periods", JSON.stringify(periods))
      setCustomTimePeriods(periods)
    } catch (error) {
      console.error("Failed to save custom time periods:", error)
    }
  }

  const addCustomTimePeriod = () => {
    console.log("[v0] Adding custom time period:", newTimePeriod)

    const { days, hours, minutes, label } = newTimePeriod

    const totalDays = days + hours / 24 + minutes / (24 * 60)
    console.log("[v0] Calculated total days:", totalDays)

    if (totalDays < 0.000694 || totalDays > 30) {
      console.log("[v0] Validation failed: time period out of range")
      toast.error("Time period must be between 1 minute and 30 days")
      return
    }

    if (!label.trim()) {
      console.log("[v0] Validation failed: no label provided")
      toast.error("Please provide a label for the time period")
      return
    }

    if (totalDays <= 0) {
      console.log("[v0] Validation failed: zero time period")
      toast.error("Please set a time period greater than 0")
      return
    }

    const allOptions = [...defaultTimeOptions, ...customTimePeriods]
    const exists = allOptions.some((p) => {
      const diff = Math.abs(p.value - totalDays)
      console.log("[v0] Checking duplicate against:", p.label, "diff:", diff)
      return diff < 0.000001
    })

    if (exists) {
      console.log("[v0] Validation failed: duplicate time period")
      toast.error("This time period already exists")
      return
    }

    const newPeriod: TimePeriod = {
      id: Date.now().toString(),
      label: label.trim(),
      value: totalDays,
      days,
      hours,
      minutes,
    }

    console.log("[v0] Creating new period:", newPeriod)

    const updatedPeriods = [...customTimePeriods, newPeriod].sort((a, b) => a.value - b.value)
    saveCustomTimePeriods(updatedPeriods)

    setNewTimePeriod({ days: 0, hours: 0, minutes: 0, label: "" })
    setIsAddingTimePeriod(false)

    console.log("[v0] Successfully added custom time period")
    toast.success(`Added custom time period: ${label}`)
  }

  const deleteCustomTimePeriod = (id: string) => {
    const updatedPeriods = customTimePeriods.filter((p) => p.id !== id)
    saveCustomTimePeriods(updatedPeriods)
    toast.success("Custom time period deleted")
  }

  const saveDefaultTimeOptions = (options: TimePeriod[]) => {
    try {
      localStorage.setItem("admin_default_time_options", JSON.stringify(options))
      setDefaultTimeOptions(options)
    } catch (error) {
      console.error("Failed to save default time options:", error)
    }
  }

  const addDefaultTimeOption = () => {
    console.log("[v0] Adding default time option:", newDefaultOption)

    const { days, hours, minutes, label } = newDefaultOption

    const totalDays = days + hours / 24 + minutes / (24 * 60)
    console.log("[v0] Calculated total days:", totalDays)

    if (totalDays < 0.000694 || totalDays > 30) {
      console.log("[v0] Validation failed: time period out of range")
      toast.error("Time period must be between 1 minute and 30 days")
      return
    }

    if (!label.trim()) {
      console.log("[v0] Validation failed: no label provided")
      toast.error("Please provide a label for the time period")
      return
    }

    if (totalDays <= 0) {
      console.log("[v0] Validation failed: zero time period")
      toast.error("Please set a time period greater than 0")
      return
    }

    const allOptions = [...defaultTimeOptions, ...customTimePeriods]
    const exists = allOptions.some((p) => {
      const diff = Math.abs(p.value - totalDays)
      console.log("[v0] Checking duplicate against:", p.label, "diff:", diff)
      return diff < 0.000001
    })

    if (exists) {
      console.log("[v0] Validation failed: duplicate time period")
      toast.error("This time period already exists")
      return
    }

    const newOption: TimePeriod = {
      id: Date.now().toString(),
      label: label.trim(),
      value: totalDays,
      days,
      hours,
      minutes,
    }

    console.log("[v0] Creating new option:", newOption)

    const updatedOptions = [...defaultTimeOptions, newOption].sort((a, b) => a.value - b.value)
    saveDefaultTimeOptions(updatedOptions)

    setNewDefaultOption({ days: 0, hours: 0, minutes: 0, label: "" })
    setIsAddingDefaultOption(false)

    console.log("[v0] Successfully added default time option")
    toast.success(`Added default time option: ${label}`)
  }

  const deleteDefaultTimeOption = (id: string) => {
    const updatedOptions = defaultTimeOptions.filter((p) => p.id !== id)
    saveDefaultTimeOptions(updatedOptions)
    toast.success("Default time option deleted")
  }

  const handleDefaultManualApprovalDaysChange = async (days: number) => {
    if (days < 0.000694 || days > 30) {
      toast.error("Default approval days must be between 1 minute and 30 days")
      return
    }

    setLoadingDefaultDays(true)
    try {
      localStorage.setItem("admin_default_manual_approval_days", days.toString())
      setDefaultManualApprovalDays(days)

      const displayText = days === 0.000694 ? "1 minute (TEST MODE)" : `${days} day${days > 1 ? "s" : ""}`
      toast.success(`Default manual approval period set to ${displayText}`)
    } catch (error) {
      console.error("Error updating default manual approval days:", error)
      toast.error("Failed to update default approval days")
    } finally {
      setLoadingDefaultDays(false)
    }
  }

  const handleManualApprovalTimeSelectionToggle = async (enabled: boolean) => {
    setLoadingApprovalSettings(true)
    try {
      const response = await fetch("/api/admin/approval-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allowManualApprovalTimeSelection: enabled,
        }),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setAllowManualApprovalTimeSelection(updatedSettings.allowManualApprovalTimeSelection)
        toast.success(
          enabled
            ? "Users can now customize manual approval time periods"
            : "Manual approval time selection disabled - users will use default period",
        )
      } else {
        throw new Error("Failed to update approval settings")
      }
    } catch (error) {
      console.error("Error updating manual approval time selection setting:", error)
      toast.error("Failed to update approval time selection setting")
    } finally {
      setLoadingApprovalSettings(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push("/admin/jobs")} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manual Approval Settings</h1>
          <p className="text-gray-600">Configure default approval times and manage time period options</p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Default Manual Approval</span>
          </CardTitle>
          <CardDescription>Set the default review period for manual approval jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Default Review Period</h3>
              <p className="text-sm text-gray-600">
                Current default:{" "}
                {defaultManualApprovalDays === 0.000694
                  ? "1 minute (TEST)"
                  : `${defaultManualApprovalDays} day${defaultManualApprovalDays > 1 ? "s" : ""}`}
              </p>
            </div>
            <Select
              value={defaultManualApprovalDays.toString()}
              onValueChange={(value) => handleDefaultManualApprovalDaysChange(Number.parseFloat(value))}
              disabled={loadingDefaultDays}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {defaultTimeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
                {customTimePeriods.map((period) => (
                  <SelectItem key={period.id} value={period.value.toString()}>
                    {period.label} (Custom)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Allow User Time Selection</span>
                <p className="text-xs text-gray-500 mt-1">
                  {allowManualApprovalTimeSelection
                    ? "Users can customize manual approval time periods when creating jobs"
                    : "Users must use the default approval period set above"}
                </p>
              </div>
              <Switch
                checked={allowManualApprovalTimeSelection}
                onCheckedChange={handleManualApprovalTimeSelectionToggle}
                disabled={loadingApprovalSettings}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Time Options</CardTitle>
          <CardDescription>Manage standard time periods available to users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Standard Time Periods</h3>
              <p className="text-sm text-gray-600">Add or remove standard time period options</p>
            </div>
            <Button
              onClick={() => setIsAddingDefaultOption(!isAddingDefaultOption)}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          {isAddingDefaultOption && (
            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Time Period</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Days</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={newDefaultOption.days}
                        onChange={(e) =>
                          setNewDefaultOption((prev) => ({
                            ...prev,
                            days: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={newDefaultOption.hours}
                        onChange={(e) =>
                          setNewDefaultOption((prev) => ({
                            ...prev,
                            hours: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={newDefaultOption.minutes}
                        onChange={(e) =>
                          setNewDefaultOption((prev) => ({
                            ...prev,
                            minutes: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Display Label</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 1 minute (TEST), 1 day, 2 days"
                    value={newDefaultOption.label}
                    onChange={(e) =>
                      setNewDefaultOption((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Total: {(() => {
                      const total =
                        newDefaultOption.days + newDefaultOption.hours / 24 + newDefaultOption.minutes / (24 * 60)
                      if (total === 0) return "0 minutes"
                      if (total < 1) return `${Math.round(total * 24 * 60)} minutes`
                      if (total < 2) return `${(total * 24).toFixed(1)} hours`
                      return `${total.toFixed(2)} days`
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingDefaultOption(false)
                        setNewDefaultOption({ days: 0, hours: 0, minutes: 0, label: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addDefaultTimeOption} className="bg-blue-600 hover:bg-blue-700">
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {defaultTimeOptions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Available Default Options</h4>
                {defaultTimeOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDefaultManualApprovalDaysChange(option.value)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1"
                      >
                        Set as Default
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteDefaultTimeOption(option.id)}
                        className="text-red-600 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No default time options available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Time Options</CardTitle>
          <CardDescription>Manage custom time periods that users can choose from when creating jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Custom Time Periods</h3>
              <p className="text-sm text-gray-600">Add custom time periods for users to choose from</p>
            </div>
            <Button
              onClick={() => setIsAddingTimePeriod(!isAddingTimePeriod)}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Period
            </Button>
          </div>

          {isAddingTimePeriod && (
            <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Time Period</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Days</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={newTimePeriod.days}
                        onChange={(e) =>
                          setNewTimePeriod((prev) => ({
                            ...prev,
                            days: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={newTimePeriod.hours}
                        onChange={(e) =>
                          setNewTimePeriod((prev) => ({
                            ...prev,
                            hours: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Minutes</Label>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={newTimePeriod.minutes}
                        onChange={(e) =>
                          setNewTimePeriod((prev) => ({
                            ...prev,
                            minutes: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Display Label</Label>
                  <Input
                    type="text"
                    placeholder="e.g., 12 Hours, 2.5 Days, etc."
                    value={newTimePeriod.label}
                    onChange={(e) =>
                      setNewTimePeriod((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Total: {(() => {
                      const total = newTimePeriod.days + newTimePeriod.hours / 24 + newTimePeriod.minutes / (24 * 60)
                      if (total === 0) return "0 minutes"
                      if (total < 1) return `${Math.round(total * 24 * 60)} minutes`
                      if (total < 2) return `${(total * 24).toFixed(1)} hours`
                      return `${total.toFixed(2)} days`
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingTimePeriod(false)
                        setNewTimePeriod({ days: 0, hours: 0, minutes: 0, label: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addCustomTimePeriod} className="bg-blue-600 hover:bg-blue-700">
                      Add Option
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {customTimePeriods.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Available Options</h4>
                {customTimePeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-700">{period.label}</span>
                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDefaultManualApprovalDaysChange(period.value)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1"
                      >
                        Set as Default
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomTimePeriod(period.id)}
                        className="text-red-600 hover:bg-red-50 p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Time Periods</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add custom time periods for users to choose from when creating jobs
                </p>
                <Button
                  onClick={() => setIsAddingTimePeriod(true)}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Time Period
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

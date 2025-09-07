"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Settings,
  Zap,
  Clock,
  Percent,
  Globe,
  Camera,
  Crown,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { approveJob, rejectJob, getJobStatusColor, getJobStatusLabel, getAllJobs } from "@/lib/jobs"
import { getPlatformFeeSettings, updatePlatformFeeSettings, type PlatformFeeSettings } from "@/lib/platform-fee"
import type { Job } from "@/types"

type TimePeriod = {
  id: string
  label: string
  value: number
  days: number
  hours: number
  minutes: number
}

export default function AdminJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null)
  const [approvalReason, setApprovalReason] = useState("")
  const [autoJobApprovalEnabled, setAutoJobApprovalEnabled] = useState(false)
  const [loadingAutoJobApproval, setLoadingAutoJobApproval] = useState(false)
  const [instantApprovalEnabled, setInstantApprovalEnabled] = useState(false)
  const [loadingInstantApproval, setLoadingInstantApproval] = useState(false)
  const [defaultManualApprovalDays, setDefaultManualApprovalDays] = useState(3)
  const [loadingDefaultDays, setLoadingDefaultDays] = useState(false)
  const [allowManualApprovalTimeSelection, setAllowManualApprovalTimeSelection] = useState(true)
  const [loadingApprovalSettings, setLoadingApprovalSettings] = useState(false)
  const [reservationSettings, setReservationSettings] = useState<any>(null)
  const [loadingReservationSettings, setLoadingReservationSettings] = useState(false)
  const [reservationTimeValue, setReservationTimeValue] = useState(30)
  const [reservationTimeUnit, setReservationTimeUnit] = useState<"minutes" | "hours">("minutes")
  const [countryRestrictionsEnabled, setCountryRestrictionsEnabled] = useState(true)
  const [loadingCountryRestrictions, setLoadingCountryRestrictions] = useState(false)
  const [thumbnailEnabled, setThumbnailEnabled] = useState(true)
  const [loadingThumbnailSettings, setLoadingThumbnailSettings] = useState(false)

  const [customTimePeriods, setCustomTimePeriods] = useState<TimePeriod[]>([])
  const [isAddingTimePeriod, setIsAddingTimePeriod] = useState(false)
  const [newTimePeriod, setNewTimePeriod] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    label: "",
  })

  const [platformFeeSettings, setPlatformFeeSettings] = useState<PlatformFeeSettings | null>(null)
  const [loadingPlatformFee, setLoadingPlatformFee] = useState(false)

  const [vipJobs, setVipJobs] = useState<Set<string>>(new Set())
  const [loadingVipJobs, setLoadingVipJobs] = useState(false)

  const loadJobs = async () => {
    try {
      const allJobs = await getAllJobs()
      console.log("[v0] Loaded jobs from storage:", allJobs)
      if (allJobs.length === 0) {
        console.log("[v0] Starting with empty job list - ready for real user submissions")
      }
      setJobs(allJobs)
    } catch (error) {
      console.error("[v0] Error loading jobs:", error)
      toast.error("Failed to load jobs")
    } finally {
      setLoading(false)
    }
  }

  const loadAutoApprovalSetting = async () => {
    try {
      const jobSetting = localStorage.getItem("admin_auto_job_approval_enabled")
      setAutoJobApprovalEnabled(jobSetting === "true")

      const instantSetting = localStorage.getItem("admin_instant_approval_enabled")
      setInstantApprovalEnabled(instantSetting === "true")

      const defaultDaysSetting = localStorage.getItem("admin_default_manual_approval_days")
      setDefaultManualApprovalDays(defaultDaysSetting ? Number.parseFloat(defaultDaysSetting) : 3)
    } catch (error) {
      console.error("[v0] Error loading auto-approval setting:", error)
    }
  }

  const loadApprovalSettings = async () => {
    try {
      const response = await fetch("/api/admin/approval-settings")
      if (response.ok) {
        const settings = await response.json()
        setAllowManualApprovalTimeSelection(settings.allowManualApprovalTimeSelection)
        console.log("[v0] 🔧 Loaded approval settings:", settings)
      }
    } catch (error) {
      console.error("[v0] Error loading approval settings:", error)
    }
  }

  const loadPlatformFeeSettings = async () => {
    try {
      const settings = await getPlatformFeeSettings()
      setPlatformFeeSettings(settings)
    } catch (error) {
      console.error("[v0] Error loading platform fee settings:", error)
      // Set default settings if loading fails
      setPlatformFeeSettings({
        id: "default",
        enabled: true,
        percentage: 5.0,
        fixed_fee: 0.0,
        minimum_fee: 0.0,
        maximum_fee: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  const loadCustomTimePeriods = () => {
    try {
      const stored = localStorage.getItem("admin_custom_time_periods")
      if (stored) {
        const periods = JSON.parse(stored)
        setCustomTimePeriods(periods)
        console.log("[v0] 🔧 Loaded custom time periods:", periods)
      }
    } catch (error) {
      console.error("Failed to load custom time periods:", error)
    }
  }

  const loadReservationSettings = async () => {
    try {
      const response = await fetch("/api/admin/reservation-settings")
      if (response.ok) {
        const settings = await response.json()
        setReservationSettings(settings)
        const minutes = settings.defaultReservationMinutes || 60
        if (minutes >= 60 && minutes % 60 === 0) {
          setReservationTimeUnit("hours")
          setReservationTimeValue(minutes / 60)
        } else {
          setReservationTimeUnit("minutes")
          setReservationTimeValue(minutes)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading reservation settings:", error)
      // Set default settings if loading fails
      setReservationSettings({
        id: "default",
        isEnabled: false,
        defaultReservationHours: 1,
        defaultReservationMinutes: 60,
        maxConcurrentReservations: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setReservationTimeUnit("hours")
      setReservationTimeValue(1)
    }
  }

  const loadVipJobs = async () => {
    try {
      console.log("[v0] Loading VIP jobs...")
      const response = await fetch("/api/admin/vip-jobs")
      console.log("[v0] VIP jobs response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] VIP jobs data:", data)
        setVipJobs(new Set(data.vipJobIds))
      } else {
        console.error("[v0] VIP jobs API error:", response.status, await response.text())
      }
    } catch (error) {
      console.error("[v0] Error loading VIP jobs:", error)
    }
  }

  const handleVipToggle = async (jobId: string, isVip: boolean) => {
    console.log("[v0] Toggling VIP status for job:", jobId, "to:", isVip)
    setLoadingVipJobs(true)
    try {
      const response = await fetch("/api/admin/vip-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, isVip }),
      })

      console.log("[v0] VIP toggle response status:", response.status)

      if (response.ok) {
        const newVipJobs = new Set(vipJobs)
        if (isVip) {
          newVipJobs.add(jobId)
        } else {
          newVipJobs.delete(jobId)
        }
        setVipJobs(newVipJobs)
        console.log("[v0] VIP jobs updated:", Array.from(newVipJobs))

        toast.success(
          isVip
            ? "Job marked as VIP - completing this job will make referrals VIP status"
            : "VIP status removed from job",
        )
      } else {
        const errorText = await response.text()
        console.error("[v0] VIP toggle API error:", response.status, errorText)
        toast.error("Failed to update VIP status")
      }
    } catch (error) {
      console.error("[v0] Error updating VIP status:", error)
      toast.error("Failed to update VIP status")
    } finally {
      setLoadingVipJobs(false)
    }
  }

  const loadCategories = () => {
    // Placeholder function - replace with actual logic if needed
    console.log("Loading categories (placeholder)")
  }

  useEffect(() => {
    loadJobs()
    loadCategories()
    loadPlatformFeeSettings()
    loadVipJobs()
  }, [])

  const loadThumbnailSettings = () => {
    try {
      const setting = localStorage.getItem("admin_thumbnail_enabled")
      setThumbnailEnabled(setting !== "false") // Default to true
    } catch (error) {
      console.error("Failed to load thumbnail settings:", error)
      setThumbnailEnabled(true)
    }
  }

  const handleThumbnailToggle = async (enabled: boolean) => {
    setLoadingThumbnailSettings(true)
    try {
      localStorage.setItem("admin_thumbnail_enabled", enabled.toString())
      setThumbnailEnabled(enabled)
      toast.success(
        enabled
          ? "Job thumbnail feature enabled - users can now add thumbnails to their jobs"
          : "Job thumbnail feature disabled - thumbnail upload option hidden from job creation",
      )
    } catch (error) {
      console.error("Error updating thumbnail setting:", error)
      toast.error("Failed to update thumbnail setting")
    } finally {
      setLoadingThumbnailSettings(false)
    }
  }

  const loadCountryRestrictionSettings = () => {
    try {
      const setting = localStorage.getItem("admin_country_restrictions_enabled")
      setCountryRestrictionsEnabled(setting !== "false") // Default to true
    } catch (error) {
      console.error("Failed to load country restriction settings:", error)
      setCountryRestrictionsEnabled(true)
    }
  }

  const handleCountryRestrictionsToggle = async (enabled: boolean) => {
    setLoadingCountryRestrictions(true)
    try {
      localStorage.setItem("admin_country_restrictions_enabled", enabled.toString())
      setCountryRestrictionsEnabled(enabled)
      toast.success(
        enabled
          ? "Country restrictions feature enabled - users can now set country limitations on jobs"
          : "Country restrictions feature disabled - all jobs will be available globally",
      )
    } catch (error) {
      console.error("Error updating country restrictions setting:", error)
      toast.error("Failed to update country restrictions setting")
    } finally {
      setLoadingCountryRestrictions(false)
    }
  }

  const loadAutoJobApprovalSetting = async () => {
    try {
      const jobSetting = localStorage.getItem("admin_auto_job_approval_enabled")
      setAutoJobApprovalEnabled(jobSetting === "true")
    } catch (error) {
      console.error("[v0] Error loading auto-approval setting:", error)
    }
  }

  const loadInstantApprovalSetting = async () => {
    try {
      const instantSetting = localStorage.getItem("admin_instant_approval_enabled")
      setInstantApprovalEnabled(instantSetting === "true")
    } catch (error) {
      console.error("[v0] Error loading instant approval setting:", error)
    }
  }

  const saveCustomTimePeriods = (periods: TimePeriod[]) => {
    try {
      localStorage.setItem("admin_custom_time_periods", JSON.stringify(periods))
      setCustomTimePeriods(periods)
      console.log("[v0] 🔧 Saved custom time periods:", periods)
    } catch (error) {
      console.error("Failed to save custom time periods:", error)
    }
  }

  const addCustomTimePeriod = () => {
    const { days, hours, minutes, label } = newTimePeriod

    // Calculate total days
    const totalDays = days + hours / 24 + minutes / (24 * 60)

    // Validation
    if (totalDays < 0.000694 || totalDays > 30) {
      toast.error("Time period must be between 1 minute and 30 days")
      return
    }

    if (!label.trim()) {
      toast.error("Please provide a label for the time period")
      return
    }

    // Check for duplicates
    const exists = customTimePeriods.some((p) => Math.abs(p.value - totalDays) < 0.000001)
    if (exists) {
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

    const updatedPeriods = [...customTimePeriods, newPeriod].sort((a, b) => a.value - b.value)
    saveCustomTimePeriods(updatedPeriods)

    // Reset form
    setNewTimePeriod({ days: 0, hours: 0, minutes: 0, label: "" })
    setIsAddingTimePeriod(false)

    toast.success(`Added custom time period: ${label}`)
  }

  const deleteCustomTimePeriod = (id: string) => {
    const updatedPeriods = customTimePeriods.filter((p) => p.id !== id)
    saveCustomTimePeriods(updatedPeriods)
    toast.success("Custom time period deleted")
  }

  const formatTimePeriodLabel = (days: number, hours: number, minutes: number) => {
    const parts = []
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`)
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`)
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`)
    return parts.join(" ")
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
        console.log("[v0] 🔧 Manual approval time selection setting updated:", enabled ? "ENABLED" : "DISABLED")
        toast.success(
          enabled
            ? "✅ Users can now customize manual approval time periods"
            : "⏳ Manual approval time selection disabled - users will use default period",
        )
      } else {
        throw new Error("Failed to update approval settings")
      }
    } catch (error) {
      console.error("[v0] Error updating manual approval time selection setting:", error)
      toast.error("Failed to update approval time selection setting")
    } finally {
      setLoadingApprovalSettings(false)
    }
  }

  const handlePlatformFeeUpdate = async (field: string, value: number | boolean) => {
    if (!platformFeeSettings) return

    setLoadingPlatformFee(true)
    try {
      const updatedSettings = {
        ...platformFeeSettings,
        [field]: value,
      }

      const savedSettings = await updatePlatformFeeSettings(updatedSettings)
      setPlatformFeeSettings(savedSettings)

      toast.success("Platform fee settings updated successfully")
    } catch (error) {
      console.error("[v0] Error updating platform fee settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update platform fee settings"
      if (errorMessage.includes("table not found") || errorMessage.includes("migration")) {
        toast.error("Database setup required. Please run the platform fee migration script first.")
      } else {
        toast.error("Failed to update platform fee settings")
      }
    } finally {
      setLoadingPlatformFee(false)
    }
  }

  const handleJobAction = (jobId: number, action: string) => {
    if (action === "view") {
      const job = jobs.find((j) => j.id === jobId)
      if (job) {
        setSelectedJobDetails(job)
        setIsDetailsModalOpen(true)
      }
      return
    }

    if (action === "approve" || action === "reject") {
      const job = jobs.find((j) => j.id === jobId)
      if (job) {
        setSelectedJobDetails(job)
        setApprovalAction(action as "approve" | "reject")
        setIsApprovalModalOpen(true)
      }
      return
    }

    setJobs(
      jobs.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: action === "suspend" ? "suspended" : job.status,
              ...(action === "suspend" && { suspendedAt: new Date().toISOString(), suspendedBy: "Admin" }),
            }
          : job,
      ),
    )

    const actionMessages = {
      suspend: "Job suspended successfully",
      delete: "Job deleted successfully",
    }

    toast.success(actionMessages[action as keyof typeof actionMessages])
  }

  const handleApprovalConfirm = async () => {
    if (!selectedJobDetails || !approvalAction) return

    try {
      let updatedJob
      if (approvalAction === "approve") {
        updatedJob = await approveJob(selectedJobDetails.id.toString(), "Admin", approvalReason)
      } else {
        updatedJob = await rejectJob(selectedJobDetails.id.toString(), "Admin", approvalReason)
      }

      await refreshJobs()

      toast.success(`Job ${approvalAction}d successfully`)
      setIsApprovalModalOpen(false)
      setApprovalAction(null)
      setApprovalReason("")
      setSelectedJobDetails(null)
    } catch (error) {
      console.error("[v0] Error in approval:", error)
      toast.error(`Failed to ${approvalAction} job`)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) {
      toast.error("Please select jobs to perform bulk actions")
      return
    }

    try {
      for (const jobId of selectedJobs) {
        if (action === "approve") {
          await approveJob(jobId.toString(), "Admin", "Bulk approval")
        } else if (action === "reject") {
          await rejectJob(jobId.toString(), "Admin", "Bulk rejection")
        }
      }

      await refreshJobs()
      setSelectedJobs([])
      toast.success(`${selectedJobs.length} jobs updated successfully`)
    } catch (error) {
      console.error("[v0] Error in bulk action:", error)
      toast.error("Failed to perform bulk action")
    }
  }

  const refreshJobs = async () => {
    try {
      const allJobs = await getAllJobs()
      setJobs(allJobs)
    } catch (error) {
      console.error("[v0] Error refreshing jobs:", error)
    }
  }

  const handleAutoJobApprovalToggle = async (enabled: boolean) => {
    setLoadingAutoJobApproval(true)
    try {
      localStorage.setItem("admin_auto_job_approval_enabled", enabled.toString())
      setAutoJobApprovalEnabled(enabled)
      console.log("[v0] 🔧 Auto job approval setting updated:", enabled ? "ENABLED" : "DISABLED")
      toast.success(
        enabled
          ? "✅ Auto job approval enabled - New jobs will be automatically approved and go live"
          : "⏳ Auto job approval disabled - New jobs require manual review before going live",
      )
    } catch (error) {
      console.error("[v0] Error updating auto job approval setting:", error)
      toast.error("Failed to update auto job approval setting")
    } finally {
      setLoadingAutoJobApproval(false)
    }
  }

  const handleInstantApprovalToggle = async (enabled: boolean) => {
    setLoadingInstantApproval(true)
    try {
      localStorage.setItem("admin_instant_approval_enabled", enabled.toString())
      setInstantApprovalEnabled(enabled)
      console.log("[v0] 🔧 Instant approval setting updated:", enabled ? "ENABLED" : "DISABLED")
      toast.success(
        enabled ? "✅ Instant approval option enabled for users" : "⏳ Instant approval option disabled for safety",
      )
    } catch (error) {
      console.error("[v0] Error updating instant approval setting:", error)
      toast.error("Failed to update instant approval setting")
    } finally {
      setLoadingInstantApproval(false)
    }
  }

  const handleDefaultManualApprovalDaysChange = async (days: number) => {
    if (days < 0.000694 || days > 7) {
      toast.error("Default approval days must be between 1 minute and 7 days")
      return
    }

    setLoadingDefaultDays(true)
    try {
      localStorage.setItem("admin_default_manual_approval_days", days.toString())
      setDefaultManualApprovalDays(days)
      console.log("[v0] 🔧 Default manual approval days updated:", days)

      const displayText = days === 0.000694 ? "1 minute (TEST MODE)" : `${days} day${days > 1 ? "s" : ""}`

      toast.success(`✅ Default manual approval period set to ${displayText}`)
    } catch (error) {
      console.error("[v0] Error updating default manual approval days:", error)
      toast.error("Failed to update default approval days")
    } finally {
      setLoadingDefaultDays(false)
    }
  }

  const handleReservationToggle = async (enabled: boolean) => {
    setLoadingReservationSettings(true)
    try {
      const response = await fetch("/api/admin/reservation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: enabled }),
      })

      if (response.ok) {
        setReservationSettings((prev) => ({ ...prev, isEnabled: enabled }))
        toast.success(`Job reservation system ${enabled ? "enabled" : "disabled"}`)
      } else {
        toast.error("Failed to update reservation settings")
      }
    } catch (error) {
      console.error("Error updating reservation settings:", error)
      toast.error("Failed to update reservation settings")
    } finally {
      setLoadingReservationSettings(false)
    }
  }

  const handleReservationSettingUpdate = async (field: string, value: number) => {
    setLoadingReservationSettings(true)
    try {
      const response = await fetch("/api/admin/reservation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setReservationSettings((prev) => ({ ...prev, [field]: value }))
        toast.success("Reservation settings updated")
      } else {
        toast.error("Failed to update reservation settings")
      }
    } catch (error) {
      console.error("Error updating reservation settings:", error)
      toast.error("Failed to update reservation settings")
    } finally {
      setLoadingReservationSettings(false)
    }
  }

  const handleReservationTimeChange = async (value: number, unit: "minutes" | "hours") => {
    if (value < 1) return

    // Validate ranges
    if (unit === "minutes" && (value < 1 || value > 1440)) {
      toast.error("Minutes must be between 1 and 1440 (24 hours)")
      return
    }
    if (unit === "hours" && (value < 1 || value > 24)) {
      toast.error("Hours must be between 1 and 24")
      return
    }

    setLoadingReservationSettings(true)
    try {
      const minutes = unit === "hours" ? value * 60 : value

      const response = await fetch("/api/admin/reservation-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultReservationMinutes: minutes }),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setReservationSettings(updatedSettings)
        setReservationTimeValue(value)
        setReservationTimeUnit(unit)

        const displayText =
          unit === "hours" ? `${value} hour${value > 1 ? "s" : ""}` : `${value} minute${value > 1 ? "s" : ""}`
        toast.success(`Default reservation time set to ${displayText}`)
      } else {
        toast.error("Failed to update reservation settings")
      }
    } catch (error) {
      console.error("Error updating reservation settings:", error)
      toast.error("Failed to update reservation settings")
    } finally {
      setLoadingReservationSettings(false)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const posterName = job.poster
      ? typeof job.poster === "object"
        ? `${job.poster.firstName} ${job.poster.lastName}`
        : job.poster
      : `User ${job.userId}`

    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      posterName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesCategory =
      categoryFilter === "all" || job.categoryId === categoryFilter || job.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs((prev) => (prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
  }

  const toggleAllJobs = () => {
    setSelectedJobs(selectedJobs.length === filteredJobs.length ? [] : filteredJobs.map((job) => job.id))
  }

  const fetchJobs = async () => {
    try {
      const allJobs = await getAllJobs()
      setJobs(allJobs)
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlatformFeeSettings = async () => {
    try {
      const settings = await getPlatformFeeSettings()
      setPlatformFeeSettings(settings)
    } catch (error) {
      console.error("Failed to fetch platform fee settings:", error)
    }
  }

  const fetchReservationSettings = async () => {
    try {
      const response = await fetch("/api/admin/reservation-settings")
      if (response.ok) {
        const settings = await response.json()
        setReservationSettings(settings)
      }
    } catch (error) {
      console.error("Failed to fetch reservation settings:", error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchPlatformFeeSettings()
    fetchReservationSettings()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Microjob Approval</h1>
            <p className="text-gray-600 mt-1">Loading jobs...</p>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Microjob Approval</h1>
          <p className="text-gray-600 mt-1">Review and approve microjobs submitted by users</p>
        </div>
        <Button onClick={refreshJobs} variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">VIP Job System</h3>
                <p className="text-sm text-gray-600">
                  Mark jobs as VIP to automatically upgrade referrals when completed. Users don't see which jobs are
                  VIP.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                {vipJobs.size} VIP Jobs
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Approval Settings - Move to separate page */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manual Approval Settings</h3>
                <p className="text-sm text-gray-600">Configure default approval times and manage time period options</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/admin/jobs/approval-settings")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reservation Management</h3>
                <p className="text-sm text-gray-600">Monitor job reservations and user violations</p>
              </div>
            </div>
            <Button onClick={() => router.push("/admin/reservations")} className="bg-purple-600 hover:bg-purple-700">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Violations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Control Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Creation Auto-Approval Card */}
        <Card className="border-2 border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Auto-Approve New Jobs</h3>
                  <p className="text-sm text-gray-600">
                    {autoJobApprovalEnabled
                      ? "✅ New jobs are automatically approved and go live"
                      : "⏳ New jobs require manual review before going live"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">{autoJobApprovalEnabled ? "ON" : "OFF"}</span>
                <Switch
                  id="auto-job-approval"
                  checked={autoJobApprovalEnabled}
                  onCheckedChange={handleAutoJobApprovalToggle}
                  disabled={loadingAutoJobApproval}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Country Restrictions</h3>
                  <p className="text-sm text-gray-600">
                    {countryRestrictionsEnabled
                      ? "🌍 Users can restrict jobs to specific countries/regions"
                      : "🌐 All jobs are available globally without restrictions"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">{countryRestrictionsEnabled ? "ON" : "OFF"}</span>
                <Switch
                  id="country-restrictions"
                  checked={countryRestrictionsEnabled}
                  onCheckedChange={handleCountryRestrictionsToggle}
                  disabled={loadingCountryRestrictions}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Reservation System Card */}
        <Card className="border-2 border-teal-200 bg-teal-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Clock className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Job Reservation System</h3>
                  <p className="text-sm text-gray-600">
                    {reservationSettings?.isEnabled
                      ? `✅ Users can reserve jobs for ${reservationTimeValue} ${reservationTimeUnit}`
                      : "⏸️ Job reservation feature is disabled"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {reservationSettings?.isEnabled ? "ON" : "OFF"}
                </span>
                <Switch
                  id="job-reservation"
                  checked={reservationSettings?.isEnabled || false}
                  onCheckedChange={handleReservationToggle}
                  disabled={loadingReservationSettings}
                  className="data-[state=checked]:bg-teal-600"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-teal-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Default Time</span>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max={reservationTimeUnit === "hours" ? "24" : "1440"}
                    value={reservationTimeValue}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value)
                      if (value > 0) {
                        handleReservationTimeChange(value, reservationTimeUnit)
                      }
                    }}
                    disabled={loadingReservationSettings}
                    className="w-20 text-center"
                  />
                  <Select
                    value={reservationTimeUnit}
                    onValueChange={(unit: "minutes" | "hours") => {
                      const currentMinutes =
                        reservationTimeUnit === "hours" ? reservationTimeValue * 60 : reservationTimeValue
                      const newValue = unit === "hours" ? Math.max(1, Math.round(currentMinutes / 60)) : currentMinutes
                      handleReservationTimeChange(newValue, unit)
                    }}
                    disabled={loadingReservationSettings}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Min</SelectItem>
                      <SelectItem value="hours">Hrs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Max Concurrent</span>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={reservationSettings?.maxConcurrentReservations || 5}
                  onChange={(e) =>
                    handleReservationSettingUpdate("maxConcurrentReservations", Number.parseInt(e.target.value))
                  }
                  disabled={loadingReservationSettings}
                  className="w-20 text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Camera className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Job Thumbnails</h3>
                  <p className="text-sm text-gray-600">
                    {thumbnailEnabled
                      ? "📸 Users can add thumbnails to make jobs more attractive"
                      : "🚫 Thumbnail upload feature is disabled"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">{thumbnailEnabled ? "ON" : "OFF"}</span>
                <Switch
                  id="job-thumbnails"
                  checked={thumbnailEnabled}
                  onCheckedChange={handleThumbnailToggle}
                  disabled={loadingThumbnailSettings}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instant Approval Control Card */}
        <Card className="border-2 border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Instant Approval Option</h3>
                  <p className="text-sm text-gray-600">
                    {instantApprovalEnabled
                      ? "✅ Users can choose instant payment approval"
                      : "⏳ Instant approval disabled for safety"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">{instantApprovalEnabled ? "ON" : "OFF"}</span>
                <Switch
                  id="instant-approval"
                  checked={instantApprovalEnabled}
                  onCheckedChange={handleInstantApprovalToggle}
                  disabled={loadingInstantApproval}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Fee Card */}
        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Percent className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Platform Fee</h3>
                  <p className="text-sm text-gray-600">
                    Current rate: {platformFeeSettings?.percentage || 5}%
                    {!platformFeeSettings?.enabled && " (Disabled)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={platformFeeSettings?.percentage || 5}
                  onChange={(e) => handlePlatformFeeUpdate("percentage", Number.parseFloat(e.target.value))}
                  disabled={loadingPlatformFee}
                  className="w-20 text-center"
                />
                <span className="text-sm font-medium text-gray-700">%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Enable Platform Fee</span>
                <Switch
                  checked={platformFeeSettings?.enabled || false}
                  onCheckedChange={(checked) => handlePlatformFeeUpdate("enabled", checked)}
                  disabled={loadingPlatformFee}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: Platform fee settings require database migration. Run script 17-platform-fee-settings.sql if
                toggle doesn't work.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Approval Status Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        {/* Job Creation Auto-Approval Status Indicator */}
        {autoJobApprovalEnabled && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Auto Job Approval Active</p>
                  <p className="text-xs text-purple-600">New jobs are being automatically approved and published</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {countryRestrictionsEnabled && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Country Restrictions Active</p>
                  <p className="text-xs text-blue-600">
                    Users can limit job visibility to specific countries and regions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {thumbnailEnabled && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardContent className="pt-4">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-indigo-800">Job Thumbnails Active</p>
                  <p className="text-xs text-indigo-600">
                    Users can upload images to make their jobs more visually appealing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {jobs.filter((j) => j.status === "pending").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter((j) => j.status === "approved").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Live on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{jobs.filter((j) => j.status === "rejected").length}</div>
            <p className="text-xs text-gray-500 mt-1">Not approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              $
              {jobs
                .reduce((sum, job) => {
                  const budget = job.budget || job.budgetMin || 0
                  const workers = job.workersNeeded || job.maxWorkers || 1
                  return sum + budget * workers
                }, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">All jobs combined</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search microjobs by title or poster..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="YOUTUBE">YouTube</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="TELEGRAM">Telegram</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="TWITTER">Twitter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.length > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedJobs.length} job{selectedJobs.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("approve")}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction("reject")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Jobs Management</CardTitle>
            <div className="flex space-x-2">
              {selectedJobs.length > 0 && (
                <>
                  <Button
                    onClick={() => handleBulkAction("approve")}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve ({selectedJobs.length})
                  </Button>
                  <Button onClick={() => handleBulkAction("reject")} size="sm" variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject ({selectedJobs.length})
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs by title or poster..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jobs Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                        onCheckedChange={toggleAllJobs}
                      />
                    </TableHead>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Poster</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>VIP</TableHead> {/* Added VIP column */}
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No jobs found</p>
                        <p className="text-sm">Jobs will appear here when users submit them for review</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => {
                      const posterName = job.poster
                        ? typeof job.poster === "object"
                          ? `${job.poster.firstName} ${job.poster.lastName}`
                          : job.poster
                        : `User ${job.userId}`

                      const isVipJob = vipJobs.has(job.id.toString())

                      return (
                        <TableRow key={job.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedJobs.includes(job.id)}
                              onCheckedChange={() => toggleJobSelection(job.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900 line-clamp-1">{job.title}</p>
                                {isVipJob && <Crown className="h-4 w-4 text-yellow-500" title="VIP Job" />}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                              {job.category && (
                                <Badge variant="outline" className="text-xs">
                                  {typeof job.category === "object" ? job.category.name : job.category}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">{posterName}</p>
                              <p className="text-sm text-gray-500">ID: {job.userId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {job.budgetMin && job.budgetMax ? (
                                <p className="font-medium text-gray-900">
                                  ${job.budgetMin} - ${job.budgetMax}
                                </p>
                              ) : job.budgetMin ? (
                                <p className="font-medium text-gray-900">${job.budgetMin}</p>
                              ) : (
                                <p className="text-gray-500">Not specified</p>
                              )}
                              {job.deadline && (
                                <p className="text-sm text-gray-500">
                                  Due: {new Date(job.deadline).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getJobStatusColor(job.status)} border-current`}>
                              {getJobStatusLabel(job.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={isVipJob}
                                onCheckedChange={(checked) => handleVipToggle(job.id.toString(), checked)}
                                disabled={loadingVipJobs}
                                className="data-[state=checked]:bg-yellow-500"
                              />
                              {isVipJob && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-600">{new Date(job.createdAt).toLocaleDateString()}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleJobAction(job.id, "view")}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {job.status === "pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleJobAction(job.id, "approve")}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleJobAction(job.id, "reject")}>
                                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Microjob Details</DialogTitle>
          </DialogHeader>
          {selectedJobDetails && (
            <div className="space-y-6">
              {selectedJobDetails.thumbnail && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={selectedJobDetails.thumbnail || "/placeholder.svg"}
                      alt={`${selectedJobDetails.title} thumbnail`}
                      className="max-w-xs max-h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-white/90 text-gray-700">
                      Job Thumbnail
                    </Badge>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Job Title</h3>
                  <p className="text-gray-600">{selectedJobDetails.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Status</h3>
                  <Badge className={getJobStatusColor(selectedJobDetails.status)}>
                    {getJobStatusLabel(selectedJobDetails.status)}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Posted By</h3>
                  <p className="text-gray-600">
                    {selectedJobDetails.poster
                      ? typeof selectedJobDetails.poster === "object"
                        ? `${selectedJobDetails.poster.firstName} ${selectedJobDetails.poster.lastName}`
                        : selectedJobDetails.poster
                      : `User ${selectedJobDetails.userId}`}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedJobDetails.poster
                      ? typeof selectedJobDetails.poster === "object"
                        ? selectedJobDetails.poster.email || selectedJobDetails.posterEmail
                        : selectedJobDetails.posterEmail
                      : "No email available"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Category</h3>
                  <Badge variant="outline">
                    {selectedJobDetails.category
                      ? typeof selectedJobDetails.category === "object"
                        ? selectedJobDetails.category.name ||
                          selectedJobDetails.category.slug ||
                          selectedJobDetails.categoryId
                        : selectedJobDetails.category
                      : selectedJobDetails.categoryId}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Budget per Worker</h3>
                  <p className="text-gray-600">${selectedJobDetails.budget || selectedJobDetails.budgetMin || 0}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Workers Needed</h3>
                  <p className="text-gray-600">
                    {selectedJobDetails.workersNeeded || selectedJobDetails.maxWorkers || 1}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Duration</h3>
                  <p className="text-gray-600">
                    {selectedJobDetails.duration || selectedJobDetails.deliveryTime || "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total Budget</h3>
                  <p className="text-gray-600 font-semibold">
                    $
                    {(
                      (selectedJobDetails.budget || selectedJobDetails.budgetMin || 0) *
                      (selectedJobDetails.workersNeeded || selectedJobDetails.maxWorkers || 1)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">{selectedJobDetails.description}</p>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">{selectedJobDetails.requirements}</p>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Step-by-Step Instructions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-gray-600 whitespace-pre-wrap font-sans">{selectedJobDetails.instructions}</pre>
                </div>
              </div>

              {/* Tags */}
              {selectedJobDetails.tags && selectedJobDetails.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJobDetails.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedJobDetails.attachments && selectedJobDetails.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {selectedJobDetails.attachments.map((file: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval/Rejection Info */}
              {(selectedJobDetails.approvedAt || selectedJobDetails.rejectedAt) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {selectedJobDetails.status === "approved" ? "Approval" : "Rejection"} Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Date:</span>
                      {new Date(selectedJobDetails.approvedAt || selectedJobDetails.rejectedAt).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">By:</span>
                      {selectedJobDetails.approvedBy || selectedJobDetails.rejectedBy}
                    </p>
                    {(selectedJobDetails.approvalReason || selectedJobDetails.rejectionReason) && (
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span>
                        {selectedJobDetails.approvalReason || selectedJobDetails.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedJobDetails.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        setApprovalAction("approve")
                        setIsDetailsModalOpen(false)
                        setIsApprovalModalOpen(true)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Job
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setApprovalAction("reject")
                        setIsDetailsModalOpen(false)
                        setIsApprovalModalOpen(true)
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Job
                    </Button>
                  </>
                )}
                {selectedJobDetails.status !== "suspended" && selectedJobDetails.status === "approved" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleJobAction(selectedJobDetails.id, "suspend")
                      setIsDetailsModalOpen(false)
                    }}
                    className="text-gray-600 border-gray-200 hover:bg-gray-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Suspend Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval/Rejection Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{approvalAction === "approve" ? "Approve" : "Reject"} Microjob</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {approvalAction === "approve"
                ? "This microjob will be published and available for workers to apply."
                : "This microjob will be rejected and the poster will be notified."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="reason">
                {approvalAction === "approve" ? "Approval Note (Optional)" : "Rejection Reason"}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  approvalAction === "approve"
                    ? "Add any notes about the approval..."
                    : "Please provide a reason for rejection..."
                }
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalConfirm}
              className={
                approvalAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {approvalAction === "approve" ? "Approve" : "Reject"} Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

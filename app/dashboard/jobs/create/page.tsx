"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { getCategoriesWithSubcategories, type CategoryWithSubcategories } from "@/lib/categories"
import { getWallet, type Wallet } from "@/lib/wallet"
import {
  calculateScreenshotCosts,
  getScreenshotPricingSettings,
  type ScreenshotPricingCalculation,
  type ScreenshotPricingSettings,
} from "@/lib/screenshot-pricing"
import { getPlatformFeeSettings, calculatePlatformFee, type PlatformFeeSettings } from "@/lib/platform-fee"
import {
  X,
  Plus,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  Info,
  Camera,
  WalletIcon,
  HelpCircle,
  Zap,
  Shield,
} from "lucide-react"

interface JobStep {
  id: string
  content: string
}

const REGIONS = {
  Asia: [
    "CN",
    "IN",
    "JP",
    "KR",
    "TH",
    "VN",
    "PH",
    "ID",
    "MY",
    "SG",
    "BD",
    "PK",
    "LK",
    "MM",
    "KH",
    "LA",
    "BN",
    "MN",
    "TW",
    "HK",
    "MO",
  ],
  Europe: [
    "DE",
    "FR",
    "IT",
    "ES",
    "GB",
    "PL",
    "RO",
    "NL",
    "BE",
    "GR",
    "PT",
    "CZ",
    "HU",
    "SE",
    "AT",
    "BY",
    "CH",
    "BG",
    "RS",
    "SK",
    "DK",
    "FI",
    "NO",
    "IE",
    "HR",
    "BA",
    "AL",
    "LT",
    "SI",
    "LV",
    "EE",
    "MK",
    "MD",
    "MT",
    "LU",
    "IS",
    "ME",
    "CY",
    "AD",
    "SM",
    "LI",
    "MC",
    "VA",
  ],
  "North America": [
    "US",
    "CA",
    "MX",
    "GT",
    "CU",
    "DO",
    "HT",
    "HN",
    "NI",
    "CR",
    "PA",
    "JM",
    "TT",
    "BS",
    "BZ",
    "SV",
    "BB",
    "GD",
    "LC",
    "VC",
    "AG",
    "DM",
    "KN",
  ],
  "South America": ["BR", "AR", "CO", "PE", "VE", "CL", "EC", "BO", "PY", "UY", "GY", "SR", "GF"],
  Africa: [
    "NG",
    "ET",
    "EG",
    "ZA",
    "KE",
    "UG",
    "DZ",
    "SD",
    "MA",
    "AO",
    "GH",
    "MZ",
    "MG",
    "CM",
    "CI",
    "NE",
    "BF",
    "ML",
    "MW",
    "ZM",
    "SO",
    "SN",
    "TD",
    "ZW",
    "GN",
    "RW",
    "BJ",
    "TN",
    "BI",
    "ER",
    "SL",
    "TG",
    "CF",
    "LY",
    "LR",
    "MR",
    "GM",
    "BW",
    "GA",
    "LS",
    "GW",
    "GQ",
    "MU",
    "SZ",
    "DJ",
    "KM",
    "CV",
    "ST",
    "SC",
  ],
  Oceania: ["AU", "PG", "NZ", "FJ", "SB", "NC", "PF", "VU", "WS", "KI", "FM", "TO", "MH", "PW", "CK", "NU", "TV", "NR"],
}

const COUNTRIES = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  SK: "Slovakia",
  SI: "Slovenia",
  HR: "Croatia",
  RO: "Romania",
  BG: "Bulgaria",
  GR: "Greece",
  PT: "Portugal",
  IE: "Ireland",
  LU: "Luxembourg",
  MT: "Malta",
  CY: "Cyprus",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  AU: "Australia",
  NZ: "New Zealand",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  IN: "India",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  MY: "Malaysia",
  TH: "Thailand",
  PH: "Philippines",
  ID: "Indonesia",
  VN: "Vietnam",
  BD: "Bangladesh",
  PK: "Pakistan",
  LK: "Sri Lanka",
  MM: "Myanmar",
  BR: "Brazil",
  AR: "Argentina",
  MX: "Mexico",
  CO: "Colombia",
  PE: "Peru",
  CL: "Chile",
  VE: "Venezuela",
  EC: "Ecuador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  NG: "Nigeria",
  ZA: "South Africa",
  EG: "Egypt",
  KE: "Kenya",
  MA: "Morocco",
  GH: "Ghana",
  ET: "Ethiopia",
  UG: "Uganda",
  TN: "Tunisia",
  DZ: "Algeria",
  AO: "Angola",
  MZ: "Mozambique",
  MG: "Madagascar",
  CM: "Cameroon",
  CI: "Ivory Coast",
  NE: "Niger",
  BF: "Burkina Faso",
  ML: "Mali",
  MW: "Malawi",
  ZM: "Zambia",
  SO: "Somalia",
  SN: "Senegal",
  TD: "Chad",
  ZW: "Zimbabwe",
  GN: "Guinea",
  RW: "Rwanda",
  BJ: "Benin",
  BI: "Burundi",
  ER: "Eritrea",
  SL: "Sierra Leone",
  TG: "Togo",
  CF: "Central African Republic",
  LY: "Libya",
  LR: "Liberia",
  MR: "Mauritania",
  GM: "Gambia",
  BW: "Botswana",
  GA: "Gabon",
  LS: "Lesotho",
  GW: "Guinea-Bissau",
  GQ: "Equatorial Guinea",
  MU: "Mauritius",
  SZ: "Eswatini",
  DJ: "Djibouti",
  KM: "Comoros",
  CV: "Cape Verde",
  ST: "São Tomé and Príncipe",
  SC: "Seychelles",
  RU: "Russia",
  TR: "Turkey",
  IL: "Israel",
  AE: "UAE",
  SA: "Saudi Arabia",
  IR: "Iran",
  IQ: "Iraq",
  JO: "Jordan",
  LB: "Lebanon",
  SY: "Syria",
  YE: "Yemen",
  OM: "Oman",
  QA: "Qatar",
  KW: "Kuwait",
  BH: "Bahrain",
}

export default function CreateJobPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([])
  const [selectedSubcategoryMinPayment, setSelectedSubcategoryMinPayment] = useState<number>(0)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [screenshotPricing, setScreenshotPricing] = useState<ScreenshotPricingCalculation | null>(null)
  const [screenshotSettings, setScreenshotSettings] = useState<ScreenshotPricingSettings | null>(null)
  const [isInstantApprovalEnabled, setIsInstantApprovalEnabled] = useState(false)
  const [platformFeeSettings, setPlatformFeeSettings] = useState<PlatformFeeSettings | null>(null)
  const [allowManualApprovalTimeSelection, setAllowManualApprovalTimeSelection] = useState(true)
  const [availableTimeOptions, setAvailableTimeOptions] = useState<
    Array<{
      label: string
      value: string
      isDefault: boolean
    }>
  >([])
  const router = useRouter()
  const { user } = useAuth()

  const [jobData, setJobData] = useState({
    category: "",
    subcategory: "",
    title: "",
    steps: [{ id: "1", content: "" }] as JobStep[],
    requiredProof: "",
    workersNeeded: "1",
    workerEarning: "",
    requireScreenshots: "0",
    approvalType: "manual", // "instant" or "manual"
    manualApprovalDays: "3", // 1-7 days for manual approval
    estimatedJobCost: "0.00",
    enableCountryRestrictions: false,
    restrictionType: "include", // "include" or "exclude"
    selectedCountries: [] as string[],
    selectedRegions: [] as string[],
    enableThumbnail: false,
    thumbnailFile: null as File | null,
    thumbnailPreview: "",
  })

  const [countryRestrictionsEnabled, setCountryRestrictionsEnabled] = useState(true)
  const [thumbnailEnabled, setThumbnailEnabled] = useState(true)

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCategories()
    loadWalletData()
    loadScreenshotSettings()
    checkInstantApprovalSetting()
    loadDefaultManualApprovalDays()
    loadPlatformFeeSettings()
    loadApprovalSettings()
    loadAvailableTimeOptions()
    loadCountryRestrictionSettings()
    loadThumbnailSettings()
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

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setJobData((prev) => ({
          ...prev,
          thumbnailFile: file,
          thumbnailPreview: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setJobData((prev) => ({
      ...prev,
      thumbnailFile: null,
      thumbnailPreview: "",
    }))
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

  const handleRegionToggle = (regionName: string) => {
    const regionCountries = REGIONS[regionName as keyof typeof REGIONS]
    const isRegionSelected = jobData.selectedRegions.includes(regionName)

    if (isRegionSelected) {
      // Remove region and its countries
      setJobData((prev) => ({
        ...prev,
        selectedRegions: prev.selectedRegions.filter((r) => r !== regionName),
        selectedCountries: prev.selectedCountries.filter((c) => !regionCountries.includes(c)),
      }))
    } else {
      // Add region and its countries
      setJobData((prev) => ({
        ...prev,
        selectedRegions: [...prev.selectedRegions, regionName],
        selectedCountries: [...new Set([...prev.selectedCountries, ...regionCountries])],
      }))
    }
  }

  const handleCountryToggle = (countryCode: string) => {
    const isSelected = jobData.selectedCountries.includes(countryCode)

    if (isSelected) {
      setJobData((prev) => ({
        ...prev,
        selectedCountries: prev.selectedCountries.filter((c) => c !== countryCode),
      }))
    } else {
      setJobData((prev) => ({
        ...prev,
        selectedCountries: [...prev.selectedCountries, countryCode],
      }))
    }

    // Update region selection based on countries
    const updatedCountries = isSelected
      ? jobData.selectedCountries.filter((c) => c !== countryCode)
      : [...jobData.selectedCountries, countryCode]

    const updatedRegions = Object.entries(REGIONS)
      .filter(([regionName, regionCountries]) => {
        return regionCountries.every((country) => updatedCountries.includes(country))
      })
      .map(([regionName]) => regionName)

    setJobData((prev) => ({
      ...prev,
      selectedRegions: updatedRegions,
    }))
  }

  const removeCountry = (countryCode: string) => {
    setJobData((prev) => ({
      ...prev,
      selectedCountries: prev.selectedCountries.filter((c) => c !== countryCode),
      selectedRegions: prev.selectedRegions.filter((regionName) => {
        const regionCountries = REGIONS[regionName as keyof typeof REGIONS]
        return !regionCountries.includes(countryCode)
      }),
    }))
  }

  const loadApprovalSettings = async () => {
    try {
      const response = await fetch("/api/admin/approval-settings")
      if (response.ok) {
        const settings = await response.json()
        setAllowManualApprovalTimeSelection(settings.allowManualApprovalTimeSelection)
        console.log("[v0] 🔧 Loaded approval settings:", settings)
      } else {
        console.log("[v0] Using default approval settings")
        setAllowManualApprovalTimeSelection(true)
      }
    } catch (error) {
      console.error("Failed to load approval settings:", error)
      setAllowManualApprovalTimeSelection(true)
    }
  }

  const checkInstantApprovalSetting = () => {
    try {
      const setting = localStorage.getItem("admin_instant_approval_enabled")
      setIsInstantApprovalEnabled(setting === "true")
    } catch (error) {
      console.error("Failed to check instant approval setting:", error)
      setIsInstantApprovalEnabled(false)
    }
  }

  const loadScreenshotSettings = async () => {
    try {
      const settings = await getScreenshotPricingSettings()
      setScreenshotSettings(settings)
    } catch (error) {
      console.error("Failed to load screenshot settings:", error)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await getCategoriesWithSubcategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast.error("Failed to load categories")
    }
  }

  const loadWalletData = async () => {
    if (!user?.id) return

    setWalletLoading(true)
    try {
      const walletData = await getWallet(user.id)
      setWallet(walletData)
    } catch (error) {
      console.error("Failed to load wallet data:", error)
      toast.error("Failed to load wallet information")
    } finally {
      setWalletLoading(false)
    }
  }

  const loadDefaultManualApprovalDays = () => {
    try {
      const defaultDays = localStorage.getItem("admin_default_manual_approval_days")
      if (defaultDays) {
        const days = Number.parseFloat(defaultDays)
        setJobData((prev) => ({ ...prev, manualApprovalDays: days.toString() }))
        console.log("[v0] 🔧 Loaded default manual approval days:", days)
      }
    } catch (error) {
      console.error("Failed to load default manual approval days:", error)
    }
  }

  const loadPlatformFeeSettings = async () => {
    try {
      const settings = await getPlatformFeeSettings()
      setPlatformFeeSettings(settings)
    } catch (error) {
      console.error("Failed to load platform fee settings:", error)
      setPlatformFeeSettings({
        id: "default",
        feeType: "job_platform_fee",
        feePercentage: 5.0,
        feeFixed: 0.0,
        minimumFee: 0.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  const loadAvailableTimeOptions = () => {
    try {
      let allOptions: Array<{ label: string; value: string; isDefault: boolean }> = []

      const defaultTimeOptions = localStorage.getItem("admin_default_time_options")
      if (defaultTimeOptions) {
        const defaultPeriods = JSON.parse(defaultTimeOptions)
        const defaultOptions = defaultPeriods.map((period: any) => ({
          label: period.label,
          value: period.value.toString(),
          isDefault: true,
        }))
        allOptions = [...allOptions, ...defaultOptions]
        console.log("[v0] 🔧 Loaded default time options from admin:", defaultOptions)
      }

      const customPeriods = localStorage.getItem("admin_custom_time_periods")
      if (customPeriods) {
        const periods = JSON.parse(customPeriods)
        const customOptions = periods.map((period: any) => ({
          label: period.label,
          value: period.value.toString(),
          isDefault: false,
        }))
        allOptions = [...allOptions, ...customOptions]
        console.log("[v0] 🔧 Loaded custom time options from admin:", customOptions)
      }

      if (allOptions.length === 0) {
        console.log("[v0] 🔧 No admin time options found, using fallback defaults")
        allOptions = [
          { label: "1 Day", value: "1", isDefault: true },
          { label: "3 Days", value: "3", isDefault: true },
          { label: "7 Days", value: "7", isDefault: true },
        ]
      }

      const sortedOptions = allOptions.sort((a, b) => Number.parseFloat(a.value) - Number.parseFloat(b.value))

      setAvailableTimeOptions(sortedOptions)
      console.log("[v0] 🔧 Final available time options:", sortedOptions)
    } catch (error) {
      console.error("Failed to load time options:", error)
      setAvailableTimeOptions([
        { label: "1 Day", value: "1", isDefault: true },
        { label: "3 Days", value: "3", isDefault: true },
        { label: "7 Days", value: "7", isDefault: true },
      ])
    }
  }

  useEffect(() => {
    const calculateCosts = async () => {
      const workers = Number.parseInt(jobData.workersNeeded) || 0
      const earning = Number.parseFloat(jobData.workerEarning) || 0
      const baseJobCost = workers * earning
      const screenshotCount = Number.parseInt(jobData.requireScreenshots) || 0

      let screenshotCost = 0
      let screenshotCalculation: ScreenshotPricingCalculation | null = null

      if (screenshotCount > 0) {
        try {
          screenshotCalculation = await calculateScreenshotCosts(screenshotCount, baseJobCost)
          screenshotCost = screenshotCalculation.totalScreenshotCost
          setScreenshotPricing(screenshotCalculation)
        } catch (error) {
          console.error("Error calculating screenshot costs:", error)
          screenshotCost = screenshotCount * 0.05
          setScreenshotPricing(null)
        }
      } else {
        setScreenshotPricing(null)
      }

      const subtotal = baseJobCost + screenshotCost

      let platformFee = 0
      let platformFeeRate = 5

      if (platformFeeSettings) {
        const feeCalculation = calculatePlatformFee(subtotal, platformFeeSettings)
        platformFee = feeCalculation.platformFee
        platformFeeRate = platformFeeSettings.feePercentage
      } else {
        platformFee = subtotal * 0.05
      }

      const totalCost = subtotal + platformFee
      setJobData((prev) => ({ ...prev, estimatedJobCost: totalCost.toFixed(2) }))
    }

    calculateCosts()
  }, [jobData.workersNeeded, jobData.workerEarning, jobData.requireScreenshots, platformFeeSettings])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!jobData.category) newErrors.category = "Please select a category"
    if (!jobData.subcategory) newErrors.subcategory = "Please select a subcategory"
    if (!jobData.title.trim()) newErrors.title = "Job title is required"
    if (jobData.steps.some((step) => !step.content.trim())) newErrors.steps = "All steps must have content"
    if (!jobData.requiredProof.trim()) newErrors.requiredProof = "Required proof is needed"

    if (!jobData.workersNeeded || Number.parseInt(jobData.workersNeeded) <= 0) {
      newErrors.workersNeeded = "Number of workers is required"
    }
    if (!jobData.workerEarning || Number.parseFloat(jobData.workerEarning) <= 0) {
      newErrors.workerEarning = "Worker earning is required"
    }
    if (selectedSubcategoryMinPayment > 0 && Number.parseFloat(jobData.workerEarning) < selectedSubcategoryMinPayment) {
      newErrors.workerEarning = `Minimum payment for this category is $${selectedSubcategoryMinPayment}`
    }

    const screenshotCount = Number.parseInt(jobData.requireScreenshots) || 0
    const maxScreenshots = screenshotSettings?.max_screenshots_allowed || 5
    if (screenshotCount > maxScreenshots) {
      newErrors.requireScreenshots = `Maximum ${maxScreenshots} screenshots allowed`
    }

    if (jobData.approvalType === "manual") {
      const days = Number.parseFloat(jobData.manualApprovalDays)
      if (!days || days < 0.000694 || days > 7) {
        newErrors.manualApprovalDays = "Manual approval days must be between 1 minute and 7 days"
      }
    }

    const totalCost = Number.parseFloat(jobData.estimatedJobCost)

    if (wallet && wallet.depositBalance < totalCost) {
      newErrors.wallet = `Insufficient deposit balance. Required: $${totalCost.toFixed(2)}, Available: $${wallet.depositBalance.toFixed(2)}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addStep = () => {
    const newStep: JobStep = {
      id: (jobData.steps.length + 1).toString(),
      content: "",
    }
    setJobData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }))
  }

  const removeStep = (stepId: string) => {
    if (jobData.steps.length <= 1) return
    setJobData((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId),
    }))
  }

  const updateStep = (stepId: string, content: string) => {
    setJobData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, content } : step)),
    }))
  }

  const getSelectedCategory = () => {
    return categories.find((cat) => cat.id === jobData.category)
  }

  const getSelectedSubcategories = () => {
    const category = getSelectedCategory()
    return category?.subcategories || []
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const { createJob } = await import("@/lib/jobs")

      const jobSubmissionData = {
        title: jobData.title,
        description: `Steps to complete:\n${jobData.steps.map((step, index) => `${index + 1}. ${step.content}`).join("\n")}`,
        categoryId: jobData.category,
        subcategoryId: jobData.subcategory,
        requirements: jobData.requiredProof,
        instructions: jobData.steps.map((step, index) => `Step ${index + 1}: ${step.content}`).join("\n"),
        budgetMin: Number.parseFloat(jobData.workerEarning),
        budgetMax: Number.parseFloat(jobData.workerEarning),
        deadline:
          jobData.approvalType === "instant"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
            : new Date(Date.now() + Number.parseInt(jobData.manualApprovalDays) * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
        location: "Remote",
        workersNeeded: Number.parseInt(jobData.workersNeeded),
        tags: [],
        attachments: [],
        userId: user?.id || "",
        requireScreenshots: Number.parseInt(jobData.requireScreenshots) || 0,
        approvalType: jobData.approvalType,
        manualApprovalDays: jobData.approvalType === "manual" ? Number.parseFloat(jobData.manualApprovalDays) : null,
        estimatedApprovalDays: jobData.approvalType === "instant" ? 0 : Number.parseFloat(jobData.manualApprovalDays),
        enableCountryRestrictions: jobData.enableCountryRestrictions,
        restrictionType: jobData.restrictionType,
        allowedCountries: jobData.enableCountryRestrictions ? jobData.selectedCountries : [],
        restrictedCountries:
          jobData.enableCountryRestrictions && jobData.restrictionType === "exclude" ? jobData.selectedCountries : [],
      }

      console.log(
        "[v0] 📸 JOB CREATION: Submitting job with approval type:",
        jobData.approvalType,
        "and screenshot requirements:",
        jobSubmissionData.requireScreenshots,
        "and country restrictions:",
        jobSubmissionData.enableCountryRestrictions,
      )

      await createJob(jobSubmissionData)

      toast.success("Microjob created successfully! The estimated cost has been deducted from your deposit balance.")
      await loadWalletData()
      router.push("/dashboard")
    } catch (error) {
      console.error("Job creation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create microjob. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader title="Create Microjob" description="Post a new microjob for the community" />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <Card className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <WalletIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Your Deposit Balance</h3>
                    <p className="text-sm text-blue-700">Required to post microjobs</p>
                  </div>
                </div>
                <div className="text-right">
                  {walletLoading ? (
                    <div className="animate-pulse">
                      <div className="h-8 w-24 bg-blue-200 rounded"></div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-blue-800">
                      ${wallet?.depositBalance?.toFixed(2) || "0.00"}
                    </div>
                  )}
                  <p className="text-sm text-blue-600">Available for job posting</p>
                </div>
              </div>
              {errors.wallet && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700 font-medium">{errors.wallet}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                <span>JOB INFORMATION</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                    Category *
                  </Label>
                  <Select
                    value={jobData.category}
                    onValueChange={(value) => setJobData((prev) => ({ ...prev, category: value, subcategory: "" }))}
                  >
                    <SelectTrigger
                      className={`h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.category ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="subcategory" className="text-sm font-semibold text-gray-700">
                    Sub Category *
                  </Label>
                  <Select
                    value={jobData.subcategory}
                    onValueChange={(value) => {
                      const selectedSubcategory = getSelectedSubcategories().find((sub) => sub.id === value)
                      const minPayment = selectedSubcategory?.minimumPayment || 0
                      setSelectedSubcategoryMinPayment(minPayment)

                      const currentEarning = Number.parseFloat(jobData.workerEarning) || 0
                      const newWorkerEarning =
                        currentEarning < minPayment ? minPayment.toString() : jobData.workerEarning

                      setJobData((prev) => ({
                        ...prev,
                        subcategory: value,
                        workerEarning: newWorkerEarning,
                      }))
                    }}
                    disabled={!jobData.category}
                  >
                    <SelectTrigger
                      className={`h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.subcategory ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSelectedSubcategories().map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{subcategory.name}</span>
                            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                              Min: ${subcategory.minimumPayment}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subcategory && <p className="text-sm text-red-500 mt-1">{errors.subcategory}</p>}
                  {selectedSubcategoryMinPayment > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                      <Info className="h-4 w-4" />
                      <span>Minimum payment for this category: ${selectedSubcategoryMinPayment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                  Job Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a clear and descriptive job title"
                  value={jobData.title}
                  onChange={(e) => setJobData((prev) => ({ ...prev, title: e.target.value }))}
                  className={`h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.title ? "border-red-500" : ""}`}
                />
                {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">Job Steps *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStep}
                    className="flex items-center space-x-2 text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Step</span>
                  </Button>
                </div>

                <div className="space-y-4">
                  {jobData.steps.map((step, index) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/30">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium text-gray-700">Step {index + 1} *</Label>
                        {jobData.steps.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(step.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Textarea
                        placeholder={`Describe what workers need to do in step ${index + 1}...`}
                        value={step.content}
                        onChange={(e) => updateStep(step.id, e.target.value)}
                        rows={3}
                        className="resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
                {errors.steps && <p className="text-sm text-red-500">{errors.steps}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="requiredProof" className="text-sm font-semibold text-gray-700">
                  Required Proof *
                </Label>
                <Textarea
                  id="requiredProof"
                  placeholder="Describe what proof workers need to provide to complete this job (screenshots, links, files, etc.)"
                  value={jobData.requiredProof}
                  onChange={(e) => setJobData((prev) => ({ ...prev, requiredProof: e.target.value }))}
                  rows={4}
                  className="resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
                {errors.requiredProof && <p className="text-sm text-red-500 mt-1">{errors.requiredProof}</p>}
              </div>

              {thumbnailEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Job Thumbnail (Optional)</Label>
                      <p className="text-sm text-gray-500 mt-1">Add an image to make your job more attractive</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">Off</span>
                      <button
                        type="button"
                        onClick={() => setJobData((prev) => ({ ...prev, enableThumbnail: !prev.enableThumbnail }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          jobData.enableThumbnail ? "bg-purple-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            jobData.enableThumbnail ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">On</span>
                    </div>
                  </div>

                  {jobData.enableThumbnail && (
                    <div className="space-y-4">
                      {!jobData.thumbnailPreview ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                          <div className="space-y-2">
                            <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                            <div>
                              <label htmlFor="thumbnail-upload" className="cursor-pointer">
                                <span className="text-purple-600 hover:text-purple-700 font-medium">
                                  Click to upload
                                </span>
                                <span className="text-gray-500"> or drag and drop</span>
                              </label>
                              <input
                                id="thumbnail-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                className="hidden"
                              />
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start space-x-4">
                              <img
                                src={jobData.thumbnailPreview || "/placeholder.svg"}
                                alt="Job thumbnail preview"
                                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">Thumbnail Preview</h4>
                                <p className="text-sm text-gray-600 mt-1">{jobData.thumbnailFile?.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {jobData.thumbnailFile && (jobData.thumbnailFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeThumbnail}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <p className="text-sm text-blue-700">
                            Adding a thumbnail can increase worker interest by up to 40%. Choose an image that
                            represents your job clearly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                <span>BUDGET & SETTING</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="workersNeeded" className="text-sm font-semibold text-gray-700">
                    Worker Need
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="workersNeeded"
                      type="number"
                      min="1"
                      value={jobData.workersNeeded}
                      onChange={(e) => setJobData((prev) => ({ ...prev, workersNeeded: e.target.value }))}
                      className={`pl-12 h-14 text-center text-lg font-semibold border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.workersNeeded ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.workersNeeded && <p className="text-sm text-red-500">{errors.workersNeeded}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="workerEarning" className="text-sm font-semibold text-gray-700">
                    Each Worker Earn ($)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="workerEarning"
                      type="number"
                      step="0.01"
                      min={selectedSubcategoryMinPayment || 0.01}
                      value={jobData.workerEarning}
                      onChange={(e) => setJobData((prev) => ({ ...prev, workerEarning: e.target.value }))}
                      className={`pl-12 h-14 text-center text-lg font-semibold border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.workerEarning ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.workerEarning && <p className="text-sm text-red-500">{errors.workerEarning}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Estimated Job Cost ($)</Label>
                  <div className="h-14 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-700">{jobData.estimatedJobCost}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Base Job Cost:</span>
                      <span>
                        $
                        {(
                          (Number.parseInt(jobData.workersNeeded) || 0) *
                          (Number.parseFloat(jobData.workerEarning) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {screenshotPricing && screenshotPricing.totalScreenshotCost > 0 && (
                      <div className="flex justify-between">
                        <span>Screenshot Cost:</span>
                        <span>${screenshotPricing.totalScreenshotCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Platform Fee ({platformFeeSettings?.feePercentage || 5}%):</span>
                      <span>
                        ${(() => {
                          const subtotal =
                            (Number.parseInt(jobData.workersNeeded) || 0) *
                              (Number.parseFloat(jobData.workerEarning) || 0) +
                            (screenshotPricing?.totalScreenshotCost || 0)

                          if (platformFeeSettings) {
                            const feeCalculation = calculatePlatformFee(subtotal, platformFeeSettings)
                            return feeCalculation.platformFee.toFixed(2)
                          } else {
                            return (subtotal * 0.05).toFixed(2)
                          }
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1">
                      <span>Total Required:</span>
                      <span>${jobData.estimatedJobCost}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-gray-700">Payment Approval System</Label>

                  <RadioGroup
                    value={jobData.approvalType}
                    onValueChange={(value) => setJobData((prev) => ({ ...prev, approvalType: value }))}
                    className="space-y-4"
                  >
                    <div
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                        jobData.approvalType === "instant"
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 bg-gray-50"
                      } ${!isInstantApprovalEnabled ? "opacity-50" : ""}`}
                    >
                      <RadioGroupItem
                        value="instant"
                        id="instant"
                        disabled={!isInstantApprovalEnabled}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4 text-orange-600" />
                          <Label htmlFor="instant" className="font-medium text-gray-900">
                            Instant Approval
                          </Label>
                          {!isInstantApprovalEnabled && (
                            <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                              Disabled by Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Workers get paid immediately when they submit their work.
                          <span className="text-orange-600 font-medium"> Higher risk of scams</span> - use with caution.
                        </p>
                      </div>
                    </div>

                    <div
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                        jobData.approvalType === "manual"
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <RadioGroupItem value="manual" id="manual" className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-green-600" />
                          <Label htmlFor="manual" className="font-medium text-gray-900">
                            Manual Approval (Recommended)
                          </Label>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            Recommended
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          You review and approve work before payment.
                          <span className="text-green-600 font-medium"> Protects against scams</span> and ensures
                          quality.
                        </p>

                        {jobData.approvalType === "manual" && allowManualApprovalTimeSelection && (
                          <div className="mt-3 space-y-3">
                            <Label htmlFor="manualApprovalDays" className="text-xs font-medium text-gray-700">
                              Review Period
                            </Label>
                            <Select
                              value={jobData.manualApprovalDays}
                              onValueChange={(value) => setJobData((prev) => ({ ...prev, manualApprovalDays: value }))}
                            >
                              <SelectTrigger className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="Select review period" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {availableTimeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{option.label}</span>
                                      {!option.isDefault && (
                                        <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                                          Custom
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.manualApprovalDays && (
                              <p className="text-xs text-red-500">{errors.manualApprovalDays}</p>
                            )}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs text-green-700">
                                <Info className="h-3 w-3 inline mr-1" />
                                Selected period:{" "}
                                <span className="font-medium">
                                  {availableTimeOptions.find((opt) => opt.value === jobData.manualApprovalDays)
                                    ?.label ||
                                    `${jobData.manualApprovalDays} day${Number.parseFloat(jobData.manualApprovalDays) > 1 ? "s" : ""}`}
                                </span>
                                . If you don't approve/reject within this time, payment will be automatically released
                                to the worker.
                              </p>
                            </div>
                          </div>
                        )}

                        {jobData.approvalType === "manual" && !allowManualApprovalTimeSelection && (
                          <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-600">
                              <Info className="h-3 w-3 inline mr-1" />
                              Review period is set to{" "}
                              <span className="font-medium">
                                {availableTimeOptions.find((opt) => opt.value === jobData.manualApprovalDays)?.label ||
                                  `${jobData.manualApprovalDays} day${Number.parseFloat(jobData.manualApprovalDays) > 1 ? "s" : ""}`}
                              </span>{" "}
                              by the administrator. You cannot customize the approval time for this job.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="requireScreenshots" className="text-sm font-semibold text-gray-700">
                    Require Screenshots
                  </Label>
                  {screenshotSettings && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <HelpCircle className="h-3 w-3" />
                      <span>Max: {screenshotSettings.max_screenshots_allowed}</span>
                    </div>
                  )}
                  <div className="relative">
                    <Camera className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="requireScreenshots"
                      type="number"
                      min="0"
                      max={screenshotSettings?.max_screenshots_allowed || 5}
                      value={jobData.requireScreenshots}
                      onChange={(e) => setJobData((prev) => ({ ...prev, requireScreenshots: e.target.value }))}
                      className={`pl-12 h-12 text-center border-gray-200 focus:border-purple-500 focus:ring-purple-500 ${errors.requireScreenshots ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.requireScreenshots && <p className="text-sm text-red-500">{errors.requireScreenshots}</p>}

                  {screenshotPricing && screenshotPricing.screenshotCosts.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-blue-800 mb-2">Screenshot Pricing Breakdown:</h5>
                      <div className="space-y-1">
                        {screenshotPricing.screenshotCosts.map((cost) => (
                          <div key={cost.screenshotNumber} className="flex justify-between text-xs">
                            <span className="text-blue-700">Screenshot {cost.screenshotNumber}:</span>
                            <span className="font-medium text-blue-800">
                              {cost.isFree ? (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Free
                                </Badge>
                              ) : (
                                `${cost.percentage}% ($${cost.cost.toFixed(2)})`
                              )}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-semibold border-t border-blue-300 pt-1 mt-2">
                          <span className="text-blue-800">Total Screenshot Cost:</span>
                          <span className="text-blue-900">${screenshotPricing.totalScreenshotCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    walletLoading ||
                    (wallet && wallet.depositBalance < Number.parseFloat(jobData.estimatedJobCost))
                  }
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white font-bold px-20 py-5 text-xl rounded-2xl shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300 h-16 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group border-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse"></div>
                  <div className="relative z-10 flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-7 w-7 border-b-3 border-white mr-4"></div>
                        <span className="animate-pulse">Posting Microjob...</span>
                      </>
                    ) : walletLoading ? (
                      <>
                        <div className="animate-pulse rounded-full h-7 w-7 bg-white/30 mr-4"></div>
                        <span>Loading Wallet...</span>
                      </>
                    ) : wallet && wallet.depositBalance < Number.parseFloat(jobData.estimatedJobCost) ? (
                      <>
                        <AlertCircle className="h-6 w-6 mr-3 text-red-200" />
                        <span>Insufficient Balance</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <div className="p-2 bg-white/20 rounded-full mr-4 group-hover:bg-white/30 transition-colors duration-300">
                            <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                          </div>
                          <span className="tracking-wide">Post Microjob</span>
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                      </>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10"></div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 text-lg">Payment & Approval Process</h4>
                  <div className="text-blue-700 mt-2 leading-relaxed space-y-2">
                    <p>
                      <strong>Payment Required:</strong> You must have sufficient deposit balance to post a microjob.
                      The estimated cost plus {platformFeeSettings?.feePercentage || 5}% platform fee will be deducted
                      from your deposit balance.
                    </p>
                    <p>
                      <strong>Instant Approval:</strong> Workers receive payment immediately upon work submission. Use
                      only for trusted tasks as this increases scam risk.
                    </p>
                    <p>
                      <strong>Manual Approval (Recommended):</strong> You have 1-7 days to review and approve work
                      before payment. If no action is taken within the timeframe, payment is automatically released to
                      protect workers.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

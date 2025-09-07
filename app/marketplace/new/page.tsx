"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { createService } from "@/lib/marketplace"
import { useMarketplace } from "@/components/marketplace/marketplace-provider"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, X, Plus, AlertCircle, FileUp, Video, Trash2, DollarSign, Clock, RefreshCw } from "lucide-react"
import Link from "next/link"

interface MarketplaceCategory {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  subcategories: MarketplaceSubcategory[]
}

interface MarketplaceSubcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  logo?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  microCategories?: MarketplaceMicroCategory[]
}

interface MarketplaceMicroCategory {
  id: string
  subcategoryId: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
}

interface ServiceTier {
  id: string
  name: string
  price: number
  deliveryTimeValue: number
  deliveryTimeUnit: "instant" | "minutes" | "hours" | "days"
  revisionsIncluded: number
  isUnlimitedRevisions: boolean
  description: string
  features: string[]
}

interface ServiceAddOn {
  id: string
  name: string
  description: string
  price: number
  deliveryTimeValue: number
  deliveryTimeUnit: "instant" | "minutes" | "hours" | "days"
}

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  showPreview?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 5,
  acceptedTypes = ["image/*"],
  showPreview = true,
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    if (selectedFiles.length === 0) return

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`)
      return
    }

    for (const file of selectedFiles) {
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the maximum size of ${maxSize}MB.`)
        return
      }

      if (!acceptedTypes.some((type) => file.type.startsWith(type.split("/")[0]))) {
        setError(`File "${file.name}" has an unsupported file type.`)
        return
      }
    }

    setError(null)
    const newFiles = [...files, ...selectedFiles]
    setFiles(newFiles)
    onFilesChange(newFiles)
  }

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove)
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
      <label
        htmlFor="file-upload"
        className="relative cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 block w-full text-sm font-medium text-gray-700 text-center"
      >
        <FileUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        Choose Files
      </label>
      {error && <Alert variant="destructive">{error}</Alert>}

      {showPreview && files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith("image") ? (
                <img
                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <p className="text-sm text-gray-500">File: {file.name}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreateServicePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const { categories, isLoading: contextLoading, isInitialized } = useMarketplace()
  const { toast } = useToast()

  console.log(
    "[v0] CreateServicePage render - user:",
    !!user,
    "contextLoading:",
    contextLoading,
    "isInitialized:",
    isInitialized,
    "categories:",
    categories?.length || 0,
  )

  const [serviceLoading, setServiceLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [availableSubcategories, setAvailableSubcategories] = useState<MarketplaceSubcategory[]>([])
  const [availableMicroCategories, setAvailableMicroCategories] = useState<MarketplaceMicroCategory[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    microCategoryId: "",
    requirements: "",
    tags: [] as string[],
    images: [] as File[],
    videoThumbnailType: "" as "youtube" | "vimeo" | "direct" | "",
    videoThumbnailUrl: "",
    serviceTiers: [] as ServiceTier[],
    serviceAddOns: [] as ServiceAddOn[],
  })
  const [newTag, setNewTag] = useState("")

  const [isCreatingTier, setIsCreatingTier] = useState(false)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [isCreatingAddOn, setIsCreatingAddOn] = useState(false)
  const [editingAddOnId, setEditingAddOnId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    console.log("[v0] Categories from context:", categories?.length || 0)
    if (categories && categories.length > 0) {
      console.log("[v0] First category from context:", categories[0]?.name)
      console.log(
        "[v0] Categories with subcategories:",
        categories.map((cat) => ({
          name: cat.name,
          subcategoriesCount: cat.subcategories?.length || 0,
        })),
      )
    }
  }, [categories])

  useEffect(() => {
    if (formData.categoryId && categories) {
      const selectedCategory = categories.find((cat) => cat.id === formData.categoryId)
      if (selectedCategory && Array.isArray(selectedCategory.subcategories)) {
        setAvailableSubcategories(selectedCategory.subcategories)
      } else {
        setAvailableSubcategories([])
      }
      setFormData((prev) => ({ ...prev, subcategoryId: "", microCategoryId: "" }))
    } else {
      setAvailableSubcategories([])
    }
  }, [formData.categoryId, categories])

  useEffect(() => {
    if (formData.subcategoryId) {
      const selectedSubcategory = availableSubcategories.find((sub) => sub.id === formData.subcategoryId)
      if (selectedSubcategory && Array.isArray(selectedSubcategory.microCategories)) {
        console.log(
          "[v0] Loading micro categories for subcategory:",
          selectedSubcategory.name,
          selectedSubcategory.microCategories.length,
        )
        setAvailableMicroCategories(selectedSubcategory.microCategories)
      } else {
        console.log("[v0] No micro categories found for subcategory:", formData.subcategoryId)
        setAvailableMicroCategories([])
      }
      setFormData((prev) => ({ ...prev, microCategoryId: "" }))
    } else {
      setAvailableMicroCategories([])
    }
  }, [formData.subcategoryId, availableSubcategories])

  // Now the conditional returns come after all hooks
  if (!isAuthenticated && !isLoading) {
    console.log("[v0] Showing auth required - user is not authenticated")
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to create a service.</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  if (isLoading || contextLoading || !isInitialized) {
    console.log(
      "[v0] Showing loading spinner - isLoading:",
      isLoading,
      "contextLoading:",
      contextLoading,
      "isInitialized:",
      isInitialized,
    )
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    console.log("[v0] Showing marketplace not available - categories:", categories?.length || 0)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Marketplace Not Available</h1>
          <p className="text-gray-600 mb-4">
            The marketplace categories are not loaded. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering form - all conditions passed")

  const addTag = () => {
    if (newTag.trim() && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  const createDefaultTier = (tierType: "starter" | "standard" | "advanced"): ServiceTier => {
    const tierNames = {
      starter: "Starter",
      standard: "Standard",
      advanced: "Advanced",
    }

    const tierPrices = {
      starter: 25,
      standard: 50,
      advanced: 100,
    }

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: tierNames[tierType],
      price: tierPrices[tierType],
      deliveryTimeValue: tierType === "starter" ? 3 : tierType === "standard" ? 2 : 1,
      deliveryTimeUnit: "days",
      revisionsIncluded: tierType === "starter" ? 2 : tierType === "standard" ? 4 : 6,
      isUnlimitedRevisions: false,
      description: `${tierNames[tierType]} package description`,
      features: [`Feature 1 for ${tierNames[tierType]}`, `Feature 2 for ${tierNames[tierType]}`],
    }
  }

  const addServiceTier = (tierType?: "starter" | "standard" | "advanced") => {
    if (formData.serviceTiers.length >= 3) return

    const newTier = tierType
      ? createDefaultTier(tierType)
      : {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: formData.serviceTiers.length === 0 ? "Basic" : `Tier ${formData.serviceTiers.length + 1}`,
          price: 25,
          deliveryTimeValue: 3,
          deliveryTimeUnit: "days" as const,
          revisionsIncluded: 2,
          isUnlimitedRevisions: false,
          description: "",
          features: [""],
        }

    setFormData((prev) => ({
      ...prev,
      serviceTiers: [...prev.serviceTiers, newTier],
    }))
    setEditingTierId(newTier.id)
    setIsCreatingTier(true)
  }

  const updateServiceTier = (tierId: string, updates: Partial<ServiceTier>) => {
    setFormData((prev) => ({
      ...prev,
      serviceTiers: prev.serviceTiers.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier)),
    }))
  }

  const removeServiceTier = (tierId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceTiers: prev.serviceTiers.filter((tier) => tier.id !== tierId),
    }))
  }

  const addTierFeature = (tierId: string) => {
    updateServiceTier(tierId, {
      features: [...(formData.serviceTiers.find((t) => t.id === tierId)?.features || []), ""],
    })
  }

  const updateTierFeature = (tierId: string, featureIndex: number, value: string) => {
    const tier = formData.serviceTiers.find((t) => t.id === tierId)
    if (!tier) return

    const newFeatures = [...tier.features]
    newFeatures[featureIndex] = value
    updateServiceTier(tierId, { features: newFeatures })
  }

  const removeTierFeature = (tierId: string, featureIndex: number) => {
    const tier = formData.serviceTiers.find((t) => t.id === tierId)
    if (!tier) return

    const newFeatures = tier.features.filter((_, index) => index !== featureIndex)
    updateServiceTier(tierId, { features: newFeatures })
  }

  const addServiceAddOn = () => {
    const newAddOn: ServiceAddOn = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      price: 10,
      deliveryTimeValue: 1,
      deliveryTimeUnit: "days",
    }

    setFormData((prev) => ({
      ...prev,
      serviceAddOns: [...prev.serviceAddOns, newAddOn],
    }))
    setEditingAddOnId(newAddOn.id)
    setIsCreatingAddOn(true)
  }

  const updateServiceAddOn = (addOnId: string, updates: Partial<ServiceAddOn>) => {
    setFormData((prev) => ({
      ...prev,
      serviceAddOns: prev.serviceAddOns.map((addOn) => (addOn.id === addOnId ? { ...addOn, ...updates } : addOn)),
    }))
  }

  const removeServiceAddOn = (addOnId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceAddOns: prev.serviceAddOns.filter((addOn) => addOn.id !== addOnId),
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFilesChange = (files: File[]) => {
    setFormData((prev) => ({ ...prev, images: files }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServiceLoading(true)

    try {
      if (!user) {
        throw new Error("You must be logged in to create a service")
      }

      if (!formData.requirements.trim()) {
        throw new Error("Buyer requirements are required")
      }

      if (formData.tags.length === 0) {
        throw new Error("At least one search tag is required")
      }

      if (formData.serviceTiers.length === 0) {
        throw new Error("At least one service tier is required")
      }

      const selectedCategory = categories.find((cat) => cat.id === formData.categoryId)
      if (!selectedCategory) {
        throw new Error("Please select a valid category")
      }

      const selectedSubcategory = selectedCategory.subcategories?.find((sub) => sub.id === formData.subcategoryId)
      if (!selectedSubcategory) {
        throw new Error("Please select a valid subcategory")
      }

      let selectedMicroCategory = null
      if (selectedSubcategory.microCategories && selectedSubcategory.microCategories.length > 0) {
        if (!formData.microCategoryId) {
          throw new Error("Please select a micro category from the available options")
        }
        selectedMicroCategory = selectedSubcategory.microCategories.find(
          (microCat) => microCat.id === formData.microCategoryId,
        )
        if (!selectedMicroCategory) {
          throw new Error("Please select a valid micro category")
        }
      }

      if (formData.images.length === 0) {
        throw new Error("At least one service image is required")
      }

      const imageUrls = formData.images.map((file, index) => URL.createObjectURL(file))

      const videoThumbnail =
        formData.videoThumbnailUrl && formData.videoThumbnailType
          ? {
              type: formData.videoThumbnailType,
              url: formData.videoThumbnailUrl,
            }
          : undefined

      const serviceData = {
        sellerId: user.id,
        categoryId: formData.categoryId,
        subcategoryId: formData.subcategoryId,
        microCategoryId: formData.microCategoryId || null,
        title: formData.title,
        description: formData.description,
        price: formData.serviceTiers[0]?.price || 0,
        deliveryTime: {
          value: formData.serviceTiers[0]?.deliveryTimeValue || 0,
          unit: formData.serviceTiers[0]?.deliveryTimeUnit || "days",
        },
        revisionsIncluded: formData.serviceTiers[0]?.isUnlimitedRevisions
          ? -1
          : formData.serviceTiers[0]?.revisionsIncluded || 0,
        images: imageUrls,
        videoThumbnail,
        tags: formData.tags,
        requirements: formData.requirements,
        serviceTiers: formData.serviceTiers,
        serviceAddOns: formData.serviceAddOns,
        status: "active" as const,
        rating: 0,
        totalOrders: 0,
        viewsCount: 0,
        category: {
          id: selectedCategory.id,
          name: selectedCategory.name,
          slug: selectedCategory.slug,
        },
        subcategory: {
          id: selectedSubcategory.id,
          name: selectedSubcategory.name,
          slug: selectedSubcategory.slug,
        },
        microCategory: selectedMicroCategory
          ? {
              id: selectedMicroCategory.id,
              name: selectedMicroCategory.name,
              slug: selectedMicroCategory.slug,
            }
          : null,
        seller: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          rating: 5.0,
          totalReviews: 0,
          isVerified: user.isVerified || false,
        },
      }

      const newService = await createService(serviceData)

      console.log("[v0] Service created successfully:", newService)
      toast({
        title: "Success!",
        description: "Your service has been created successfully.",
      })
      router.push("/dashboard/services")
    } catch (error) {
      console.error("Failed to create service:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setServiceLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        const hasRequiredMicroCategory = availableMicroCategories.length === 0 || formData.microCategoryId
        return formData.title && formData.categoryId && formData.subcategoryId && hasRequiredMicroCategory
      case 2:
        return formData.description && formData.images.length > 0
      case 3:
        return (
          formData.serviceTiers.length > 0 &&
          formData.serviceTiers.every(
            (tier) => tier.name && tier.price > 0 && tier.description && tier.features.some((f) => f.trim()),
          )
        )
      case 4:
        return formData.requirements.trim().length > 0 && formData.tags.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Service</h1>
              <p className="text-gray-600">Share your skills and start earning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  <div className="ml-3 text-sm">
                    <p className={`font-medium ${step <= currentStep ? "text-blue-600" : "text-gray-500"}`}>
                      {step === 1 && "Basic Info"}
                      {step === 2 && "Service Details"}
                      {step === 3 && "Pricing & Tiers"}
                      {step === 4 && "Requirements & Tags"}
                    </p>
                  </div>
                  {step < 4 && (
                    <div className={`w-16 h-0.5 ml-8 ${step < currentStep ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Service Title *</Label>
                    <Input
                      id="title"
                      placeholder="I will create a professional logo design for your business"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      maxLength={80}
                      required
                    />
                    <p className="text-sm text-gray-500">{formData.title.length}/80 characters</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => handleInputChange("categoryId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          )) || []}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Subcategory *</Label>
                      <Select
                        value={formData.subcategoryId}
                        onValueChange={(value) => handleInputChange("subcategoryId", value)}
                        disabled={!formData.categoryId || availableSubcategories.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.categoryId && availableSubcategories.length === 0 && (
                        <p className="text-sm text-amber-600">No subcategories available for this category</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Micro Category {availableMicroCategories.length > 0 ? "*" : ""}</Label>
                    <Select
                      value={formData.microCategoryId}
                      onValueChange={(value) => handleInputChange("microCategoryId", value)}
                      disabled={!formData.subcategoryId || availableMicroCategories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableMicroCategories.length > 0
                              ? "Select a micro category"
                              : "Select a micro category (optional)"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMicroCategories.map((microCategory) => (
                          <SelectItem key={microCategory.id} value={microCategory.id}>
                            {microCategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.subcategoryId && availableMicroCategories.length === 0 && (
                      <p className="text-sm text-gray-500">No micro categories defined for this subcategory</p>
                    )}
                    {availableMicroCategories.length > 0 && (
                      <p className="text-sm text-orange-600">
                        Micro category selection is required for this subcategory
                      </p>
                    )}
                    {!formData.subcategoryId && <p className="text-sm text-gray-500">Select a subcategory first</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your service in detail. What will you deliver? What's your process? What makes you unique?"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={8}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Service Images *</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Upload at least 1 image to showcase your service (max 5 images)
                    </p>
                    <FileUpload
                      onFilesChange={handleFilesChange}
                      maxFiles={5}
                      maxSize={5}
                      acceptedTypes={["image/*"]}
                      showPreview={true}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Video Thumbnail (Optional)</Label>
                    <p className="text-sm text-gray-500">Add a video to showcase your service</p>

                    <div className="grid md:grid-cols-3 gap-3">
                      <Select
                        value={formData.videoThumbnailType}
                        onValueChange={(value) => handleInputChange("videoThumbnailType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Video type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="vimeo">Vimeo</SelectItem>
                          <SelectItem value="direct">Direct Link</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="md:col-span-2">
                        <div className="relative">
                          <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder={
                              formData.videoThumbnailType === "youtube"
                                ? "https://www.youtube.com/watch?v=..."
                                : formData.videoThumbnailType === "vimeo"
                                  ? "https://vimeo.com/..."
                                  : formData.videoThumbnailType === "direct"
                                    ? "https://example.com/video.mp4"
                                    : "Select video type first"
                            }
                            value={formData.videoThumbnailUrl}
                            onChange={(e) => handleInputChange("videoThumbnailUrl", e.target.value)}
                            className="pl-10"
                            disabled={!formData.videoThumbnailType}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Service Tiers</CardTitle>
                  <p className="text-sm text-gray-600">Create multiple tiers to offer different value propositions</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Tiers Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Service Tiers</Label>
                        <p className="text-sm text-gray-500">
                          {formData.serviceTiers.length === 0 && "Create at least one service tier"}
                          {formData.serviceTiers.length === 1 && "Single tier - no comparison will be shown"}
                          {formData.serviceTiers.length > 1 && "Multiple tiers - buyers can compare options"}
                        </p>
                      </div>
                      {formData.serviceTiers.length < 3 && (
                        <div className="flex space-x-2">
                          {formData.serviceTiers.length === 0 && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addServiceTier("starter")}
                              >
                                Add Starter
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => addServiceTier()}>
                                Add Basic
                              </Button>
                            </>
                          )}
                          {formData.serviceTiers.length === 1 && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addServiceTier("standard")}
                              >
                                Add Standard
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => addServiceTier()}>
                                Add Tier
                              </Button>
                            </>
                          )}
                          {formData.serviceTiers.length === 2 && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addServiceTier("advanced")}
                              >
                                Add Advanced
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => addServiceTier()}>
                                Add Tier
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tier Comparison View */}
                    {formData.serviceTiers.length > 1 && (
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        {formData.serviceTiers.map((tier, index) => (
                          <div key={tier.id} className="border rounded-lg p-4 bg-white">
                            <div className="text-center mb-3">
                              <h3 className="font-semibold text-lg">{tier.name}</h3>
                              <div className="text-2xl font-bold text-green-600">${tier.price}</div>
                              <p className="text-sm text-gray-500">
                                {tier.deliveryTimeUnit === "instant"
                                  ? "Instant delivery"
                                  : `${tier.deliveryTimeValue} ${tier.deliveryTimeUnit}`}
                              </p>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Revisions:</span>
                                <span>{tier.isUnlimitedRevisions ? "Unlimited" : tier.revisionsIncluded}</span>
                              </div>
                              <div className="space-y-1">
                                <span className="font-medium">Features:</span>
                                {tier.features
                                  .filter((f) => f.trim())
                                  .map((feature, idx) => (
                                    <div key={idx} className="flex items-center text-xs">
                                      <span className="text-green-500 mr-1">✓</span>
                                      {feature}
                                    </div>
                                  ))}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full mt-3 bg-transparent"
                              onClick={() => {
                                setEditingTierId(tier.id)
                                setIsCreatingTier(true)
                              }}
                            >
                              Edit Tier
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Individual Tier Cards */}
                    {formData.serviceTiers.map((tier, index) => (
                      <Card key={tier.id} className={formData.serviceTiers.length === 1 ? "" : "mb-4"}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {formData.serviceTiers.length === 1 ? "Service Package" : tier.name}
                            </CardTitle>
                            <div className="flex space-x-2">
                              {formData.serviceTiers.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeServiceTier(tier.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {formData.serviceTiers.length > 1 && (
                            <div className="space-y-2">
                              <Label>Tier Name</Label>
                              <Input
                                value={tier.name}
                                onChange={(e) => updateServiceTier(tier.id, { name: e.target.value })}
                                placeholder="e.g., Starter, Standard, Premium"
                              />
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Price (USD) *</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  type="number"
                                  value={tier.price}
                                  onChange={(e) => updateServiceTier(tier.id, { price: Number(e.target.value) })}
                                  className="pl-10"
                                  min="5"
                                  max="10000"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Delivery Time *</Label>
                              <div className="flex space-x-2">
                                <div className="relative flex-1">
                                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input
                                    type="number"
                                    value={tier.deliveryTimeValue}
                                    onChange={(e) =>
                                      updateServiceTier(tier.id, { deliveryTimeValue: Number(e.target.value) })
                                    }
                                    className="pl-10"
                                    min="1"
                                    disabled={tier.deliveryTimeUnit === "instant"}
                                    required={tier.deliveryTimeUnit !== "instant"}
                                  />
                                </div>
                                <Select
                                  value={tier.deliveryTimeUnit}
                                  onValueChange={(value) =>
                                    updateServiceTier(tier.id, { deliveryTimeUnit: value as any })
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="instant">Instant</SelectItem>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label>Revisions Included</Label>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`unlimited-revisions-${tier.id}`}
                                  checked={tier.isUnlimitedRevisions}
                                  onChange={(e) =>
                                    updateServiceTier(tier.id, {
                                      isUnlimitedRevisions: e.target.checked,
                                      revisionsIncluded: e.target.checked ? 0 : tier.revisionsIncluded,
                                    })
                                  }
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`unlimited-revisions-${tier.id}`} className="text-sm font-medium">
                                  Unlimited Revisions
                                </Label>
                              </div>
                              {!tier.isUnlimitedRevisions && (
                                <div className="relative flex-1 max-w-32">
                                  <RefreshCw className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <Input
                                    type="number"
                                    value={tier.revisionsIncluded}
                                    onChange={(e) =>
                                      updateServiceTier(tier.id, { revisionsIncluded: Number(e.target.value) })
                                    }
                                    className="pl-10"
                                    min="0"
                                    max="10"
                                    placeholder="2"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Tier Description</Label>
                            <Textarea
                              value={tier.description}
                              onChange={(e) => updateServiceTier(tier.id, { description: e.target.value })}
                              placeholder="Describe what's included in this tier"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Features Included</Label>
                              <Button type="button" variant="outline" size="sm" onClick={() => addTierFeature(tier.id)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Feature
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {tier.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex space-x-2">
                                  <Input
                                    value={feature}
                                    onChange={(e) => updateTierFeature(tier.id, featureIndex, e.target.value)}
                                    placeholder="e.g., 3 logo concepts, Source files included"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTierFeature(tier.id, featureIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  {/* Add-ons Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-semibold">Optional Add-ons</Label>
                        <p className="text-sm text-gray-500">
                          Offer additional services that buyers can add to their order
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={addServiceAddOn}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Add-on
                      </Button>
                    </div>

                    {formData.serviceAddOns.map((addOn) => (
                      <Card key={addOn.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Add-on Name *</Label>
                                  <Input
                                    value={addOn.name}
                                    onChange={(e) => updateServiceAddOn(addOn.id, { name: e.target.value })}
                                    placeholder="e.g., Additional revision, Rush delivery"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Price (USD) *</Label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                      type="number"
                                      value={addOn.price}
                                      onChange={(e) => updateServiceAddOn(addOn.id, { price: Number(e.target.value) })}
                                      className="pl-10"
                                      min="1"
                                      max="1000"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                  value={addOn.description}
                                  onChange={(e) => updateServiceAddOn(addOn.id, { description: e.target.value })}
                                  placeholder="Describe what this add-on includes"
                                  rows={2}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Additional Delivery Time</Label>
                                <div className="flex space-x-2">
                                  <div className="relative flex-1">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                      type="number"
                                      value={addOn.deliveryTimeValue}
                                      onChange={(e) =>
                                        updateServiceAddOn(addOn.id, { deliveryTimeValue: Number(e.target.value) })
                                      }
                                      className="pl-10"
                                      min="0"
                                      placeholder="0"
                                    />
                                  </div>
                                  <Select
                                    value={addOn.deliveryTimeUnit}
                                    onChange={(value) =>
                                      updateServiceAddOn(addOn.id, { deliveryTimeUnit: value as any })
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="instant">No delay</SelectItem>
                                      <SelectItem value="minutes">Minutes</SelectItem>
                                      <SelectItem value="hours">Hours</SelectItem>
                                      <SelectItem value="days">Days</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <p className="text-xs text-gray-500">
                                  How much extra time this add-on adds to delivery
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeServiceAddOn(addOn.id)}
                              className="ml-4"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Buyer Requirements *</Label>
                    <Textarea
                      id="requirements"
                      placeholder="What information do you need from buyers to complete their order? (e.g., business name, color preferences, content, etc.)"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange("requirements", e.target.value)}
                      rows={6}
                      required
                    />
                    <p className="text-sm text-gray-500">
                      Be specific about what buyers need to provide to avoid delays
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label>Search Tags *</Label>
                      <p className="text-sm text-gray-500 mb-3">
                        Add tags to help buyers find your service (max 10 tags)
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        maxLength={20}
                      />
                      <Button type="button" onClick={addTag} disabled={!newTag.trim() || formData.tags.length >= 10}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between mt-8">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>

              <div className="flex space-x-3">
                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep} disabled={!isStepValid(currentStep)}>
                    Next Step
                  </Button>
                ) : (
                  <Button type="submit" disabled={serviceLoading}>
                    {serviceLoading ? "Creating Service..." : "Create Service"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

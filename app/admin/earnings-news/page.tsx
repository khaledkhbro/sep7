"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit, Plus, Eye, DollarSign, Globe, MapPin, Upload, Link, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EarningsNews {
  id: string
  title: string
  thumbnail: string
  description: string
  money: number
  countries: string[] | null
  status: boolean
  created_at: string
  updated_at: string
  is_restricted: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const COUNTRIES = [
  // North America
  { code: "US", name: "United States", region: "North America" },
  { code: "CA", name: "Canada", region: "North America" },
  { code: "MX", name: "Mexico", region: "North America" },

  // Europe
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "BE", name: "Belgium", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  { code: "AT", name: "Austria", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "NO", name: "Norway", region: "Europe" },
  { code: "DK", name: "Denmark", region: "Europe" },
  { code: "FI", name: "Finland", region: "Europe" },
  { code: "PL", name: "Poland", region: "Europe" },
  { code: "CZ", name: "Czech Republic", region: "Europe" },
  { code: "HU", name: "Hungary", region: "Europe" },
  { code: "RO", name: "Romania", region: "Europe" },
  { code: "BG", name: "Bulgaria", region: "Europe" },
  { code: "HR", name: "Croatia", region: "Europe" },
  { code: "SI", name: "Slovenia", region: "Europe" },
  { code: "SK", name: "Slovakia", region: "Europe" },
  { code: "EE", name: "Estonia", region: "Europe" },
  { code: "LV", name: "Latvia", region: "Europe" },
  { code: "LT", name: "Lithuania", region: "Europe" },
  { code: "IE", name: "Ireland", region: "Europe" },
  { code: "PT", name: "Portugal", region: "Europe" },
  { code: "GR", name: "Greece", region: "Europe" },
  { code: "CY", name: "Cyprus", region: "Europe" },
  { code: "MT", name: "Malta", region: "Europe" },
  { code: "LU", name: "Luxembourg", region: "Europe" },

  // Asia
  { code: "CN", name: "China", region: "Asia" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "KR", name: "South Korea", region: "Asia" },
  { code: "IN", name: "India", region: "Asia" },
  { code: "ID", name: "Indonesia", region: "Asia" },
  { code: "TH", name: "Thailand", region: "Asia" },
  { code: "VN", name: "Vietnam", region: "Asia" },
  { code: "PH", name: "Philippines", region: "Asia" },
  { code: "MY", name: "Malaysia", region: "Asia" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "HK", name: "Hong Kong", region: "Asia" },
  { code: "TW", name: "Taiwan", region: "Asia" },
  { code: "BD", name: "Bangladesh", region: "Asia" },
  { code: "PK", name: "Pakistan", region: "Asia" },
  { code: "LK", name: "Sri Lanka", region: "Asia" },
  { code: "MM", name: "Myanmar", region: "Asia" },
  { code: "KH", name: "Cambodia", region: "Asia" },
  { code: "LA", name: "Laos", region: "Asia" },
  { code: "MN", name: "Mongolia", region: "Asia" },
  { code: "NP", name: "Nepal", region: "Asia" },
  { code: "BT", name: "Bhutan", region: "Asia" },
  { code: "MV", name: "Maldives", region: "Asia" },

  // Gulf/Middle East
  { code: "AE", name: "United Arab Emirates", region: "Gulf" },
  { code: "SA", name: "Saudi Arabia", region: "Gulf" },
  { code: "QA", name: "Qatar", region: "Gulf" },
  { code: "KW", name: "Kuwait", region: "Gulf" },
  { code: "BH", name: "Bahrain", region: "Gulf" },
  { code: "OM", name: "Oman", region: "Gulf" },
  { code: "IR", name: "Iran", region: "Gulf" },
  { code: "IQ", name: "Iraq", region: "Gulf" },
  { code: "JO", name: "Jordan", region: "Gulf" },
  { code: "LB", name: "Lebanon", region: "Gulf" },
  { code: "SY", name: "Syria", region: "Gulf" },
  { code: "IL", name: "Israel", region: "Gulf" },
  { code: "PS", name: "Palestine", region: "Gulf" },
  { code: "TR", name: "Turkey", region: "Gulf" },
  { code: "YE", name: "Yemen", region: "Gulf" },

  // Africa
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "KE", name: "Kenya", region: "Africa" },
  { code: "GH", name: "Ghana", region: "Africa" },
  { code: "MA", name: "Morocco", region: "Africa" },
  { code: "TN", name: "Tunisia", region: "Africa" },
  { code: "DZ", name: "Algeria", region: "Africa" },
  { code: "ET", name: "Ethiopia", region: "Africa" },
  { code: "UG", name: "Uganda", region: "Africa" },
  { code: "TZ", name: "Tanzania", region: "Africa" },
  { code: "RW", name: "Rwanda", region: "Africa" },
  { code: "SN", name: "Senegal", region: "Africa" },
  { code: "CI", name: "Ivory Coast", region: "Africa" },
  { code: "CM", name: "Cameroon", region: "Africa" },
  { code: "ZW", name: "Zimbabwe", region: "Africa" },
  { code: "ZM", name: "Zambia", region: "Africa" },
  { code: "BW", name: "Botswana", region: "Africa" },
  { code: "NA", name: "Namibia", region: "Africa" },
  { code: "MU", name: "Mauritius", region: "Africa" },

  // Oceania
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  { code: "FJ", name: "Fiji", region: "Oceania" },
  { code: "PG", name: "Papua New Guinea", region: "Oceania" },

  // South America
  { code: "BR", name: "Brazil", region: "South America" },
  { code: "AR", name: "Argentina", region: "South America" },
  { code: "CL", name: "Chile", region: "South America" },
  { code: "CO", name: "Colombia", region: "South America" },
  { code: "PE", name: "Peru", region: "South America" },
  { code: "VE", name: "Venezuela", region: "South America" },
  { code: "EC", name: "Ecuador", region: "South America" },
  { code: "UY", name: "Uruguay", region: "South America" },
  { code: "PY", name: "Paraguay", region: "South America" },
  { code: "BO", name: "Bolivia", region: "South America" },
  { code: "GY", name: "Guyana", region: "South America" },
  { code: "SR", name: "Suriname", region: "South America" },

  // Central America & Caribbean
  { code: "GT", name: "Guatemala", region: "Central America" },
  { code: "CR", name: "Costa Rica", region: "Central America" },
  { code: "PA", name: "Panama", region: "Central America" },
  { code: "NI", name: "Nicaragua", region: "Central America" },
  { code: "HN", name: "Honduras", region: "Central America" },
  { code: "SV", name: "El Salvador", region: "Central America" },
  { code: "BZ", name: "Belize", region: "Central America" },
  { code: "JM", name: "Jamaica", region: "Caribbean" },
  { code: "CU", name: "Cuba", region: "Caribbean" },
  { code: "DO", name: "Dominican Republic", region: "Caribbean" },
  { code: "HT", name: "Haiti", region: "Caribbean" },
  { code: "TT", name: "Trinidad and Tobago", region: "Caribbean" },
  { code: "BB", name: "Barbados", region: "Caribbean" },
]

const REGIONS = [
  {
    code: "North America",
    name: "North America",
    countries: COUNTRIES.filter((c) => c.region === "North America").map((c) => c.code),
  },
  { code: "Europe", name: "Europe", countries: COUNTRIES.filter((c) => c.region === "Europe").map((c) => c.code) },
  { code: "Asia", name: "Asia", countries: COUNTRIES.filter((c) => c.region === "Asia").map((c) => c.code) },
  {
    code: "Gulf",
    name: "Gulf/Middle East",
    countries: COUNTRIES.filter((c) => c.region === "Gulf").map((c) => c.code),
  },
  { code: "Africa", name: "Africa", countries: COUNTRIES.filter((c) => c.region === "Africa").map((c) => c.code) },
  { code: "Oceania", name: "Oceania", countries: COUNTRIES.filter((c) => c.region === "Oceania").map((c) => c.code) },
  {
    code: "South America",
    name: "South America",
    countries: COUNTRIES.filter((c) => c.region === "South America").map((c) => c.code),
  },
  {
    code: "Central America",
    name: "Central America",
    countries: COUNTRIES.filter((c) => c.region === "Central America").map((c) => c.code),
  },
  {
    code: "Caribbean",
    name: "Caribbean",
    countries: COUNTRIES.filter((c) => c.region === "Caribbean").map((c) => c.code),
  },
]

export default function AdminEarningsNewsPage() {
  const [news, setNews] = useState<EarningsNews[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<EarningsNews | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    thumbnail: "",
    description: "",
    money: "",
    countries: [] as string[],
    isRestricted: false,
    status: true,
  })
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("url")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchNews = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/earnings-news?page=${page}`)
      const data = await response.json()

      if (data.success) {
        setNews(data.data)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch earnings news",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch earnings news",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/admin/earnings-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          money: Number.parseFloat(formData.money),
          countries: formData.countries.length > 0 ? formData.countries : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Earnings news created successfully",
        })
        setIsCreateOpen(false)
        resetForm()
        fetchNews(pagination.page)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create earnings news",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create earnings news",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!editingNews) return

    try {
      const response = await fetch(`/api/admin/earnings-news/${editingNews.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          money: Number.parseFloat(formData.money),
          countries: formData.countries.length > 0 ? formData.countries : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Earnings news updated successfully",
        })
        setIsEditOpen(false)
        setEditingNews(null)
        resetForm()
        fetchNews(pagination.page)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update earnings news",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update earnings news",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this earnings news?")) return

    try {
      const response = await fetch(`/api/admin/earnings-news/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Earnings news deleted successfully",
        })
        fetchNews(pagination.page)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete earnings news",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete earnings news",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedFile(file)
      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file)
      setFormData({ ...formData, thumbnail: blobUrl })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setFormData({ ...formData, thumbnail: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      thumbnail: "",
      description: "",
      money: "",
      countries: [],
      isRestricted: false,
      status: true,
    })
    setThumbnailMode("url")
    setUploadedFile(null)
    setDragActive(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openEditDialog = (newsItem: EarningsNews) => {
    setEditingNews(newsItem)
    setFormData({
      title: newsItem.title,
      thumbnail: newsItem.thumbnail,
      description: newsItem.description,
      money: newsItem.money.toString(),
      countries: newsItem.countries || [],
      isRestricted: (newsItem as any).is_restricted || false,
      status: newsItem.status,
    })
    setThumbnailMode("url")
    setUploadedFile(null)
    setIsEditOpen(true)
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const addRegion = (regionCode: string) => {
    const region = REGIONS.find((r) => r.code === regionCode)
    if (region) {
      const newCountries = [...new Set([...formData.countries, ...region.countries])]
      setFormData({ ...formData, countries: newCountries })
    }
  }

  const clearAllCountries = () => {
    setFormData({ ...formData, countries: [] })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading earnings news...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Earnings News Management</h1>
          <p className="text-muted-foreground">Manage earning-related news posts for users</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create News
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Earnings News</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter news title"
                />
              </div>

              <div className="space-y-3">
                <Label>Thumbnail *</Label>

                {/* Mode Toggle */}
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={thumbnailMode === "upload" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbnailMode("upload")}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant={thumbnailMode === "url" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setThumbnailMode("url")}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Enter URL
                  </Button>
                </div>

                {thumbnailMode === "upload" ? (
                  <div className="space-y-3">
                    {/* File Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {uploadedFile ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center">
                            <img
                              src={formData.thumbnail || "/placeholder.svg"}
                              alt="Preview"
                              className="max-w-32 max-h-32 object-cover rounded-lg"
                            />
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm text-muted-foreground">{uploadedFile.name}</span>
                            <Button type="button" variant="outline" size="sm" onClick={clearFile}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Drag and drop an image here, or{" "}
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-primary hover:underline"
                              >
                                browse files
                              </button>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, GIF, WebP</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      placeholder="Enter thumbnail image URL"
                    />
                    {formData.thumbnail && (
                      <div className="mt-2">
                        <img
                          src={formData.thumbnail || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-32 max-h-32 object-cover rounded-lg"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed description"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="money">Money Amount *</Label>
                <Input
                  id="money"
                  type="number"
                  step="0.01"
                  value={formData.money}
                  onChange={(e) => setFormData({ ...formData, money: e.target.value })}
                  placeholder="Enter money amount"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Country Targeting</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRestricted"
                      checked={formData.isRestricted}
                      onCheckedChange={(checked) => setFormData({ ...formData, isRestricted: checked })}
                    />
                    <Label htmlFor="isRestricted" className="text-sm">
                      {formData.isRestricted ? "Restrict from countries" : "Show to countries"}
                    </Label>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formData.isRestricted
                    ? "Selected countries will NOT see this news"
                    : formData.countries.length === 0
                      ? "Global - all countries will see this news"
                      : "Only selected countries will see this news"}
                </div>

                <div>
                  <Label className="text-sm font-medium">Quick Regional Selection</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {REGIONS.map((region) => (
                      <Button
                        key={region.code}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addRegion(region.code)}
                      >
                        {region.name} ({region.countries.length})
                      </Button>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={clearAllCountries}>
                      Clear All
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Individual Countries</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!formData.countries.includes(value)) {
                        setFormData({ ...formData, countries: [...formData.countries, value] })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add countries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.countries.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Selected Countries ({formData.countries.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                      {formData.countries.map((countryCode) => {
                        const country = COUNTRIES.find((c) => c.code === countryCode)
                        return (
                          <Badge key={countryCode} variant="secondary" className="text-xs">
                            {country?.name}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  countries: formData.countries.filter((c) => c !== countryCode),
                                })
                              }
                              className="ml-2 text-xs hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
                <Label htmlFor="status">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active News</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{news.filter((n) => n.status).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(news.reduce((sum, n) => sum + Number(n.money), 0))}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings News ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {news.map((newsItem) => (
              <div key={newsItem.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-4">
                    <img
                      src={newsItem.thumbnail || "/placeholder.svg"}
                      alt={newsItem.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{newsItem.title}</h3>
                        <Badge variant={newsItem.status ? "default" : "secondary"}>
                          {newsItem.status ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{newsItem.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatMoney(Number(newsItem.money))}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {newsItem.countries ? `${newsItem.countries.length} countries` : "Global"}
                        </span>
                        <span>{formatDate(newsItem.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(newsItem)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(newsItem.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrev}
                  onClick={() => fetchNews(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => fetchNews(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Earnings News</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter news title"
              />
            </div>

            <div className="space-y-3">
              <Label>Thumbnail *</Label>

              {/* Mode Toggle */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={thumbnailMode === "upload" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThumbnailMode("upload")}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
                <Button
                  type="button"
                  variant={thumbnailMode === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setThumbnailMode("url")}
                >
                  <Link className="w-4 h-4 mr-2" />
                  Enter URL
                </Button>
              </div>

              {thumbnailMode === "upload" ? (
                <div className="space-y-3">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {uploadedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <img
                            src={formData.thumbnail || "/placeholder.svg"}
                            alt="Preview"
                            className="max-w-32 max-h-32 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-sm text-muted-foreground">{uploadedFile.name}</span>
                          <Button type="button" variant="outline" size="sm" onClick={clearFile}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Drag and drop an image here, or{" "}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-primary hover:underline"
                            >
                              browse files
                            </button>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, GIF, WebP</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="Enter thumbnail image URL"
                  />
                  {formData.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnail || "/placeholder.svg"}
                        alt="Preview"
                        className="max-w-32 max-h-32 object-cover rounded-lg"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="edit-money">Money Amount *</Label>
              <Input
                id="edit-money"
                type="number"
                step="0.01"
                value={formData.money}
                onChange={(e) => setFormData({ ...formData, money: e.target.value })}
                placeholder="Enter money amount"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Country Targeting</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isRestricted"
                    checked={formData.isRestricted}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRestricted: checked })}
                  />
                  <Label htmlFor="edit-isRestricted" className="text-sm">
                    {formData.isRestricted ? "Restrict from countries" : "Show to countries"}
                  </Label>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {formData.isRestricted
                  ? "Selected countries will NOT see this news"
                  : formData.countries.length === 0
                    ? "Global - all countries will see this news"
                    : "Only selected countries will see this news"}
              </div>

              <div>
                <Label className="text-sm font-medium">Quick Regional Selection</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {REGIONS.map((region) => (
                    <Button
                      key={region.code}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRegion(region.code)}
                    >
                      {region.name} ({region.countries.length})
                    </Button>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={clearAllCountries}>
                    Clear All
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Individual Countries</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (!formData.countries.includes(value)) {
                      setFormData({ ...formData, countries: [...formData.countries, value] })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add countries" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.countries.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Selected Countries ({formData.countries.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {formData.countries.map((countryCode) => {
                      const country = COUNTRIES.find((c) => c.code === countryCode)
                      return (
                        <Badge key={countryCode} variant="secondary" className="text-xs">
                          {country?.name}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                countries: formData.countries.filter((c) => c !== countryCode),
                              })
                            }
                            className="ml-2 text-xs hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-status"
                checked={formData.status}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
              />
              <Label htmlFor="edit-status">Active</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

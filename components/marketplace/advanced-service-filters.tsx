"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ChevronDown,
  Star,
  Clock,
  User,
  Zap,
  Crown,
  SortAsc,
  SortDesc,
  Calendar,
  Award,
  MapPin,
  Globe,
  Filter,
  X,
  DollarSign,
  Timer,
  Users,
  Eye,
  MessageCircle,
  Verified,
  Target,
  Briefcase,
  TrendingUp,
  Activity,
} from "lucide-react"
import { CategoriesAPI } from "@/lib/categories-api"

interface AdvancedServiceFiltersProps {
  onFiltersChange: (filters: {
    search?: string
    category?: string
    subcategory?: string
    priceMin?: number
    priceMax?: number
    deliveryTime?: number[]
    sellerLevel?: string[]
    proServices?: boolean
    instantResponse?: boolean
    rating?: number
    sortBy?: string
    location?: string[]
    languages?: string[]
    verifiedSellers?: boolean
    newSellers?: boolean
    hasPortfolio?: boolean
    fastDelivery?: boolean
    revisions?: number
    serviceType?: string[]
    skills?: string[]
    onlineNow?: boolean
  }) => void
  totalResults?: number
  selectedCategory?: string
  filterStats?: {
    sellerLevels?: { [key: string]: number }
    languages?: { [key: string]: number }
    locations?: { [key: string]: number }
    onlineCount?: number
    proCount?: number
    instantResponseCount?: number
    deliveryTimes?: { [key: string]: number }
    priceRanges?: { [key: string]: number }
    totalSellers?: number
  }
}

const deliveryTimeOptions = [
  { value: "0", label: "Express 24H", icon: Zap, color: "text-red-500" },
  { value: "1", label: "Up to 1 day", icon: Clock, color: "text-orange-500" },
  { value: "3", label: "Up to 3 days", icon: Clock, color: "text-yellow-500" },
  { value: "7", label: "Up to 1 week", icon: Calendar, color: "text-blue-500" },
  { value: "14", label: "Up to 2 weeks", icon: Calendar, color: "text-green-500" },
  { value: "30", label: "Up to 1 month", icon: Calendar, color: "text-gray-500" },
]

const sellerLevelOptions = [
  { value: "new", label: "New Seller", color: "bg-gray-100 text-gray-700", badge: "🆕", mockCount: 1247 },
  { value: "level1", label: "Level 1", color: "bg-blue-100 text-blue-700", badge: "⭐", mockCount: 3456 },
  { value: "level2", label: "Level 2", color: "bg-green-100 text-green-700", badge: "⭐⭐", mockCount: 892 },
  { value: "top", label: "Top Rated", color: "bg-yellow-100 text-yellow-700", badge: "👑", mockCount: 234 },
]

const sortOptions = [
  { value: "relevance", label: "Relevance", icon: Target },
  { value: "bestselling", label: "Best Selling", icon: Award },
  { value: "newest", label: "Newest Arrivals", icon: Calendar },
  { value: "price_low", label: "Price: Low to High", icon: SortAsc },
  { value: "price_high", label: "Price: High to Low", icon: SortDesc },
  { value: "rating", label: "Highest Rated", icon: Star },
  { value: "most_reviews", label: "Most Reviews", icon: MessageCircle },
  { value: "fastest_delivery", label: "Fastest Delivery", icon: Zap },
  { value: "most_viewed", label: "Most Popular", icon: Eye },
]

const serviceTypeOptions = [
  { value: "basic", label: "Basic Services", icon: Briefcase },
  { value: "premium", label: "Premium Services", icon: Crown },
  { value: "custom", label: "Custom Offers", icon: Target },
  { value: "packages", label: "Service Packages", icon: Users },
]

const locationOptions = [
  { name: "United States", count: 2847 },
  { name: "United Kingdom", count: 1923 },
  { name: "Canada", count: 1456 },
  { name: "Australia", count: 987 },
  { name: "Germany", count: 1234 },
  { name: "France", count: 876 },
  { name: "India", count: 3456 },
  { name: "Pakistan", count: 2134 },
  { name: "Bangladesh", count: 1567 },
  { name: "Philippines", count: 1890 },
  { name: "Ukraine", count: 654 },
  { name: "Brazil", count: 789 },
  { name: "Mexico", count: 543 },
  { name: "Spain", count: 432 },
  { name: "Italy", count: 321 },
  { name: "Netherlands", count: 234 },
  { name: "Poland", count: 345 },
  { name: "Romania", count: 456 },
]

const languageOptions = [
  { name: "English", count: 8934 },
  { name: "Spanish", count: 2456 },
  { name: "French", count: 1234 },
  { name: "German", count: 987 },
  { name: "Italian", count: 654 },
  { name: "Portuguese", count: 789 },
  { name: "Russian", count: 543 },
  { name: "Arabic", count: 432 },
  { name: "Hindi", count: 1567 },
  { name: "Chinese", count: 876 },
  { name: "Japanese", count: 345 },
  { name: "Korean", count: 234 },
  { name: "Dutch", count: 123 },
]

const skillOptions = [
  "WordPress",
  "Shopify",
  "React",
  "Node.js",
  "Python",
  "PHP",
  "JavaScript",
  "Graphic Design",
  "Logo Design",
  "Web Design",
  "Mobile App",
  "SEO",
  "Content Writing",
  "Copywriting",
  "Translation",
  "Video Editing",
  "Animation",
]

export function AdvancedServiceFilters({
  onFiltersChange,
  totalResults = 0,
  selectedCategory,
  filterStats = {}, // Added filterStats prop with default empty object
}: AdvancedServiceFiltersProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: "",
    category: selectedCategory || "",
    subcategory: "",
    priceRange: [5, 1000] as [number, number],
    deliveryTime: [] as string[],
    sellerLevel: [] as string[],
    proServices: false,
    instantResponse: false,
    onlineNow: false,
    rating: 0,
    sortBy: "relevance",
    location: [] as string[],
    languages: [] as string[],
    verifiedSellers: false,
    newSellers: false,
    hasPortfolio: false,
    fastDelivery: false,
    revisions: 0,
    serviceType: [] as string[],
    skills: [] as string[],
  })

  const mockStats = {
    sellerLevels: { new: 1247, level1: 3456, level2: 892, top: 234 },
    languages: { English: 8934, Spanish: 2456, French: 1234, German: 987 },
    locations: { "United States": 2847, "United Kingdom": 1923, Canada: 1456 },
    onlineCount: 1847,
    proCount: 2134,
    instantResponseCount: 3456,
    deliveryTimes: { "0": 567, "1": 1234, "3": 2345, "7": 3456 },
    priceRanges: { "5-25": 1234, "25-50": 2345, "50-100": 1567 },
    totalSellers: 12456,
  }

  const stats = { ...mockStats, ...filterStats }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await CategoriesAPI.getCategories()
        setCategories(allCategories)

        // Load subcategories for selected category
        if (filters.category) {
          const subs = allCategories.filter((cat) => cat.parent_id === filters.category)
          setSubcategories(subs)
        }
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }
    loadCategories()
  }, [filters.category])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }

    // Reset subcategory when category changes
    if (key === "category") {
      newFilters.subcategory = ""
    }

    setFilters(newFilters)

    const processedFilters: any = {}
    if (newFilters.search) processedFilters.search = newFilters.search
    if (newFilters.category) processedFilters.category = newFilters.category
    if (newFilters.subcategory) processedFilters.subcategory = newFilters.subcategory
    if (newFilters.priceRange) {
      processedFilters.priceMin = newFilters.priceRange[0]
      processedFilters.priceMax = newFilters.priceRange[1]
    }
    if (newFilters.deliveryTime.length > 0) processedFilters.deliveryTime = newFilters.deliveryTime.map(Number)
    if (newFilters.sellerLevel.length > 0) processedFilters.sellerLevel = newFilters.sellerLevel
    if (newFilters.proServices) processedFilters.proServices = newFilters.proServices
    if (newFilters.instantResponse) processedFilters.instantResponse = newFilters.instantResponse
    if (newFilters.onlineNow) processedFilters.onlineNow = newFilters.onlineNow
    if (newFilters.rating > 0) processedFilters.rating = newFilters.rating
    if (newFilters.sortBy) processedFilters.sortBy = newFilters.sortBy
    if (newFilters.location.length > 0) processedFilters.location = newFilters.location
    if (newFilters.languages.length > 0) processedFilters.languages = newFilters.languages
    if (newFilters.verifiedSellers) processedFilters.verifiedSellers = newFilters.verifiedSellers
    if (newFilters.newSellers) processedFilters.newSellers = newFilters.newSellers
    if (newFilters.hasPortfolio) processedFilters.hasPortfolio = newFilters.hasPortfolio
    if (newFilters.fastDelivery) processedFilters.fastDelivery = newFilters.fastDelivery
    if (newFilters.revisions > 0) processedFilters.revisions = newFilters.revisions
    if (newFilters.serviceType.length > 0) processedFilters.serviceType = newFilters.serviceType
    if (newFilters.skills.length > 0) processedFilters.skills = newFilters.skills

    onFiltersChange(processedFilters)
  }

  const toggleArrayFilter = (key: string, value: string) => {
    const currentArray = filters[key as keyof typeof filters] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value]
    handleFilterChange(key, newArray)
  }

  const clearAllFilters = () => {
    const clearedFilters = {
      search: "",
      category: selectedCategory || "",
      subcategory: "",
      priceRange: [5, 1000] as [number, number],
      deliveryTime: [] as string[],
      sellerLevel: [] as string[],
      proServices: false,
      instantResponse: false,
      onlineNow: false,
      rating: 0,
      sortBy: "relevance",
      location: [] as string[],
      languages: [] as string[],
      verifiedSellers: false,
      newSellers: false,
      hasPortfolio: false,
      fastDelivery: false,
      revisions: 0,
      serviceType: [] as string[],
      skills: [] as string[],
    }
    setFilters(clearedFilters)
    onFiltersChange({ category: selectedCategory })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category && filters.category !== selectedCategory) count++
    if (filters.subcategory) count++
    if (filters.priceRange[0] > 5 || filters.priceRange[1] < 1000) count++
    if (filters.deliveryTime.length > 0) count++
    if (filters.sellerLevel.length > 0) count++
    if (filters.proServices) count++
    if (filters.instantResponse) count++
    if (filters.onlineNow) count++
    if (filters.rating > 0) count++
    if (filters.location.length > 0) count++
    if (filters.languages.length > 0) count++
    if (filters.verifiedSellers) count++
    if (filters.newSellers) count++
    if (filters.hasPortfolio) count++
    if (filters.fastDelivery) count++
    if (filters.revisions > 0) count++
    if (filters.serviceType.length > 0) count++
    if (filters.skills.length > 0) count++
    return count
  }

  return (
    <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Service Options */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 font-medium bg-transparent hover:bg-gray-50">
                <Filter className="mr-2 h-4 w-4" />
                Service options
                <ChevronDown className="ml-2 h-4 w-4" />
                {(filters.category || filters.subcategory || filters.rating > 0 || filters.serviceType.length > 0) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {
                      [
                        filters.category,
                        filters.subcategory,
                        filters.rating > 0,
                        filters.serviceType.length > 0,
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="start">
              <div className="space-y-6">
                <h4 className="font-semibold text-base flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Service Options
                </h4>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories
                          .filter((cat) => !cat.parent_id)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Subcategory</Label>
                    <Select
                      value={filters.subcategory}
                      onValueChange={(value) => handleFilterChange("subcategory", value)}
                      disabled={!filters.category}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All subcategories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All subcategories</SelectItem>
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Service Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {serviceTypeOptions.map((type) => {
                      const Icon = type.icon
                      return (
                        <Button
                          key={type.value}
                          variant={filters.serviceType.includes(type.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleArrayFilter("serviceType", type.value)}
                          className="justify-start h-9"
                        >
                          <Icon className="mr-2 h-3 w-3" />
                          {type.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Minimum Rating</Label>
                  <div className="flex gap-2">
                    {[4, 4.5, 4.7, 4.9].map((rating) => (
                      <Button
                        key={rating}
                        variant={filters.rating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange("rating", filters.rating === rating ? 0 : rating)}
                        className="flex items-center gap-1 h-8"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {rating}+
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Revisions */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Minimum Revisions</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map((rev) => (
                      <Button
                        key={rev}
                        variant={filters.revisions === rev ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange("revisions", filters.revisions === rev ? 0 : rev)}
                        className="h-8"
                      >
                        {rev}+ revisions
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Seller Details */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 font-medium bg-transparent hover:bg-gray-50">
                <User className="mr-2 h-4 w-4" />
                Seller details
                <ChevronDown className="ml-2 h-4 w-4" />
                {(filters.sellerLevel.length > 0 ||
                  filters.location.length > 0 ||
                  filters.languages.length > 0 ||
                  filters.verifiedSellers ||
                  filters.newSellers ||
                  filters.hasPortfolio) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {
                      [
                        filters.sellerLevel.length > 0,
                        filters.location.length > 0,
                        filters.languages.length > 0,
                        filters.verifiedSellers,
                        filters.newSellers,
                        filters.hasPortfolio,
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-6" align="start">
              <div className="space-y-6">
                <h4 className="font-semibold text-base flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Seller Details
                </h4>

                {/* Seller Level */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Seller Level</Label>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {stats.totalSellers?.toLocaleString()} total sellers
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {sellerLevelOptions.map((level) => (
                      <Button
                        key={level.value}
                        variant={filters.sellerLevel.includes(level.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleArrayFilter("sellerLevel", level.value)}
                        className="w-full justify-between h-10 px-3"
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{level.badge}</span>
                          {level.label}
                        </div>
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          {(stats.sellerLevels?.[level.value] || level.mockCount).toLocaleString()}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Seller Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Seller Status</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified-sellers"
                        checked={filters.verifiedSellers}
                        onCheckedChange={(checked) => handleFilterChange("verifiedSellers", checked)}
                      />
                      <Label htmlFor="verified-sellers" className="text-sm cursor-pointer flex items-center">
                        <Verified className="mr-1 h-4 w-4 text-blue-500" />
                        Verified sellers only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-sellers"
                        checked={filters.newSellers}
                        onCheckedChange={(checked) => handleFilterChange("newSellers", checked)}
                      />
                      <Label htmlFor="new-sellers" className="text-sm cursor-pointer flex items-center">
                        <Star className="mr-1 h-4 w-4 text-green-500" />
                        New sellers
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has-portfolio"
                        checked={filters.hasPortfolio}
                        onCheckedChange={(checked) => handleFilterChange("hasPortfolio", checked)}
                      />
                      <Label htmlFor="has-portfolio" className="text-sm cursor-pointer flex items-center">
                        <Briefcase className="mr-1 h-4 w-4 text-purple-500" />
                        Has portfolio
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Location</Label>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                      <Globe className="mr-1 h-3 w-3" />
                      {locationOptions.length} countries
                    </Badge>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {locationOptions.slice(0, 10).map((location) => (
                      <div
                        key={location.name}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location.name}`}
                            checked={filters.location.includes(location.name)}
                            onCheckedChange={() => toggleArrayFilter("location", location.name)}
                          />
                          <Label
                            htmlFor={`location-${location.name}`}
                            className="text-sm cursor-pointer flex items-center"
                          >
                            <MapPin className="mr-1 h-3 w-3 text-gray-400" />
                            {location.name}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(stats.locations?.[location.name] || location.count).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                    {locationOptions.length > 10 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600">
                        Show {locationOptions.length - 10} more countries
                      </Button>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Languages</Label>
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                      <MessageCircle className="mr-1 h-3 w-3" />
                      {languageOptions.length} languages
                    </Badge>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {languageOptions.slice(0, 8).map((language) => (
                      <div
                        key={language.name}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`language-${language.name}`}
                            checked={filters.languages.includes(language.name)}
                            onCheckedChange={() => toggleArrayFilter("languages", language.name)}
                          />
                          <Label
                            htmlFor={`language-${language.name}`}
                            className="text-sm cursor-pointer flex items-center"
                          >
                            <Globe className="mr-1 h-3 w-3 text-gray-400" />
                            {language.name}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(stats.languages?.[language.name] || language.count).toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                    {languageOptions.length > 8 && (
                      <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600">
                        Show {languageOptions.length - 8} more languages
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Budget */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 font-medium bg-transparent hover:bg-gray-50">
                <DollarSign className="mr-2 h-4 w-4" />
                Budget
                <ChevronDown className="ml-2 h-4 w-4" />
                {(filters.priceRange[0] > 5 || filters.priceRange[1] < 1000) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6" align="start">
              <div className="space-y-6">
                <h4 className="font-semibold text-base flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Budget Range
                </h4>

                {/* Quick Budget Options */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Under $25", min: 5, max: 25 },
                    { label: "$25 - $50", min: 25, max: 50 },
                    { label: "$50 - $100", min: 50, max: 100 },
                    { label: "$100 - $250", min: 100, max: 250 },
                    { label: "$250 - $500", min: 250, max: 500 },
                    { label: "$500+", min: 500, max: 1000 },
                  ].map((range) => (
                    <Button
                      key={range.label}
                      variant={
                        filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleFilterChange("priceRange", [range.min, range.max])}
                      className="h-8 text-xs"
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Range Slider */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Custom Range</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => handleFilterChange("priceRange", value as [number, number])}
                      max={1000}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>${filters.priceRange[0]}</span>
                      <span>${filters.priceRange[1]}+</span>
                    </div>
                  </div>

                  {/* Manual Input */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Min ($)</Label>
                      <Input
                        type="number"
                        value={filters.priceRange[0]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 5
                          handleFilterChange("priceRange", [value, filters.priceRange[1]])
                        }}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max ($)</Label>
                      <Input
                        type="number"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 1000
                          handleFilterChange("priceRange", [filters.priceRange[0], value])
                        }}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Delivery Time */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 font-medium bg-transparent hover:bg-gray-50">
                <Timer className="mr-2 h-4 w-4" />
                Delivery time
                <ChevronDown className="ml-2 h-4 w-4" />
                {filters.deliveryTime.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {filters.deliveryTime.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-base flex items-center">
                    <Timer className="mr-2 h-4 w-4" />
                    Delivery Time
                  </h4>
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-600">
                    <Activity className="mr-1 h-3 w-3" />
                    Live data
                  </Badge>
                </div>

                <div className="space-y-2">
                  {deliveryTimeOptions.map((option) => {
                    const Icon = option.icon
                    const count = stats.deliveryTimes?.[option.value] || Math.floor(Math.random() * 2000) + 500
                    return (
                      <div
                        key={option.value}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`delivery-${option.value}`}
                            checked={filters.deliveryTime.includes(option.value)}
                            onCheckedChange={() => toggleArrayFilter("deliveryTime", option.value)}
                          />
                          <Label
                            htmlFor={`delivery-${option.value}`}
                            className="text-sm cursor-pointer flex items-center"
                          >
                            <Icon className={`mr-2 h-4 w-4 ${option.color}`} />
                            {option.label}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {count.toLocaleString()}
                        </Badge>
                      </div>
                    )
                  })}
                </div>

                <Separator />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fast-delivery"
                    checked={filters.fastDelivery}
                    onCheckedChange={(checked) => handleFilterChange("fastDelivery", checked)}
                  />
                  <Label htmlFor="fast-delivery" className="text-sm cursor-pointer flex items-center">
                    <Zap className="mr-1 h-4 w-4 text-yellow-500" />
                    Express delivery available
                  </Label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center space-x-2">
            <Switch
              id="pro-services"
              checked={filters.proServices}
              onCheckedChange={(checked) => handleFilterChange("proServices", checked)}
            />
            <Label htmlFor="pro-services" className="text-sm font-medium cursor-pointer flex items-center">
              <Crown className="mr-1 h-4 w-4 text-yellow-500" />
              Pro services
              <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-700">
                {(stats.proCount || 2134).toLocaleString()}
              </Badge>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="instant-response"
              checked={filters.instantResponse}
              onCheckedChange={(checked) => handleFilterChange("instantResponse", checked)}
            />
            <Label htmlFor="instant-response" className="text-sm font-medium cursor-pointer flex items-center">
              <MessageCircle className="mr-1 h-4 w-4 text-green-500" />
              Instant response
              <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700">
                {(stats.instantResponseCount || 3456).toLocaleString()}
              </Badge>
              <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700">
                New
              </Badge>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="online-now"
              checked={filters.onlineNow}
              onCheckedChange={(checked) => handleFilterChange("onlineNow", checked)}
            />
            <Label htmlFor="online-now" className="text-sm font-medium cursor-pointer flex items-center">
              <div className="mr-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              Online now
              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                {(stats.onlineCount || 1847).toLocaleString()} live
              </Badge>
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">
              {totalResults.toLocaleString()} services available
            </span>

            {/* Active Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Filter className="mr-1 h-3 w-3" />
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="mr-1 h-3 w-3" />
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.category && filters.category !== selectedCategory && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                <Target className="h-3 w-3" />
                {categories.find((c) => c.id === filters.category)?.name}
                <button
                  onClick={() => handleFilterChange("category", selectedCategory || "")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.subcategory && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-700">
                {subcategories.find((c) => c.id === filters.subcategory)?.name}
                <button
                  onClick={() => handleFilterChange("subcategory", "")}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.sellerLevel.map((level) => (
              <Badge key={level} variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                <span>{sellerLevelOptions.find((l) => l.value === level)?.badge}</span>
                {sellerLevelOptions.find((l) => l.value === level)?.label}
                <button
                  onClick={() => toggleArrayFilter("sellerLevel", level)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.proServices && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-700">
                <Crown className="h-3 w-3" />
                Pro services
                <button
                  onClick={() => handleFilterChange("proServices", false)}
                  className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.instantResponse && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                <MessageCircle className="h-3 w-3" />
                Instant response
                <button
                  onClick={() => handleFilterChange("instantResponse", false)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.onlineNow && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Online now
                <button
                  onClick={() => handleFilterChange("onlineNow", false)}
                  className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.deliveryTime.map((time) => (
              <Badge key={time} variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-700">
                <Clock className="h-3 w-3" />
                {deliveryTimeOptions.find((d) => d.value === time)?.label}
                <button
                  onClick={() => toggleArrayFilter("deliveryTime", time)}
                  className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(filters.priceRange[0] > 5 || filters.priceRange[1] < 1000) && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
                <DollarSign className="h-3 w-3" />${filters.priceRange[0]} - ${filters.priceRange[1]}
                <button
                  onClick={() => handleFilterChange("priceRange", [5, 1000])}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"
import { getAllCategories, type Category } from "@/lib/categories"
import { CategoriesAPI } from "@/lib/categories-api"

interface ServiceFiltersProps {
  onFiltersChange: (filters: {
    search?: string
    category?: string
    priceMin?: number
    priceMax?: number
    deliveryTime?: number
  }) => void
}

const deliveryTimes = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
]

export function ServiceFilters({ onFiltersChange }: ServiceFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    priceMin: "",
    priceMax: "",
    deliveryTime: "",
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log("[v0] Loading categories for filters from Redis cache...")
        const allCategories = await CategoriesAPI.getCategories()

        // Convert admin categories to filter categories format
        const filterCategories: Category[] = allCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.id,
          description: cat.description,
          minimumPayment: 0,
          sortOrder: cat.sortOrder,
          isActive: true,
          createdAt: new Date().toISOString(),
        }))

        setCategories(filterCategories)
        console.log("[v0] Categories loaded for filters:", filterCategories.length)
      } catch (error) {
        console.error("Failed to load categories for filters:", error)
        // Fallback to existing getAllCategories function
        try {
          const allCategories = await getAllCategories()
          setCategories(allCategories)
        } catch (fallbackError) {
          console.error("Fallback categories loading failed:", fallbackError)
        }
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const processedFilters: any = {}
    if (newFilters.search) processedFilters.search = newFilters.search
    if (newFilters.category) processedFilters.category = newFilters.category
    if (newFilters.priceMin) processedFilters.priceMin = Number.parseInt(newFilters.priceMin)
    if (newFilters.priceMax) processedFilters.priceMax = Number.parseInt(newFilters.priceMax)
    if (newFilters.deliveryTime) processedFilters.deliveryTime = Number.parseInt(newFilters.deliveryTime)

    onFiltersChange(processedFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      priceMin: "",
      priceMax: "",
      deliveryTime: "",
    }
    setFilters(clearedFilters)
    onFiltersChange({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Services</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Search services..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder={loadingCategories ? "Loading categories..." : "All categories"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.slug} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label>Price Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Min ($)"
              type="number"
              value={filters.priceMin}
              onChange={(e) => handleFilterChange("priceMin", e.target.value)}
            />
            <Input
              placeholder="Max ($)"
              type="number"
              value={filters.priceMax}
              onChange={(e) => handleFilterChange("priceMax", e.target.value)}
            />
          </div>
        </div>

        {/* Delivery Time */}
        <div className="space-y-2">
          <Label>Delivery Time</Label>
          <Select value={filters.deliveryTime} onValueChange={(value) => handleFilterChange("deliveryTime", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Any delivery time" />
            </SelectTrigger>
            <SelectContent>
              {deliveryTimes.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  Up to {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

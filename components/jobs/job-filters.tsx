"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, X } from "lucide-react"

interface JobFiltersProps {
  onFiltersChange: (filters: {
    search?: string
    category?: string
    location?: string
    remote?: boolean
    budgetMin?: number
    budgetMax?: number
  }) => void
}

const categories = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "design-creative", label: "Design & Creative" },
  { value: "writing-translation", label: "Writing & Translation" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "data-analytics", label: "Data & Analytics" },
]

export function JobFilters({ onFiltersChange }: JobFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    remote: false,
    budgetMin: "",
    budgetMax: "",
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    // Convert to the expected format
    const processedFilters: any = {}
    if (newFilters.search) processedFilters.search = newFilters.search
    if (newFilters.category) processedFilters.category = newFilters.category
    if (newFilters.location) processedFilters.location = newFilters.location
    if (newFilters.remote) processedFilters.remote = newFilters.remote
    if (newFilters.budgetMin) processedFilters.budgetMin = Number.parseInt(newFilters.budgetMin)
    if (newFilters.budgetMax) processedFilters.budgetMax = Number.parseInt(newFilters.budgetMax)

    onFiltersChange(processedFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      location: "",
      remote: false,
      budgetMin: "",
      budgetMax: "",
    }
    setFilters(clearedFilters)
    onFiltersChange({})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Search jobs..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Category</Label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
            <SelectTrigger className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
            Location
          </Label>
          <Input
            id="location"
            placeholder="Any location"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 py-2">
          <Checkbox
            id="remote"
            checked={filters.remote}
            onCheckedChange={(checked) => handleFilterChange("remote", checked)}
            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label htmlFor="remote" className="text-sm font-medium text-gray-700 cursor-pointer">
            Remote only
          </Label>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Budget Range</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Min ($)"
              type="number"
              value={filters.budgetMin}
              onChange={(e) => handleFilterChange("budgetMin", e.target.value)}
              className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Input
              placeholder="Max ($)"
              type="number"
              value={filters.budgetMax}
              onChange={(e) => handleFilterChange("budgetMax", e.target.value)}
              className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

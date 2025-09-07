"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { JobCard } from "@/components/jobs/job-card"
import { Heart, Search, Grid, List, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/hooks/use-favorites"

export default function FavoritesPage() {
  const { user } = useAuth()
  const { favorites, isLoading, clearAllFavorites } = useFavorites()
  const [filteredFavorites, setFilteredFavorites] = useState(favorites)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    filterAndSortFavorites()
  }, [favorites, searchQuery, categoryFilter, sortBy])

  const filterAndSortFavorites = () => {
    let filtered = [...favorites]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.category.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((job) => job.category.name === categoryFilter)
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "price-high":
        filtered.sort((a, b) => b.budgetMax - a.budgetMax)
        break
      case "price-low":
        filtered.sort((a, b) => a.budgetMax - b.budgetMax)
        break
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "favorited":
        filtered.sort(
          (a, b) => new Date(b.favoritedAt || b.createdAt).getTime() - new Date(a.favoritedAt || a.createdAt).getTime(),
        )
        break
    }

    setFilteredFavorites(filtered)
  }

  const getUniqueCategories = () => {
    const categories = favorites.map((job) => job.category.name)
    return [...new Set(categories)]
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            My Favorites
          </h1>
          <p className="text-gray-600 mt-1">Jobs you've saved for later • {favorites.length} total</p>
        </div>
        {favorites.length > 0 && (
          <Button
            variant="outline"
            onClick={clearAllFavorites}
            className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start exploring jobs and click the heart icon to save them here for easy access later.
            </p>
            <Button asChild>
              <a href="/jobs">Browse Jobs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search favorites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {getUniqueCategories().map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="favorited">Recently Favorited</SelectItem>
                      <SelectItem value="newest">Newest Jobs</SelectItem>
                      <SelectItem value="oldest">Oldest Jobs</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {(searchQuery || categoryFilter !== "all") && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Showing {filteredFavorites.length} of {favorites.length} favorites
              </span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Category: {categoryFilter}
                </Badge>
              )}
            </div>
          )}

          {/* Jobs Grid/List */}
          {filteredFavorites.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredFavorites.map((job) => (
                <div key={job.id} className={viewMode === "list" ? "max-w-none" : ""}>
                  <JobCard job={job} showApplyButton={true} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

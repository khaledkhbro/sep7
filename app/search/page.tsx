"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, MapPin, Star, Clock, Users, Briefcase, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useMarketplace } from "@/components/marketplace/marketplace-provider"
import { serviceStorage } from "@/lib/local-storage"

interface SearchResult {
  id: string
  type: "job" | "service" | "user"
  title: string
  description: string
  price?: number
  location?: string
  rating?: number
  reviews?: number
  imageUrl?: string
  user?: {
    name: string
    username: string
    avatar?: string
  }
  tags: string[]
  createdAt: string
}

const mockResults: SearchResult[] = [
  {
    id: "1",
    type: "job",
    title: "React Developer for E-commerce Platform",
    description:
      "Looking for an experienced React developer to build a modern e-commerce platform with advanced features.",
    price: 2500,
    location: "Remote",
    tags: ["React", "JavaScript", "E-commerce"],
    user: { name: "John Smith", username: "johnsmith" },
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "3",
    type: "user",
    title: "Sarah Johnson - UI/UX Designer",
    description: "Creative UI/UX designer with 5+ years of experience in web and mobile design.",
    rating: 4.9,
    reviews: 89,
    tags: ["UI/UX Design", "Figma", "Prototyping"],
    user: { name: "Sarah Johnson", username: "sarah_designer" },
    createdAt: "2023-01-15T10:00:00Z",
  },
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [priceRange, setPriceRange] = useState("all")

  const { isUserInVacationMode } = useMarketplace()

  useEffect(() => {
    if (query) {
      performSearch()
    }
  }, [query, activeTab, sortBy, priceRange])

  const performSearch = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      const userServices = serviceStorage.getAll()
      const activeUserServices = userServices
        .filter((service) => service.status === "active")
        .filter((service) => !isUserInVacationMode(service.sellerId))
        .map((service) => ({
          id: service.id,
          type: "service" as const,
          title: service.title,
          description: service.description,
          price: service.price,
          rating: service.rating,
          reviews: service.totalOrders,
          imageUrl: service.images[0],
          tags: service.tags,
          user: {
            name: `${service.seller.firstName} ${service.seller.lastName}`,
            username: service.seller.username,
          },
          createdAt: service.createdAt,
        }))

      // Combine with mock results (excluding mock services to avoid duplicates)
      const mockNonServiceResults = mockResults.filter((result) => result.type !== "service")
      const allResults = [...mockNonServiceResults, ...activeUserServices]

      let filteredResults = allResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
      )

      if (activeTab !== "all") {
        filteredResults = filteredResults.filter((result) => result.type === activeTab)
      }

      setResults(filteredResults)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "job":
        return <Briefcase className="h-5 w-5 text-blue-600" />
      case "service":
        return <ShoppingBag className="h-5 w-5 text-green-600" />
      case "user":
        return <Users className="h-5 w-5 text-purple-600" />
    }
  }

  const filteredResults = results.filter((result) => {
    if (activeTab !== "all" && result.type !== activeTab) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search jobs, services, or freelancers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
              <Button type="submit" className="absolute right-2 top-2 bottom-2">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="0-100">$0 - $100</SelectItem>
                      <SelectItem value="100-500">$100 - $500</SelectItem>
                      <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                      <SelectItem value="1000+">$1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                  <TabsTrigger value="job">Jobs ({results.filter((r) => r.type === "job").length})</TabsTrigger>
                  <TabsTrigger value="service">
                    Services ({results.filter((r) => r.type === "service").length})
                  </TabsTrigger>
                  <TabsTrigger value="user">
                    Freelancers ({results.filter((r) => r.type === "user").length})
                  </TabsTrigger>
                </TabsList>

                <div className="text-sm text-gray-600">
                  {loading ? "Searching..." : `${filteredResults.length} results found`}
                </div>
              </div>

              <TabsContent value={activeTab}>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex space-x-4">
                            <div className="w-16 h-16 bg-gray-200 rounded"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <Card key={result.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              {result.type === "user" ? (
                                <Avatar className="h-16 w-16">
                                  <AvatarFallback>
                                    {result.user?.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                              ) : result.imageUrl ? (
                                <img
                                  src={result.imageUrl || "/placeholder.svg"}
                                  alt={result.title}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                  {getResultIcon(result.type)}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getResultIcon(result.type)}
                                  <Badge variant="outline" className="text-xs">
                                    {result.type}
                                  </Badge>
                                </div>
                                {result.price && (
                                  <span className="text-lg font-bold text-green-600">${result.price}</span>
                                )}
                              </div>

                              <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                                <Link
                                  href={
                                    result.type === "job"
                                      ? `/jobs/${result.id}`
                                      : result.type === "service"
                                        ? `/marketplace/${result.id}`
                                        : `/profile/${result.user?.username}`
                                  }
                                >
                                  {result.title}
                                </Link>
                              </h3>

                              <p className="text-gray-600 mb-3 line-clamp-2">{result.description}</p>

                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                {result.user && <span>by {result.user.name}</span>}
                                {result.location && (
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {result.location}
                                  </div>
                                )}
                                {result.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                                    {result.rating} ({result.reviews})
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(result.createdAt).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {result.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {result.tags.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{result.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                    <Button onClick={() => setQuery("")}>Clear Search</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

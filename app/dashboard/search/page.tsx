"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Clock } from "lucide-react"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setLoading(true)
    // Simulate search API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock search results
    const mockResults = [
      {
        id: 1,
        title: "React Developer Needed",
        description: "Looking for an experienced React developer to build a modern web application",
        price: 500,
        location: "Remote",
        timeAgo: "2 hours ago",
        type: "job",
      },
      {
        id: 2,
        title: "Logo Design Service",
        description: "Professional logo design for your business or startup",
        price: 150,
        location: "Remote",
        timeAgo: "1 day ago",
        type: "service",
      },
    ].filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    setResults(mockResults)
    setLoading(false)
  }

  useEffect(() => {
    if (query) {
      handleSearch(query)
    }
  }, [query])

  return (
    <>
      <DashboardHeader
        title="Search Results"
        description={query ? `Results for "${query}"` : "Search jobs and services"}
      />

      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search jobs, services, skills..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching...</p>
            </div>
          ) : (
            <>
              {results.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-600">Found {results.length} results</p>
                </div>
              )}

              <div className="space-y-4">
                {results.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={item.type === "job" ? "default" : "secondary"}>
                              {item.type === "job" ? "Job" : "Service"}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-600 mb-4">{item.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {item.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {item.timeAgo}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600 mb-2">${item.price}</div>
                          <Button>{item.type === "job" ? "Apply Now" : "Order Now"}</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {query && results.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or browse all available jobs and services.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

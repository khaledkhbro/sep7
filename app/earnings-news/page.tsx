"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DollarSign, MapPin, Calendar, TrendingUp, Globe } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EarningsNews {
  id: string
  title: string
  thumbnail: string
  description: string
  money: number
  countries: string[] | null
  created_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const COUNTRIES = {
  US: "United States",
  UK: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  JP: "Japan",
  AU: "Australia",
  CA: "Canada",
  SG: "Singapore",
  HK: "Hong Kong",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
}

const LazyNewsImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {isLoading && <div className="absolute inset-0 bg-muted animate-pulse rounded" />}
      <Image
        src={error ? "/placeholder.svg?height=200&width=300&query=news" : src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true)
          setIsLoading(false)
        }}
        loading="lazy"
      />
    </div>
  )
}

export default function EarningsNewsPage() {
  const [news, setNews] = useState<EarningsNews[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [loading, setLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState<EarningsNews | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Mock user country - in real app, get from user profile or geolocation
  const userCountry = "US"

  const fetchNews = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/earnings-news?country=${userCountry}&page=${page}`)
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getCountryNames = (countryCodes: string[] | null) => {
    if (!countryCodes || countryCodes.length === 0) return "Global"
    return countryCodes.map((code) => COUNTRIES[code as keyof typeof COUNTRIES] || code).join(", ")
  }

  const openDetailDialog = (newsItem: EarningsNews) => {
    setSelectedNews(newsItem)
    setIsDetailOpen(true)
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
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Earnings News
        </h1>
        <p className="text-lg text-muted-foreground">
          Stay updated with the latest earning opportunities and market insights
        </p>
      </div>

      {/* Stats Banner */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{pagination.total}</div>
              <div className="text-sm text-muted-foreground">Active Opportunities</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatMoney(news.reduce((sum, n) => sum + Number(n.money), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {COUNTRIES[userCountry as keyof typeof COUNTRIES]}
              </div>
              <div className="text-sm text-muted-foreground">Your Region</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      {news.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No earnings news available</h3>
            <p className="text-muted-foreground">Check back later for new earning opportunities and market updates.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((newsItem) => (
            <Card key={newsItem.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <div onClick={() => openDetailDialog(newsItem)}>
                <div className="aspect-video relative">
                  <LazyNewsImage
                    src={newsItem.thumbnail || "/placeholder.svg?height=200&width=300&query=earnings-news"}
                    alt={newsItem.title}
                    className="aspect-video"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-600 hover:bg-green-700">{formatMoney(Number(newsItem.money))}</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{newsItem.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{newsItem.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {getCountryNames(newsItem.countries)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(newsItem.created_at)}
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" disabled={!pagination.hasPrev} onClick={() => fetchNews(pagination.page - 1)}>
              Previous
            </Button>
            <span className="flex items-center px-4 py-2 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button variant="outline" disabled={!pagination.hasNext} onClick={() => fetchNews(pagination.page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedNews && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedNews.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <LazyNewsImage
                  src={selectedNews.thumbnail || "/placeholder.svg?height=300&width=600&query=earnings-news-detail"}
                  alt={selectedNews.title}
                  className="w-full h-64 rounded-lg"
                />

                <div className="flex items-center justify-between">
                  <Badge className="bg-green-600 hover:bg-green-700 text-lg px-4 py-2">
                    {formatMoney(Number(selectedNews.money))}
                  </Badge>
                  <div className="text-sm text-muted-foreground">{formatDate(selectedNews.created_at)}</div>
                </div>

                <div className="prose max-w-none">
                  <p className="text-base leading-relaxed">{selectedNews.description}</p>
                </div>

                <div className="flex items-center text-sm text-muted-foreground border-t pt-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Available in: {getCountryNames(selectedNews.countries)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

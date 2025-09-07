"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Heart, Eye, Clock, ChevronLeft, ChevronRight, TrendingUp, Zap, Award, Users } from "lucide-react"

interface ServiceRecommendation {
  id: string
  title: string
  seller: {
    name: string
    avatar?: string
    level: number
    rating: number
    isTopRated: boolean
  }
  price: number
  originalPrice?: number
  rating: number
  reviewCount: number
  image: string
  deliveryTime: string
  tags: string[]
  isChoice?: boolean
  isTrending?: boolean
  viewCount: number
  orderCount: number
  category?: string
  subcategory?: string
  microCategory?: string
  algorithmScore?: number
}

interface EnhancedServiceRecommendationsProps {
  currentServiceId: string
  category?: string
}

export function EnhancedServiceRecommendations({ currentServiceId, category }: EnhancedServiceRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([])
  const [browsingHistory, setBrowsingHistory] = useState<ServiceRecommendation[]>([])
  const [trendingServices, setTrendingServices] = useState<ServiceRecommendation[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAlgorithmRecommendations = async () => {
      try {
        setLoading(true)
        console.log("[v0] Loading algorithm-based recommendations for service:", currentServiceId)

        let algorithmSettings = null
        try {
          const response = await fetch("/api/admin/marketplace-algorithm")
          if (response.ok) {
            algorithmSettings = await response.json()
            console.log("[v0] Loaded algorithm settings:", algorithmSettings)
          }
        } catch (error) {
          console.log("[v0] Algorithm settings unavailable, using defaults:", error)
        }

        const settings = algorithmSettings || {
          enabled: true,
          algorithm: "newest_first",
          weights: {
            popularity: 0.3,
            rating: 0.25,
            views: 0.2,
            orders: 0.15,
            recency: 0.1,
          },
          rotationHours: 8,
          promotedPositions: [1, 4, 7],
        }

        const realServices = await loadRealServices(currentServiceId, category, settings)
        const algorithmRecommendations = applyAlgorithmSorting(realServices, settings)
        const allRecommendations = algorithmRecommendations.slice(0, 12)
        const trending = algorithmRecommendations.filter((s) => s.isTrending).slice(0, 6)
        const history = await loadBrowsingHistory(settings)

        setRecommendations(allRecommendations)
        setTrendingServices(trending)
        setBrowsingHistory(history)

        console.log("[v0] Loaded algorithm recommendations:", {
          total: allRecommendations.length,
          trending: trending.length,
          history: history.length,
        })
      } catch (error) {
        console.error("[v0] Error loading algorithm recommendations:", error)
        await loadBasicRecommendations()
      } finally {
        setLoading(false)
      }
    }

    loadAlgorithmRecommendations()
  }, [currentServiceId, category])

  const loadRealServices = async (
    excludeId: string,
    categoryFilter?: string,
    settings?: any,
  ): Promise<ServiceRecommendation[]> => {
    const services: ServiceRecommendation[] = []

    try {
      const categoriesData = localStorage.getItem("marketplace_categories")
      const servicesData = localStorage.getItem("marketplace_services")

      if (categoriesData) {
        const categories = JSON.parse(categoriesData)

        categories.forEach((cat: any) => {
          if (categoryFilter && cat.name !== categoryFilter) return

          cat.subcategories?.forEach((subcat: any) => {
            subcat.services?.forEach((service: any) => {
              if (service.id === excludeId) return

              services.push({
                id: service.id,
                title: service.name || service.description || "Professional Service",
                seller: {
                  name: generateSellerName(),
                  level: Math.floor(Math.random() * 3) + 1,
                  rating: 4.5 + Math.random() * 0.5,
                  isTopRated: Math.random() > 0.6,
                },
                price: service.price || 50 + Math.random() * 200,
                rating: 4.5 + Math.random() * 0.5,
                reviewCount: Math.floor(Math.random() * 500) + 10,
                image: service.images?.[0] || "/placeholder.svg?height=300&width=400&text=Service",
                deliveryTime: `${service.deliveryTime?.value || Math.floor(Math.random() * 7) + 1} ${service.deliveryTime?.unit || "days"}`,
                tags: [cat.name, subcat.name, "Professional"],
                viewCount: Math.floor(Math.random() * 2000) + 100,
                orderCount: Math.floor(Math.random() * 200) + 5,
                category: cat.name,
                subcategory: subcat.name,
                isTrending: Math.random() > 0.7,
                isChoice: Math.random() > 0.8,
              })
            })
          })
        })
      }

      if (servicesData) {
        const userServices = JSON.parse(servicesData)
        userServices.forEach((service: any) => {
          if (service.id === excludeId) return

          services.push({
            id: service.id,
            title: service.title || "Custom Service",
            seller: {
              name: service.sellerName || "Service Provider",
              level: 2,
              rating: 4.8,
              isTopRated: true,
            },
            price: service.price || 100,
            rating: 4.8,
            reviewCount: Math.floor(Math.random() * 100) + 5,
            image: service.images?.[0] || "/placeholder.svg?height=300&width=400&text=Custom",
            deliveryTime: service.deliveryTime || "3 days",
            tags: service.tags || ["Custom", "Professional"],
            viewCount: Math.floor(Math.random() * 1000) + 50,
            orderCount: Math.floor(Math.random() * 50) + 1,
            category: service.category || "Custom",
            subcategory: service.subcategory || "General",
            isTrending: Math.random() > 0.6,
            isChoice: Math.random() > 0.7,
          })
        })
      }
    } catch (error) {
      console.error("[v0] Error loading real services:", error)
    }

    return services
  }

  const applyAlgorithmSorting = (services: ServiceRecommendation[], settings: any): ServiceRecommendation[] => {
    if (!settings.enabled) {
      return services.sort((a, b) => b.viewCount - a.viewCount)
    }

    const weights = settings.weights || {
      popularity: 0.3,
      rating: 0.25,
      views: 0.2,
      orders: 0.15,
      recency: 0.1,
    }

    const scoredServices = services.map((service) => {
      const popularityScore = (service.orderCount / 200) * weights.popularity
      const ratingScore = (service.rating / 5) * weights.rating
      const viewsScore = (service.viewCount / 2000) * weights.views
      const ordersScore = (service.orderCount / 200) * weights.orders
      const recencyScore = Math.random() * weights.recency

      const algorithmScore = popularityScore + ratingScore + viewsScore + ordersScore + recencyScore

      return {
        ...service,
        algorithmScore,
      }
    })

    const sorted = scoredServices.sort((a, b) => (b.algorithmScore || 0) - (a.algorithmScore || 0))

    if (settings.promotedPositions) {
      const promoted = sorted.filter((s) => s.isChoice || s.isTrending)
      settings.promotedPositions.forEach((pos: number, index: number) => {
        if (promoted[index] && pos < sorted.length) {
          const service = promoted[index]
          const currentIndex = sorted.findIndex((s) => s.id === service.id)
          if (currentIndex !== -1) {
            sorted.splice(currentIndex, 1)
            sorted.splice(pos - 1, 0, service)
          }
        }
      })
    }

    return sorted
  }

  const loadBrowsingHistory = async (settings: any): Promise<ServiceRecommendation[]> => {
    try {
      const historyData = localStorage.getItem("browsing_history")
      if (historyData) {
        const history = JSON.parse(historyData)
        const recentServices = await loadRealServices("", undefined, settings)
        return recentServices.filter((s) => history.some((h: any) => h.serviceId === s.id)).slice(0, 4)
      }
    } catch (error) {
      console.error("[v0] Error loading browsing history:", error)
    }

    const recentServices = await loadRealServices("", undefined, settings)
    return recentServices.slice(0, 4)
  }

  const loadBasicRecommendations = async () => {
    const basicServices = await loadRealServices(currentServiceId, category)
    const shuffled = basicServices.sort(() => Math.random() - 0.5)

    setRecommendations(shuffled.slice(0, 12))
    setTrendingServices(shuffled.filter((s) => s.isTrending).slice(0, 6))
    setBrowsingHistory(shuffled.slice(0, 4))
  }

  const generateSellerName = (): string => {
    const names = [
      "Muhammad I",
      "Sarah K",
      "Alex M",
      "David L",
      "Emma R",
      "John D",
      "Lisa W",
      "Mike C",
      "Anna S",
      "Tom B",
      "Maria G",
      "Chris P",
      "Nina F",
      "Paul R",
      "Kate M",
      "Sam T",
    ]
    return names[Math.floor(Math.random() * names.length)]
  }

  const ServiceCard = ({ service }: { service: ServiceRecommendation }) => (
    <Card className="premium-card service-card-hover group cursor-pointer overflow-hidden">
      <div className="relative">
        <img
          src={service.image || "/placeholder.svg"}
          alt={service.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          {service.isChoice && (
            <Badge className="bg-primary text-primary-foreground font-semibold">
              <Award className="w-3 h-3 mr-1" />
              Choice
            </Badge>
          )}
          {service.isTrending && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4" />
        </Button>
        {service.originalPrice && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="destructive" className="font-semibold">
              {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% OFF
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">{service.seller.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-medium text-gray-700">{service.seller.name}</span>
              {service.seller.isTopRated && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Level {service.seller.level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {service.title}
        </h3>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
            <span className="font-medium">{service.rating.toFixed(1)}</span>
            <span className="ml-1">({service.reviewCount})</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            <span>{service.viewCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {service.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{service.deliveryTime}</span>
          </div>
          <div className="text-right">
            {service.originalPrice && (
              <span className="text-sm text-gray-400 line-through mr-2">${service.originalPrice}</span>
            )}
            <span className="text-lg font-bold text-gray-900">From ${Math.round(service.price)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {service.orderCount} orders
          </span>
          <span className="flex items-center">
            <Zap className="w-3 h-3 mr-1" />
            Offers video consultations
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-12 mt-12">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading personalized recommendations...</p>
        </div>
      </div>
    )
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(recommendations.length / 4))
  }

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + Math.ceil(recommendations.length / 4)) % Math.ceil(recommendations.length / 4),
    )
  }

  return (
    <div className="space-y-12 mt-12">
      {/* People Who Viewed This Service Also Viewed */}
      <section className="fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">People Who Viewed This Service Also Viewed</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prevSlide}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextSlide}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="smart-grid-lg">
          {recommendations.slice(currentSlide * 4, (currentSlide + 1) * 4).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Trending in Category */}
      {trendingServices.length > 0 && (
        <section className="gradient-section-premium p-8 rounded-2xl fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary rounded-lg">
                <TrendingUp className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Trending in {category || "This Category"}</h2>
                <p className="text-gray-600">Hot services everyone's talking about</p>
              </div>
            </div>
            <Button variant="outline" className="bg-white/80">
              View All Trending
            </Button>
          </div>

          <div className="smart-grid">
            {trendingServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {/* Your Browsing History */}
      <section className="fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Browsing History</h2>
              <p className="text-gray-600">Services you've recently viewed</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-500">
              Clear All
            </Button>
            <Button variant="outline" size="sm">
              See All
            </Button>
          </div>
        </div>

        <div className="smart-grid">
          {browsingHistory.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* Recommended for You */}
      <section className="gradient-section p-8 rounded-2xl fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-lg pulse-glow">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
              <p className="text-gray-600">Personalized picks based on your interests</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Explore More</Button>
        </div>

        <div className="smart-grid-lg">
          {recommendations.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>
    </div>
  )
}

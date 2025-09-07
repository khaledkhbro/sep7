"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ShoppingCart, Verified, Crown, MessageCircle, Star, Eye } from "lucide-react"
import { ServicePrice } from "@/components/ui/price-display"

interface MarketplaceService {
  id: string
  title: string
  description: string
  price: number
  rating: number
  totalOrders: number
  viewsCount: number
  seller: {
    firstName: string
    lastName: string
    username: string
    isVerified: boolean
    sellerId?: string
    sellerLevel?: string
    isOnline?: boolean
    hasInstantResponse?: boolean
    location?: string
    languages?: string
    responseTime?: string
    completionRate?: number
    totalReviews?: number
    memberSince?: string
    lastSeen?: string
    avgResponseTime?: number
  }
  images: string[]
  category: {
    name: string
    slug: string
  }
  subcategory: {
    name: string
    slug: string
  }
  deliveryTime: {
    value: number
    unit: string
  }
  tags: string[]
}

interface ServiceCardProps {
  service: MarketplaceService
}

const formatDeliveryTime = (deliveryTime: any) => {
  console.log("[v0] ServiceCard formatDeliveryTime input:", deliveryTime, typeof deliveryTime)

  if (typeof deliveryTime === "string") {
    return deliveryTime
  }

  if (typeof deliveryTime === "number") {
    return `${deliveryTime} day${deliveryTime !== 1 ? "s" : ""}`
  }

  if (
    typeof deliveryTime === "object" &&
    deliveryTime !== null &&
    deliveryTime.value !== undefined &&
    deliveryTime.unit
  ) {
    const { value, unit } = deliveryTime

    if (unit === "instant") {
      return "Instant delivery"
    }

    if (value === 0) {
      return "Instant delivery"
    }

    const unitLabel = unit === "minutes" ? "min" : unit === "hours" ? "hr" : unit === "days" ? "day" : unit

    const result = `${value} ${unitLabel}${value !== 1 && unit !== "minutes" ? "s" : ""}`
    console.log("[v0] ServiceCard formatDeliveryTime result:", result)
    return result
  }

  console.log("[v0] ServiceCard formatDeliveryTime fallback for:", deliveryTime)
  return "Contact seller"
}

const getSellerLevelBadge = (sellerLevel?: string) => {
  switch (sellerLevel) {
    case "level1":
      return {
        badge: "⭐",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Level 1",
        description: "Experienced seller",
      }
    case "level2":
      return {
        badge: "⭐⭐",
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Level 2",
        description: "Top performer",
      }
    case "top":
      return {
        badge: "👑",
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Top Rated",
        description: "Elite seller",
      }
    default:
      return {
        badge: "🆕",
        color: "bg-gray-100 text-gray-700 border-gray-200",
        label: "New Seller",
        description: "New to platform",
      }
  }
}

const formatResponseTime = (avgResponseTime?: number) => {
  if (!avgResponseTime) return "Contact seller"

  if (avgResponseTime < 60) return `~${Math.round(avgResponseTime)} min`
  if (avgResponseTime < 1440) return `~${Math.round(avgResponseTime / 60)} hr`
  return `~${Math.round(avgResponseTime / 1440)} day`
}

const getOnlineStatus = (isOnline?: boolean, lastSeen?: string) => {
  if (isOnline) return { text: "Online now", color: "text-green-600" }
  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return { text: "Active recently", color: "text-green-500" }
    if (diffHours < 24) return { text: `Active ${diffHours}h ago`, color: "text-yellow-600" }
    return { text: `Active ${Math.floor(diffHours / 24)}d ago`, color: "text-gray-500" }
  }
  return { text: "Contact seller", color: "text-gray-500" }
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  const sellerLevelInfo = getSellerLevelBadge(service.seller.sellerLevel)
  const isProSeller = ["level1", "level2", "top"].includes(service.seller.sellerLevel || "")
  const onlineStatus = getOnlineStatus(service.seller.isOnline, service.seller.lastSeen)

  return (
    <Link href={`/marketplace/${service.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          {imageLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <Image
            src={
              imageError
                ? "/placeholder.svg?height=200&width=300&query=service"
                : service.images[0] || "/placeholder.svg?height=200&width=300&query=service"
            }
            alt={service.title}
            fill
            className={`object-cover group-hover:scale-105 transition-all duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true)
              setImageLoading(false)
            }}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-900 font-semibold">
              <ServicePrice amount={service.price} />
            </Badge>
          </div>

          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {isProSeller && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-medium shadow-sm">
                <Crown className="mr-1 h-3 w-3" />
                Pro
              </Badge>
            )}
            {service.seller.hasInstantResponse && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-medium shadow-sm">
                <MessageCircle className="mr-1 h-3 w-3" />
                Instant
              </Badge>
            )}
            {service.seller.completionRate && service.seller.completionRate >= 95 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium shadow-sm">
                ✓ {service.seller.completionRate}%
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                  <AvatarFallback className="text-xs font-medium">
                    {service.seller.firstName[0]}
                    {service.seller.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {service.seller.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900">{service.seller.username}</span>
                {service.seller.isVerified && <Verified className="h-3 w-3 text-blue-500" />}
              </div>
            </div>

            <Badge variant="outline" className={`text-xs font-medium ${sellerLevelInfo.color}`}>
              <span className="mr-1">{sellerLevelInfo.badge}</span>
              {sellerLevelInfo.label}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${onlineStatus.color}`}>{onlineStatus.text}</span>
            {service.seller.avgResponseTime && (
              <span className="text-gray-600">Responds in {formatResponseTime(service.seller.avgResponseTime)}</span>
            )}
          </div>

          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
            {service.title}
          </h3>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-gray-900">{service.rating.toFixed(1)}</span>
                <span className="text-gray-500">({service.seller.totalReviews || 0})</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Eye className="h-4 w-4" />
                <span>{service.viewsCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-lg font-bold text-gray-900">
              <ServicePrice amount={service.price} />
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-full px-2 py-1">
              <ShoppingCart className="mr-1 h-3 w-3" />
              <span className="font-medium">{service.totalOrders.toLocaleString()}</span>
              <span className="ml-1">orders</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Delivery: {String(formatDeliveryTime(service.deliveryTime))}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

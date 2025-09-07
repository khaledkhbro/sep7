"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getServiceById, type MarketplaceService } from "@/lib/marketplace"
import { sellerProfileStorage, formatLocalTime, getCountryFlag, type SellerProfile } from "@/lib/seller-profiles"
import { ModernReviewSystem } from "@/components/marketplace/modern-review-system"
import { initializeSampleReviews } from "@/lib/marketplace-reviews"
import { useToast } from "@/hooks/use-toast"
import { TierComparison } from "@/components/marketplace/tier-comparison"
import { marketplaceOrderManager } from "@/lib/marketplace-orders"
import { getWallet, createDeposit, addWalletTransaction, type Wallet } from "@/lib/wallet"
import { useAuth } from "@/contexts/auth-context"
import {
  Clock,
  RefreshCw,
  Check,
  CreditCard,
  AlertCircle,
  Plus,
  Shield,
  Lock,
  Loader2,
  Star,
  Eye,
  Heart,
  Share2,
  Flag,
  MoreHorizontal,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SellerLevelBadge } from "@/components/seller/seller-level-badge"

import { EnhancedServiceRecommendations } from "@/components/marketplace/enhanced-service-recommendations"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ShareModal } from "@/components/marketplace/share-modal"
import { useFavorites } from "@/hooks/use-favorites"

interface ServiceTier {
  name: string
  price: number
  deliveryTime: string | { value: number; unit: string }
  revisions: string
  features: string[]
  description?: string
}

interface ServiceAddOn {
  id: string
  name: string
  description: string
  price: number
  deliveryTime?: string | { value: number; unit: string }
}

// Helper function to format delivery time object
const formatDeliveryTime = (deliveryTime: any) => {
  if (typeof deliveryTime === "number") {
    // Handle legacy format
    return `${deliveryTime} day${deliveryTime !== 1 ? "s" : ""}`
  }

  if (typeof deliveryTime === "object" && deliveryTime.value !== undefined && deliveryTime.unit) {
    const { value, unit } = deliveryTime

    if (unit === "instant") {
      return "Instant delivery"
    }

    if (value === 0) {
      return "Instant delivery"
    }

    const unitLabel = unit === "minutes" ? "min" : unit === "hours" ? "hr" : unit === "days" ? "day" : unit

    return `${value} ${unitLabel}${value !== 1 && unit !== "minutes" ? "s" : ""}`
  }

  return "Contact seller"
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()

  const [service, setService] = useState<MarketplaceService | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [requirements, setRequirements] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [showFullBio, setShowFullBio] = useState(false)
  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(null)
  const [selectedAddOns, setSelectedAddOns] = useState<ServiceAddOn[]>([])
  const [serviceTiers, setServiceTiers] = useState<ServiceTier[]>([])
  const [serviceAddOns, setServiceAddOns] = useState<ServiceAddOn[]>([])
  const [selectedPackage, setSelectedPackage] = useState("basic")
  const [quantity, setQuantity] = useState(1)
  const [isReserving, setIsReserving] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [showWalletDialog, setShowWalletDialog] = useState(false)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [orderStep, setOrderStep] = useState<"wallet" | "confirm">("wallet")

  const { toast } = useToast()

  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites()
  const isFavorited = favorites.some((fav) => fav.job_id === Number.parseInt(params.id))

  const handleFavoriteClick = async () => {
    if (!user) {
      toast.error("Please login to save favorites")
      return
    }

    try {
      await toggleFavorite(Number.parseInt(params.id))
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites")
    } catch (error) {
      toast.error("Failed to update favorites")
    }
  }

  useEffect(() => {
    // If the ID is "new", redirect to the static new page
    if (params.id === "new") {
      router.replace("/marketplace/new")
      return
    }
  }, [params.id, router])

  const loadWalletData = async () => {
    if (!user?.id) return
    try {
      const walletData = await getWallet(user.id)
      setWallet(walletData)
    } catch (error) {
      console.error("Failed to load wallet data:", error)
    }
  }

  useEffect(() => {
    const loadService = async () => {
      if (!params.id || params.id === "new") return

      setLoading(true)
      try {
        await initializeSampleReviews()

        const serviceData = await getServiceById(params.id as string)
        setService(serviceData)

        if (user?.id) {
          await loadWalletData()
        }

        if (serviceData) {
          console.log("[v0] Loading service tiers and add-ons for service:", serviceData.id)

          if (serviceData.serviceTiers && serviceData.serviceTiers.length > 0) {
            console.log("[v0] Found service tiers in service object:", serviceData.serviceTiers.length)
            setServiceTiers(serviceData.serviceTiers)
            setSelectedTier(serviceData.serviceTiers[0]) // Default to first tier
          } else {
            const fallbackTier: ServiceTier = {
              name: "Basic",
              price: serviceData.price,
              deliveryTime: formatDeliveryTime(serviceData.deliveryTime),
              revisions: serviceData.revisionsIncluded === 0 ? "Unlimited" : `${serviceData.revisionsIncluded}`,
              features: ["Standard delivery", "Professional service"],
              description: serviceData.shortDescription,
            }
            console.log("[v0] No service tiers found, using fallback single tier")
            setServiceTiers([fallbackTier])
            setSelectedTier(fallbackTier)
          }

          if (serviceData.addOns && serviceData.addOns.length > 0) {
            console.log("[v0] Found service add-ons in service object:", serviceData.addOns.length)
            setServiceAddOns(serviceData.addOns)
          } else {
            console.log("[v0] No service add-ons found")
            setServiceAddOns([])
          }

          let profile = sellerProfileStorage.getById(serviceData.seller.id)
          if (!profile) {
            profile = sellerProfileStorage.createDefaultProfile(serviceData.seller.id, {
              username: serviceData.seller.username,
              firstName: serviceData.seller.firstName,
              lastName: serviceData.seller.lastName,
              isVerified: serviceData.seller.isVerified,
              rating: serviceData.seller.rating,
              totalReviews: serviceData.seller.totalReviews,
            })
          }
          setSellerProfile(profile)
        }
      } catch (error) {
        console.error("Failed to load service:", error)
      } finally {
        setLoading(false)
      }
    }

    loadService()
  }, [params.id, user])

  const calculateTotalPrice = () => {
    const tierPrice = selectedTier?.price || 0
    const addOnsPrice = selectedAddOns.reduce((total, addOn) => total + addOn.price, 0)
    return tierPrice + addOnsPrice
  }

  const handleAddOnToggle = (addOn: ServiceAddOn) => {
    setSelectedAddOns((prev) => {
      const isSelected = prev.some((item) => item.id === addOn.id)
      if (isSelected) {
        return prev.filter((item) => item.id !== addOn.id)
      } else {
        return [...prev, addOn]
      }
    })
  }

  const handleDepositToWallet = async () => {
    if (!user) return
    const amount = Number.parseFloat(depositAmount)
    if (amount > 0) {
      try {
        await createDeposit({
          amount,
          paymentMethodId: "default", // In real app, user would select payment method
          userId: user.id,
        })
        await loadWalletData() // Refresh wallet data
        setDepositAmount("")
        setShowWalletDialog(false)
        alert(`Successfully deposited $${amount} to your wallet!`)
      } catch (error) {
        console.error("Failed to deposit to wallet:", error)
        alert("Failed to deposit to wallet. Please try again.")
      }
    }
  }

  const handleStartOrder = () => {
    if (!user) {
      router.push("/login")
      return
    }

    const totalPrice = calculateTotalPrice()
    const availableBalance = (wallet?.depositBalance || 0) + (wallet?.earningsBalance || 0)

    if (availableBalance < totalPrice) {
      setOrderStep("wallet")
    } else {
      setOrderStep("confirm")
    }

    setShowOrderDialog(true)
  }

  const handlePlaceOrder = async () => {
    if (!service || !selectedTier || !user || !wallet) return

    const totalPrice = calculateTotalPrice()
    const availableBalance = wallet.depositBalance + wallet.earningsBalance

    // Check wallet balance
    if (availableBalance < totalPrice) {
      alert("Insufficient wallet balance. Please deposit funds first.")
      return
    }

    setOrdering(true)
    try {
      const deliveryDays = extractDeliveryDays(selectedTier.deliveryTime)

      const uniqueReferenceId = `service_${service.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await addWalletTransaction({
        userId: user.id,
        type: "payment",
        amount: -totalPrice,
        description: `Payment for service: ${service.title}`,
        referenceId: uniqueReferenceId,
        referenceType: "marketplace_order",
        balanceType: wallet.depositBalance >= totalPrice ? "deposit" : "earnings",
      })

      const order = marketplaceOrderManager.createOrder({
        serviceId: service.id,
        sellerId: service.seller.id,
        buyerId: user.id,
        serviceName: service.title,
        serviceImage: service.images[0],
        tier: selectedTier.name.toLowerCase() as "basic" | "standard" | "premium",
        price: totalPrice,
        deliveryTime: deliveryDays,
        requirements: requirements || "No specific requirements provided",
      })

      // Refresh wallet data
      await loadWalletData()

      setShowOrderDialog(false)
      alert("Order placed successfully! The seller has 24 hours to accept your order.")
      router.push(`/dashboard/orders/${order.id}`)
    } catch (error) {
      console.error("Failed to create order:", error)
      alert("Failed to place order. Please try again.")
    } finally {
      setOrdering(false)
    }
  }

  const extractDeliveryDays = (deliveryTime: string | { value: number; unit: string }): number => {
    if (!deliveryTime) return 3 // Default to 3 days if undefined

    // Handle object format (from StorageService)
    if (typeof deliveryTime === "object" && deliveryTime.value && deliveryTime.unit) {
      const { value, unit } = deliveryTime
      if (unit.toLowerCase().includes("day")) {
        return value
      } else if (unit.toLowerCase().includes("hour")) {
        return Math.ceil(value / 24) // Convert hours to days
      } else if (unit.toLowerCase().includes("week")) {
        return value * 7 // Convert weeks to days
      }
      return value // Default to treating as days
    }

    // Handle string format (legacy)
    if (typeof deliveryTime === "string") {
      const match = deliveryTime.match(/(\d+)\s*day/i)
      return match ? Number.parseInt(match[1]) : 3 // Default to 3 days
    }

    return 3 // Default fallback
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const handleContactSeller = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!service) return

    try {
      const chatData = {
        type: "direct" as const,
        title: `Inquiry: ${service.title}`,
        marketplaceItemId: service.id,
        participantId: service.seller.id,
      }

      router.push(`/dashboard/messages?serviceId=${service.id}&sellerId=${service.seller.id}`)
    } catch (error) {
      console.error("Failed to start chat:", error)
      alert("Failed to start chat. Please try again.")
    }
  }

  const getAvailableBalance = () => {
    if (!wallet) return 0
    return wallet.depositBalance + wallet.earningsBalance
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h1>
          <p className="text-gray-600 mb-4">The service you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/marketplace")}>Browse Services</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TooltipProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Images */}
              <Card className="premium-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={service.images[currentImageIndex] || "/placeholder.svg?height=400&width=600"}
                      alt={service.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    {service.images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {service.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentImageIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/80 hover:bg-white text-gray-700"
                        onClick={handleFavoriteClick}
                        disabled={favoritesLoading}
                      >
                        <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card className="premium-card">
                <CardHeader className="pb-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {service.category.name}
                        </Badge>
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                          {service.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <Eye className="w-4 h-4 mr-1" />
                          {service.viewsCount}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-500">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={handleShare}
                              className="cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-l-4 border-blue-500 font-medium transition-all duration-200"
                            >
                              <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                              <span className="text-blue-700">Share This Service</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // You could open a report modal here
                                alert("Report functionality would open a modal here")
                              }}
                              className="cursor-pointer text-red-600 hover:text-red-700"
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Report Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">{service.title}</h1>
                    <p className="text-xl text-gray-600 leading-relaxed">{service.shortDescription}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex items-center space-x-8 text-sm bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="font-semibold text-lg">{service.rating}</span>
                      <span className="text-gray-600">({service.totalOrders} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{service.viewsCount} views</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{service.totalOrders} orders</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Service</h3>
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                      {service.description.split("\n").map((paragraph, index) => (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-3">
                      {service.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="px-3 py-1 text-sm bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 cursor-pointer transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {service.requirements && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                        <div className="bg-muted/50 p-6 rounded-lg">
                          <pre className="text-gray-700 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {service.requirements}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Tier Comparison Section */}
              <TierComparison
                serviceTiers={serviceTiers}
                serviceAddOns={serviceAddOns}
                onTierSelect={setSelectedTier}
                selectedTier={selectedTier}
              />

              {/* Reviews Section */}
              {service && (
                <ModernReviewSystem
                  serviceId={service.id}
                  sellerId={service.seller.id}
                  currentUserId={user?.id}
                  allowViewWithoutLogin={true}
                />
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Enhanced Service Selection Card */}
              <Card className="premium-card pulse-glow">
                <CardContent className="p-6 space-y-6">
                  {serviceTiers.length > 1 ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Select service tier</h3>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          Compare tiers
                        </Button>
                      </div>

                      <Tabs
                        value={selectedTier?.name.toLowerCase() || serviceTiers[0]?.name.toLowerCase()}
                        onValueChange={(value) => {
                          const tier = serviceTiers.find((t) => t.name.toLowerCase() === value)
                          if (tier) setSelectedTier(tier)
                        }}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50">
                          {serviceTiers.map((tier) => (
                            <TabsTrigger
                              key={tier.name}
                              value={tier.name.toLowerCase()}
                              className="text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                              {tier.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {serviceTiers.map((tier) => (
                          <TabsContent key={tier.name} value={tier.name.toLowerCase()} className="mt-6">
                            <div className="border-2 border-primary/20 rounded-xl p-6 space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                              <div className="text-center">
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">{tier.name} Package</h4>
                                <div className="text-4xl font-bold text-primary mb-3">${tier.price}</div>
                                {tier.description && (
                                  <p className="text-gray-600 leading-relaxed">{tier.description}</p>
                                )}
                              </div>

                              <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 bg-white/50 p-4 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-5 w-5 text-primary" />
                                  <span className="font-medium">{formatDeliveryTime(tier.deliveryTime)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RefreshCw className="h-5 w-5 text-secondary" />
                                  <span className="font-medium">{tier.revisions} revisions</span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {tier.features.slice(0, 6).map((feature, index) => (
                                  <div key={index} className="flex items-center text-sm">
                                    <Check className="mr-3 h-5 w-5 text-secondary flex-shrink-0" />
                                    <span className="text-gray-700">{feature}</span>
                                  </div>
                                ))}
                                {tier.features.length > 6 && (
                                  <p className="text-sm text-gray-500 ml-8 font-medium">
                                    +{tier.features.length - 6} more premium features
                                  </p>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  ) : (
                    <div className="text-center space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-xl">
                      <div className="text-4xl font-bold text-primary mb-3">
                        ${selectedTier?.price || service.price}
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div className="flex flex-col items-center space-y-2 bg-white/50 p-4 rounded-lg">
                          <Clock className="h-6 w-6 text-primary" />
                          <span className="font-medium text-gray-700">
                            {formatDeliveryTime(selectedTier?.deliveryTime) || formatDeliveryTime(service.deliveryTime)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center space-y-2 bg-white/50 p-4 rounded-lg">
                          <RefreshCw className="h-6 w-6 text-secondary" />
                          <span className="font-medium text-gray-700">
                            {selectedTier?.revisions ||
                              (service.revisionsIncluded === 0 ? "Unlimited" : service.revisionsIncluded)}{" "}
                            revisions
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {serviceAddOns.length > 0 && (
                    <div className="space-y-6">
                      <Separator />
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-4">Optional add-ons</h4>
                        <div className="space-y-4">
                          {serviceAddOns.map((addOn) => (
                            <div
                              key={addOn.id}
                              className="flex items-start space-x-4 p-4 border-2 border-secondary/20 rounded-xl hover:bg-secondary/5 transition-colors"
                            >
                              <Checkbox
                                id={addOn.id}
                                checked={selectedAddOns.some((item) => item.id === addOn.id)}
                                onCheckedChange={() => handleAddOnToggle(addOn)}
                                disabled={!user}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={addOn.id} className="font-medium text-gray-900 cursor-pointer">
                                    {addOn.name}
                                  </label>
                                  <span className="font-semibold text-secondary">+${addOn.price}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{addOn.description}</p>
                                {addOn.deliveryTime && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    +{formatDeliveryTime(addOn.deliveryTime)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedAddOns.length > 0 && (
                      <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Service ({selectedTier?.name || "Basic"}):</span>
                          <span>${selectedTier?.price || service.price}</span>
                        </div>
                        {selectedAddOns.map((addOn) => (
                          <div key={addOn.id} className="flex justify-between items-center text-sm">
                            <span>{addOn.name}:</span>
                            <span className="text-secondary font-medium">+${addOn.price}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary">${calculateTotalPrice()}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="lg"
                      onClick={handleStartOrder}
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      {user ? `Continue (${calculateTotalPrice()})` : `Sign In to Order ($${calculateTotalPrice()})`}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-2 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={handleContactSeller}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {user ? "Contact Seller" : "Sign In to Contact"}
                  </Button>
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle>About the Seller</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sellerProfile && (
                    <>
                      {/* Seller Header */}
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                              {sellerProfile.firstName[0]}
                              {sellerProfile.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {sellerProfile.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {sellerProfile.firstName} {sellerProfile.lastName}
                            </h3>
                            {sellerProfile.isVerified && <CreditCard className="h-4 w-4 text-blue-500" />}
                          </div>
                          <p className="text-sm text-gray-600">@{sellerProfile.username}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <CreditCard className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{sellerProfile.rating}</span>
                            <span className="text-sm text-gray-500">({sellerProfile.totalReviews} reviews)</span>
                            <SellerLevelBadge sellerId={sellerProfile.id} className="ml-2" />
                          </div>
                        </div>
                      </div>

                      {/* Bio Section */}
                      <div className="space-y-2">
                        <div className="text-sm text-gray-700">
                          {showFullBio ? (
                            <p className="whitespace-pre-line">{sellerProfile.bio}</p>
                          ) : (
                            <p className="line-clamp-3">{sellerProfile.bio}</p>
                          )}
                        </div>
                        {sellerProfile.bio.length > 150 && (
                          <button
                            onClick={() => setShowFullBio(!showFullBio)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {showFullBio ? "- Show Less" : "+ Show More"}
                          </button>
                        )}
                      </div>

                      <Separator />

                      {/* Statistics Grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">From</p>
                          <div className="flex items-center">
                            <span className="mr-1">{getCountryFlag(sellerProfile.country)}</span>
                            <p className="font-semibold text-gray-900">{sellerProfile.location}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Member since</p>
                          <div className="flex items-center">
                            <CreditCard className="h-3 w-3 mr-1 text-gray-400" />
                            <p className="font-semibold text-gray-900">
                              {new Date(sellerProfile.joinedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Avg. response time</p>
                          <p className="font-semibold text-gray-900">{sellerProfile.averageResponseTime}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Last delivery</p>
                          <p className="font-semibold text-gray-900">{sellerProfile.lastDelivery}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Completed orders</p>
                          <p className="font-semibold text-gray-900">
                            {sellerProfile.completedOrders.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">On time delivery</p>
                          <p className="font-semibold text-gray-900">{sellerProfile.onTimeDeliveryRate}%</p>
                        </div>
                      </div>

                      <Separator />

                      {/* Additional Info */}
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">Languages</p>
                          <p className="font-medium">{sellerProfile.languages.join(", ")}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Seller local time</p>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            <p className="font-semibold text-gray-900">{formatLocalTime(sellerProfile.timezone)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Last signed on</p>
                          <p className="font-semibold text-gray-900">
                            {formatDistanceToNow(new Date(sellerProfile.lastSeen), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Contact Buttons */}
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full bg-transparent" onClick={handleContactSeller}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Contact Seller
                        </Button>
                        {sellerProfile.availableForConsultation && (
                          <Button variant="secondary" className="w-full" size="sm">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Book a Consultation
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Similar Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Similar Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h4 className="font-medium text-sm text-gray-900">Professional Website Design</h4>
                      <p className="text-xs text-gray-600 mt-1">Starting at $200 • 5 days delivery</p>
                    </div>
                    <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h4 className="font-medium text-sm text-gray-900">Custom Logo & Branding</h4>
                      <p className="text-xs text-gray-600 mt-1">Starting at $100 • 3 days delivery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <EnhancedServiceRecommendations currentServiceId={service.id} category={service.category.name} />

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            title={service?.title || "Check out this service"}
            description={service?.description || ""}
            url={typeof window !== "undefined" ? window.location.href : ""}
          />
        </div>
      </TooltipProvider>

      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Current Balance:</span>
                <span className="text-lg font-bold text-green-600">${getAvailableBalance().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit Amount</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDepositToWallet}
                disabled={!depositAmount || Number.parseFloat(depositAmount) <= 0}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Deposit ${depositAmount || "0"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Place Order: {service.title}</DialogTitle>
          </DialogHeader>

          {orderStep === "wallet" && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient wallet balance. You need ${calculateTotalPrice().toFixed(2)} but only have $
                  {getAvailableBalance().toFixed(2)}.
                </AlertDescription>
              </Alert>

              <div className="bg-red-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Required Amount:</span>
                  <span className="text-lg font-bold text-red-600">${calculateTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Balance:</span>
                  <span className="text-lg font-bold text-green-600">${getAvailableBalance().toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Need to Deposit:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${Math.max(0, calculateTotalPrice() - getAvailableBalance()).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Deposit Amount</label>
                <Input
                  type="number"
                  placeholder={`Minimum: $${Math.max(0, calculateTotalPrice() - getAvailableBalance()).toFixed(2)}`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min={Math.max(0, calculateTotalPrice() - getAvailableBalance())}
                  step="0.01"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleDepositToWallet()
                    setOrderStep("confirm")
                  }}
                  disabled={
                    !depositAmount ||
                    Number.parseFloat(depositAmount) < Math.max(0, calculateTotalPrice() - getAvailableBalance())
                  }
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Deposit & Continue
                </Button>
              </div>
            </div>
          )}

          {orderStep === "confirm" && (
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                {/* Service Header */}
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex items-start space-x-3">
                    {service.images && service.images[0] && (
                      <img
                        src={service.images[0] || "/placeholder.svg"}
                        alt={service.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{service.title}</h3>
                      <div className="flex items-center mt-1">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {selectedTier?.name} Package
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{selectedTier?.name} Package</span>
                    <span className="text-2xl font-bold">${selectedTier?.price || service.price}</span>
                  </div>

                  {/* Package Features */}
                  <div className="space-y-2">
                    {selectedTier?.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add-ons */}
                  {selectedAddOns.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Add-ons:</h4>
                      {selectedAddOns.map((addOn) => (
                        <div key={addOn.id} className="flex justify-between items-center text-sm py-1">
                          <div className="flex items-center">
                            <Plus className="mr-2 h-3 w-3 text-gray-400" />
                            <span>{addOn.name}</span>
                          </div>
                          <span className="font-medium">+${addOn.price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service Fee */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-gray-600">Service fee</span>
                      </div>
                      <span className="font-medium">${(calculateTotalPrice() * 0.05).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">
                        ${(calculateTotalPrice() + calculateTotalPrice() * 0.05).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                      <span>Total delivery time</span>
                      <span>{selectedTier?.deliveryTime}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Security Notice */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Secure Payment</p>
                    <p className="text-blue-700 mt-1">
                      ${(calculateTotalPrice() + calculateTotalPrice() * 0.05).toFixed(2)} will be held securely. The
                      seller has 24 hours to accept your order. You won't be charged until work begins.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Notice */}
              <div className="text-xs text-gray-500 text-center">
                By clicking the button, you agree to our{" "}
                <button className="text-blue-600 hover:underline">Terms of Service</button> and{" "}
                <button className="text-blue-600 hover:underline">Payment Terms</button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={ordering}
                  className="bg-black hover:bg-gray-800 text-white px-8"
                  size="lg"
                >
                  {ordering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>Confirm & Pay - ${(calculateTotalPrice() + calculateTotalPrice() * 0.05).toFixed(2)}</>
                  )}
                </Button>
              </div>

              {/* SSL Security Badge */}
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Lock className="mr-1 h-3 w-3" />
                SSL Secure Payment
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Search, Calendar, DollarSign, Clock, MessageSquare, AlertCircle } from "lucide-react"
import {
  getServiceReviews,
  getServiceReviewStats,
  getSellerReviews,
  getSellerReviewStats,
  submitMarketplaceReview,
  getUserPurchaseHistory,
  initializeSampleReviews,
  type MarketplaceReview,
  type ReviewStats,
} from "@/lib/marketplace-reviews"
import { formatDistanceToNow } from "date-fns"

interface ModernReviewSystemProps {
  serviceId: string
  sellerId: string
  currentUserId?: string
}

export function ModernReviewSystem({ serviceId, sellerId, currentUserId = "current-user" }: ModernReviewSystemProps) {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([])
  const [allSellerReviews, setAllSellerReviews] = useState<MarketplaceReview[]>([])
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [sellerStats, setSellerStats] = useState<(ReviewStats & { totalProjects: number }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"most_recent" | "most_relevant" | "highest_rating" | "lowest_rating">(
    "most_recent",
  )
  const [activeTab, setActiveTab] = useState("this-project")
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")

  const [displayedReviewsCount, setDisplayedReviewsCount] = useState(5)
  const [displayedSellerReviewsCount, setDisplayedSellerReviewsCount] = useState(5)
  const REVIEWS_PER_PAGE = 5

  // Review form state
  const [rating, setRating] = useState(5)
  const [sellerCommunication, setSellerCommunication] = useState(5)
  const [qualityOfDelivery, setQualityOfDelivery] = useState(5)
  const [valueOfDelivery, setValueOfDelivery] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    initializeSampleReviews()
    loadReviews()
    checkReviewEligibility()
    setDisplayedReviewsCount(5)
    setDisplayedSellerReviewsCount(5)
  }, [serviceId, searchTerm, sortBy, activeTab])

  const loadReviews = async () => {
    try {
      const [serviceReviewsData, serviceStatsData, sellerReviewsData, sellerStatsData] = await Promise.all([
        getServiceReviews(serviceId, { search: searchTerm, sortBy, limit: 50 }),
        getServiceReviewStats(serviceId),
        getSellerReviews(sellerId, { search: searchTerm, sortBy, limit: 50 }),
        getSellerReviewStats(sellerId),
      ])

      setReviews(serviceReviewsData)
      setAllSellerReviews(sellerReviewsData)
      setReviewStats(serviceStatsData)
      setSellerStats(sellerStatsData)
    } catch (error) {
      console.error("Failed to load reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkReviewEligibility = async () => {
    try {
      const { canReview: eligible, availableForReview } = await getUserPurchaseHistory(currentUserId, serviceId)
      setCanReview(availableForReview.length > 0)
      setAvailableOrders(availableForReview)
      if (availableForReview.length > 0) {
        setSelectedOrderId(availableForReview[0].id)
      }
    } catch (error) {
      console.error("Failed to check review eligibility:", error)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedOrderId) return

    setSubmitting(true)
    try {
      await submitMarketplaceReview({
        serviceId,
        orderId: selectedOrderId,
        buyerId: currentUserId,
        sellerId,
        rating,
        sellerCommunication,
        qualityOfDelivery,
        valueOfDelivery,
        comment: comment.trim() || undefined,
      })

      setShowReviewForm(false)
      setComment("")
      setRating(5)
      setSellerCommunication(5)
      setQualityOfDelivery(5)
      setValueOfDelivery(5)

      // Reload reviews and eligibility
      await loadReviews()
      await checkReviewEligibility()
    } catch (error) {
      console.error("Failed to submit review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    readonly = false,
  }: { value: number; onChange?: (value: number) => void; readonly?: boolean }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          <Star className={`h-4 w-4 ${star <= value ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStats = activeTab === "this-project" ? reviewStats : sellerStats
  const currentReviews = activeTab === "this-project" ? reviews : allSellerReviews

  const handleShowMoreReviews = () => {
    setDisplayedReviewsCount((prev) => prev + REVIEWS_PER_PAGE)
  }

  const handleShowMoreSellerReviews = () => {
    setDisplayedSellerReviewsCount((prev) => prev + REVIEWS_PER_PAGE)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-xl">Reviews</CardTitle>
            {currentStats && currentStats.totalReviews > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-bold text-lg">{currentStats.averageRating}</span>
                  <span className="text-gray-600 ml-1">•</span>
                  <span className="font-medium text-gray-700 ml-1">
                    {currentStats.totalReviews.toLocaleString()} review{currentStats.totalReviews !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          </div>
          {canReview && activeTab === "this-project" && (
            <Button onClick={() => setShowReviewForm(true)} size="sm" className="bg-green-600 hover:bg-green-700">
              <MessageSquare className="mr-2 h-4 w-4" />
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStats && currentStats.totalReviews > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center space-x-3">
                  <span className="text-sm font-medium w-12">{stars} stars</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-800 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${currentStats.totalReviews > 0 ? (currentStats.ratingBreakdown[stars as keyof typeof currentStats.ratingBreakdown] / currentStats.totalReviews) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-green-600 font-medium w-12 text-right">
                    ({currentStats.ratingBreakdown[stars as keyof typeof currentStats.ratingBreakdown]})
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Rating breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Seller communication level</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{currentStats.categoryAverages.sellerCommunication}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quality of delivery</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{currentStats.categoryAverages.qualityOfDelivery}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Value of delivery</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{currentStats.categoryAverages.valueOfDelivery}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStats && currentStats.totalReviews > 0 && <Separator />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="this-project" className="text-sm">
              This project ({reviewStats?.totalReviews || 0})
            </TabsTrigger>
            <TabsTrigger value="all-projects" className="text-sm">
              All projects ({sellerStats?.totalReviews || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="this-project" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_recent">Most recent</SelectItem>
                  <SelectItem value="most_relevant">Most relevant</SelectItem>
                  <SelectItem value="highest_rating">Highest rating</SelectItem>
                  <SelectItem value="lowest_rating">Lowest rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, displayedReviewsCount).map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-500 text-white text-sm font-medium">
                            {review.buyer.firstName[0]}
                            {review.buyer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {review.buyer.firstName} {review.buyer.lastName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>🇺🇸 {review.buyer.country}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRating value={review.rating} readonly />
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {review.comment && <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>}

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="font-medium">${review.purchaseAmount}</span>
                          <span className="text-gray-500 ml-1">Price</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="font-medium">{review.deliveryTime}</span>
                          <span className="text-gray-500 ml-1">Duration</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.order.tierName}
                      </Badge>
                    </div>
                  </div>
                ))}

                {reviews.length > displayedReviewsCount && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={handleShowMoreReviews} className="px-8 py-2 bg-transparent">
                      Show More Reviews
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                <p className="text-gray-600 mb-4">
                  {canReview
                    ? "Be the first to review this service!"
                    : "Only buyers who have completed orders can write reviews."}
                </p>
                {canReview && (
                  <Button onClick={() => setShowReviewForm(true)} className="bg-green-600 hover:bg-green-700">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write First Review
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all-projects" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most_recent">Most recent</SelectItem>
                  <SelectItem value="most_relevant">Most relevant</SelectItem>
                  <SelectItem value="highest_rating">Highest rating</SelectItem>
                  <SelectItem value="lowest_rating">Lowest rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {allSellerReviews.length > 0 ? (
              <div className="space-y-4">
                {allSellerReviews.slice(0, displayedSellerReviewsCount).map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                            {review.buyer.firstName[0]}
                            {review.buyer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {review.buyer.firstName} {review.buyer.lastName}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>🇺🇸 {review.buyer.country}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRating value={review.rating} readonly />
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {review.comment && <p className="text-gray-700 text-sm leading-relaxed mb-3">{review.comment}</p>}

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="font-medium">${review.purchaseAmount}</span>
                          <span className="text-gray-500 ml-1">Price</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="font-medium">{review.deliveryTime}</span>
                          <span className="text-gray-500 ml-1">Duration</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {review.order.tierName}
                      </Badge>
                    </div>
                  </div>
                ))}

                {allSellerReviews.length > displayedSellerReviewsCount && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={handleShowMoreSellerReviews}
                      className="px-8 py-2 bg-transparent"
                    >
                      Show More Reviews
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-600">This seller hasn't received any reviews yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {availableOrders.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Order to Review</label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          ${order.amount} - {new Date(order.completedAt || order.createdAt).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Overall Rating</label>
                <div className="flex items-center space-x-2">
                  <StarRating value={rating} onChange={setRating} />
                  <span className="text-sm text-gray-600">
                    ({rating} star{rating !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seller communication skill</label>
                  <div className="flex items-center space-x-2">
                    <StarRating value={sellerCommunication} onChange={setSellerCommunication} />
                    <span className="text-sm text-gray-600">({sellerCommunication})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality of delivery</label>
                  <div className="flex items-center space-x-2">
                    <StarRating value={qualityOfDelivery} onChange={setQualityOfDelivery} />
                    <span className="text-sm text-gray-600">({qualityOfDelivery})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Value of delivery</label>
                  <div className="flex items-center space-x-2">
                    <StarRating value={valueOfDelivery} onChange={setValueOfDelivery} />
                    <span className="text-sm text-gray-600">({valueOfDelivery})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review (Optional)</label>
                <Textarea
                  placeholder="Share your experience with this seller..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 text-right">{comment.length}/1000 characters</div>
              </div>

              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Review Guidelines:</p>
                  <ul className="space-y-1">
                    <li>• Only buyers who completed orders can write reviews</li>
                    <li>• You can write one review per completed order</li>
                    <li>• Reviews help other buyers make informed decisions</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || !selectedOrderId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? "Publishing..." : "Publish Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Search, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface MarketplaceReview {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_type: string
  rating: number
  title: string
  comment: string
  communication_rating: number
  quality_rating: number
  value_rating: number
  delivery_time_rating: number
  created_at: string
  updated_at: string
  is_deleted: boolean
  is_hidden?: boolean
}

export default function MarketplaceReviewsAdmin() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const ITEMS_PER_PAGE = 10

  const mockReviews: MarketplaceReview[] = [
    {
      id: "rev_001",
      order_id: "ord_12345678",
      reviewer_id: "james_wilson",
      reviewee_id: "sarah_designer",
      reviewer_type: "buyer",
      rating: 5,
      title: "Outstanding Logo Design Service",
      comment:
        "Sarah delivered an absolutely stunning logo design that exceeded all my expectations. The communication was excellent throughout the process, and she provided multiple revisions until it was perfect. Highly recommend her services!",
      communication_rating: 5,
      quality_rating: 5,
      value_rating: 4,
      delivery_time_rating: 5,
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      is_deleted: false,
      is_hidden: false,
    },
    {
      id: "rev_002",
      order_id: "ord_87654321",
      reviewer_id: "mike_startup",
      reviewee_id: "alex_developer",
      reviewer_type: "buyer",
      rating: 4,
      title: "Great Website Development",
      comment:
        "Alex built a fantastic website for my startup. The code quality is excellent and the site loads fast. Only minor issue was a small delay in delivery, but the final result was worth the wait.",
      communication_rating: 4,
      quality_rating: 5,
      value_rating: 4,
      delivery_time_rating: 3,
      created_at: "2024-01-14T14:20:00Z",
      updated_at: "2024-01-14T14:20:00Z",
      is_deleted: false,
      is_hidden: false,
    },
    {
      id: "rev_003",
      order_id: "ord_11223344",
      reviewer_id: "lisa_marketing",
      reviewee_id: "john_writer",
      reviewer_type: "buyer",
      rating: 2,
      title: "Content Writing - Below Expectations",
      comment:
        "The content delivered was not up to the standard I expected. Several grammatical errors and the tone didn't match my brand voice. Had to request multiple revisions.",
      communication_rating: 3,
      quality_rating: 2,
      value_rating: 2,
      delivery_time_rating: 4,
      created_at: "2024-01-13T09:15:00Z",
      updated_at: "2024-01-13T09:15:00Z",
      is_deleted: false,
      is_hidden: true,
    },
    {
      id: "rev_004",
      order_id: "ord_55667788",
      reviewer_id: "emma_boutique",
      reviewee_id: "maria_photographer",
      reviewer_type: "buyer",
      rating: 5,
      title: "Amazing Product Photography",
      comment:
        "Maria's product photography is absolutely incredible! She captured my jewelry pieces beautifully with perfect lighting and composition. The photos have significantly improved my online sales. Will definitely work with her again!",
      communication_rating: 5,
      quality_rating: 5,
      value_rating: 5,
      delivery_time_rating: 5,
      created_at: "2024-01-12T16:45:00Z",
      updated_at: "2024-01-12T16:45:00Z",
      is_deleted: false,
      is_hidden: false,
    },
    {
      id: "rev_005",
      order_id: "ord_99887766",
      reviewer_id: "david_tech",
      reviewee_id: "anna_designer",
      reviewer_type: "buyer",
      rating: 3,
      title: "UI/UX Design - Average Quality",
      comment:
        "The design was okay but nothing special. Anna delivered on time and was responsive, but the creativity and innovation I was looking for wasn't quite there. It's functional but not inspiring.",
      communication_rating: 4,
      quality_rating: 3,
      value_rating: 3,
      delivery_time_rating: 4,
      created_at: "2024-01-11T11:30:00Z",
      updated_at: "2024-01-11T11:30:00Z",
      is_deleted: false,
      is_hidden: false,
    },
    {
      id: "rev_006",
      order_id: "ord_44556677",
      reviewer_id: "robert_agency",
      reviewee_id: "sophie_marketer",
      reviewer_type: "buyer",
      rating: 1,
      title: "Poor Social Media Management",
      comment:
        "Very disappointed with the service. Sophie was unresponsive for days, missed scheduled posts, and the content quality was poor. Would not recommend.",
      communication_rating: 1,
      quality_rating: 2,
      value_rating: 1,
      delivery_time_rating: 1,
      created_at: "2024-01-10T08:20:00Z",
      updated_at: "2024-01-10T08:20:00Z",
      is_deleted: false,
      is_hidden: true,
    },
    {
      id: "rev_007",
      order_id: "ord_33445566",
      reviewer_id: "jennifer_restaurant",
      reviewee_id: "carlos_chef",
      reviewer_type: "buyer",
      rating: 5,
      title: "Excellent Recipe Development",
      comment:
        "Carlos created amazing recipes for our restaurant menu. His culinary expertise really shows, and our customers love the new dishes. Professional, creative, and delivered exactly what we needed.",
      communication_rating: 5,
      quality_rating: 5,
      value_rating: 4,
      delivery_time_rating: 4,
      created_at: "2024-01-09T13:10:00Z",
      updated_at: "2024-01-09T13:10:00Z",
      is_deleted: false,
      is_hidden: false,
    },
    {
      id: "rev_008",
      order_id: "ord_22334455",
      reviewer_id: "thomas_fitness",
      reviewee_id: "rachel_trainer",
      reviewer_type: "buyer",
      rating: 4,
      title: "Good Personal Training Program",
      comment:
        "Rachel designed a comprehensive fitness program that fits my schedule perfectly. The workouts are challenging but achievable. Only wish there were more video demonstrations included.",
      communication_rating: 4,
      quality_rating: 4,
      value_rating: 4,
      delivery_time_rating: 5,
      created_at: "2024-01-08T15:25:00Z",
      updated_at: "2024-01-08T15:25:00Z",
      is_deleted: false,
      is_hidden: false,
    },
  ]

  useEffect(() => {
    loadReviews()
  }, [currentPage, searchTerm, statusFilter, ratingFilter])

  const loadReviews = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading mock reviews for testing")

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setReviews(mockReviews)
      setTotalPages(Math.ceil(mockReviews.length / ITEMS_PER_PAGE))
      setTotalReviews(mockReviews.length)

      toast.success("Mock reviews loaded successfully")
    } catch (error) {
      console.error("Error loading reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (reviewId: string, currentlyHidden: boolean) => {
    setActionLoading(reviewId)
    try {
      const action = currentlyHidden ? "show" : "hide"
      const response = await fetch(`/api/marketplace/reviews/${reviewId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} review`)
      }

      toast.success(`Review ${action === "hide" ? "hidden" : "shown"} successfully`)
      loadReviews()
    } catch (error) {
      console.error(`Error toggling review visibility:`, error)
      toast.error(`Failed to ${currentlyHidden ? "show" : "hide"} review`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const response = await fetch(`/api/marketplace/reviews/${reviewId}?adminDelete=true`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Review deleted successfully")
        loadReviews()
      } else {
        throw new Error("Failed to delete review")
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      toast.error("Failed to delete review")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewee_id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "visible" && !review.is_hidden) ||
      (statusFilter === "hidden" && review.is_hidden)

    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter

    return matchesSearch && matchesStatus && matchesRating
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  const getStats = () => {
    const visible = reviews.filter((r) => !r.is_hidden).length
    const hidden = reviews.filter((r) => r.is_hidden).length
    const avgRating =
      reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0"

    return { visible, hidden, avgRating }
  }

  const stats = getStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Reviews Management</h1>
        <p className="text-gray-600">Manage and moderate marketplace service reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visible</p>
                <p className="text-2xl font-bold text-green-600">{stats.visible}</p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hidden</p>
                <p className="text-2xl font-bold text-red-600">{stats.hidden}</p>
              </div>
              <EyeOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgRating}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews by title, comment, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p>No reviews found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className={review.is_hidden ? "bg-red-50 border-red-200" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{review.reviewer_id.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{review.title}</h3>
                      <p className="text-sm text-gray-600">
                        By {review.reviewer_id} • Order #{review.order_id.slice(-8)}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600 ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={review.is_hidden ? "destructive" : "default"}>
                      {review.is_hidden ? "Hidden" : "Visible"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(review.id, review.is_hidden || false)}
                      disabled={actionLoading === review.id}
                    >
                      {review.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={actionLoading === review.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete this review? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">{review.comment}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Communication:</span>
                    <div className="flex items-center space-x-1">{renderStars(review.communication_rating)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality:</span>
                    <div className="flex items-center space-x-1">{renderStars(review.quality_rating)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>
                    <div className="flex items-center space-x-1">{renderStars(review.value_rating)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery:</span>
                    <div className="flex items-center space-x-1">{renderStars(review.delivery_time_rating)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

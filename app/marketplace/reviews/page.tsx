"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Search, Filter, Edit, Trash2, MessageSquare, DollarSign, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface MarketplaceReview {
  id: number
  order_id: string
  reviewer_id: string
  reviewee_id: string
  reviewer_type: "buyer" | "seller"
  rating: number
  title: string
  comment: string
  communication_rating: number
  quality_rating: number
  value_rating: number
  delivery_time_rating: number
  created_at: string
  updated_at: string
  reviewer_name?: string
  reviewer_avatar?: string
  reviewer_country?: string
  order_price?: number
  order_duration?: string
  service_tier?: string
}

interface ReviewStats {
  total_reviews: number
  avg_rating: number
  avg_communication: number
  avg_quality: number
  avg_value: number
  avg_delivery_time: number
  five_star_count: number
  four_star_count: number
  three_star_count: number
  two_star_count: number
  one_star_count: number
}

const ITEMS_PER_PAGE = 5

export default function MarketplaceReviewsPage() {
  const [reviews, setReviews] = useState<MarketplaceReview[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [editingReview, setEditingReview] = useState<MarketplaceReview | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Mock current user - in real app, get from auth context
  const currentUserId = "buyer_jane_employer"

  useEffect(() => {
    fetchReviews()
    fetchStats()
  }, [currentPage, searchTerm, filterRating, sortBy])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual API
      const mockReviews: MarketplaceReview[] = [
        {
          id: 1,
          order_id: "order_1757068781503_gwrks1un4",
          reviewer_id: "buyer_jane_employer",
          reviewee_id: "seller_john_doe",
          reviewer_type: "buyer",
          rating: 5,
          title: "Excellent work and communication",
          comment:
            "The seller delivered exactly what I needed. Great communication throughout the project and delivered on time. Highly recommended!",
          communication_rating: 5,
          quality_rating: 5,
          value_rating: 5,
          delivery_time_rating: 5,
          created_at: "2024-01-28T10:30:00Z",
          updated_at: "2024-01-28T10:30:00Z",
          reviewer_name: "Jane Employer",
          reviewer_avatar: "/avatars/jane.jpg",
          reviewer_country: "UK",
          order_price: 75,
          order_duration: "2 days",
          service_tier: "Basic",
        },
        {
          id: 2,
          order_id: "order_1757068781503_gwrks1un4",
          reviewer_id: "seller_john_doe",
          reviewee_id: "buyer_jane_employer",
          reviewer_type: "seller",
          rating: 5,
          title: "Great client to work with",
          comment: "Clear requirements and prompt payment. Very professional and easy to communicate with.",
          communication_rating: 5,
          quality_rating: 5,
          value_rating: 5,
          delivery_time_rating: 5,
          created_at: "2024-01-22T14:15:00Z",
          updated_at: "2024-01-22T14:15:00Z",
          reviewer_name: "John Doe",
          reviewer_avatar: "/avatars/john.jpg",
          reviewer_country: "US",
          order_price: 200,
          order_duration: "1 day",
          service_tier: "Standard",
        },
        {
          id: 3,
          order_id: "order_1757068781504_test123",
          reviewer_id: "buyer_mike_smith",
          reviewee_id: "seller_sarah_wilson",
          reviewer_type: "buyer",
          rating: 4,
          title: "Good quality work",
          comment:
            "The work was completed as requested. Minor revisions needed but overall satisfied with the outcome.",
          communication_rating: 4,
          quality_rating: 4,
          value_rating: 4,
          delivery_time_rating: 3,
          created_at: "2024-01-20T09:45:00Z",
          updated_at: "2024-01-20T09:45:00Z",
          reviewer_name: "Mike Smith",
          reviewer_avatar: "/avatars/mike.jpg",
          reviewer_country: "CA",
          order_price: 150,
          order_duration: "3 days",
          service_tier: "Premium",
        },
        {
          id: 4,
          order_id: "order_1757068781505_demo456",
          reviewer_id: "buyer_lisa_johnson",
          reviewee_id: "seller_alex_brown",
          reviewer_type: "buyer",
          rating: 3,
          title: "Average experience",
          comment: "Work was completed but took longer than expected. Communication could have been better.",
          communication_rating: 3,
          quality_rating: 4,
          value_rating: 3,
          delivery_time_rating: 2,
          created_at: "2024-01-18T16:20:00Z",
          updated_at: "2024-01-18T16:20:00Z",
          reviewer_name: "Lisa Johnson",
          reviewer_avatar: "/avatars/lisa.jpg",
          reviewer_country: "AU",
          order_price: 100,
          order_duration: "5 days",
          service_tier: "Basic",
        },
        {
          id: 5,
          order_id: "order_1757068781506_sample789",
          reviewer_id: "buyer_david_lee",
          reviewee_id: "seller_emma_davis",
          reviewer_type: "buyer",
          rating: 5,
          title: "Outstanding service!",
          comment:
            "Exceeded my expectations! Fast delivery, excellent quality, and great communication. Will definitely work with this seller again.",
          communication_rating: 5,
          quality_rating: 5,
          value_rating: 5,
          delivery_time_rating: 5,
          created_at: "2024-01-15T11:10:00Z",
          updated_at: "2024-01-15T11:10:00Z",
          reviewer_name: "David Lee",
          reviewer_avatar: "/avatars/david.jpg",
          reviewer_country: "SG",
          order_price: 300,
          order_duration: "1 day",
          service_tier: "Premium",
        },
      ]

      // Apply filters and search
      const filteredReviews = mockReviews.filter((review) => {
        const matchesSearch =
          review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.reviewer_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRating = filterRating === "all" || review.rating.toString() === filterRating

        return matchesSearch && matchesRating
      })

      // Apply sorting
      filteredReviews.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case "highest":
            return b.rating - a.rating
          case "lowest":
            return a.rating - b.rating
          default:
            return 0
        }
      })

      // Apply pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const paginatedReviews = filteredReviews.slice(startIndex, startIndex + ITEMS_PER_PAGE)

      setReviews(paginatedReviews)
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual API
      const mockStats: ReviewStats = {
        total_reviews: 5,
        avg_rating: 4.4,
        avg_communication: 4.4,
        avg_quality: 4.6,
        avg_value: 4.4,
        avg_delivery_time: 4.0,
        five_star_count: 3,
        four_star_count: 1,
        three_star_count: 1,
        two_star_count: 0,
        one_star_count: 0,
      }
      setStats(mockStats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleEditReview = (review: MarketplaceReview) => {
    setEditingReview(review)
    setIsEditDialogOpen(true)
  }

  const handleDeleteReview = async (reviewId: number) => {
    try {
      // Mock API call - replace with actual API
      console.log("Deleting review:", reviewId)
      toast({
        title: "Success",
        description: "Review deleted successfully.",
      })
      fetchReviews()
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: "Failed to delete review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateReview = async (updatedReview: MarketplaceReview) => {
    try {
      // Mock API call - replace with actual API
      console.log("Updating review:", updatedReview)
      toast({
        title: "Success",
        description: "Review updated successfully.",
      })
      setIsEditDialogOpen(false)
      setEditingReview(null)
      fetchReviews()
    } catch (error) {
      console.error("Error updating review:", error)
      toast({
        title: "Error",
        description: "Failed to update review. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5"
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const totalPages = Math.ceil(25 / ITEMS_PER_PAGE) // Mock total count

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Reviews</h1>
        <p className="text-gray-600">Browse and manage reviews from completed orders</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold">{stats.total_reviews}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{stats.avg_rating}</p>
                    {renderStars(Math.round(stats.avg_rating))}
                  </div>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quality Rating</p>
                  <p className="text-2xl font-bold">{stats.avg_quality}</p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  ★
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Communication</p>
                  <p className="text-2xl font-bold">{stats.avg_communication}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rating" />
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4 mb-8">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={review.reviewer_avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {review.reviewer_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{review.reviewer_name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {review.reviewer_country}
                      </Badge>
                      <Badge variant={review.reviewer_type === "buyer" ? "default" : "secondary"}>
                        {review.reviewer_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {review.reviewer_id === currentUserId && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditReview(review)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteReview(review.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              {/* Rating Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Communication</p>
                  <div className="flex items-center justify-center">{renderStars(review.communication_rating)}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Quality</p>
                  <div className="flex items-center justify-center">{renderStars(review.quality_rating)}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Value</p>
                  <div className="flex items-center justify-center">{renderStars(review.value_rating)}</div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Delivery</p>
                  <div className="flex items-center justify-center">{renderStars(review.delivery_time_rating)}</div>
                </div>
              </div>

              {/* Order Details */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${review.order_price}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{review.order_duration}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {review.service_tier}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) setCurrentPage(currentPage - 1)
              }}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i + 1}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(i + 1)
                }}
                isActive={currentPage === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) setCurrentPage(currentPage + 1)
              }}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <EditReviewForm
              review={editingReview}
              onSave={handleUpdateReview}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Edit Review Form Component
function EditReviewForm({
  review,
  onSave,
  onCancel,
}: {
  review: MarketplaceReview
  onSave: (review: MarketplaceReview) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: review.title,
    comment: review.comment,
    rating: review.rating,
    communication_rating: review.communication_rating,
    quality_rating: review.quality_rating,
    value_rating: review.value_rating,
    delivery_time_rating: review.delivery_time_rating,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...review,
      ...formData,
    })
  }

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: number
    onChange: (rating: number) => void
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
            <Star className={`h-6 w-6 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Review Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter review title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Review Comment</Label>
        <Textarea
          id="comment"
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          placeholder="Share your experience..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingInput
          label="Overall Rating"
          value={formData.rating}
          onChange={(rating) => setFormData({ ...formData, rating })}
        />
        <RatingInput
          label="Communication"
          value={formData.communication_rating}
          onChange={(communication_rating) => setFormData({ ...formData, communication_rating })}
        />
        <RatingInput
          label="Quality"
          value={formData.quality_rating}
          onChange={(quality_rating) => setFormData({ ...formData, quality_rating })}
        />
        <RatingInput
          label="Value"
          value={formData.value_rating}
          onChange={(value_rating) => setFormData({ ...formData, value_rating })}
        />
        <RatingInput
          label="Delivery Time"
          value={formData.delivery_time_rating}
          onChange={(delivery_time_rating) => setFormData({ ...formData, delivery_time_rating })}
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}

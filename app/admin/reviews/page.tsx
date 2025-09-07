"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, Search, Eye, EyeOff, Trash2, Calendar, Filter } from "lucide-react"
import { toast } from "sonner"
import { type Review, getAllReviews, hideReview, showReview, deleteReview } from "@/lib/reviews"

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden">("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [reviews, searchTerm, filterStatus])

  const loadReviews = async () => {
    try {
      const allReviews = await getAllReviews()
      setReviews(allReviews)
    } catch (error) {
      console.error("[v0] Failed to load reviews:", error)
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const filterReviews = () => {
    let filtered = reviews

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.reviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.reviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.reviewee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.reviewee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.job.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by visibility status
    if (filterStatus !== "all") {
      filtered = filtered.filter((review) => (filterStatus === "visible" ? review.isVisible : !review.isVisible))
    }

    setFilteredReviews(filtered)
  }

  const handleToggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    setActionLoading(reviewId)
    try {
      if (currentVisibility) {
        await hideReview(reviewId)
        toast.success("Review hidden successfully")
      } else {
        await showReview(reviewId)
        toast.success("Review made visible successfully")
      }
      await loadReviews()
    } catch (error) {
      toast.error("Failed to update review visibility")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) {
      return
    }

    setActionLoading(reviewId)
    try {
      await deleteReview(reviewId)
      toast.success("Review deleted successfully")
      await loadReviews()
    } catch (error) {
      toast.error("Failed to delete review")
    } finally {
      setActionLoading(null)
    }
  }

  const getVisibilityStats = () => {
    const visible = reviews.filter((r) => r.isVisible).length
    const hidden = reviews.filter((r) => !r.isVisible).length
    return { visible, hidden, total: reviews.length }
  }

  const stats = getVisibilityStats()

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
          <p className="text-gray-600 mt-1">Manage user reviews and ratings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visible Reviews</p>
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
                <p className="text-sm font-medium text-gray-600">Hidden Reviews</p>
                <p className="text-2xl font-bold text-red-600">{stats.hidden}</p>
              </div>
              <EyeOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews by user, comment, or job..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "visible" | "hidden")}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Reviews</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Reviewee</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {review.reviewer.firstName[0]}
                            {review.reviewer.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </p>
                          <p className="text-xs text-gray-500">@{review.reviewer.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {review.reviewee.firstName[0]}
                            {review.reviewee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {review.reviewee.firstName} {review.reviewee.lastName}
                          </p>
                          <p className="text-xs text-gray-500">@{review.reviewee.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm font-medium">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {review.comment ? (
                          <p className="text-sm text-gray-700 truncate" title={review.comment}>
                            "{review.comment}"
                          </p>
                        ) : (
                          <span className="text-xs text-gray-500 italic">No comment</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium truncate max-w-32" title={review.job.title}>
                          {review.job.title}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {typeof review.job.category === "object" ? review.job.category.name : review.job.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.isVisible ? "default" : "secondary"}>
                        {review.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleVisibility(review.id, review.isVisible)}
                          disabled={actionLoading === review.id}
                          className="text-xs"
                        >
                          {review.isVisible ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Show
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={actionLoading === review.id}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No reviews found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Reviews will appear here once users start rating completed work"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

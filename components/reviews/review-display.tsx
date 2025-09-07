"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar } from "lucide-react"
import { type Review, getReviewsByUser, calculateUserRating } from "@/lib/reviews"

interface ReviewDisplayProps {
  userId: string
  showTitle?: boolean
}

export function ReviewDisplay({ userId, showTitle = true }: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [userRating, setUserRating] = useState({ averageRating: 0, totalReviews: 0 })

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const userReviews = await getReviewsByUser(userId)
        setReviews(userReviews)
        setUserRating(calculateUserRating(userReviews))
      } catch (error) {
        console.error("[v0] Failed to load reviews:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReviews()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Reviews & Ratings</h3>}
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Reviews & Ratings</h3>}
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">Reviews will appear here after completing jobs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews & Ratings</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="ml-1 font-semibold text-lg">{userRating.averageRating.toFixed(1)}</span>
            </div>
            <Badge variant="secondary">
              {userRating.totalReviews} review{userRating.totalReviews !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white text-sm">
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
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {review.comment && <p className="text-gray-700 text-sm leading-relaxed mb-3">"{review.comment}"</p>}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Job: {review.job.title}</span>
                <Badge variant="outline" className="text-xs">
                  {review.job.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

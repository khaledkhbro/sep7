"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function CreateReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [communicationRating, setCommunicationRating] = useState(0)
  const [qualityRating, setQualityRating] = useState(0)
  const [valueRating, setValueRating] = useState(0)
  const [deliveryTimeRating, setDeliveryTimeRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (orderId) {
      // Mock order data - replace with actual API call
      setOrder({
        id: orderId,
        serviceTitle: "Logo Design Service",
        sellerId: "seller123",
        price: 75,
        status: "delivered",
      })
    }
  }, [orderId])

  const handleSubmitReview = async () => {
    if (!orderId || rating === 0) return

    setLoading(true)
    try {
      const reviewData = {
        orderId,
        rating,
        comment,
        communicationRating,
        qualityRating,
        valueRating,
        deliveryTimeRating,
      }

      const response = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      })

      if (response.ok) {
        router.push("/dashboard/orders?tab=delivered")
      } else {
        alert("Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review")
    } finally {
      setLoading(false)
    }
  }

  const StarRating = ({ rating, setRating, hoverRating, setHoverRating, label }: any) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating && setHoverRating(star)}
            onMouseLeave={() => setHoverRating && setHoverRating(0)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= (hoverRating || rating) ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  if (!order) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Leave a Review</h1>
        <p className="text-gray-600">Share your experience with this order</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{order.serviceTitle}</span>
            <Badge variant="secondary">Order #{orderId?.slice(-8)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <StarRating
            rating={rating}
            setRating={setRating}
            hoverRating={hoverRating}
            setHoverRating={setHoverRating}
            label="Overall Rating"
          />

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating rating={communicationRating} setRating={setCommunicationRating} label="Communication" />
            <StarRating rating={qualityRating} setRating={setQualityRating} label="Quality of Work" />
            <StarRating rating={valueRating} setRating={setValueRating} label="Value for Money" />
            <StarRating rating={deliveryTimeRating} setRating={setDeliveryTimeRating} label="Delivery Time" />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Review Comment</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this service..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmitReview}
            disabled={loading || rating === 0}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

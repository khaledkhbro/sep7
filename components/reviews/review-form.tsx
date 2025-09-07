"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Star, X } from "lucide-react"
import { toast } from "sonner"
import { submitReview } from "@/lib/reviews"

interface ReviewFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  jobId: string
  workProofId: string
  reviewerId: string
  revieweeId: string
  workerName: string
}

export function ReviewForm({
  isOpen,
  onClose,
  onSubmit,
  jobId,
  workProofId,
  reviewerId,
  revieweeId,
  workerName,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      await submitReview({
        jobId,
        workProofId,
        reviewerId,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      })

      toast.success("Review submitted successfully!")
      onSubmit()
      onClose()

      // Reset form
      setRating(0)
      setComment("")
    } catch (error) {
      console.error("[v0] Failed to submit review:", error)
      toast.error("Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoveredRating(0)
    setComment("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Rate Your Experience</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">How was your experience working with</p>
              <p className="font-semibold text-gray-900">{workerName}?</p>
            </CardContent>
          </Card>

          {/* Star Rating */}
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-gray-700">Rate the work quality</p>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Comment (Optional)</label>
            <Textarea
              placeholder="Share your experience working with this person..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">{comment.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent" disabled={isSubmitting}>
              Skip Review
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

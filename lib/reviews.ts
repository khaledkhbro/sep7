// Review and rating system for microjob marketplace
export interface Review {
  id: string
  jobId: string
  workProofId: string
  reviewerId: string // employer who gives the review
  revieweeId: string // worker who receives the review
  rating: number // 1-5 stars
  comment?: string
  createdAt: string
  updatedAt: string
  isVisible: boolean // admin can hide reviews
  reviewer: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
  }
  reviewee: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
  }
  job: {
    id: string
    title: string
    category: string
  }
}

const REVIEWS_STORAGE_KEY = "marketplace-reviews"

const getStoredReviews = (): Review[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(REVIEWS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveReviews = (reviews: Review[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch (error) {
    console.error("Failed to save reviews:", error)
  }
}

export async function submitReview(data: {
  jobId: string
  workProofId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment?: string
}): Promise<Review> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  console.log("[v0] 🌟 Submitting review:", data)

  // Get job and user details
  const { getJobById } = await import("./jobs")
  const job = await getJobById(data.jobId)

  const newReview: Review = {
    id: `review_${Date.now()}`,
    jobId: data.jobId,
    workProofId: data.workProofId,
    reviewerId: data.reviewerId,
    revieweeId: data.revieweeId,
    rating: Math.max(1, Math.min(5, data.rating)), // Ensure rating is between 1-5
    comment: data.comment?.trim() || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVisible: true,
    reviewer: {
      id: data.reviewerId,
      firstName: "Job",
      lastName: "Poster",
      username: "employer",
    },
    reviewee: {
      id: data.revieweeId,
      firstName: "Current",
      lastName: "Worker",
      username: "worker",
    },
    job: {
      id: data.jobId,
      title: job?.title || "Microjob Task",
      category: job?.category || "General",
    },
  }

  const reviews = getStoredReviews()
  reviews.push(newReview)
  saveReviews(reviews)

  console.log("[v0] ✅ Review submitted successfully:", newReview.id)
  return newReview
}

export async function getReviewsByUser(userId: string): Promise<Review[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const reviews = getStoredReviews()
  return reviews.filter((review) => review.revieweeId === userId && review.isVisible)
}

export async function getReviewsByJob(jobId: string): Promise<Review[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const reviews = getStoredReviews()
  return reviews.filter((review) => review.jobId === jobId && review.isVisible)
}

export async function getAllReviews(): Promise<Review[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return getStoredReviews()
}

export async function hideReview(reviewId: string): Promise<Review | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const reviews = getStoredReviews()
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId)

  if (reviewIndex === -1) return null

  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    isVisible: false,
    updatedAt: new Date().toISOString(),
  }

  saveReviews(reviews)
  console.log("[v0] 🔒 Review hidden by admin:", reviewId)
  return reviews[reviewIndex]
}

export async function showReview(reviewId: string): Promise<Review | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const reviews = getStoredReviews()
  const reviewIndex = reviews.findIndex((r) => r.id === reviewId)

  if (reviewIndex === -1) return null

  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    isVisible: true,
    updatedAt: new Date().toISOString(),
  }

  saveReviews(reviews)
  console.log("[v0] 👁️ Review shown by admin:", reviewId)
  return reviews[reviewIndex]
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const reviews = getStoredReviews()
  const filteredReviews = reviews.filter((r) => r.id !== reviewId)

  if (filteredReviews.length === reviews.length) return false

  saveReviews(filteredReviews)
  console.log("[v0] 🗑️ Review deleted by admin:", reviewId)
  return true
}

export function calculateUserRating(reviews: Review[]): { averageRating: number; totalReviews: number } {
  const visibleReviews = reviews.filter((r) => r.isVisible)

  if (visibleReviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 }
  }

  const totalRating = visibleReviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = Math.round((totalRating / visibleReviews.length) * 10) / 10 // Round to 1 decimal

  return { averageRating, totalReviews: visibleReviews.length }
}

export function getReviewStatusColor(rating: number): string {
  if (rating >= 4.5) return "text-green-600"
  if (rating >= 3.5) return "text-yellow-600"
  if (rating >= 2.5) return "text-orange-600"
  return "text-red-600"
}

// Modern review system for marketplace - only buyers with completed orders can review
export interface MarketplaceReview {
  id: string
  serviceId: string
  orderId: string // Links review to specific completed order
  buyerId: string
  sellerId: string
  rating: number // Overall rating 1-5
  comment?: string
  // Rating breakdown categories
  sellerCommunication: number // 1-5
  qualityOfDelivery: number // 1-5
  valueOfDelivery: number // 1-5
  // Purchase details
  purchaseAmount: number
  purchaseDate: string
  deliveryTime: string
  createdAt: string
  updatedAt: string
  isVisible: boolean
  // User info
  buyer: {
    id: string
    firstName: string
    lastName: string
    username: string
    avatar?: string
    country?: string
  }
  // Order details for display
  order: {
    id: string
    tierName: string
    totalAmount: number
    completedAt: string
  }
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  categoryAverages: {
    sellerCommunication: number
    qualityOfDelivery: number
    valueOfDelivery: number
  }
}

const MARKETPLACE_REVIEWS_KEY = "marketplace_reviews_v2"

// Get all reviews from localStorage
const getStoredReviews = (): MarketplaceReview[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(MARKETPLACE_REVIEWS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save reviews to localStorage
const saveReviews = (reviews: MarketplaceReview[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(MARKETPLACE_REVIEWS_KEY, JSON.stringify(reviews))
  } catch (error) {
    console.error("Failed to save marketplace reviews:", error)
  }
}

// Check if user can review (has completed order for this service)
export async function canUserReview(
  buyerId: string,
  serviceId: string,
): Promise<{
  canReview: boolean
  completedOrders: any[]
  existingReviews: MarketplaceReview[]
}> {
  const { orderStorage } = await import("./local-storage")

  // Get user's completed orders for this service
  const allOrders = orderStorage.getAll()
  const completedOrders = allOrders.filter(
    (order) => order.buyerId === buyerId && order.marketplaceItemId === serviceId && order.status === "completed",
  )

  // Get existing reviews by this user for this service
  const reviews = getStoredReviews()
  const existingReviews = reviews.filter((review) => review.buyerId === buyerId && review.serviceId === serviceId)

  // User can review if they have more completed orders than reviews
  const canReview = completedOrders.length > existingReviews.length

  return { canReview, completedOrders, existingReviews }
}

// Submit a new review (only if user has completed order)
export async function submitMarketplaceReview(data: {
  serviceId: string
  orderId: string
  buyerId: string
  sellerId: string
  rating: number
  sellerCommunication: number
  qualityOfDelivery: number
  valueOfDelivery: number
  comment?: string
}): Promise<MarketplaceReview> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Verify user can review
  const { canReview, completedOrders } = await canUserReview(data.buyerId, data.serviceId)
  if (!canReview) {
    throw new Error("You can only review services you have purchased and completed")
  }

  // Find the specific order
  const order = completedOrders.find((o) => o.id === data.orderId)
  if (!order) {
    throw new Error("Order not found or not completed")
  }

  // Get service details
  const { getServiceById } = await import("./marketplace")
  const service = await getServiceById(data.serviceId)
  if (!service) {
    throw new Error("Service not found")
  }

  const newReview: MarketplaceReview = {
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    serviceId: data.serviceId,
    orderId: data.orderId,
    buyerId: data.buyerId,
    sellerId: data.sellerId,
    rating: Math.max(1, Math.min(5, Math.round(data.rating))),
    sellerCommunication: Math.max(1, Math.min(5, Math.round(data.sellerCommunication))),
    qualityOfDelivery: Math.max(1, Math.min(5, Math.round(data.qualityOfDelivery))),
    valueOfDelivery: Math.max(1, Math.min(5, Math.round(data.valueOfDelivery))),
    comment: data.comment?.trim() || undefined,
    purchaseAmount: order.amount,
    purchaseDate: order.createdAt,
    deliveryTime: order.deliveredAt
      ? Math.ceil(
          (new Date(order.deliveredAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        ) + " days"
      : "N/A",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isVisible: true,
    buyer: {
      id: data.buyerId,
      firstName: order.buyer.firstName,
      lastName: order.buyer.lastName,
      username: order.buyer.username,
      country: "US", // Default, could be enhanced
    },
    order: {
      id: order.id,
      tierName: "Standard", // Could be enhanced from order data
      totalAmount: order.amount,
      completedAt: order.completedAt || order.deliveredAt || new Date().toISOString(),
    },
  }

  const reviews = getStoredReviews()
  reviews.push(newReview)
  saveReviews(reviews)

  console.log("[v0] ✅ Marketplace review submitted:", newReview.id)
  return newReview
}

// Get reviews for a service with search and sorting
export async function getServiceReviews(
  serviceId: string,
  options: {
    search?: string
    sortBy?: "most_recent" | "most_relevant" | "highest_rating" | "lowest_rating"
    limit?: number
    offset?: number
  } = {},
): Promise<MarketplaceReview[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  let reviews = getStoredReviews().filter((review) => review.serviceId === serviceId && review.isVisible)

  // Apply search filter
  if (options.search) {
    const searchTerm = options.search.toLowerCase()
    reviews = reviews.filter(
      (review) =>
        review.comment?.toLowerCase().includes(searchTerm) ||
        review.buyer.firstName.toLowerCase().includes(searchTerm) ||
        review.buyer.lastName.toLowerCase().includes(searchTerm) ||
        review.buyer.username.toLowerCase().includes(searchTerm),
    )
  }

  // Apply sorting
  switch (options.sortBy) {
    case "most_recent":
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case "most_relevant":
      // Sort by rating and recency combined
      reviews.sort((a, b) => {
        const aScore = a.rating * 0.7 + (new Date(a.createdAt).getTime() / 1000000000) * 0.3
        const bScore = b.rating * 0.7 + (new Date(b.createdAt).getTime() / 1000000000) * 0.3
        return bScore - aScore
      })
      break
    case "highest_rating":
      reviews.sort((a, b) => b.rating - a.rating)
      break
    case "lowest_rating":
      reviews.sort((a, b) => a.rating - b.rating)
      break
    default:
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Apply pagination
  if (options.offset) {
    reviews = reviews.slice(options.offset)
  }
  if (options.limit) {
    reviews = reviews.slice(0, options.limit)
  }

  return reviews
}

// Calculate review statistics for a service
export async function getServiceReviewStats(serviceId: string): Promise<ReviewStats> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  const reviews = getStoredReviews().filter((review) => review.serviceId === serviceId && review.isVisible)

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: {
        sellerCommunication: 0,
        qualityOfDelivery: 0,
        valueOfDelivery: 0,
      },
    }
  }

  // Calculate rating breakdown
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((review) => {
    ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++
  })

  // Calculate averages
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const totalCommunication = reviews.reduce((sum, review) => sum + review.sellerCommunication, 0)
  const totalQuality = reviews.reduce((sum, review) => sum + review.qualityOfDelivery, 0)
  const totalValue = reviews.reduce((sum, review) => sum + review.valueOfDelivery, 0)

  return {
    totalReviews: reviews.length,
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    ratingBreakdown,
    categoryAverages: {
      sellerCommunication: Math.round((totalCommunication / reviews.length) * 10) / 10,
      qualityOfDelivery: Math.round((totalQuality / reviews.length) * 10) / 10,
      valueOfDelivery: Math.round((totalValue / reviews.length) * 10) / 10,
    },
  }
}

// Get user's purchase history for a service (for review eligibility)
export async function getUserPurchaseHistory(
  buyerId: string,
  serviceId: string,
): Promise<{
  completedOrders: any[]
  availableForReview: any[]
  reviewedOrders: string[]
}> {
  const { orderStorage } = await import("./local-storage")

  const allOrders = orderStorage.getAll()
  const completedOrders = allOrders.filter(
    (order) => order.buyerId === buyerId && order.marketplaceItemId === serviceId && order.status === "completed",
  )

  const reviews = getStoredReviews()
  const reviewedOrders = reviews
    .filter((review) => review.buyerId === buyerId && review.serviceId === serviceId)
    .map((review) => review.orderId)

  const availableForReview = completedOrders.filter((order) => !reviewedOrders.includes(order.id))

  return {
    completedOrders,
    availableForReview,
    reviewedOrders,
  }
}

// Initialize with some sample reviews for testing
export async function initializeSampleReviews(): Promise<void> {
  if (typeof window === "undefined") return

  const existing = getStoredReviews()
  if (existing.length > 0) return // Already has data

  const sampleReviews: MarketplaceReview[] = [
    {
      id: "review_sample_1",
      serviceId: "2",
      orderId: "order_sample_1",
      buyerId: "buyer_1",
      sellerId: "seller2",
      rating: 5,
      sellerCommunication: 5,
      qualityOfDelivery: 5,
      valueOfDelivery: 5,
      comment:
        "Outstanding work! Emma delivered exactly what I needed and was very responsive throughout the process. The logo design exceeded my expectations and really captures our brand identity perfectly.",
      purchaseAmount: 150,
      purchaseDate: "2024-01-15T10:00:00Z",
      deliveryTime: "2 days",
      createdAt: "2024-01-18T14:30:00Z",
      updatedAt: "2024-01-18T14:30:00Z",
      isVisible: true,
      buyer: {
        id: "buyer_1",
        firstName: "Michael",
        lastName: "Johnson",
        username: "mjohnson_biz",
        country: "US",
      },
      order: {
        id: "order_sample_1",
        tierName: "Standard",
        totalAmount: 150,
        completedAt: "2024-01-18T12:00:00Z",
      },
    },
    {
      id: "review_sample_2",
      serviceId: "2",
      orderId: "order_sample_2",
      buyerId: "buyer_2",
      sellerId: "seller2",
      rating: 5,
      sellerCommunication: 5,
      qualityOfDelivery: 5,
      valueOfDelivery: 4,
      comment:
        "Great experience overall. The communication was excellent and the final product was very professional. Minor revisions were handled quickly.",
      purchaseAmount: 250,
      purchaseDate: "2024-01-10T08:00:00Z",
      deliveryTime: "3 days",
      createdAt: "2024-01-14T16:45:00Z",
      updatedAt: "2024-01-14T16:45:00Z",
      isVisible: true,
      buyer: {
        id: "buyer_2",
        firstName: "Sarah",
        lastName: "Chen",
        username: "sarahc_startup",
        country: "CA",
      },
      order: {
        id: "order_sample_2",
        tierName: "Premium",
        totalAmount: 250,
        completedAt: "2024-01-13T15:30:00Z",
      },
    },
    {
      id: "review_sample_3",
      serviceId: "2",
      orderId: "order_sample_3",
      buyerId: "buyer_3",
      sellerId: "seller2",
      rating: 4,
      sellerCommunication: 4,
      qualityOfDelivery: 5,
      valueOfDelivery: 4,
      comment:
        "Great work overall. The design was creative and met our requirements. Communication could have been a bit more frequent, but the end result was worth it.",
      purchaseAmount: 100,
      purchaseDate: "2024-01-05T12:00:00Z",
      deliveryTime: "4 days",
      createdAt: "2024-01-10T09:20:00Z",
      updatedAt: "2024-01-10T09:20:00Z",
      isVisible: true,
      buyer: {
        id: "buyer_3",
        firstName: "David",
        lastName: "Rodriguez",
        username: "drodriguez_tech",
        country: "MX",
      },
      order: {
        id: "order_sample_3",
        tierName: "Basic",
        totalAmount: 100,
        completedAt: "2024-01-09T18:00:00Z",
      },
    },
    {
      id: "review_sample_4",
      serviceId: "2",
      orderId: "order_sample_4",
      buyerId: "buyer_4",
      sellerId: "seller2",
      rating: 5,
      sellerCommunication: 5,
      qualityOfDelivery: 5,
      valueOfDelivery: 5,
      comment:
        "Absolutely fantastic! This is my third project with this seller and they never disappoint. Fast delivery, excellent communication, and top-quality work every time.",
      purchaseAmount: 200,
      purchaseDate: "2024-01-20T14:00:00Z",
      deliveryTime: "1 day",
      createdAt: "2024-01-22T11:15:00Z",
      updatedAt: "2024-01-22T11:15:00Z",
      isVisible: true,
      buyer: {
        id: "buyer_4",
        firstName: "Lisa",
        lastName: "Thompson",
        username: "lisa_creative",
        country: "AU",
      },
      order: {
        id: "order_sample_4",
        tierName: "Standard",
        totalAmount: 200,
        completedAt: "2024-01-21T16:30:00Z",
      },
    },
    {
      id: "review_sample_5",
      serviceId: "2",
      orderId: "order_sample_5",
      buyerId: "buyer_5",
      sellerId: "seller2",
      rating: 4,
      sellerCommunication: 4,
      qualityOfDelivery: 4,
      valueOfDelivery: 5,
      comment:
        "Good value for money. The work was completed as requested and the seller was helpful with revisions. Would work with them again.",
      purchaseAmount: 75,
      purchaseDate: "2024-01-25T09:00:00Z",
      deliveryTime: "2 days",
      createdAt: "2024-01-28T13:45:00Z",
      updatedAt: "2024-01-28T13:45:00Z",
      isVisible: true,
      buyer: {
        id: "buyer_5",
        firstName: "James",
        lastName: "Wilson",
        username: "jwilson_biz",
        country: "UK",
      },
      order: {
        id: "order_sample_5",
        tierName: "Basic",
        totalAmount: 75,
        completedAt: "2024-01-27T15:20:00Z",
      },
    },
  ]

  saveReviews(sampleReviews)
  console.log("[v0] ✅ Sample marketplace reviews initialized")
}

// Get seller's total review stats across all services
export async function getSellerReviewStats(sellerId: string): Promise<ReviewStats & { totalProjects: number }> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  const reviews = getStoredReviews().filter((review) => review.sellerId === sellerId && review.isVisible)

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryAverages: {
        sellerCommunication: 0,
        qualityOfDelivery: 0,
        valueOfDelivery: 0,
      },
      totalProjects: 0,
    }
  }

  // Calculate rating breakdown
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((review) => {
    ratingBreakdown[review.rating as keyof typeof ratingBreakdown]++
  })

  // Calculate averages
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const totalCommunication = reviews.reduce((sum, review) => sum + review.sellerCommunication, 0)
  const totalQuality = reviews.reduce((sum, review) => sum + review.qualityOfDelivery, 0)
  const totalValue = reviews.reduce((sum, review) => sum + review.valueOfDelivery, 0)

  // Count unique services (projects)
  const uniqueServices = new Set(reviews.map((review) => review.serviceId))

  return {
    totalReviews: reviews.length,
    averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
    ratingBreakdown,
    categoryAverages: {
      sellerCommunication: Math.round((totalCommunication / reviews.length) * 10) / 10,
      qualityOfDelivery: Math.round((totalQuality / reviews.length) * 10) / 10,
      valueOfDelivery: Math.round((totalValue / reviews.length) * 10) / 10,
    },
    totalProjects: uniqueServices.size,
  }
}

// Get seller's reviews across all services
export async function getSellerReviews(
  sellerId: string,
  options: {
    search?: string
    sortBy?: "most_recent" | "most_relevant" | "highest_rating" | "lowest_rating"
    limit?: number
    offset?: number
  } = {},
): Promise<MarketplaceReview[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  let reviews = getStoredReviews().filter((review) => review.sellerId === sellerId && review.isVisible)

  // Apply search filter
  if (options.search) {
    const searchTerm = options.search.toLowerCase()
    reviews = reviews.filter(
      (review) =>
        review.comment?.toLowerCase().includes(searchTerm) ||
        review.buyer.firstName.toLowerCase().includes(searchTerm) ||
        review.buyer.lastName.toLowerCase().includes(searchTerm) ||
        review.buyer.username.toLowerCase().includes(searchTerm),
    )
  }

  // Apply sorting
  switch (options.sortBy) {
    case "most_recent":
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case "most_relevant":
      reviews.sort((a, b) => {
        const aScore = a.rating * 0.7 + (new Date(a.createdAt).getTime() / 1000000000) * 0.3
        const bScore = b.rating * 0.7 + (new Date(b.createdAt).getTime() / 1000000000) * 0.3
        return bScore - aScore
      })
      break
    case "highest_rating":
      reviews.sort((a, b) => b.rating - a.rating)
      break
    case "lowest_rating":
      reviews.sort((a, b) => a.rating - b.rating)
      break
    default:
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Apply pagination
  if (options.offset) {
    reviews = reviews.slice(options.offset)
  }
  if (options.limit) {
    reviews = reviews.slice(0, options.limit)
  }

  return reviews
}

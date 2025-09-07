import { serviceStorage, orderStorage, type StorageService, type StorageOrder } from "./local-storage"

// Re-export types for compatibility
export type MarketplaceService = StorageService
export type Order = StorageOrder

// Updated API functions to use local storage
export async function getServices(filters?: {
  category?: string
  priceMin?: number
  priceMax?: number
  deliveryTime?: number
  search?: string
}): Promise<MarketplaceService[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  return serviceStorage.search(filters || {})
}

export async function getServiceById(id: string): Promise<MarketplaceService | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))

  console.log("[v0] Looking for service with ID:", id)

  // First try direct ID lookup
  let service = serviceStorage.getById(id)

  if (!service) {
    console.log("[v0] Direct ID lookup failed, trying alternative lookups...")

    // Try to find by slug or title match
    const allServices = serviceStorage.getAll()
    console.log("[v0] Total services available:", allServices.length)
    console.log(
      "[v0] Available service IDs:",
      allServices.map((s) => s.id),
    )

    // Try to find by slug (convert title to slug format)
    service = allServices.find((s) => {
      const titleSlug = s.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      const categorySlug = s.category.slug || s.category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const subcategorySlug = s.subcategory?.slug || s.subcategory?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

      return (
        titleSlug === id ||
        `${categorySlug}-${titleSlug}` === id ||
        `${subcategorySlug}-${titleSlug}` === id ||
        s.id.includes(id) ||
        id.includes(s.id)
      )
    })

    if (service) {
      console.log("[v0] Found service by alternative lookup:", service.id, service.title)
    } else {
      console.log("[v0] No service found for ID:", id)
    }
  } else {
    console.log("[v0] Found service by direct ID lookup:", service.id, service.title)
  }

  return service
}

export async function createService(
  data: Omit<MarketplaceService, "id" | "createdAt" | "updatedAt">,
): Promise<MarketplaceService> {
  console.log("[v0] Creating service with data:", data)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const serviceData = {
    ...data,
    // If serviceTiers exist, use them; otherwise create a default tier from basic pricing
    serviceTiers: data.serviceTiers || [
      {
        id: "basic",
        name: "Basic",
        price: data.price,
        deliveryTime: data.deliveryTime.value,
        revisions: data.revisionsIncluded === -1 ? "unlimited" : data.revisionsIncluded,
        features: ["Standard delivery", "Professional quality"],
        description: data.shortDescription,
      },
    ],
    addOns: data.addOns || [],
  }

  console.log("[v0] Service data with tiers:", serviceData)
  return serviceStorage.create(serviceData)
}

export async function updateService(
  id: string,
  updates: Partial<MarketplaceService>,
): Promise<MarketplaceService | null> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return serviceStorage.update(id, updates)
}

export async function deleteService(id: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return serviceStorage.delete(id)
}

export async function createOrder(data: {
  serviceId: string
  requirements: string
}): Promise<Order> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const service = serviceStorage.getById(data.serviceId)
  if (!service) throw new Error("Service not found")

  const newOrder: Omit<Order, "id" | "createdAt"> = {
    marketplaceItemId: data.serviceId,
    buyerId: "current-user",
    sellerId: service.sellerId,
    amount: service.price,
    status: "pending",
    requirementsProvided: data.requirements,
    deliveryDate: new Date(Date.now() + service.deliveryTime * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    service: {
      title: service.title,
      deliveryTime: service.deliveryTime,
    },
    buyer: {
      firstName: "Current",
      lastName: "User",
      username: "currentuser",
    },
    seller: service.seller,
  }

  return orderStorage.create(newOrder)
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return orderStorage.getUserOrders(userId)
}

// Additional utility functions
export async function incrementServiceViews(serviceId: string): Promise<void> {
  const service = serviceStorage.getById(serviceId)
  if (service) {
    serviceStorage.update(serviceId, { viewsCount: service.viewsCount + 1 })
  }
}

export async function getPopularServices(limit = 6): Promise<MarketplaceService[]> {
  const services = serviceStorage.getAll()
  return services.sort((a, b) => b.totalOrders - a.totalOrders).slice(0, limit)
}

export async function getNewServices(limit = 6): Promise<MarketplaceService[]> {
  const services = serviceStorage.getAll()
  return services.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
}

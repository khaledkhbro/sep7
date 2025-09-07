// Service-related types and functions for admin panel
export interface Service {
  id: string
  userId: string
  title: string
  description: string
  price: number
  category: string
  status: "active" | "inactive" | "pending"
  createdAt: string
}

const SERVICES_STORAGE_KEY = "marketplace-services"

const getStoredServices = (): Service[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(SERVICES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export async function getAllServices(): Promise<Service[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return getStoredServices()
}

export async function createService(serviceData: Omit<Service, "id" | "createdAt">): Promise<Service> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const newService: Service = {
    ...serviceData,
    id: `service_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  const services = getStoredServices()
  services.push(newService)

  if (typeof window !== "undefined") {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services))
  }

  return newService
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Plus, Star, Eye, ShoppingCart, BarChart3, Edit, Package, Plane } from "lucide-react"
import Link from "next/link"
import { serviceStorage, type StorageService } from "@/lib/local-storage"

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800"
    case "paused":
      return "bg-yellow-100 text-yellow-800"
    case "draft":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<StorageService[]>([])
  const [loading, setLoading] = useState(true)
  const [vacationMode, setVacationMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadServices = () => {
      try {
        console.log("[v0] Loading services for current user...")
        if (!user?.id) {
          console.log("[v0] No user ID available, skipping service load")
          setServices([])
          return
        }

        const userServices = serviceStorage.getBySeller(user.id)
        const sortedServices = userServices.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA
        })
        console.log("[v0] Found services:", sortedServices.length)
        setServices(sortedServices)
      } catch (error) {
        console.error("[v0] Error loading services:", error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    const loadVacationMode = () => {
      if (!user?.id) return
      const savedVacationMode = localStorage.getItem(`vacation_mode_${user.id}`)
      setVacationMode(savedVacationMode === "true")
    }

    loadServices()
    loadVacationMode()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "marketplace_services") {
        console.log("[v0] Services updated, reloading...")
        loadServices()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [user?.id])

  const handleVacationModeToggle = (enabled: boolean) => {
    if (!user?.id) return

    setVacationMode(enabled)
    localStorage.setItem(`vacation_mode_${user.id}`, enabled.toString())

    console.log("[v0] Vacation mode", enabled ? "enabled" : "disabled")

    if (enabled) {
      alert("Vacation mode enabled! Your services are now hidden from the marketplace.")
    } else {
      alert("Vacation mode disabled! Your services are now visible in the marketplace.")
    }
  }

  const handleServiceClick = (serviceId: string) => {
    console.log("[v0] Navigating to service:", serviceId)
    router.push(`/marketplace/${serviceId}`)
  }

  const handleViewOrders = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation()
    console.log("[v0] Viewing orders for service:", serviceId)
    router.push(`/dashboard/orders?service=${serviceId}`)
  }

  const handleEditService = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation()
    console.log("[v0] Editing service:", serviceId)
    router.push(`/marketplace/edit/${serviceId}`)
  }

  const handleViewAnalytics = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation()
    console.log("[v0] Viewing analytics for service:", serviceId)
    router.push(`/dashboard/analytics/service/${serviceId}`)
  }

  const activeServices = services.filter((service) => service.status === "active")
  const pausedServices = services.filter((service) => service.status === "paused")
  const draftServices = services.filter((service) => service.status === "draft")

  const ServiceCard = ({ service }: { service: StorageService }) => (
    <Card
      key={service.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleServiceClick(service.id)}
    >
      <CardContent className="p-6">
        <div className="flex space-x-4">
          <div className="flex-shrink-0">
            <img
              src={service.images[0] || "/placeholder.svg"}
              alt={service.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.shortDescription}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-400 fill-current" />
                {service.rating} ({service.totalOrders} orders)
              </div>
              <div className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                {service.viewsCount} views
              </div>
              <div className="flex items-center">
                <ShoppingCart className="mr-1 h-4 w-4" />
                {service.deliveryTime.unit === "instant"
                  ? "Instant"
                  : `${service.deliveryTime.value} ${service.deliveryTime.unit}`}{" "}
                delivery
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-green-600">${service.price}</div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleViewOrders(e, service.id)}
                  className="flex items-center gap-1"
                >
                  <Package className="h-3 w-3" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleEditService(e, service.id)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => handleViewAnalytics(e, service.id)}
                  className="flex items-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const getPaginatedServices = (serviceList: StorageService[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return serviceList.slice(startIndex, endIndex)
  }

  const getTotalPages = (serviceList: StorageService[]) => {
    return Math.ceil(serviceList.length / itemsPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTabChange = () => {
    setCurrentPage(1)
  }

  const PaginationControls = ({ serviceList }: { serviceList: StorageService[] }) => {
    const totalPages = getTotalPages(serviceList)

    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-8">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) handlePageChange(currentPage + 1)
                }}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="My Services" description="Manage your marketplace services and track performance" />
        <div className="flex-1 overflow-auto p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading your services...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="My Services" description="Manage your marketplace services and track performance" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {vacationMode && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Plane className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Vacation Mode Active</h3>
                    <p className="text-sm text-orange-700">
                      Your services are currently hidden from the marketplace. Customers cannot view or order your
                      services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Listings</h2>
              <p className="text-gray-600">
                You have {services.length} service{services.length !== 1 ? "s" : ""} • Click on any service to view
                details
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Plane className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Vacation Mode</span>
                <Switch
                  checked={vacationMode}
                  onCheckedChange={handleVacationModeToggle}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
              <Link href="/marketplace/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Service
                </Button>
              </Link>
            </div>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <ShoppingCart className="mx-auto h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">No services yet</h3>
                    <p className="text-gray-600">Create your first service to start earning on the marketplace</p>
                  </div>
                  <Link href="/marketplace/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Service
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-6" onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all">All Services ({services.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({activeServices.length})</TabsTrigger>
                <TabsTrigger value="paused">Paused ({pausedServices.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({draftServices.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {getPaginatedServices(services).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
                <PaginationControls serviceList={services} />
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {activeServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No active services</p>
                  </div>
                ) : (
                  <>
                    {getPaginatedServices(activeServices).map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                    <PaginationControls serviceList={activeServices} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="paused" className="space-y-4">
                {pausedServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No paused services</p>
                  </div>
                ) : (
                  <>
                    {getPaginatedServices(pausedServices).map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                    <PaginationControls serviceList={pausedServices} />
                  </>
                )}
              </TabsContent>

              <TabsContent value="draft" className="space-y-4">
                {draftServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No draft services</p>
                  </div>
                ) : (
                  <>
                    {getPaginatedServices(draftServices).map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                    <PaginationControls serviceList={draftServices} />
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  )
}

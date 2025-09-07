"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { marketplaceOrderManager, formatOrderStatus, type MarketplaceOrder } from "@/lib/marketplace-orders"
import { useAuth } from "@/contexts/auth-context"
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  MessageCircle,
  Upload,
  DollarSign,
  Truck,
  Flag,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Star,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PaginationComponentProps {
  totalItems: number
  status: string
}

const PaginationComponent: React.FC<PaginationComponentProps> = ({ totalItems, status }) => {
  const totalPages = Math.ceil(totalItems / 5)
  const [currentPage, setCurrentPage] = useState(1)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return totalPages > 1 ? (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * 5 + 1} to {Math.min(currentPage * 5, totalItems)} of {totalItems} orders
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => handlePageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  ) : null
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [orders, setOrders] = useState<MarketplaceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null)
  const [deliveryMessage, setDeliveryMessage] = useState("")
  const [deliveryFiles, setDeliveryFiles] = useState<string[]>([])
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeDetails, setDisputeDetails] = useState("")

  const viewMode = (searchParams.get("view") as "buyer" | "seller") || "buyer"

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "price" | "status">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.requirements.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "price":
          comparison = a.price - b.price
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [orders, searchQuery, sortBy, sortOrder, statusFilter])

  const ITEMS_PER_PAGE = 5
  const currentPageOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredAndSortedOrders.slice(start, end)
  }, [filteredAndSortedOrders, currentPage])

  const totalPagesCount = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE)

  const awaitingOrders = orders.filter((order) => order.status === "awaiting_acceptance")
  const activeOrders = orders.filter((order) => ["pending", "in_progress"].includes(order.status))
  const deliveredOrders = orders.filter((order) => order.status === "delivered")
  const completedOrders = orders.filter((order) => ["completed", "dispute_resolved"].includes(order.status))
  const cancelledOrders = orders.filter((order) => ["cancelled", "disputed"].includes(order.status))

  useEffect(() => {
    if (user) {
      loadOrders()
    }

    const interval = setInterval(() => {
      marketplaceOrderManager.cleanupExpiredOrders()
      if (user) {
        loadOrders()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [viewMode, user])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, sortOrder, statusFilter, viewMode])

  const loadOrders = () => {
    if (!user) return

    setLoading(true)
    try {
      const userOrders = marketplaceOrderManager.getOrdersByUser(user.id, viewMode)
      console.log(`[v0] Loaded ${viewMode} orders:`, userOrders.length)
      setOrders(userOrders)
    } catch (error) {
      console.error("[v0] Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOrdersByStatus = (status: string) => {
    let statusOrders = []

    switch (status) {
      case "awaiting":
        statusOrders = filteredAndSortedOrders.filter((order) => order.status === "awaiting_acceptance")
        break
      case "active":
        statusOrders = filteredAndSortedOrders.filter((order) => ["pending", "in_progress"].includes(order.status))
        break
      case "delivered":
        statusOrders = filteredAndSortedOrders.filter((order) => order.status === "delivered")
        break
      case "completed":
        statusOrders = filteredAndSortedOrders.filter((order) =>
          ["completed", "dispute_resolved"].includes(order.status),
        )
        break
      case "cancelled":
        statusOrders = filteredAndSortedOrders.filter((order) => ["cancelled", "disputed"].includes(order.status))
        break
      default:
        statusOrders = filteredAndSortedOrders
    }

    const startIdx = (currentPage - 1) * itemsPerPage
    return statusOrders.slice(startIdx, startIdx + itemsPerPage)
  }

  const handleReleasePayment = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const success = marketplaceOrderManager.releasePayment(orderId, user.id)
      if (success) {
        loadOrders()
        alert("Payment released successfully! The seller has been paid.")
      } else {
        alert("Failed to release payment. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error releasing payment:", error)
      alert("Failed to release payment. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleOpenDispute = async () => {
    if (!selectedOrder || !disputeReason.trim()) return

    setActionLoading(selectedOrder.id)
    try {
      const success = marketplaceOrderManager.openDispute(selectedOrder.id, user.id, disputeReason, disputeDetails)

      if (success) {
        loadOrders()
        setSelectedOrder(null)
        setDisputeReason("")
        setDisputeDetails("")
        alert("Dispute opened successfully. An admin will review your case.")
      } else {
        alert("Failed to open dispute. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error opening dispute:", error)
      alert("Failed to open dispute. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const success = marketplaceOrderManager.acceptOrder(orderId, user.id)
      if (success) {
        loadOrders()
        alert("Order accepted successfully! You can now start working on it.")
      } else {
        alert("Failed to accept order. It may have expired or already been processed.")
      }
    } catch (error) {
      console.error("[v0] Error accepting order:", error)
      alert("Failed to accept order. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const reason = prompt("Please provide a reason for declining this order:")
      if (reason) {
        const success = marketplaceOrderManager.declineOrder(orderId, user.id, reason)
        if (success) {
          loadOrders()
          alert("Order declined. The buyer has been refunded.")
        } else {
          alert("Failed to decline order. Please try again.")
        }
      }
    } catch (error) {
      console.error("[v0] Error declining order:", error)
      alert("Failed to decline order. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: "pending" | "in_progress" | "delivered") => {
    setActionLoading(orderId)
    try {
      const success = marketplaceOrderManager.updateOrderStatus(orderId, user.id, newStatus)
      if (success) {
        loadOrders()
        alert(`Order status updated to ${formatOrderStatus(newStatus)}`)
      } else {
        alert("Failed to update order status. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error updating status:", error)
      alert("Failed to update order status. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubmitDelivery = async () => {
    if (!selectedOrder || !deliveryMessage.trim()) return

    setActionLoading(selectedOrder.id)
    try {
      const success = marketplaceOrderManager.submitDelivery(selectedOrder.id, user.id, {
        files: deliveryFiles,
        message: deliveryMessage,
      })

      if (success) {
        loadOrders()
        setSelectedOrder(null)
        setDeliveryMessage("")
        setDeliveryFiles([])
        alert("Delivery submitted successfully! The buyer has 3 days to review and release payment.")
      } else {
        alert("Failed to submit delivery. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error submitting delivery:", error)
      alert("Failed to submit delivery. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const remaining = marketplaceOrderManager.getTimeRemaining(deadline)
    if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0) {
      return "Expired"
    }
    if (remaining.days > 0) {
      return `${remaining.days}d ${remaining.hours}h remaining`
    }
    if (remaining.hours > 0) {
      return `${remaining.hours}h ${remaining.minutes}m remaining`
    }
    return `${remaining.minutes}m remaining`
  }

  const getStatusIcon = (status: MarketplaceOrder["status"]) => {
    switch (status) {
      case "awaiting_acceptance":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "in_progress":
        return <Package className="h-4 w-4" />
      case "delivered":
        return <Truck className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
      case "disputed":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          title={viewMode === "buyer" ? "My Orders" : "Seller Orders"}
          description={
            viewMode === "buyer"
              ? "Track your purchases and manage payments"
              : "Manage your marketplace orders and deliveries"
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  const handleLeaveReview = (orderId: string) => {
    router.push(`/marketplace/reviews/create?orderId=${orderId}`)
  }

  const OrderCard = ({ order, viewMode }: { order: MarketplaceOrder; viewMode: "buyer" | "seller" }) => {
    const router = useRouter()
    return (
      <Card key={order.id} className="border-gray-200 bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                <p className="text-sm text-gray-600">
                  Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                  {viewMode === "buyer" ? order.sellerId : order.buyerId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border-0 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <Eye className="h-4 w-4 relative z-10 group-hover:animate-pulse" />
                <span className="relative z-10">View Details</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              </Button>
              {order.status === "delivered" && viewMode === "buyer" && (
                <Button
                  onClick={() => handleLeaveReview(order.id)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Leave Review
                </Button>
              )}
              <Badge variant="secondary" className="bg-orange-500">
                {order.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Requirements:</h4>
            <p className="text-sm text-gray-700">{order.requirements}</p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/messages?orderId=${order.id}`)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Message {viewMode === "buyer" ? "Seller" : "Buyer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <DashboardHeader
        title={viewMode === "buyer" ? "My Orders" : "Seller Orders"}
        description={
          viewMode === "buyer"
            ? "Track your purchases and manage payments"
            : "Manage your marketplace orders and deliveries"
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">
                {viewMode === "buyer" ? "Your Orders" : "Orders for Your Services"}
              </h2>
            </div>

            <Button
              variant="outline"
              onClick={loadOrders}
              disabled={loading}
              className="flex items-center space-x-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="awaiting_acceptance">Awaiting Acceptance</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: "date" | "price" | "status") => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date Created</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center space-x-2"
                >
                  {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {viewMode === "buyer" ? (
              <>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-700 font-medium">Awaiting Acceptance</p>
                        <p className="text-2xl font-bold text-yellow-800">{awaitingOrders.length}</p>
                      </div>
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">In Progress</p>
                        <p className="text-2xl font-bold text-blue-800">{activeOrders.length}</p>
                      </div>
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Awaiting Review</p>
                        <p className="text-2xl font-bold text-purple-800">{deliveredOrders.length}</p>
                      </div>
                      <Star className="h-6 w-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-green-800">{completedOrders.length}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-800">
                          ${completedOrders.reduce((sum, order) => sum + order.price, 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-700 font-medium">Awaiting Acceptance</p>
                        <p className="text-2xl font-bold text-yellow-800">{awaitingOrders.length}</p>
                      </div>
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Active Orders</p>
                        <p className="text-2xl font-bold text-blue-800">{activeOrders.length}</p>
                      </div>
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Delivered</p>
                        <p className="text-2xl font-bold text-purple-800">{deliveredOrders.length}</p>
                      </div>
                      <Truck className="h-6 w-6 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-green-800">{completedOrders.length}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-800">
                          ${completedOrders.reduce((sum, order) => sum + order.price, 0).toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="h-6 w-6 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="text-gray-400">
                    <Package className="mx-auto h-12 w-12" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {viewMode === "buyer" ? "No orders yet" : "No orders yet"}
                    </h3>
                    <p className="text-gray-600">
                      {viewMode === "buyer"
                        ? "When you purchase services, your orders will appear here"
                        : "When customers place orders for your services, they'll appear here"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
                <TabsTrigger value="awaiting">
                  {viewMode === "buyer" ? "Awaiting" : "Awaiting"} ({awaitingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  {viewMode === "buyer" ? "In Progress" : "Active"} ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  {viewMode === "buyer" ? "Review" : "Delivered"} ({deliveredOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                <TabsTrigger value="cancelled">Issues ({cancelledOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="space-y-4">
                  {currentPageOrders.length > 0 ? (
                    currentPageOrders.map((order) => <OrderCard key={order.id} order={order} viewMode={viewMode} />)
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No orders found</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Your orders will appear here once you start buying or selling services"}
                      </p>
                    </div>
                  )}
                </div>

                {totalPagesCount > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedOrders.length)} of{" "}
                      {filteredAndSortedOrders.length} orders
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPagesCount }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(Math.min(totalPagesCount, currentPage + 1))}
                            className={
                              currentPage === totalPagesCount ? "pointer-events-none opacity-50" : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="awaiting" className="space-y-4">
                {getOrdersByStatus("awaiting").map((order) => (
                  <Card key={order.id} className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                              {viewMode === "buyer" ? order.sellerId : order.buyerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border-0 group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <Eye className="h-4 w-4 relative z-10 group-hover:animate-pulse" />
                            <span className="relative z-10">View Details</span>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                          </Button>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg mb-4">
                        <h4 className="font-medium mb-2">Requirements:</h4>
                        <p className="text-sm text-gray-700">{order.requirements}</p>
                      </div>

                      <div className="flex space-x-2">
                        {viewMode === "seller" ? (
                          <>
                            <Button
                              onClick={() => handleAcceptOrder(order.id)}
                              disabled={actionLoading === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === order.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Accept Order
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeclineOrder(order.id)}
                              disabled={actionLoading === order.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Decline
                            </Button>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">Waiting for seller to accept your order...</div>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/messages?orderId=${order.id}`)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message {viewMode === "buyer" ? "Seller" : "Buyer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <PaginationComponent
                  totalItems={filteredAndSortedOrders.filter((order) => order.status === "awaiting_acceptance").length}
                  status="awaiting"
                />

                {awaitingOrders.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {viewMode === "buyer" ? "No orders awaiting acceptance" : "No orders awaiting acceptance"}
                    </h3>
                    <p className="text-gray-600">
                      {viewMode === "buyer"
                        ? "Orders waiting for seller acceptance will appear here"
                        : "New orders will appear here for you to accept or decline"}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="space-y-4">
                {getOrdersByStatus("active").map((order) => (
                  <Card key={order.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                              {viewMode === "buyer" ? order.sellerId : order.buyerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border-0 group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <Eye className="h-4 w-4 relative z-10 group-hover:animate-pulse" />
                            <span className="relative z-10">View Details</span>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                          </Button>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg mb-4">
                        <h4 className="font-medium mb-2">Requirements:</h4>
                        <p className="text-sm text-gray-700">{order.requirements}</p>
                      </div>

                      <div className="flex space-x-2">
                        {viewMode === "seller" ? (
                          <>
                            {order.status === "pending" && (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, "in_progress")}
                                disabled={actionLoading === order.id}
                              >
                                <Package className="mr-2 h-4 w-4" />
                                Start Working
                              </Button>
                            )}

                            {order.status === "in_progress" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Submit Delivery
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Submit Delivery</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Delivery Message *</label>
                                      <Textarea
                                        placeholder="Describe what you've delivered and any important notes for the buyer..."
                                        value={deliveryMessage}
                                        onChange={(e) => setDeliveryMessage(e.target.value)}
                                        rows={4}
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium">Delivery Files (Optional)</label>
                                      <Input
                                        type="text"
                                        placeholder="Add file URLs (one per line)"
                                        value={deliveryFiles.join("\n")}
                                        onChange={(e) => setDeliveryFiles(e.target.value.split("\n").filter(Boolean))}
                                      />
                                    </div>

                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Once submitted, the buyer will have 3 days to review and release payment.
                                      </AlertDescription>
                                    </Alert>

                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSubmitDelivery}
                                        disabled={!deliveryMessage.trim() || actionLoading === selectedOrder?.id}
                                      >
                                        {actionLoading === selectedOrder?.id ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Submitting...
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Submit Delivery
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {order.status === "pending"
                              ? "Seller will start working soon..."
                              : "Seller is working on your order..."}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/messages?orderId=${order.id}`)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message {viewMode === "buyer" ? "Seller" : "Buyer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <PaginationComponent
                  totalItems={
                    filteredAndSortedOrders.filter((order) => ["pending", "in_progress"].includes(order.status)).length
                  }
                  status="active"
                />
              </TabsContent>

              <TabsContent value="delivered" className="space-y-4">
                {getOrdersByStatus("delivered").map((order) => (
                  <Card key={order.id} className="border-purple-200 bg-purple-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                              {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                              {viewMode === "buyer" ? order.sellerId : order.buyerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border-0 group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <Eye className="h-4 w-4 relative z-10 group-hover:animate-pulse" />
                            <span className="relative z-10">View Details</span>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                          </Button>
                          {order.status === "delivered" && viewMode === "buyer" && (
                            <Button
                              onClick={() => handleLeaveReview(order.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Leave Review
                            </Button>
                          )}
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {order.deliverables && (
                        <div className="bg-white p-4 rounded-lg mb-4">
                          <h4 className="font-medium mb-2">Delivered:</h4>
                          <p className="text-sm text-gray-700 mb-2">{order.deliverables.message}</p>
                          {order.deliverables.files.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {order.deliverables.files.length} file(s) attached
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {viewMode === "buyer" ? (
                          <>
                            <Button
                              onClick={() => handleReleasePayment(order.id)}
                              disabled={actionLoading === order.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {actionLoading === order.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Releasing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Release Payment
                                </>
                              )}
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedOrder(order)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Open Dispute
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Open Dispute</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Dispute Reason *</label>
                                    <Select value={disputeReason} onValueChange={setDisputeReason}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="not_as_described">Work not as described</SelectItem>
                                        <SelectItem value="incomplete">Incomplete delivery</SelectItem>
                                        <SelectItem value="poor_quality">Poor quality work</SelectItem>
                                        <SelectItem value="late_delivery">Late delivery</SelectItem>
                                        <SelectItem value="no_communication">No communication from seller</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Additional Details</label>
                                    <Textarea
                                      placeholder="Please provide more details about the issue..."
                                      value={disputeDetails}
                                      onChange={(e) => setDisputeDetails(e.target.value)}
                                      rows={4}
                                    />
                                  </div>

                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Opening a dispute will pause the order and notify an admin for review.
                                    </AlertDescription>
                                  </Alert>

                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleOpenDispute}
                                      disabled={!disputeReason || actionLoading === selectedOrder?.id}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {actionLoading === selectedOrder?.id ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                          Opening...
                                        </>
                                      ) : (
                                        <>
                                          <Flag className="mr-2 h-4 w-4" />
                                          Open Dispute
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Waiting for buyer to review and release payment...
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/messages?orderId=${order.id}`)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message {viewMode === "buyer" ? "Seller" : "Buyer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <PaginationComponent
                  totalItems={filteredAndSortedOrders.filter((order) => order.status === "delivered").length}
                  status="delivered"
                />
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                {getOrdersByStatus("completed").map((order) => (
                  <Card key={order.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                              {viewMode === "buyer" ? order.sellerId : order.buyerId}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-green-700">
                            Completed {formatDistanceToNow(new Date(order.completedAt!), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <PaginationComponent
                  totalItems={
                    filteredAndSortedOrders.filter((order) => ["completed", "dispute_resolved"].includes(order.status))
                      .length
                  }
                  status="completed"
                />
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4">
                {getOrdersByStatus("cancelled").map((order) => (
                  <Card key={order.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-red-100 text-red-700">
                              {(viewMode === "buyer" ? order.sellerId : order.buyerId).slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.serviceTitle}</h3>
                            <p className="text-sm text-gray-600">
                              Order #{order.id.slice(-8)} • {viewMode === "buyer" ? "Seller" : "Buyer"}:{" "}
                              {viewMode === "buyer" ? order.sellerId : order.buyerId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                            className="relative flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out border-0 group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            <Eye className="h-4 w-4 relative z-10 group-hover:animate-pulse" />
                            <span className="relative z-10">View Details</span>
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                          </Button>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {order.disputeReason && (
                        <div className="bg-white p-4 rounded-lg mb-4">
                          <h4 className="font-medium mb-2">
                            {order.status === "disputed" ? "Dispute Reason:" : "Issue:"}
                          </h4>
                          <p className="text-sm text-gray-700">{order.disputeReason}</p>
                          {order.disputeDetails && <p className="text-sm text-gray-600 mt-2">{order.disputeDetails}</p>}
                          {order.adminDecision && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm font-medium text-blue-800">Admin Decision:</p>
                              <p className="text-sm text-blue-700">
                                {order.adminDecision === "refund_buyer"
                                  ? "Refund issued to buyer"
                                  : "Payment released to seller"}
                              </p>
                              {order.adminNotes && <p className="text-sm text-blue-600 mt-1">{order.adminNotes}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                <PaginationComponent
                  totalItems={
                    filteredAndSortedOrders.filter((order) => ["cancelled", "disputed"].includes(order.status)).length
                  }
                  status="cancelled"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* ... existing dialogs and modals ... */}
    </>
  )
}

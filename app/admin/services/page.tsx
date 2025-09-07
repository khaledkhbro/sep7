"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Search, MoreHorizontal, Eye, CheckCircle, XCircle, Trash2, Star } from "lucide-react"

// Mock data for services
const mockServices = [
  {
    id: 1, // Changed to numeric ID starting from 1
    title: "Professional Logo Design",
    seller: "John Designer",
    sellerId: "user1",
    category: "Design",
    price: 50,
    rating: 4.8,
    orders: 156,
    status: "active",
    createdAt: "2024-01-15",
    description: "I will create a professional logo design for your business with unlimited revisions.",
    tags: ["logo", "branding", "design"],
    deliveryTime: "3 days",
  },
  {
    id: 2, // Changed to numeric ID
    title: "Website Development",
    seller: "Sarah Developer",
    sellerId: "user2",
    category: "Programming",
    price: 200,
    rating: 4.9,
    orders: 89,
    status: "pending",
    createdAt: "2024-01-20",
    description: "Full-stack web development using React and Node.js.",
    tags: ["web", "react", "nodejs"],
    deliveryTime: "7 days",
  },
  {
    id: 3, // Changed to numeric ID
    title: "Content Writing",
    seller: "Mike Writer",
    sellerId: "user3",
    category: "Writing",
    price: 25,
    rating: 4.6,
    orders: 234,
    status: "suspended",
    createdAt: "2024-01-10",
    description: "High-quality content writing for blogs and websites.",
    tags: ["writing", "content", "blog"],
    deliveryTime: "2 days",
  },
  {
    id: 4, // Added more services with sequential IDs
    title: "Social Media Marketing",
    seller: "Emma Marketer",
    sellerId: "user4",
    category: "Marketing",
    price: 75,
    rating: 4.7,
    orders: 98,
    status: "active",
    createdAt: "2024-01-25",
    description: "Complete social media marketing strategy and management.",
    tags: ["social", "marketing", "strategy"],
    deliveryTime: "5 days",
  },
  {
    id: 5, // Added more services
    title: "Mobile App Development",
    seller: "Alex Developer",
    sellerId: "user5",
    category: "Programming",
    price: 500,
    rating: 4.9,
    orders: 45,
    status: "active",
    createdAt: "2024-02-01",
    description: "Native mobile app development for iOS and Android.",
    tags: ["mobile", "app", "ios", "android"],
    deliveryTime: "14 days",
  },
]

export default function AdminServicesPage() {
  const [services, setServices] = useState(mockServices)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedServices, setSelectedServices] = useState<number[]>([]) // Changed to number array
  const [selectedService, setSelectedService] = useState<any>(null)
  const [showServiceDetails, setShowServiceDetails] = useState(false)

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.seller.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleServiceAction = (serviceId: number, action: string) => {
    // Changed parameter type to number
    if (action === "view") {
      const service = services.find((s) => s.id === serviceId)
      setSelectedService(service)
      setShowServiceDetails(true)
      return
    }

    setServices((prev) =>
      prev.map((service) => {
        if (service.id === serviceId) {
          switch (action) {
            case "approve":
              toast({ title: "Service approved successfully" })
              return { ...service, status: "active" }
            case "suspend":
              toast({ title: "Service suspended successfully" })
              return { ...service, status: "suspended" }
            case "delete":
              toast({ title: "Service deleted successfully" })
              return service
            default:
              return service
          }
        }
        return service
      }),
    )

    if (action === "delete") {
      setServices((prev) => prev.filter((service) => service.id !== serviceId))
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedServices.length === 0) {
      toast({ title: "No services selected", variant: "destructive" })
      return
    }

    setServices((prev) =>
      prev.map((service) => {
        if (selectedServices.includes(service.id)) {
          switch (action) {
            case "approve":
              return { ...service, status: "active" }
            case "suspend":
              return { ...service, status: "suspended" }
            default:
              return service
          }
        }
        return service
      }),
    )

    if (action === "delete") {
      setServices((prev) => prev.filter((service) => !selectedServices.includes(service.id)))
    }

    setSelectedServices([])
    toast({ title: `Bulk ${action} completed successfully` })
  }

  const toggleServiceSelection = (serviceId: number) => {
    // Changed parameter type to number
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const toggleSelectAll = () => {
    setSelectedServices((prev) => (prev.length === filteredServices.length ? [] : filteredServices.map((s) => s.id)))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
    }
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Services Management</h1>
        <p className="text-muted-foreground">Manage and oversee all marketplace services</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {services.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {services.filter((s) => s.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {services.filter((s) => s.status === "suspended").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services or sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedServices.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{selectedServices.length} service(s) selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("approve")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("suspend")}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspend Selected
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Services ({filteredServices.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div key={service.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleServiceSelection(service.id)}
                />

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">#{service.id}</span>{" "}
                    {/* Added service ID display */}
                    <h3 className="font-semibold">{service.title}</h3>
                    <Badge className={getStatusBadge(service.status)}>{service.status}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>By {service.seller}</span>
                    <span>•</span>
                    <span>{service.category}</span>
                    <span>•</span>
                    <span>${service.price}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{service.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{service.orders} orders</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {service.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleServiceAction(service.id, "view")}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleServiceAction(service.id, "approve")}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleServiceAction(service.id, "suspend")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleServiceAction(service.id, "delete")}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Details Modal */}
      <Dialog open={showServiceDetails} onOpenChange={setShowServiceDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedService.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span>By {selectedService.seller}</span>
                  <Badge className={getStatusBadge(selectedService.status)}>{selectedService.status}</Badge>
                </div>
                <p className="text-muted-foreground">{selectedService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Service Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{selectedService.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>${selectedService.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Time:</span>
                      <span>{selectedService.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{selectedService.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span>{selectedService.orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{selectedService.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex gap-2">
                  {selectedService.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleServiceAction(selectedService.id, "approve")
                    setShowServiceDetails(false)
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleServiceAction(selectedService.id, "suspend")
                    setShowServiceDetails(false)
                  }}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Suspend Service
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

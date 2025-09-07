"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Settings,
  TrendingUp,
  Eye,
  ShoppingCart,
  Star,
  MousePointer,
  Users,
  Layers,
  Package,
  X,
  CheckCircle,
  Target,
  Grid,
} from "lucide-react"
import { format } from "date-fns"

interface AlgorithmSettings {
  id: string
  name: string
  weight: number
  enabled: boolean
  description: string
}

interface PromotedService {
  id: string
  title: string
  category: string
  position: number
  startDate: Date
  endDate: Date
  enabled: boolean
}

interface SubcategoryControl {
  id: string
  name: string
  categoryId: string
  weight: number
  enabled: boolean
  priority: "high" | "medium" | "low"
}

interface ServiceControl {
  id: string
  title: string
  categoryId: string
  subcategoryId: string
  weight: number
  enabled: boolean
  boostType: "none" | "trending" | "featured" | "new"
  customRanking: number
}

export default function MarketplaceAlgorithmPage() {
  const [algorithmSettings, setAlgorithmSettings] = useState<AlgorithmSettings[]>([
    {
      id: "popular",
      name: "Most Popular",
      weight: 25,
      enabled: true,
      description: "Based on view count and engagement",
    },
    { id: "bought", name: "Most Bought", weight: 30, enabled: true, description: "Based on total orders and sales" },
    { id: "clicked", name: "Most Clicked", weight: 20, enabled: true, description: "Based on click-through rates" },
    {
      id: "viewed",
      name: "Most Viewed",
      weight: 15,
      enabled: true,
      description: "Based on page views and impressions",
    },
    {
      id: "reviewed",
      name: "Most Reviewed",
      weight: 20,
      enabled: true,
      description: "Based on review count and ratings",
    },
    {
      id: "fast_delivery",
      name: "Fast Delivery",
      weight: 10,
      enabled: true,
      description: "Based on delivery speed and completion time",
    },
  ])

  const [promotedServices, setPromotedServices] = useState<PromotedService[]>([
    {
      id: "1",
      title: "Professional Logo Design",
      category: "Graphics & Design",
      position: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      enabled: true,
    },
  ])

  const [subcategoryControls, setSubcategoryControls] = useState<SubcategoryControl[]>([
    {
      id: "logo-design",
      name: "Logo Design",
      categoryId: "graphics-design",
      weight: 80,
      enabled: true,
      priority: "high",
    },
    {
      id: "web-design",
      name: "Web Design",
      categoryId: "graphics-design",
      weight: 70,
      enabled: true,
      priority: "high",
    },
    {
      id: "frontend-dev",
      name: "Frontend Development",
      categoryId: "web-development",
      weight: 85,
      enabled: true,
      priority: "high",
    },
    {
      id: "backend-dev",
      name: "Backend Development",
      categoryId: "web-development",
      weight: 75,
      enabled: true,
      priority: "medium",
    },
    {
      id: "content-writing",
      name: "Content Writing",
      categoryId: "writing-translation",
      weight: 60,
      enabled: true,
      priority: "medium",
    },
    {
      id: "seo-marketing",
      name: "SEO Marketing",
      categoryId: "digital-marketing",
      weight: 90,
      enabled: true,
      priority: "high",
    },
  ])

  const [serviceControls, setServiceControls] = useState<ServiceControl[]>([
    {
      id: "1",
      title: "Professional Logo Design Package",
      categoryId: "graphics-design",
      subcategoryId: "logo-design",
      weight: 95,
      enabled: true,
      boostType: "featured",
      customRanking: 1,
    },
    {
      id: "2",
      title: "Modern Website Development",
      categoryId: "web-development",
      subcategoryId: "frontend-dev",
      weight: 88,
      enabled: true,
      boostType: "trending",
      customRanking: 2,
    },
    {
      id: "3",
      title: "SEO Content Writing Service",
      categoryId: "writing-translation",
      subcategoryId: "content-writing",
      weight: 75,
      enabled: true,
      boostType: "new",
      customRanking: 5,
    },
    {
      id: "4",
      title: "Complete SEO Optimization",
      categoryId: "digital-marketing",
      subcategoryId: "seo-marketing",
      weight: 92,
      enabled: true,
      boostType: "featured",
      customRanking: 3,
    },
  ])

  const [pageSettings, setPageSettings] = useState({
    servicesPerPage: 20,
    featuredServicesCount: 6,
    categoriesOnFirstPage: 8,
    enablePersonalization: true,
    enableBrowsingHistory: true,
    enableSimilarServices: true,
    recommendationCount: 12,
  })

  const [showServiceBrowser, setShowServiceBrowser] = useState(false)
  const [selectedServiceForPromotion, setSelectedServiceForPromotion] = useState<any>(null)
  const [serviceSearch, setServiceSearch] = useState<string>("")
  const [searchedService, setSearchedService] = useState<any>(null)

  const availableServices = [
    {
      id: 1,
      title: "Professional Logo Design",
      category: "Graphics & Design",
      subcategory: "Logo Design",
      seller: "John Doe",
      rating: 4.9,
      orders: 1250,
    },
    {
      id: 2,
      title: "WordPress Website Development",
      category: "Web Development",
      subcategory: "WordPress",
      seller: "Jane Smith",
      rating: 4.8,
      orders: 890,
    },
    {
      id: 3,
      title: "SEO Content Writing",
      category: "Writing & Translation",
      subcategory: "Content Writing",
      seller: "Mike Johnson",
      rating: 4.7,
      orders: 650,
    },
    {
      id: 4,
      title: "Social Media Marketing",
      category: "Digital Marketing",
      subcategory: "Social Media",
      seller: "Sarah Wilson",
      rating: 4.9,
      orders: 420,
    },
    {
      id: 5,
      title: "Video Editing & Animation",
      category: "Video & Animation",
      subcategory: "Video Editing",
      seller: "David Brown",
      rating: 4.6,
      orders: 380,
    },
    {
      id: 6,
      title: "Mobile App Development",
      category: "Programming & Tech",
      subcategory: "Mobile Apps",
      seller: "Lisa Chen",
      rating: 4.8,
      orders: 125,
    },
    {
      id: 7,
      title: "Business Plan Writing",
      category: "Business",
      subcategory: "Business Plans",
      seller: "Robert Taylor",
      rating: 4.7,
      orders: 95,
    },
    {
      id: 8,
      title: "Fitness Coaching",
      category: "Lifestyle",
      subcategory: "Fitness",
      seller: "Emma Davis",
      rating: 4.9,
      orders: 310,
    },
  ]

  // Mock services for adding new services
  const mockServices = [
    { id: 9, title: "AI-Powered Chatbot Development", category: "Programming & Tech", subcategory: "AI Development" },
    { id: 10, title: "E-commerce Store Setup", category: "Web Development", subcategory: "E-commerce" },
    {
      id: 11,
      title: "Technical Writing Services",
      category: "Writing & Translation",
      subcategory: "Technical Writing",
    },
  ]

  const [newServiceSearch, setNewServiceSearch] = useState<string>("")
  const [selectedNewService, setSelectedNewService] = useState<any>(null)

  const updateAlgorithmWeight = (id: string, weight: number) => {
    setAlgorithmSettings((prev) => prev.map((setting) => (setting.id === id ? { ...setting, weight } : setting)))
  }

  const toggleAlgorithm = (id: string) => {
    setAlgorithmSettings((prev) =>
      prev.map((setting) => (setting.id === id ? { ...setting, enabled: !setting.enabled } : setting)),
    )
  }

  const addPromotedService = () => {
    const newService: PromotedService = {
      id: Date.now().toString(),
      title: "",
      category: "",
      position: promotedServices.length + 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      enabled: true,
    }
    setPromotedServices((prev) => [...prev, newService])
  }

  const updatePromotedService = (id: string, updates: Partial<PromotedService>) => {
    setPromotedServices((prev) => prev.map((service) => (service.id === id ? { ...service, ...updates } : service)))
  }

  const removePromotedService = (id: string) => {
    setPromotedServices((prev) => prev.filter((service) => service.id !== id))
  }

  const updateSubcategoryWeight = (id: string, weight: number) => {
    setSubcategoryControls((prev) => prev.map((sub) => (sub.id === id ? { ...sub, weight } : sub)))
  }

  const toggleSubcategory = (id: string) => {
    setSubcategoryControls((prev) => prev.map((sub) => (sub.id === id ? { ...sub, enabled: !sub.enabled } : sub)))
  }

  const updateSubcategoryPriority = (id: string, priority: "high" | "medium" | "low") => {
    setSubcategoryControls((prev) => prev.map((sub) => (sub.id === id ? { ...sub, priority } : sub)))
  }

  const updateServiceWeight = (id: string, weight: number) => {
    setServiceControls((prev) => prev.map((service) => (service.id === id ? { ...service, weight } : service)))
  }

  const toggleService = (id: string) => {
    setServiceControls((prev) =>
      prev.map((service) => (service.id === id ? { ...service, enabled: !service.enabled } : service)),
    )
  }

  const updateServiceBoost = (id: string, boostType: "none" | "trending" | "featured" | "new") => {
    setServiceControls((prev) => prev.map((service) => (service.id === id ? { ...service, boostType } : service)))
  }

  const updateServiceRanking = (id: string, customRanking: number) => {
    setServiceControls((prev) => prev.map((service) => (service.id === id ? { ...service, customRanking } : service)))
  }

  const saveSettings = async () => {
    // API call to save settings
    console.log("Saving algorithm settings:", {
      algorithmSettings,
      promotedServices,
      pageSettings,
      subcategoryControls,
      serviceControls,
    })
  }

  const selectServiceForPromotion = (service: any) => {
    const newService: PromotedService = {
      id: Date.now().toString(),
      title: `#${service.id} - ${service.title}`,
      category: service.category,
      position: promotedServices.length + 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      enabled: true,
    }
    setPromotedServices((prev) => [...prev, newService])
    setShowServiceBrowser(false)
    setSelectedServiceForPromotion(null)
    setServiceSearch("")
    setSearchedService(null)
  }

  const handleServiceSearch = (searchTerm: string) => {
    setServiceSearch(searchTerm)
    if (searchTerm) {
      const foundService = availableServices.find(
        (service) =>
          service.id.toString() === searchTerm || service.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setSearchedService(foundService || null)
    } else {
      setSearchedService(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Algorithm Control</h1>
          <p className="text-muted-foreground">Control what appears on the marketplace and how services are ranked</p>
        </div>
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="algorithms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="algorithms">Algorithm Weights</TabsTrigger>
          <TabsTrigger value="promoted">Promoted Services</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="services">Individual Services</TabsTrigger>
          <TabsTrigger value="page-settings">Page Settings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="algorithms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Algorithm Weights & Priority
              </CardTitle>
              <CardDescription>
                Control how different factors influence service ranking on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {algorithmSettings.map((setting) => (
                <div key={setting.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Label className="text-base font-medium">{setting.name}</Label>
                        <Switch checked={setting.enabled} onCheckedChange={() => toggleAlgorithm(setting.id)} />
                        <Badge variant={setting.enabled ? "default" : "secondary"}>
                          {setting.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{setting.weight}%</div>
                    </div>
                  </div>

                  {setting.enabled && (
                    <div className="space-y-2">
                      <Label>Weight: {setting.weight}%</Label>
                      <Slider
                        value={[setting.weight]}
                        onValueChange={(value) => updateAlgorithmWeight(setting.id, value[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Algorithm Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                    <span>Total Active: {algorithmSettings.filter((s) => s.enabled).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>
                      Total Weight: {algorithmSettings.filter((s) => s.enabled).reduce((sum, s) => sum + s.weight, 0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span>Last Updated: Just now</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promoted" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Promoted Services
              </CardTitle>
              <CardDescription>
                Manually promote specific services to appear at exact positions in listings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={addPromotedService} variant="outline" className="flex-1 bg-transparent">
                    Add Manually
                  </Button>
                </div>

                {/* Smart Service Search */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Quick Service Search</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Search by Service ID or Title</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter service ID (e.g., 1, 2, 3) or service title..."
                          value={serviceSearch}
                          onChange={(e) => handleServiceSearch(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => searchedService && selectServiceForPromotion(searchedService)}
                          disabled={!searchedService}
                          size="sm"
                        >
                          Add to Promotion
                        </Button>
                      </div>
                    </div>

                    {/* Service Preview */}
                    {searchedService && (
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                ID: {searchedService.id}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {searchedService.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {searchedService.subcategory}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900">{searchedService.title}</h4>
                            <p className="text-sm text-gray-600">by {searchedService.seller}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {searchedService.rating}
                              </span>
                              <span>{searchedService.orders} orders</span>
                            </div>
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    )}

                    {serviceSearch && !searchedService && (
                      <div className="text-sm text-gray-500 italic">
                        No service found with ID or title matching "{serviceSearch}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showServiceBrowser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Select Service to Promote</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowServiceBrowser(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {availableServices.map((service) => (
                        <div
                          key={service.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectServiceForPromotion(service)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  ID: {service.id}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {service.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {service.subcategory}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-gray-900">{service.title}</h4>
                              <p className="text-sm text-gray-600">by {service.seller}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {service.rating}
                                </span>
                                <span>{service.orders} orders</span>
                              </div>
                            </div>
                            <Button size="sm">Select</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Position Management</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Services will appear in exact positions on the marketplace. Position 1 = first service, Position 2 =
                  second service, etc.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Active Promotions: {promotedServices.filter((s) => s.enabled).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Scheduled: {promotedServices.filter((s) => s.startDate > new Date()).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Expired: {promotedServices.filter((s) => s.endDate < new Date()).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>Disabled: {promotedServices.filter((s) => !s.enabled).length}</span>
                  </div>
                </div>
              </div>

              {promotedServices
                .sort((a, b) => a.position - b.position)
                .map((service, index) => (
                  <div key={service.id} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={service.enabled ? "default" : "secondary"} className="text-lg px-3 py-1">
                          Position #{service.position}
                        </Badge>
                        {service.enabled && service.startDate <= new Date() && service.endDate >= new Date() && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Live
                          </Badge>
                        )}
                        {service.startDate > new Date() && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Scheduled
                          </Badge>
                        )}
                        {service.endDate < new Date() && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={service.enabled}
                          onCheckedChange={(enabled) => updatePromotedService(service.id, { enabled })}
                        />
                        <Button variant="destructive" size="sm" onClick={() => removePromotedService(service.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={service.position.toString()}
                          onValueChange={(position) =>
                            updatePromotedService(service.id, { position: Number.parseInt(position) })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((pos) => (
                              <SelectItem key={pos} value={pos.toString()}>
                                Position {pos} {pos === 1 ? "(Top)" : pos <= 3 ? "(Premium)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Service Title</Label>
                        <Input
                          value={service.title}
                          onChange={(e) => updatePromotedService(service.id, { title: e.target.value })}
                          placeholder="Enter service title or ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={service.category}
                          onValueChange={(category) => updatePromotedService(service.id, { category })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="graphics-design">Graphics & Design</SelectItem>
                            <SelectItem value="web-development">Web Development</SelectItem>
                            <SelectItem value="writing-translation">Writing & Translation</SelectItem>
                            <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                            <SelectItem value="video-animation">Video & Animation</SelectItem>
                            <SelectItem value="programming-tech">Programming & Tech</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(service.startDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={service.startDate}
                              onSelect={(date) => date && updatePromotedService(service.id, { startDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(service.endDate, "PPP")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={service.endDate}
                              onSelect={(date) => date && updatePromotedService(service.id, { endDate: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Promotion Preview</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="font-medium">
                            {Math.ceil(
                              (service.endDate.getTime() - service.startDate.getTime()) / (1000 * 60 * 60 * 24),
                            )}{" "}
                            days
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="font-medium">
                            {service.enabled
                              ? service.startDate <= new Date() && service.endDate >= new Date()
                                ? "Active"
                                : service.startDate > new Date()
                                  ? "Scheduled"
                                  : "Expired"
                              : "Disabled"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <div className="font-medium">
                            {service.position <= 3 ? "High" : service.position <= 10 ? "Medium" : "Low"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Visibility:</span>
                          <div className="font-medium">
                            {service.position === 1 ? "Maximum" : service.position <= 5 ? "High" : "Standard"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              {promotedServices.length > 0 && (
                <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-3">Quick Position Management</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Auto-assign positions 1, 2, 3, etc.
                        const updatedServices = [...promotedServices]
                        updatedServices.forEach((service, index) => {
                          service.position = index + 1
                        })
                        setPromotedServices(updatedServices)
                      }}
                    >
                      Auto-Assign Positions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Move all to top 5 positions
                        const updatedServices = promotedServices.slice(0, 5).map((service, index) => ({
                          ...service,
                          position: index + 1,
                        }))
                        setPromotedServices(updatedServices)
                      }}
                    >
                      Top 5 Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Enable all active promotions
                        setPromotedServices((prev) => prev.map((service) => ({ ...service, enabled: true })))
                      }}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Clear expired promotions
                        setPromotedServices((prev) => prev.filter((service) => service.endDate >= new Date()))
                      }}
                    >
                      Clear Expired
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcategories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Subcategory Controls
              </CardTitle>
              <CardDescription>
                Control the ranking and visibility of specific subcategories within each main category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcategoryControls.map((subcategory) => (
                  <div key={subcategory.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{subcategory.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {subcategory.categoryId.replace("-", " & ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            subcategory.priority === "high"
                              ? "default"
                              : subcategory.priority === "medium"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {subcategory.priority}
                        </Badge>
                        <Switch
                          checked={subcategory.enabled}
                          onCheckedChange={() => toggleSubcategory(subcategory.id)}
                        />
                      </div>
                    </div>

                    {subcategory.enabled && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Weight</Label>
                            <span className="text-sm font-medium">{subcategory.weight}%</span>
                          </div>
                          <Slider
                            value={[subcategory.weight]}
                            onValueChange={(value) => updateSubcategoryWeight(subcategory.id, value[0])}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Priority Level</Label>
                          <Select
                            value={subcategory.priority}
                            onValueChange={(priority: "high" | "medium" | "low") =>
                              updateSubcategoryPriority(subcategory.id, priority)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Subcategory Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>
                      High Priority: {subcategoryControls.filter((s) => s.priority === "high" && s.enabled).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>
                      Medium Priority: {subcategoryControls.filter((s) => s.priority === "medium" && s.enabled).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>
                      Low Priority: {subcategoryControls.filter((s) => s.priority === "low" && s.enabled).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Disabled: {subcategoryControls.filter((s) => !s.enabled).length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Individual Service Controls
              </CardTitle>
              <CardDescription>
                Fine-tune the ranking and boost individual services with custom weights and special promotions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                <h4 className="font-medium mb-3 text-blue-900">Add New Service to Control</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Search Service</Label>
                    <Input
                      placeholder="Enter service ID or title..."
                      value={newServiceSearch}
                      onChange={(e) => {
                        setNewServiceSearch(e.target.value)
                        // Auto-search when typing
                        if (e.target.value.length > 0) {
                          const found = mockServices.find(
                            (s) =>
                              s.id.toString() === e.target.value ||
                              s.title.toLowerCase().includes(e.target.value.toLowerCase()),
                          )
                          if (found) {
                            setSelectedNewService(found)
                          }
                        } else {
                          setSelectedNewService(null)
                        }
                      }}
                    />
                  </div>

                  {selectedNewService && (
                    <>
                      <div className="space-y-2">
                        <Label>Service Found</Label>
                        <div className="p-2 bg-white border rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              ID #{selectedNewService.id}
                            </Badge>
                            <span className="text-sm font-medium">{selectedNewService.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedNewService.category} → {selectedNewService.subcategory}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Button
                          onClick={() => {
                            // Check if service already exists in controls
                            const exists = serviceControls.find((s) => s.id === selectedNewService.id)
                            if (exists) {
                              alert("Service already exists in individual controls!")
                              return
                            }

                            // Add new service to controls
                            const newService = {
                              id: selectedNewService.id,
                              title: selectedNewService.title,
                              categoryId: selectedNewService.category.toLowerCase().replace(" & ", "-"),
                              subcategoryId: selectedNewService.subcategory.toLowerCase().replace(" ", "-"),
                              weight: 50, // Default weight
                              boostType: "none" as const,
                              customRanking: serviceControls.length + 1,
                              enabled: true,
                            }

                            setServiceControls((prev) => [...prev, newService])
                            setNewServiceSearch("")
                            setSelectedNewService(null)
                          }}
                          className="w-full"
                        >
                          Add to Controls
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {serviceControls
                .sort((a, b) => a.customRanking - b.customRanking)
                .map((service) => (
                  <div key={service.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            ID #{service.id}
                          </Badge>
                          <h4 className="font-medium">{service.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {service.categoryId.replace("-", " & ")} → {service.subcategoryId.replace("-", " ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            service.boostType === "featured"
                              ? "default"
                              : service.boostType === "trending"
                                ? "secondary"
                                : service.boostType === "new"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {service.boostType === "none" ? "No Boost" : service.boostType}
                        </Badge>
                        <Switch checked={service.enabled} onCheckedChange={() => toggleService(service.id)} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setServiceControls((prev) => prev.filter((s) => s.id !== service.id))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {service.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Algorithm Weight</Label>
                            <span className="text-sm font-medium">{service.weight}%</span>
                          </div>
                          <Slider
                            value={[service.weight]}
                            onValueChange={(value) => updateServiceWeight(service.id, value[0])}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Boost Type</Label>
                          <Select
                            value={service.boostType}
                            onValueChange={(boostType: "none" | "trending" | "featured" | "new") =>
                              updateServiceBoost(service.id, boostType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Boost</SelectItem>
                              <SelectItem value="featured">Featured Service</SelectItem>
                              <SelectItem value="trending">Trending Now</SelectItem>
                              <SelectItem value="new">New Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Custom Ranking Position</Label>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={service.customRanking}
                            onChange={(e) => updateServiceRanking(service.id, Number.parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Service Performance Impact</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Visibility Score:</span>
                          <div className="font-medium">
                            {service.weight + (service.boostType !== "none" ? 20 : 0)}/120
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Ranking Position:</span>
                          <div className="font-medium">#{service.customRanking}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Boost Impact:</span>
                          <div className="font-medium">
                            {service.boostType === "featured"
                              ? "+25%"
                              : service.boostType === "trending"
                                ? "+20%"
                                : service.boostType === "new"
                                  ? "+15%"
                                  : "0%"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="font-medium">{service.enabled ? "Active" : "Disabled"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              <div className="mt-6 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                <h4 className="font-medium mb-3">Bulk Service Management</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Auto-rank by weight
                      const sortedServices = [...serviceControls].sort((a, b) => b.weight - a.weight)
                      sortedServices.forEach((service, index) => {
                        service.customRanking = index + 1
                      })
                      setServiceControls(sortedServices)
                    }}
                  >
                    Auto-Rank by Weight
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Boost top 3 services
                      const updatedServices = serviceControls.map((service, index) => ({
                        ...service,
                        boostType: index < 3 ? "featured" : ("none" as const),
                      }))
                      setServiceControls(updatedServices)
                    }}
                  >
                    Feature Top 3
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Reset all boosts
                      setServiceControls((prev) => prev.map((service) => ({ ...service, boostType: "none" as const })))
                    }}
                  >
                    Clear All Boosts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Enable all services
                      setServiceControls((prev) => prev.map((service) => ({ ...service, enabled: true })))
                    }}
                  >
                    Enable All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="page-settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Display Settings
                </CardTitle>
                <CardDescription>Control how many items appear on each page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Services per page</Label>
                  <Input
                    type="number"
                    value={pageSettings.servicesPerPage}
                    onChange={(e) =>
                      setPageSettings((prev) => ({ ...prev, servicesPerPage: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Featured services count</Label>
                  <Input
                    type="number"
                    value={pageSettings.featuredServicesCount}
                    onChange={(e) =>
                      setPageSettings((prev) => ({ ...prev, featuredServicesCount: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categories on first page</Label>
                  <Input
                    type="number"
                    value={pageSettings.categoriesOnFirstPage}
                    onChange={(e) =>
                      setPageSettings((prev) => ({ ...prev, categoriesOnFirstPage: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personalization Settings
                </CardTitle>
                <CardDescription>Control user-specific features and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Personalization</Label>
                  <Switch
                    checked={pageSettings.enablePersonalization}
                    onCheckedChange={(enabled) =>
                      setPageSettings((prev) => ({ ...prev, enablePersonalization: enabled }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Browsing History</Label>
                  <Switch
                    checked={pageSettings.enableBrowsingHistory}
                    onCheckedChange={(enabled) =>
                      setPageSettings((prev) => ({ ...prev, enableBrowsingHistory: enabled }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Similar Services</Label>
                  <Switch
                    checked={pageSettings.enableSimilarServices}
                    onCheckedChange={(enabled) =>
                      setPageSettings((prev) => ({ ...prev, enableSimilarServices: enabled }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recommendation count</Label>
                  <Input
                    type="number"
                    value={pageSettings.recommendationCount}
                    onChange={(e) =>
                      setPageSettings((prev) => ({ ...prev, recommendationCount: Number.parseInt(e.target.value) }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Hierarchical Recommendation Engine
              </CardTitle>
              <CardDescription>Control cascading recommendations from specific to general categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Level 1: Micro Category Recommendations
                  </CardTitle>
                  <CardDescription>Primary recommendations from the same micro category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Most Popular</h4>
                      <p className="text-xs text-muted-foreground">Highest view count in micro category</p>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-xs font-medium">25%</span>
                      </div>
                      <Slider defaultValue={[25]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Most Bought</h4>
                      <p className="text-xs text-muted-foreground">Highest sales in micro category</p>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-xs font-medium">30%</span>
                      </div>
                      <Slider defaultValue={[30]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Most Clicked</h4>
                      <p className="text-xs text-muted-foreground">Highest click rate in micro category</p>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-xs font-medium">20%</span>
                      </div>
                      <Slider defaultValue={[20]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Most Viewed</h4>
                      <p className="text-xs text-muted-foreground">Highest impressions in micro category</p>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-xs font-medium">15%</span>
                      </div>
                      <Slider defaultValue={[15]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Most Saved</h4>
                      <p className="text-xs text-muted-foreground">Most loved/favorited in micro category</p>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Weight</Label>
                        <span className="text-xs font-medium">10%</span>
                      </div>
                      <Slider defaultValue={[10]} max={100} step={5} />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Minimum Products Required</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" defaultValue="4" className="w-16 h-8 text-xs" min="1" max="50" />
                        <span className="text-xs text-muted-foreground">products</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      If micro category has fewer products, cascade to subcategory level
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Level 2: Browsing History + Subcategory Fallback
                  </CardTitle>
                  <CardDescription>
                    User's browsing history and subcategory recommendations when template has few products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium">Browsing History</h4>
                      <p className="text-sm text-muted-foreground">Based on user's previous views</p>
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <span className="text-sm font-medium">40%</span>
                      </div>
                      <Slider defaultValue={[40]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium">Subcategory Products</h4>
                      <p className="text-sm text-muted-foreground">Same ranking criteria from parent subcategory</p>
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                      <Slider defaultValue={[60]} max={100} step={5} />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Subcategory Minimum Products</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" defaultValue="8" className="w-16 h-8 text-xs" min="1" max="100" />
                        <span className="text-xs text-muted-foreground">products</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      If subcategory has fewer products, cascade to main category level
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    Level 3: Main Category Fallback
                  </CardTitle>
                  <CardDescription>
                    Final fallback to main category when subcategory has insufficient products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium">Category Popular</h4>
                      <p className="text-sm text-muted-foreground">Most popular in main category</p>
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <span className="text-sm font-medium">50%</span>
                      </div>
                      <Slider defaultValue={[50]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium">Similar Buyers</h4>
                      <p className="text-sm text-muted-foreground">What similar users bought</p>
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <Slider defaultValue={[30]} max={100} step={5} />
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <h4 className="font-medium">Price Range</h4>
                      <p className="text-sm text-muted-foreground">Similar price range in category</p>
                      <div className="flex items-center justify-between">
                        <Label>Weight</Label>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                      <Slider defaultValue={[20]} max={100} step={5} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Cascading Algorithm Settings
                  </CardTitle>
                  <CardDescription>Control how the recommendation system cascades between levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Enable Cascading</Label>
                        <Switch defaultChecked />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Maximum Recommendations per Level</Label>
                        <Input type="number" defaultValue="12" className="w-20" min="4" max="50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Total Recommendations to Show</Label>
                        <Input type="number" defaultValue="24" className="w-20" min="8" max="100" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded border">
                        <h5 className="font-medium text-sm mb-2">Cascade Priority Order</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>1. Micro Category (Same micro category products)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>2. Browsing History + Subcategory</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded"></div>
                            <span>3. Main Category Fallback</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Recommendation Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-green-600">24.5%</div>
                    <div className="text-green-700">Click Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">8.2%</div>
                    <div className="text-green-700">Conversion Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-green-700">Avg. Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">4.7</div>
                    <div className="text-green-700">Relevance Score</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

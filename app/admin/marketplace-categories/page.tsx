"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, ChevronDown, ChevronRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { CategoriesAPI } from "@/lib/categories-api"

interface AdminService {
  id: string
  name: string
  description: string
  price: number
  deliveryTime: number
  deliveryUnit: string
  revisions: number
  unlimitedRevisions: boolean
  images: string[]
  videoUrl?: string
  sortOrder: number
}

interface AdminSubcategory {
  id: string
  name: string
  description: string
  services: AdminService[]
  sortOrder: number
}

interface AdminCategory {
  id: string
  name: string
  description: string
  logo: string
  subcategories: AdminSubcategory[]
  sortOrder: number
}

export default function MarketplaceCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false)
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    logo: "",
    sortOrder: "0",
  })

  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    sortOrder: "0",
  })

  const [serviceForm, setServiceForm] = useState({
    subcategoryId: "",
    name: "",
    description: "",
    price: "0",
    deliveryTime: "1",
    deliveryUnit: "days",
    revisions: "3",
    unlimitedRevisions: false,
    sortOrder: "0",
  })

  // Editing states
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<AdminSubcategory | null>(null)
  const [editingService, setEditingService] = useState<AdminService | null>(null)

  const loadCategories = async () => {
    setLoading(true)
    try {
      console.log("[v0] Admin: Loading categories from CategoriesAPI...")
      const loadedCategories = await CategoriesAPI.getCategories()
      console.log("[v0] Admin: Loaded categories:", loadedCategories.length)
      setCategories(loadedCategories)
    } catch (error) {
      console.error("[v0] Admin: Failed to load categories:", error)
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const saveCategories = async (updatedCategories: AdminCategory[]) => {
    try {
      await CategoriesAPI.updateCategories(updatedCategories)
      setCategories(updatedCategories)
      console.log("[v0] Admin: Categories saved successfully")
    } catch (error) {
      console.error("[v0] Admin: Failed to save categories:", error)
      toast.error("Failed to save categories")
      throw error
    }
  }

  const handleRefresh = async () => {
    await CategoriesAPI.clearCache()
    await loadCategories()
    toast.success("Categories refreshed from server")
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleSubcategoryExpansion = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories)
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId)
    } else {
      newExpanded.add(subcategoryId)
    }
    setExpandedSubcategories(newExpanded)
  }

  // Category functions
  const startCreateCategory = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: "",
      description: "",
      logo: "",
      sortOrder: "0",
    })
    setCategoryDialogOpen(true)
  }

  const startEditCategory = (category: AdminCategory) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      logo: category.logo || "",
      sortOrder: category.sortOrder.toString(),
    })
    setCategoryDialogOpen(true)
  }

  const handleCreateCategory = async () => {
    try {
      const newCategory: AdminCategory = {
        id: `category-${Date.now()}`,
        name: categoryForm.name,
        description: categoryForm.description,
        logo:
          categoryForm.logo || `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(categoryForm.name)}`,
        sortOrder: Number.parseInt(categoryForm.sortOrder),
        subcategories: [],
      }

      const updatedCategories = [...categories, newCategory]
      await saveCategories(updatedCategories)
      toast.success("Category created successfully")
      resetCategoryDialog()
    } catch (error) {
      console.error("Failed to create category:", error)
      toast.error("Failed to create category")
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const updatedCategories = categories.map((cat) =>
        cat.id === editingCategory.id
          ? {
              ...cat,
              name: categoryForm.name,
              description: categoryForm.description,
              logo: categoryForm.logo || cat.logo,
              sortOrder: Number.parseInt(categoryForm.sortOrder),
            }
          : cat,
      )

      await saveCategories(updatedCategories)
      toast.success("Category updated successfully")
      resetCategoryDialog()
    } catch (error) {
      console.error("Failed to update category:", error)
      toast.error("Failed to update category")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      const updatedCategories = categories.filter((cat) => cat.id !== id)
      await saveCategories(updatedCategories)
      toast.success("Category deleted successfully")
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast.error("Failed to delete category")
    }
  }

  // Subcategory functions
  const startCreateSubcategory = (categoryId: string) => {
    setEditingSubcategory(null)
    setSubcategoryForm({
      categoryId,
      name: "",
      description: "",
      sortOrder: "0",
    })
    setSubcategoryDialogOpen(true)
  }

  const startEditSubcategory = (subcategory: AdminSubcategory, categoryId: string) => {
    setEditingSubcategory(subcategory)
    setSubcategoryForm({
      categoryId,
      name: subcategory.name,
      description: subcategory.description || "",
      sortOrder: subcategory.sortOrder.toString(),
    })
    setSubcategoryDialogOpen(true)
  }

  const handleCreateSubcategory = async () => {
    try {
      const newSubcategory: AdminSubcategory = {
        id: `subcategory-${Date.now()}`,
        name: subcategoryForm.name,
        description: subcategoryForm.description,
        sortOrder: Number.parseInt(subcategoryForm.sortOrder),
        services: [],
      }

      const updatedCategories = categories.map((cat) =>
        cat.id === subcategoryForm.categoryId
          ? {
              ...cat,
              subcategories: [...(cat.subcategories || []), newSubcategory],
            }
          : cat,
      )

      await saveCategories(updatedCategories)
      toast.success("Subcategory created successfully")
      resetSubcategoryDialog()
    } catch (error) {
      console.error("Failed to create subcategory:", error)
      toast.error("Failed to create subcategory")
    }
  }

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return

    try {
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).map((sub) =>
          sub.id === editingSubcategory.id
            ? {
                ...sub,
                name: subcategoryForm.name,
                description: subcategoryForm.description,
                sortOrder: Number.parseInt(subcategoryForm.sortOrder),
              }
            : sub,
        ),
      }))

      await saveCategories(updatedCategories)
      toast.success("Subcategory updated successfully")
      resetSubcategoryDialog()
    } catch (error) {
      console.error("Failed to update subcategory:", error)
      toast.error("Failed to update subcategory")
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return

    try {
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter((sub) => sub.id !== id),
      }))

      await saveCategories(updatedCategories)
      toast.success("Subcategory deleted successfully")
    } catch (error) {
      console.error("Failed to delete subcategory:", error)
      toast.error("Failed to delete subcategory")
    }
  }

  const startCreateService = (subcategoryId: string) => {
    setEditingService(null)
    setServiceForm({
      subcategoryId,
      name: "",
      description: "",
      price: "0",
      deliveryTime: "1",
      deliveryUnit: "days",
      revisions: "3",
      unlimitedRevisions: false,
      sortOrder: "0",
    })
    setServiceDialogOpen(true)
  }

  const startEditService = (service: AdminService, subcategoryId: string) => {
    setEditingService(service)
    setServiceForm({
      subcategoryId,
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      deliveryTime: service.deliveryTime.toString(),
      deliveryUnit: service.deliveryUnit,
      revisions: service.revisions.toString(),
      unlimitedRevisions: service.unlimitedRevisions,
      sortOrder: service.sortOrder.toString(),
    })
    setServiceDialogOpen(true)
  }

  const handleCreateService = async () => {
    try {
      const newService: AdminService = {
        id: `service-${Date.now()}`,
        name: serviceForm.name,
        description: serviceForm.description,
        price: Number.parseFloat(serviceForm.price),
        deliveryTime: Number.parseInt(serviceForm.deliveryTime),
        deliveryUnit: serviceForm.deliveryUnit,
        revisions: Number.parseInt(serviceForm.revisions),
        unlimitedRevisions: serviceForm.unlimitedRevisions,
        images: [`/placeholder.svg?height=300&width=400&query=${encodeURIComponent(serviceForm.name)}`],
        sortOrder: Number.parseInt(serviceForm.sortOrder),
      }

      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).map((sub) =>
          sub.id === serviceForm.subcategoryId
            ? {
                ...sub,
                services: [...(sub.services || []), newService],
              }
            : sub,
        ),
      }))

      await saveCategories(updatedCategories)
      toast.success("Service created successfully")
      resetServiceDialog()
    } catch (error) {
      console.error("Failed to create service:", error)
      toast.error("Failed to create service")
    }
  }

  const handleUpdateService = async () => {
    if (!editingService) return

    try {
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).map((sub) => ({
          ...sub,
          services: (sub.services || []).map((service) =>
            service.id === editingService.id
              ? {
                  ...service,
                  name: serviceForm.name,
                  description: serviceForm.description,
                  price: Number.parseFloat(serviceForm.price),
                  deliveryTime: Number.parseInt(serviceForm.deliveryTime),
                  deliveryUnit: serviceForm.deliveryUnit,
                  revisions: Number.parseInt(serviceForm.revisions),
                  unlimitedRevisions: serviceForm.unlimitedRevisions,
                  sortOrder: Number.parseInt(serviceForm.sortOrder),
                }
              : service,
          ),
        })),
      }))

      await saveCategories(updatedCategories)
      toast.success("Service updated successfully")
      resetServiceDialog()
    } catch (error) {
      console.error("Failed to update service:", error)
      toast.error("Failed to update service")
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const updatedCategories = categories.map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).map((sub) => ({
          ...sub,
          services: (sub.services || []).filter((service) => service.id !== id),
        })),
      }))

      await saveCategories(updatedCategories)
      toast.success("Service deleted successfully")
    } catch (error) {
      console.error("Failed to delete service:", error)
      toast.error("Failed to delete service")
    }
  }

  // Reset functions
  const resetCategoryDialog = () => {
    setCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryForm({
      name: "",
      description: "",
      logo: "",
      sortOrder: "0",
    })
  }

  const resetSubcategoryDialog = () => {
    setSubcategoryDialogOpen(false)
    setEditingSubcategory(null)
    setSubcategoryForm({
      categoryId: "",
      name: "",
      description: "",
      sortOrder: "0",
    })
  }

  const resetServiceDialog = () => {
    setServiceDialogOpen(false)
    setEditingService(null)
    setServiceForm({
      subcategoryId: "",
      name: "",
      description: "",
      price: "0",
      deliveryTime: "1",
      deliveryUnit: "days",
      revisions: "3",
      unlimitedRevisions: false,
      sortOrder: "0",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading categories...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marketplace Categories</h1>
          <p className="text-muted-foreground">Manage marketplace service categories and subcategories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={startCreateCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => toggleCategoryExpansion(category.id)}>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.name}
                      <Badge variant="secondary">#{category.sortOrder}</Badge>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => startCreateSubcategory(category.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Subcategory
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEditCategory(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedCategories.has(category.id) && (
              <CardContent>
                <div className="space-y-3">
                  {(category.subcategories || []).map((subcategory) => (
                    <Card key={subcategory.id} className="border-l-4 border-l-green-500 ml-6">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubcategoryExpansion(subcategory.id)}
                            >
                              {expandedSubcategories.has(subcategory.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {subcategory.name}
                                <Badge variant="outline">#{subcategory.sortOrder}</Badge>
                              </CardTitle>
                              <CardDescription>{subcategory.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => startCreateService(subcategory.id)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Service
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditSubcategory(subcategory, category.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSubcategory(subcategory.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedSubcategories.has(subcategory.id) && (
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Services</h4>
                            {(subcategory.services || []).map((service) => (
                              <div
                                key={service.id}
                                className="flex items-center justify-between p-3 border rounded-lg ml-6 border-l-4 border-l-orange-500"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{service.name}</span>
                                    <Badge variant="secondary">${service.price}</Badge>
                                    <Badge variant="outline">#{service.sortOrder}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{service.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {service.deliveryTime} {service.deliveryUnit} • {service.revisions} revisions
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => startEditService(service, subcategory.id)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(!subcategory.services || subcategory.services.length === 0) && (
                              <p className="text-sm text-muted-foreground ml-6">No services yet</p>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  {(!category.subcategories || category.subcategories.length === 0) && (
                    <p className="text-sm text-muted-foreground ml-6">No subcategories yet</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No categories found</p>
          <Button onClick={startCreateCategory}>Create your first category</Button>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category details" : "Create a new category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Graphics & Design"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Brief description of the category"
              />
            </div>
            <div>
              <Label htmlFor="category-logo">Logo URL</Label>
              <Input
                id="category-logo"
                value={categoryForm.logo}
                onChange={(e) => setCategoryForm({ ...categoryForm, logo: e.target.value })}
                placeholder="https://example.com/logo.png (optional)"
              />
            </div>
            <div>
              <Label htmlFor="category-sort-order">Sort Order</Label>
              <Input
                id="category-sort-order"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetCategoryDialog}>
                Cancel
              </Button>
              <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
            <DialogDescription>
              {editingSubcategory ? "Update the subcategory details" : "Create a new subcategory"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcategory-name">Subcategory Name *</Label>
              <Input
                id="subcategory-name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                placeholder="e.g., Logo Design"
              />
            </div>
            <div>
              <Label htmlFor="subcategory-description">Description</Label>
              <Textarea
                id="subcategory-description"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                placeholder="Brief description of the subcategory"
              />
            </div>
            <div>
              <Label htmlFor="subcategory-sort-order">Sort Order</Label>
              <Input
                id="subcategory-sort-order"
                type="number"
                value={subcategoryForm.sortOrder}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sortOrder: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetSubcategoryDialog}>
                Cancel
              </Button>
              <Button onClick={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory}>
                {editingSubcategory ? "Update Subcategory" : "Create Subcategory"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update the service details" : "Create a new service"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="e.g., Professional Logo Design"
              />
            </div>
            <div>
              <Label htmlFor="service-description">Description</Label>
              <Textarea
                id="service-description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Detailed description of the service"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-price">Price ($) *</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  placeholder="50.00"
                />
              </div>
              <div>
                <Label htmlFor="service-sort-order">Sort Order</Label>
                <Input
                  id="service-sort-order"
                  type="number"
                  value={serviceForm.sortOrder}
                  onChange={(e) => setServiceForm({ ...serviceForm, sortOrder: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="service-delivery-time">Delivery Time *</Label>
                <Input
                  id="service-delivery-time"
                  type="number"
                  value={serviceForm.deliveryTime}
                  onChange={(e) => setServiceForm({ ...serviceForm, deliveryTime: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div>
                <Label htmlFor="service-delivery-unit">Delivery Unit</Label>
                <select
                  id="service-delivery-unit"
                  value={serviceForm.deliveryUnit}
                  onChange={(e) => setServiceForm({ ...serviceForm, deliveryUnit: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </div>
              <div>
                <Label htmlFor="service-revisions">Revisions</Label>
                <Input
                  id="service-revisions"
                  type="number"
                  value={serviceForm.revisions}
                  onChange={(e) => setServiceForm({ ...serviceForm, revisions: e.target.value })}
                  placeholder="3"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unlimited-revisions"
                checked={serviceForm.unlimitedRevisions}
                onChange={(e) => setServiceForm({ ...serviceForm, unlimitedRevisions: e.target.checked })}
              />
              <Label htmlFor="unlimited-revisions">Unlimited Revisions</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetServiceDialog}>
                Cancel
              </Button>
              <Button onClick={editingService ? handleUpdateService : handleCreateService}>
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

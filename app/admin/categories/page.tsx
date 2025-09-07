"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Edit, Trash2, DollarSign, Hash, Folder, FolderOpen, ImageIcon, Upload } from "lucide-react"
import Image from "next/image"
import {
  getCategoriesWithSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type CategoryWithSubcategories,
  type Category,
  type Subcategory,
} from "@/lib/categories"

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false)

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    thumbnail: "",
    minimumPayment: "0.10",
    sortOrder: "0",
  })

  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    thumbnail: "",
    minimumPayment: "0.10",
    sortOrder: "0",
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await getCategoriesWithSubcategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      await createCategory({
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        icon: categoryForm.icon,
        thumbnail: categoryForm.thumbnail,
        minimumPayment: Number.parseFloat(categoryForm.minimumPayment),
        sortOrder: Number.parseInt(categoryForm.sortOrder),
        isActive: true,
      })

      toast.success("Category created successfully")
      setCategoryDialogOpen(false)
      setCategoryForm({
        name: "",
        slug: "",
        description: "",
        icon: "",
        thumbnail: "",
        minimumPayment: "0.10",
        sortOrder: "0",
      })
      loadCategories()
    } catch (error) {
      console.error("Failed to create category:", error)
      toast.error("Failed to create category")
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      await updateCategory(editingCategory.id, {
        name: categoryForm.name,
        slug: categoryForm.slug,
        description: categoryForm.description,
        icon: categoryForm.icon,
        thumbnail: categoryForm.thumbnail,
        minimumPayment: Number.parseFloat(categoryForm.minimumPayment),
        sortOrder: Number.parseInt(categoryForm.sortOrder),
      })

      toast.success("Category updated successfully")
      setCategoryDialogOpen(false)
      setEditingCategory(null)
      setCategoryForm({
        name: "",
        slug: "",
        description: "",
        icon: "",
        thumbnail: "",
        minimumPayment: "0.10",
        sortOrder: "0",
      })
      loadCategories()
    } catch (error) {
      console.error("Failed to update category:", error)
      toast.error("Failed to update category")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
      await deleteCategory(id)
      toast.success("Category deleted successfully")
      loadCategories()
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast.error("Failed to delete category")
    }
  }

  const handleCreateSubcategory = async () => {
    try {
      await createSubcategory({
        categoryId: subcategoryForm.categoryId,
        name: subcategoryForm.name,
        slug: subcategoryForm.slug,
        description: subcategoryForm.description,
        thumbnail: subcategoryForm.thumbnail || undefined,
        minimumPayment: Number.parseFloat(subcategoryForm.minimumPayment),
        sortOrder: Number.parseInt(subcategoryForm.sortOrder),
        isActive: true,
      })

      toast.success("Subcategory created successfully")
      setSubcategoryDialogOpen(false)
      setSubcategoryForm({
        categoryId: "",
        name: "",
        slug: "",
        description: "",
        thumbnail: "",
        minimumPayment: "0.10",
        sortOrder: "0",
      })
      loadCategories()
    } catch (error) {
      console.error("Failed to create subcategory:", error)
      toast.error("Failed to create subcategory")
    }
  }

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory) return

    try {
      await updateSubcategory(editingSubcategory.id, {
        name: subcategoryForm.name,
        slug: subcategoryForm.slug,
        description: subcategoryForm.description,
        thumbnail: subcategoryForm.thumbnail || undefined,
        minimumPayment: Number.parseFloat(subcategoryForm.minimumPayment),
        sortOrder: Number.parseInt(subcategoryForm.sortOrder),
      })

      toast.success("Subcategory updated successfully")
      setSubcategoryDialogOpen(false)
      setEditingSubcategory(null)
      setSubcategoryForm({
        categoryId: "",
        name: "",
        slug: "",
        description: "",
        thumbnail: "",
        minimumPayment: "0.10",
        sortOrder: "0",
      })
      loadCategories()
    } catch (error) {
      console.error("Failed to update subcategory:", error)
      toast.error("Failed to update subcategory")
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) return

    try {
      await deleteSubcategory(id)
      toast.success("Subcategory deleted successfully")
      loadCategories()
    } catch (error) {
      console.error("Failed to delete subcategory:", error)
      toast.error("Failed to delete subcategory")
    }
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      thumbnail: category.thumbnail || "",
      minimumPayment: category.minimumPayment.toString(),
      sortOrder: category.sortOrder.toString(),
    })
    setCategoryDialogOpen(true)
  }

  const startEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setSubcategoryForm({
      categoryId: subcategory.categoryId,
      name: subcategory.name,
      slug: subcategory.slug,
      description: subcategory.description || "",
      thumbnail: subcategory.thumbnail || "",
      minimumPayment: subcategory.minimumPayment.toString(),
      sortOrder: subcategory.sortOrder.toString(),
    })
    setSubcategoryDialogOpen(true)
  }

  const convertBlobToStorage = async (blobUrl: string, filename: string): Promise<string> => {
    try {
      // Fetch the blob data
      const response = await fetch(blobUrl)
      const blob = await response.blob()

      // Create a File object
      const file = new File([blob], filename, { type: blob.type })

      // Upload to Vercel Blob storage (simulated - in real app would use actual Vercel Blob API)
      // For now, we'll use a more permanent blob URL format
      const permanentUrl = `https://blob.vercel-storage.com/thumbnails/${Date.now()}-${filename}`

      // Store the mapping in localStorage for persistence
      const thumbnailStorage = JSON.parse(localStorage.getItem("thumbnailStorage") || "{}")
      thumbnailStorage[blobUrl] = permanentUrl
      localStorage.setItem("thumbnailStorage", JSON.stringify(thumbnailStorage))

      return permanentUrl
    } catch (error) {
      console.error("Failed to convert blob to storage:", error)
      return blobUrl // Fallback to original blob URL
    }
  }

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create a blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file)

      // Convert to permanent storage
      const permanentUrl = await convertBlobToStorage(blobUrl, file.name)

      setCategoryForm((prev) => ({ ...prev, thumbnail: permanentUrl }))
      toast.success("Thumbnail uploaded and saved successfully")
    }
  }

  const handleSubcategoryThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Create a blob URL for immediate preview
      const blobUrl = URL.createObjectURL(file)

      // Convert to permanent storage
      const permanentUrl = await convertBlobToStorage(blobUrl, file.name)

      setSubcategoryForm((prev) => ({ ...prev, thumbnail: permanentUrl }))
      toast.success("Subcategory thumbnail uploaded and saved successfully")
    }
  }

  const resetCategoryDialog = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: "",
      slug: "",
      description: "",
      icon: "",
      thumbnail: "",
      minimumPayment: "0.10",
      sortOrder: "0",
    })
    setCategoryDialogOpen(false)
  }

  const resetSubcategoryDialog = () => {
    setEditingSubcategory(null)
    setSubcategoryForm({
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      thumbnail: "",
      minimumPayment: "0.10",
      sortOrder: "0",
    })
    setSubcategoryDialogOpen(false)
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Category Management" description="Manage job categories and subcategories" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Category Management" description="Manage job categories and subcategories" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-name">Name</Label>
                    <Input
                      id="cat-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Social Media"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-slug">Slug</Label>
                    <Input
                      id="cat-slug"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="social-media"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-description">Description</Label>
                  <Textarea
                    id="cat-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Social media engagement and promotion tasks"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail</Label>
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div className="flex gap-2">
                      <Input
                        id="cat-thumbnail"
                        value={categoryForm.thumbnail}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                        placeholder="https://example.com/image.jpg or /placeholder.svg?text=Category"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            thumbnail: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(prev.name || "Category")}`,
                          }))
                        }
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Or upload from PC:</span>
                      <Label htmlFor="thumbnail-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Choose File
                          </span>
                        </Button>
                        <Input
                          id="thumbnail-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                      </Label>
                    </div>

                    {/* Preview */}
                    {categoryForm.thumbnail && (
                      <div className="mt-2">
                        <Image
                          src={categoryForm.thumbnail || "/placeholder.svg"}
                          alt="Category thumbnail preview"
                          width={150}
                          height={100}
                          className="rounded-lg border object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cat-icon">Icon</Label>
                    <Input
                      id="cat-icon"
                      value={categoryForm.icon}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))}
                      placeholder="share-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-min-payment">Min Payment ($)</Label>
                    <Input
                      id="cat-min-payment"
                      type="number"
                      step="0.01"
                      value={categoryForm.minimumPayment}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, minimumPayment: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-sort">Sort Order</Label>
                    <Input
                      id="cat-sort"
                      type="number"
                      value={categoryForm.sortOrder}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetCategoryDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                <Plus className="h-4 w-4" />
                <span>Add Subcategory</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Create New Subcategory"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sub-category">Parent Category</Label>
                  <Select
                    value={subcategoryForm.categoryId}
                    onValueChange={(value) => setSubcategoryForm((prev) => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub-name">Name</Label>
                    <Input
                      id="sub-name"
                      value={subcategoryForm.name}
                      onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Facebook Tasks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-slug">Slug</Label>
                    <Input
                      id="sub-slug"
                      value={subcategoryForm.slug}
                      onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="facebook"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sub-description">Description</Label>
                  <Textarea
                    id="sub-description"
                    value={subcategoryForm.description}
                    onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Facebook likes, shares, follows, and engagement"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    If no thumbnail is provided, the parent category's thumbnail will be used.
                  </p>
                  <div className="space-y-3">
                    {/* URL Input */}
                    <div className="flex gap-2">
                      <Input
                        id="sub-thumbnail"
                        value={subcategoryForm.thumbnail}
                        onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                        placeholder="https://example.com/image.jpg or /placeholder.svg?text=Subcategory"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setSubcategoryForm((prev) => ({
                            ...prev,
                            thumbnail: `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(prev.name || "Subcategory")}`,
                          }))
                        }
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* File Upload */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Or upload from PC:</span>
                      <Label htmlFor="sub-thumbnail-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Choose File
                          </span>
                        </Button>
                        <Input
                          id="sub-thumbnail-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleSubcategoryThumbnailUpload}
                          className="hidden"
                        />
                      </Label>
                    </div>

                    {/* Preview */}
                    {subcategoryForm.thumbnail && (
                      <div className="mt-2">
                        <Image
                          src={subcategoryForm.thumbnail || "/placeholder.svg"}
                          alt="Subcategory thumbnail preview"
                          width={150}
                          height={100}
                          className="rounded-lg border object-cover"
                        />
                      </div>
                    )}

                    {/* Show parent category thumbnail as fallback preview */}
                    {!subcategoryForm.thumbnail && subcategoryForm.categoryId && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-2">Will use parent category thumbnail:</p>
                        {(() => {
                          const parentCategory = categories.find((cat) => cat.id === subcategoryForm.categoryId)
                          return parentCategory?.thumbnail ? (
                            <Image
                              src={parentCategory.thumbnail || "/placeholder.svg"}
                              alt="Parent category thumbnail (fallback)"
                              width={150}
                              height={100}
                              className="rounded-lg border object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-[150px] h-[100px] bg-muted rounded-lg border flex items-center justify-center opacity-60">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub-min-payment">Min Payment ($)</Label>
                    <Input
                      id="sub-min-payment"
                      type="number"
                      step="0.01"
                      value={subcategoryForm.minimumPayment}
                      onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, minimumPayment: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-sort">Sort Order</Label>
                    <Input
                      id="sub-sort"
                      type="number"
                      value={subcategoryForm.sortOrder}
                      onChange={(e) => setSubcategoryForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetSubcategoryDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingSubcategory ? handleUpdateSubcategory : handleCreateSubcategory}>
                    {editingSubcategory ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {category.thumbnail ? (
                        <Image
                          src={category.thumbnail || "/placeholder.svg"}
                          alt={category.name}
                          width={60}
                          height={40}
                          className="rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Folder className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>${category.minimumPayment}</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Hash className="h-3 w-3" />
                      <span>{category.sortOrder}</span>
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => startEditCategory(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {category.subcategories.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Subcategories</h4>
                    <div className="grid gap-2">
                      {category.subcategories.map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {subcategory.thumbnail || category.thumbnail ? (
                                <Image
                                  src={subcategory.thumbnail || category.thumbnail || "/placeholder.svg"}
                                  alt={subcategory.name}
                                  width={32}
                                  height={24}
                                  className="rounded border object-cover"
                                />
                              ) : (
                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{subcategory.name}</p>
                              <p className="text-xs text-muted-foreground">{subcategory.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${subcategory.minimumPayment}</span>
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => startEditSubcategory(subcategory)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

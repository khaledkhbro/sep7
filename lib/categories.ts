export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  thumbnail?: string
  minimumPayment: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface Subcategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  thumbnail?: string
  minimumPayment: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[]
}

const CATEGORIES_STORAGE_KEY = "marketplace-categories"
const SUBCATEGORIES_STORAGE_KEY = "marketplace-subcategories"

// Mock data for development
const mockCategories: Category[] = [
  {
    id: "1",
    name: "Social Media",
    slug: "social-media",
    description: "Social media engagement and promotion tasks",
    icon: "share-2",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Social+Media",
    minimumPayment: 0.5,
    sortOrder: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Content Creation",
    slug: "content-creation",
    description: "Writing, video, and creative content tasks",
    icon: "edit-3",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Content+Creation",
    minimumPayment: 1.0,
    sortOrder: 2,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Data Entry",
    slug: "data-entry",
    description: "Data collection and entry tasks",
    icon: "database",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Data+Entry",
    minimumPayment: 0.25,
    sortOrder: 3,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Testing & Reviews",
    slug: "testing-reviews",
    description: "App testing, website reviews, and feedback",
    icon: "star",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Testing+Reviews",
    minimumPayment: 0.75,
    sortOrder: 4,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
]

const mockSubcategories: Subcategory[] = [
  {
    id: "1",
    categoryId: "1",
    name: "Facebook Tasks",
    slug: "facebook",
    description: "Facebook likes, shares, follows, and engagement",
    minimumPayment: 0.5,
    sortOrder: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    categoryId: "1",
    name: "YouTube Tasks",
    slug: "youtube",
    description: "YouTube views, likes, subscribes, and comments",
    minimumPayment: 0.75,
    sortOrder: 2,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    categoryId: "1",
    name: "TikTok Tasks",
    slug: "tiktok",
    description: "TikTok likes, follows, views, and engagement",
    minimumPayment: 0.6,
    sortOrder: 3,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "4",
    categoryId: "1",
    name: "Instagram Tasks",
    slug: "instagram",
    description: "Instagram likes, follows, and story views",
    minimumPayment: 0.65,
    sortOrder: 4,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    categoryId: "2",
    name: "Article Writing",
    slug: "article-writing",
    description: "Short articles and blog posts",
    minimumPayment: 5.0,
    sortOrder: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    categoryId: "3",
    name: "Data Collection",
    slug: "data-collection",
    description: "Gathering information from websites",
    minimumPayment: 0.5,
    sortOrder: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
]

const getStoredCategories = (): Category[] => {
  if (typeof window === "undefined") return mockCategories
  try {
    const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : mockCategories
  } catch {
    return mockCategories
  }
}

const getStoredSubcategories = (): Subcategory[] => {
  if (typeof window === "undefined") return mockSubcategories
  try {
    const stored = localStorage.getItem(SUBCATEGORIES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : mockSubcategories
  } catch {
    return mockSubcategories
  }
}

const saveCategories = (categories: Category[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
  } catch (error) {
    console.error("Failed to save categories:", error)
  }
}

const saveSubcategories = (subcategories: Subcategory[]): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SUBCATEGORIES_STORAGE_KEY, JSON.stringify(subcategories))
  } catch (error) {
    console.error("Failed to save subcategories:", error)
  }
}

// API Functions
export async function getAllCategories(): Promise<Category[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return getStoredCategories()
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getAllSubcategories(): Promise<Subcategory[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return getStoredSubcategories()
    .filter((sub) => sub.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const categories = getStoredCategories()
    .filter((cat) => cat.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const subcategories = getStoredSubcategories()
    .filter((sub) => sub.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return categories.map((category) => ({
    ...category,
    subcategories: subcategories.filter((sub) => sub.categoryId === category.id),
  }))
}

export async function getCategoryById(id: string): Promise<Category | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const categories = getStoredCategories()
  return categories.find((cat) => cat.id === id) || null
}

export async function getSubcategoryById(id: string): Promise<Subcategory | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const subcategories = getStoredSubcategories()
  return subcategories.find((sub) => sub.id === id) || null
}

export async function getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const subcategories = getStoredSubcategories()
  return subcategories
    .filter((sub) => sub.categoryId === categoryId && sub.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// Admin functions
export async function createCategory(data: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const newCategory: Category = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const categories = getStoredCategories()
  categories.push(newCategory)
  saveCategories(categories)

  return newCategory
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const categories = getStoredCategories()
  const index = categories.findIndex((cat) => cat.id === id)
  if (index === -1) throw new Error("Category not found")

  const updatedCategory = {
    ...categories[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  categories[index] = updatedCategory
  saveCategories(categories)

  return updatedCategory
}

export async function deleteCategory(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const categories = getStoredCategories()
  const index = categories.findIndex((cat) => cat.id === id)
  if (index === -1) throw new Error("Category not found")

  // Soft delete by setting isActive to false
  categories[index] = {
    ...categories[index],
    isActive: false,
    updatedAt: new Date().toISOString(),
  }

  saveCategories(categories)
}

export async function createSubcategory(
  data: Omit<Subcategory, "id" | "createdAt" | "updatedAt">,
): Promise<Subcategory> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const newSubcategory: Subcategory = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const subcategories = getStoredSubcategories()
  subcategories.push(newSubcategory)
  saveSubcategories(subcategories)

  return newSubcategory
}

export async function updateSubcategory(id: string, updates: Partial<Subcategory>): Promise<Subcategory> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const subcategories = getStoredSubcategories()
  const index = subcategories.findIndex((sub) => sub.id === id)
  if (index === -1) throw new Error("Subcategory not found")

  const updatedSubcategory = {
    ...subcategories[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  subcategories[index] = updatedSubcategory
  saveSubcategories(subcategories)

  return updatedSubcategory
}

export async function deleteSubcategory(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  const subcategories = getStoredSubcategories()
  const index = subcategories.findIndex((sub) => sub.id === id)
  if (index === -1) throw new Error("Subcategory not found")

  // Soft delete by setting isActive to false
  subcategories[index] = {
    ...subcategories[index],
    isActive: false,
    updatedAt: new Date().toISOString(),
  }

  saveSubcategories(subcategories)
}

export async function getMinimumPayment(subcategoryId: string): Promise<number> {
  const subcategory = await getSubcategoryById(subcategoryId)
  if (subcategory) return subcategory.minimumPayment

  // Fallback to category minimum if subcategory not found
  const subcategories = getStoredSubcategories()
  const sub = subcategories.find((s) => s.id === subcategoryId)
  if (sub) {
    const category = await getCategoryById(sub.categoryId)
    return category?.minimumPayment || 0.1
  }

  return 0.1 // Default minimum
}

export async function getCategoryThumbnail(categoryId: string): Promise<string | null> {
  const category = await getCategoryById(categoryId)
  return category?.thumbnail || null
}

export async function getEffectiveThumbnail(subcategoryId: string): Promise<string | null> {
  const subcategory = await getSubcategoryById(subcategoryId)
  if (!subcategory) return null

  // Return subcategory thumbnail if it exists
  if (subcategory.thumbnail) {
    return subcategory.thumbnail
  }

  // Fallback to parent category thumbnail
  const category = await getCategoryById(subcategory.categoryId)
  return category?.thumbnail || null
}

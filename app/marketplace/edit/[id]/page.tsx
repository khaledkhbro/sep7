"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { serviceStorage, type StorageService } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function EditServicePage() {
  const [service, setService] = useState<StorageService | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    price: 0,
  })

  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    const loadService = () => {
      try {
        const foundService = serviceStorage.getById(serviceId)

        if (!foundService) {
          console.log("[v0] Service not found:", serviceId)
          router.push("/dashboard/services")
          return
        }

        // Check if user owns this service
        if (foundService.sellerId !== user?.id) {
          console.log("[v0] User doesn't own this service")
          router.push("/dashboard/services")
          return
        }

        setService(foundService)
        setFormData({
          title: foundService.title,
          shortDescription: foundService.shortDescription,
          description: foundService.description,
          price: foundService.price,
        })
      } catch (error) {
        console.error("[v0] Error loading service:", error)
        router.push("/dashboard/services")
      } finally {
        setLoading(false)
      }
    }

    if (user?.id && isAuthenticated) {
      loadService()
    }
  }, [serviceId, user?.id, router, isAuthenticated])

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to edit services.</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Service not found</h1>
          <p className="text-gray-600 mb-4">The service you're trying to edit doesn't exist.</p>
          <Link href="/dashboard/services">
            <Button>Back to Services</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!service || !user?.id) return

    setSaving(true)
    try {
      const updatedService: StorageService = {
        ...service,
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: formData.price,
        updatedAt: new Date().toISOString(),
      }

      serviceStorage.update(serviceId, updatedService)
      console.log("[v0] Service updated successfully")

      // Redirect back to services page
      router.push("/dashboard/services")
    } catch (error) {
      console.error("[v0] Error updating service:", error)
      alert("Failed to update service. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href="/dashboard/services">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Services
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
          <p className="text-gray-600">Update your service details and pricing</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Service Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter service title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief description that appears in search results"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of your service"
                className="mt-1"
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="Enter price"
                className="mt-1"
                min="1"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Link href="/dashboard/services">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

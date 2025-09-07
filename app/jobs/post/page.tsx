"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Briefcase } from "lucide-react"

const categories = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "design-creative", label: "Design & Creative" },
  { value: "writing-translation", label: "Writing & Translation" },
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "data-analytics", label: "Data & Analytics" },
]

const priorities = [
  { value: "low", label: "Low Priority" },
  { value: "normal", label: "Normal Priority" },
  { value: "high", label: "High Priority" },
  { value: "urgent", label: "Urgent" },
]

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    category: "",
    budgetMin: "",
    budgetMax: "",
    deadline: "",
    location: "",
    isRemote: false,
    priority: "normal",
    skillsRequired: [] as string[],
  })
  const [newSkill, setNewSkill] = useState("")

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skillsRequired.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, newSkill.trim()],
      }))
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Job posted:", formData)
      alert("Job posted successfully!")
      router.push("/dashboard/jobs")
    } catch (error) {
      console.error("Failed to post job:", error)
      alert("Failed to post job. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Briefcase className="mr-3 h-8 w-8" />
            Post a New Job
          </h1>
          <p className="text-gray-600 mt-2">Find the perfect freelancer for your project</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Build a Modern E-commerce Website"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail. What do you need done? What are your expectations?"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (Optional)</Label>
                  <Textarea
                    id="requirements"
                    placeholder="List specific requirements, qualifications, or experience needed..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Budget and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Budget and Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Minimum Budget ($) *</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min="1"
                      placeholder="500"
                      value={formData.budgetMin}
                      onChange={(e) => handleInputChange("budgetMin", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Maximum Budget ($) *</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={formData.budgetMax}
                      onChange={(e) => handleInputChange("budgetMax", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Project Deadline *</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location and Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Location and Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isRemote"
                    checked={formData.isRemote}
                    onCheckedChange={(checked) => handleInputChange("isRemote", checked)}
                  />
                  <Label htmlFor="isRemote">This is a remote job</Label>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Required Skills</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a skill (e.g., React, Python, Design)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {formData.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skillsRequired.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="ml-1 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Posting Job..." : "Post Job"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { getJobById, updateJob, type Job } from "@/lib/jobs"
import {
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  Clock,
  FileText,
  Save,
} from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  "FACEBOOK",
  "YOUTUBE",
  "TIKTOK",
  "TELEGRAM",
  "TWITTER",
  "INSTAGRAM",
  "WEBSITE",
  "APP_TESTING",
  "DATA_ENTRY",
  "OTHER",
]

const STEPS = [
  { id: 1, title: "Job Details", description: "Basic information about your microjob" },
  { id: 2, title: "Requirements", description: "What workers need to do" },
  { id: 3, title: "Payment & Settings", description: "Budget and job settings" },
  { id: 4, title: "Review & Submit", description: "Final review before submission" },
]

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const jobId = params.id as string

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [originalJob, setOriginalJob] = useState<Job | null>(null)

  const [jobData, setJobData] = useState({
    title: "",
    description: "",
    category: "",
    requirements: "",
    instructions: "",
    budget: "",
    workersNeeded: "1",
    duration: "1",
    durationType: "days",
    tags: [] as string[],
    newTag: "",
    approvalType: "instant", // Default approval type
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchJob = async () => {
      try {
        console.log("[v0] Loading job for editing:", jobId)
        const job = await getJobById(jobId)

        if (!job) {
          toast.error("Job not found")
          router.push("/dashboard/jobs")
          return
        }

        // Check if user owns this job
        if (job.userId !== user?.id) {
          toast.error("You don't have permission to edit this job")
          router.push("/dashboard/jobs")
          return
        }

        // Check if job can be edited
        if (job.status === "in_progress" || job.status === "completed") {
          toast.error("Cannot edit jobs that are in progress or completed")
          router.push("/dashboard/jobs")
          return
        }

        setOriginalJob(job)

        // Pre-fill form with existing job data
        setJobData({
          title: job.title,
          description: job.description,
          category: job.categoryId,
          requirements: job.requirements || "",
          instructions: job.instructions || "",
          budget: job.budgetMin.toString(),
          workersNeeded: job.workersNeeded?.toString() || "1",
          duration: job.duration || "1",
          durationType: job.durationType || "days",
          tags: job.tags || [],
          newTag: "",
          approvalType: job.approvalType || "instant", // Pre-fill approval type
        })

        console.log("[v0] Loaded job for editing:", job)
      } catch (error) {
        console.error("[v0] Error loading job:", error)
        toast.error("Failed to load job")
        router.push("/dashboard/jobs")
      } finally {
        setLoading(false)
      }
    }

    if (jobId && user?.id) {
      fetchJob()
    }
  }, [jobId, user?.id, router])

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!jobData.title.trim()) newErrors.title = "Job title is required"
      if (!jobData.description.trim()) newErrors.description = "Job description is required"
    }

    if (step === 2) {
      if (!jobData.requirements.trim()) newErrors.requirements = "Job requirements are required"
      if (!jobData.instructions.trim()) newErrors.instructions = "Instructions are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const addTag = () => {
    if (jobData.newTag.trim() && !jobData.tags.includes(jobData.newTag.trim())) {
      setJobData((prev) => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: "",
      }))
    }
  }

  const removeTag = (tag: string) => {
    setJobData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !originalJob) return

    setIsSubmitting(true)
    try {
      const jobUpdateData = {
        title: jobData.title,
        description: jobData.description,
        categoryId: jobData.category.toLowerCase(),
        requirements: jobData.requirements,
        instructions: jobData.instructions,
        deadline: originalJob.deadline, // Keep original deadline
        location: originalJob.location, // Keep original location
        isRemote: originalJob.isRemote, // Keep original remote setting
        priority: originalJob.priority, // Keep original priority
        skillsRequired: jobData.tags,
        approvalType: jobData.approvalType, // Include approval type in update data
      }

      await updateJob(originalJob.id, jobUpdateData)

      toast.success("Job updated successfully! It will be reviewed by our admin team before going live again.")
      router.push("/dashboard/jobs")
    } catch (error) {
      console.error("Job update error:", error)
      toast.error("Failed to update job. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  if (loading) {
    return (
      <>
        <DashboardHeader title="Edit Microjob" description="Update your job posting" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading job...</p>
          </div>
        </div>
      </>
    )
  }

  if (!originalJob) {
    return (
      <>
        <DashboardHeader title="Edit Microjob" description="Job not found" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Job not found</p>
            <Link href="/dashboard/jobs">
              <Button className="mt-4">Back to My Jobs</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title="Edit Microjob" description="Update your job posting" />

      <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          {/* Progress Header */}
          <Card className="mb-6 sm:mb-8 border-0 gradient-card backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">Edit Microjob</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    Step {currentStep} of {STEPS.length}
                  </Badge>
                  <Link href="/dashboard/jobs">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="mr-1 h-3 w-3" />
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>

              <Progress value={progress} className="h-2 mb-4" />

              <div className="flex justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center flex-1 px-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-200 ${
                        currentStep > step.id
                          ? "bg-gradient-to-r from-primary to-accent text-white"
                          : currentStep === step.id
                            ? "bg-gradient-to-r from-secondary to-accent text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <span className="text-xs sm:text-sm font-bold">{step.id}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs sm:text-sm font-medium text-foreground leading-tight">{step.title}</p>
                      <p className="text-xs text-muted-foreground hidden md:block mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Re-approval Notice */}
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800">Re-approval Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Any changes to your job will require admin re-approval before it goes live again. Your job will be
                    temporarily removed from the marketplace during review.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Content - Same as create page but with pre-filled data */}
          <Card className="border-0 gradient-card backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                {currentStep === 1 && <FileText className="h-5 w-5 text-primary" />}
                {currentStep === 2 && <AlertCircle className="h-5 w-5 text-secondary" />}
                {currentStep === 3 && <DollarSign className="h-5 w-5 text-accent" />}
                {currentStep === 4 && <CheckCircle className="h-5 w-5 text-primary" />}
                <span>{STEPS[currentStep - 1].title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {/* Step 1: Job Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Job Title *
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., YouTube video watch and like"
                      value={jobData.title}
                      onChange={(e) => setJobData((prev) => ({ ...prev, title: e.target.value }))}
                      className={`h-12 text-base ${errors.title ? "border-destructive" : ""}`}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Job Description *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what workers need to do in detail..."
                      value={jobData.description}
                      onChange={(e) => setJobData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className={`text-base resize-none ${errors.description ? "border-destructive" : ""}`}
                    />
                    {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category (Cannot be changed)
                    </Label>
                    <div className="h-12 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-base text-muted-foreground">
                      {jobData.category.replace("_", " ")}
                    </div>
                    <p className="text-xs text-muted-foreground">Category cannot be changed after job creation</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="tags" className="text-sm font-medium">
                      Tags (Optional)
                    </Label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Input
                        id="tags"
                        placeholder="Add a tag..."
                        value={jobData.newTag}
                        onChange={(e) => setJobData((prev) => ({ ...prev, newTag: e.target.value }))}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                        className="h-12 text-base flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        className="h-12 px-6 text-base bg-transparent"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {jobData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-secondary/10 text-secondary py-1 px-3 text-sm"
                        >
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-2 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Requirements */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="requirements" className="text-sm font-medium">
                      Job Requirements *
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="What are the requirements for this job? (e.g., Must have YouTube account, Must be from specific country, etc.)"
                      value={jobData.requirements}
                      onChange={(e) => setJobData((prev) => ({ ...prev, requirements: e.target.value }))}
                      rows={4}
                      className={`text-base resize-none ${errors.requirements ? "border-destructive" : ""}`}
                    />
                    {errors.requirements && <p className="text-sm text-destructive">{errors.requirements}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="instructions" className="text-sm font-medium">
                      Step-by-Step Instructions *
                    </Label>
                    <Textarea
                      id="instructions"
                      placeholder="Provide clear step-by-step instructions for workers..."
                      value={jobData.instructions}
                      onChange={(e) => setJobData((prev) => ({ ...prev, instructions: e.target.value }))}
                      rows={6}
                      className={`text-base resize-none ${errors.instructions ? "border-destructive" : ""}`}
                    />
                    {errors.instructions && <p className="text-sm text-destructive">{errors.instructions}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Payment & Settings - Limited editing */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="budget" className="text-sm font-medium">
                        Budget per Worker (USD) - Cannot be changed
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <div className="pl-12 h-12 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-base text-muted-foreground">
                          ${jobData.budget}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Budget cannot be changed after job creation</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="workersNeeded" className="text-sm font-medium">
                        Number of Workers Needed - Cannot be changed
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <div className="pl-12 h-12 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-base text-muted-foreground">
                          {jobData.workersNeeded}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Worker count cannot be changed after job creation</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="duration" className="text-sm font-medium">
                        Job Duration - Cannot be changed
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <div className="pl-12 h-12 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-base text-muted-foreground">
                          {jobData.duration}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Duration cannot be changed after job creation</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="durationType" className="text-sm font-medium">
                        Duration Type - Cannot be changed
                      </Label>
                      <div className="h-12 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-base text-muted-foreground capitalize">
                        {jobData.durationType}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Duration type cannot be changed after job creation
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Payment Approval System</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg">
                        <input
                          type="radio"
                          id="instant-approval"
                          name="approvalType"
                          value="instant"
                          checked={jobData.approvalType === "instant"}
                          onChange={(e) => setJobData((prev) => ({ ...prev, approvalType: e.target.value }))}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <label htmlFor="instant-approval" className="font-medium text-sm cursor-pointer">
                            Instant Approval
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Workers get paid immediately when they submit work
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg">
                        <input
                          type="radio"
                          id="manual-approval"
                          name="approvalType"
                          value="manual"
                          checked={jobData.approvalType === "manual"}
                          onChange={(e) => setJobData((prev) => ({ ...prev, approvalType: e.target.value }))}
                          className="h-4 w-4 text-primary"
                        />
                        <div className="flex-1">
                          <label htmlFor="manual-approval" className="font-medium text-sm cursor-pointer">
                            Manual Approval (Recommended)
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Review work before payment is released</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-medium text-foreground mb-3 text-base">Cost Summary (Read-only)</h3>
                      <div className="space-y-2 text-sm sm:text-base">
                        <div className="flex justify-between items-center">
                          <span>Budget per worker:</span>
                          <span className="font-medium">${jobData.budget || "0.00"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Number of workers:</span>
                          <span className="font-medium">{jobData.workersNeeded || "0"}</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-3">
                          <div className="flex justify-between items-center font-medium text-primary text-base">
                            <span>Total budget:</span>
                            <span>
                              $
                              {(
                                (Number.parseFloat(jobData.budget) || 0) * (Number.parseInt(jobData.workersNeeded) || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Step 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4 sm:p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-foreground">Updated Job Preview</h3>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-foreground text-base">{jobData.title}</h4>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{jobData.description}</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block">Category:</span>
                          <p className="font-medium mt-1">{jobData.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Budget:</span>
                          <p className="font-medium mt-1">${jobData.budget}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Workers:</span>
                          <p className="font-medium mt-1">{jobData.workersNeeded}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Duration:</span>
                          <p className="font-medium mt-1">
                            {jobData.duration} {jobData.durationType}
                          </p>
                        </div>
                      </div>

                      {jobData.tags.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-2">Tags:</span>
                          <div className="flex flex-wrap gap-2">
                            {jobData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs py-1 px-2">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-foreground text-base">Re-approval Process</h4>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            Your updated job will be reviewed by our admin team before being published again. This
                            usually takes 24-48 hours. You'll receive a notification once it's approved and live on the
                            platform.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-border space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex items-center justify-center space-x-2 bg-transparent h-12 text-base"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  )}

                  <Link href="/dashboard/jobs">
                    <Button variant="ghost" className="text-muted-foreground h-12 text-base w-full sm:w-auto">
                      Cancel
                    </Button>
                  </Link>
                </div>

                <div className="flex space-x-2">
                  {currentStep < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-heading font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 h-12 text-base flex-1 sm:flex-none px-8"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white font-heading font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 h-12 text-base flex-1 sm:flex-none px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Update Job</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

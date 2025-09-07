"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getJobById, submitJobApplication, getUserApplications, type Job } from "@/lib/jobs"
import { submitWorkProof, getWorkProofsByJob } from "@/lib/work-proofs"
import { createJobChat } from "@/lib/chat"
import { useAuth } from "@/contexts/auth-context"
import { useLocalReservations, useJobReservationStatus } from "@/hooks/use-local-reservations"
import { toast } from "sonner"
import {
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  Eye,
  Calendar,
  AlertCircle,
  MessageCircle,
  Upload,
  CheckCircle,
  Timer,
  Lock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function JobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { settings, reserve } = useLocalReservations(user?.id)
  const { status: reservationStatus, refresh: refreshStatus } = useJobReservationStatus(params.id as string)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [contacting, setContacting] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [categoryName, setCategoryName] = useState<string>("General")
  const [hasSubmittedWork, setHasSubmittedWork] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<string>("")
  const [isJobCompleted, setIsJobCompleted] = useState(false)
  const [workSubmissionData, setWorkSubmissionData] = useState({
    submissionText: "",
    proofFiles: [] as File[],
    proofLinks: [""],
    additionalNotes: "",
  })

  useEffect(() => {
    if (reservationStatus.isReserved && reservationStatus.timeLeft) {
      const updateTimer = () => {
        const timeLeftMs = reservationStatus.timeLeft || 0

        if (timeLeftMs > 0) {
          const hours = Math.floor(timeLeftMs / (1000 * 60 * 60))
          const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000)
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        } else {
          setTimeLeft("Expired")
          refreshStatus()
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeLeft("")
    }
  }, [reservationStatus.isReserved, reservationStatus.timeLeft, refreshStatus])

  useEffect(() => {
    const loadJob = async () => {
      if (!params.id || !user?.id) return

      setLoading(true)
      try {
        const jobData = await getJobById(params.id as string)
        setJob(jobData)
        if (jobData) {
          setCategoryName(jobData.category?.name || `Category ${jobData.categoryId}` || "General")
          setWorkSubmissionData((prev) => ({
            ...prev,
            proofLinks: [jobData.proofLink || ""],
          }))

          console.log("[v0] Checking if user has submitted work for job:", jobData.id)

          // Check user applications for this job
          const userApplications = await getUserApplications(user.id)
          const jobApplication = userApplications.find((app) => app.job?.id === jobData.id)

          if (jobApplication) {
            console.log("[v0] Found user application:", jobApplication.id, "status:", jobApplication.status)

            // Check work proofs for this job
            const workProofs = await getWorkProofsByJob(jobData.id)
            const userWorkProof = workProofs.find((proof) => proof.applicationId === jobApplication.id)

            if (userWorkProof) {
              console.log(
                "[v0] User has already submitted work proof:",
                userWorkProof.id,
                "status:",
                userWorkProof.status,
              )
              setHasSubmittedWork(true)

              if (userWorkProof.status === "approved") {
                setIsJobCompleted(true)
                setSubmissionStatus("Your work has been approved and payment processed")
              } else {
                // Set status message based on work proof status
                switch (userWorkProof.status) {
                  case "submitted":
                    setSubmissionStatus("Your work is under review")
                    break
                  case "rejected":
                    setSubmissionStatus("Your work needs revision - check feedback")
                    break
                  default:
                    setSubmissionStatus("Work submitted")
                }
              }
            } else if (jobApplication.status === "accepted") {
              // User has been accepted but hasn't submitted work yet
              setHasSubmittedWork(false)
              setSubmissionStatus("Ready to submit work")
            } else {
              // Application exists but not accepted yet
              setHasSubmittedWork(true)
              setSubmissionStatus("Application pending review")
            }
          }
        }
      } catch (error) {
        console.error("Failed to load job:", error)
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [params.id, user?.id])

  const handleReserveJob = async () => {
    if (!settings?.isEnabled) {
      toast.error("Job reservation is currently disabled")
      return
    }

    if (!user?.id) {
      toast.error("Please log in to reserve jobs")
      return
    }

    if (!job) return

    setIsReserving(true)
    try {
      const reservation = await reserve(job.id, settings.defaultReservationMinutes)

      if (reservation) {
        const timeUnit = settings.defaultReservationMinutes >= 60 ? "hour(s)" : "minute(s)"
        const timeValue =
          settings.defaultReservationMinutes >= 60
            ? Math.round(settings.defaultReservationMinutes / 60)
            : settings.defaultReservationMinutes

        toast.success(`Job reserved for ${timeValue} ${timeUnit}!`)
        refreshStatus()
      } else {
        toast.error("Failed to reserve job")
      }
    } catch (error) {
      console.error("Reservation error:", error)
      toast.error("Failed to reserve job")
    } finally {
      setIsReserving(false)
    }
  }

  const handleWorkSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!job || !user) {
      alert("Please log in to submit work for this job.")
      return
    }

    if (
      job.requireScreenshots &&
      job.requireScreenshots > 0 &&
      workSubmissionData.proofFiles.length !== job.requireScreenshots
    ) {
      alert(`Please upload exactly ${job.requireScreenshots} screenshot(s) as required.`)
      return
    }

    if (!workSubmissionData.submissionText.trim()) {
      alert("Please provide a description of your completed work.")
      return
    }

    setSubmitting(true)
    try {
      console.log("[v0] Submitting work proof for job:", job.id, "by user:", user.id)

      const application = await submitJobApplication({
        jobId: job.id,
        coverLetter: workSubmissionData.submissionText,
        proposedBudget: job.budgetMin,
        estimatedDuration: `${job.duration} ${job.durationType || "days"}`,
        portfolioLinks: workSubmissionData.proofLinks.filter((link) => link.trim()),
        userId: user.id,
      })

      console.log("[v0] Created job application:", application.id)

      await submitWorkProof({
        jobId: job.id,
        workerId: user.id,
        applicationId: application.id,
        submissionText: workSubmissionData.submissionText,
        proofFiles: workSubmissionData.proofFiles || [],
        proofLinks: workSubmissionData.proofLinks?.filter((link) => link.trim()) || [],
        screenshots: workSubmissionData.proofFiles || [], // Use proofFiles as screenshots
        additionalNotes: workSubmissionData.additionalNotes,
      })

      alert("Work submitted successfully! The job poster will review your submission.")
      router.push("/dashboard/applied-jobs")
    } catch (error) {
      console.error("Failed to submit work:", error)
      alert("Failed to submit work. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartChat = async () => {
    if (!job || !user) {
      toast.error("Please log in to contact the client.")
      return
    }

    if (user.id === job.poster.id) {
      toast.error("You cannot contact yourself.")
      return
    }

    setContacting(true)
    try {
      console.log("[v0] Starting chat for job:", job.id, "between user:", user.id, "and poster:", job.poster.id)

      const newChat = await createJobChat(job.id, user.id, job.poster.id)

      console.log("[v0] Chat created successfully:", newChat.id)

      toast.success("Chat started successfully!")
      router.push(`/dashboard/messages?chatId=${newChat.id}`)
    } catch (error) {
      console.error("[v0] Failed to start chat:", error)
      toast.error("Failed to start chat. Please try again.")
    } finally {
      setContacting(false)
    }
  }

  const handleProofFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (job?.requireScreenshots && files.length > job.requireScreenshots) {
      alert(`You can only upload up to ${job.requireScreenshots} file(s).`)
      return
    }
    setWorkSubmissionData((prev) => ({ ...prev, proofFiles: files }))
  }

  const removeProofFile = (index: number) => {
    setWorkSubmissionData((prev) => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h1>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push("/jobs")}>Browse Jobs</Button>
        </div>
      </div>
    )
  }

  const getPriorityColor = (priority: Job["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{categoryName}</Badge>
                      <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                      <Badge variant="secondary">{job.status}</Badge>
                      {reservationStatus.isReserved && (
                        <Badge className="bg-orange-100 text-orange-800 flex items-center space-x-1">
                          <Lock className="h-3 w-3" />
                          <span>Reserved</span>
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4" />${job.budgetMin} - ${job.budgetMax}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-4 w-4" />
                        {job.isRemote ? "Remote" : job.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Due {new Date(job.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        {job.workersNeeded} workers needed
                      </div>
                    </div>
                  </div>
                  {job.attachments && job.attachments.length > 0 && (
                    <div className="ml-4">
                      <img
                        src={`/abstract-geometric-shapes.png?key=2rtlv&height=120&width=120&query=${encodeURIComponent(job.title + " thumbnail")}`}
                        alt={`${job.title} thumbnail`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Job Steps */}
            {job.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <span>Job Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.instructions
                      .split("\n")
                      .filter((step) => step.trim())
                      .map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed">{step.replace(/^Step \d+:\s*/, "")}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{job.description}</p>

                {job.requirements && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <span>Required Proof</span>
                      </h3>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <pre className="text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {job.requirements}
                        </pre>
                      </div>
                    </div>
                  </>
                )}

                {job.requireScreenshots && job.requireScreenshots > 0 && (
                  <>
                    <Separator />
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 mb-2 flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Screenshot Requirements</span>
                      </h3>
                      <p className="text-purple-800">
                        You must provide <strong>{job.requireScreenshots} screenshot(s)</strong> as proof of completion.
                      </p>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(job.skillsRequired || []).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Timeline</span>
                    </h4>
                    <p className="text-green-800 text-sm">
                      Estimated approval:{" "}
                      <strong>
                        {job.duration} {job.durationType || "days"}
                      </strong>
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Payment</span>
                    </h4>
                    <p className="text-blue-800 text-sm">
                      Earn: <strong>${job.budgetMin}</strong> per worker
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{job.applicationsCount}</p>
                    <p className="text-sm text-gray-600">Applications</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{job.viewsCount}</p>
                    <p className="text-sm text-gray-600">Views</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.ceil((new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-sm text-gray-600">Days Left</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                {reservationStatus.isReserved ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-900">Job Reserved</h3>
                      </div>
                      <p className="text-orange-800 text-sm">
                        {timeLeft === "Expired" ? "Your reservation has expired" : `Time remaining: ${timeLeft}`}
                      </p>
                      {timeLeft === "Expired" && (
                        <p className="text-red-600 text-xs mt-1">Apply now or lose this opportunity!</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {hasSubmittedWork ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Work Status</h3>
                      </div>
                      <p className="text-blue-800 text-sm">{submissionStatus}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => router.push("/dashboard/applied-jobs")}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View in My Jobs
                    </Button>
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Completed Work
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
                      {/* ... existing dialog content ... */}
                      <div className="flex flex-col h-full max-h-[95vh]">
                        <DialogHeader className="px-6 py-4 border-b bg-white sticky top-0 z-10">
                          <DialogTitle className="text-lg font-semibold">Submit Work for: {job.title}</DialogTitle>
                        </DialogHeader>

                        {/* Job Requirements Summary */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                          {/* Job Requirements Summary */}
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 flex items-center space-x-2 mb-3">
                              <CheckCircle className="h-5 w-5" />
                              <span>Job Requirements Completed</span>
                            </h3>

                            {job.instructions && (
                              <div className="space-y-3">
                                <h4 className="font-medium text-green-800">What you should have done:</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {job.instructions
                                    .split("\n")
                                    .filter((step) => step.trim())
                                    .map((step, index) => (
                                      <div key={index} className="flex items-start space-x-2 text-sm">
                                        <div className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                                          ✓
                                        </div>
                                        <span className="text-green-800">{step.replace(/^Step \d+:\s*/, "")}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {job.requirements && (
                              <div className="space-y-2 mt-3">
                                <h4 className="font-medium text-green-800">Proof Required:</h4>
                                <div className="bg-white p-3 rounded border border-green-200 max-h-24 overflow-y-auto">
                                  <pre className="text-sm text-green-800 whitespace-pre-wrap font-sans">
                                    {job.requirements}
                                  </pre>
                                </div>
                              </div>
                            )}

                            <div className="bg-white p-3 rounded border border-green-200 mt-3">
                              <p className="text-sm text-green-800">
                                💰 <strong>Payment:</strong> ${job.budgetMin} (will be released after approval)
                                <br />
                                ⏱️ <strong>Review time:</strong> Usually within {job.duration}{" "}
                                {job.durationType || "days"}
                              </p>
                            </div>
                          </div>

                          {/* Form Content */}
                          <form onSubmit={handleWorkSubmission} className="space-y-6">
                            <div className="space-y-2">
                              <Label htmlFor="submissionText" className="text-base font-semibold">
                                Work Description *
                              </Label>
                              <p className="text-sm text-gray-600 mb-2">
                                Describe what you completed and how you met the requirements
                              </p>
                              <Textarea
                                id="submissionText"
                                placeholder="Describe the work you completed, how you followed each step, and any important details the client should know..."
                                value={workSubmissionData.submissionText}
                                onChange={(e) =>
                                  setWorkSubmissionData((prev) => ({ ...prev, submissionText: e.target.value }))
                                }
                                rows={4}
                                required
                                className="resize-none"
                              />
                            </div>

                            {job.requireScreenshots && job.requireScreenshots > 0 && (
                              <div className="space-y-3">
                                <Label htmlFor="proofFiles" className="text-base font-semibold">
                                  📸 Proof Screenshots/Files *
                                </Label>
                                <p className="text-sm text-red-600 mb-2">
                                  Upload exactly {job.requireScreenshots} file(s) as proof
                                </p>
                                <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50">
                                  <Input
                                    id="proofFiles"
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx"
                                    multiple={job.requireScreenshots > 1}
                                    onChange={handleProofFileUpload}
                                    required
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                                  />
                                  <div className="mt-2 flex items-center justify-between">
                                    <p className="text-sm text-green-700 font-medium">
                                      {workSubmissionData.proofFiles.length} of {job.requireScreenshots} file(s)
                                      uploaded
                                    </p>
                                    {workSubmissionData.proofFiles.length === job.requireScreenshots && (
                                      <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                                    )}
                                  </div>
                                </div>

                                {/* File Preview Section */}
                                {workSubmissionData.proofFiles.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700">Preview your proof files:</h4>
                                    <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                                      <div className="grid grid-cols-2 gap-3">
                                        {workSubmissionData.proofFiles.map((file, index) => (
                                          <div key={index} className="relative group">
                                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                              {file.type.startsWith("image/") ? (
                                                <img
                                                  src={URL.createObjectURL(file) || "/placeholder.svg"}
                                                  alt={`Proof ${index + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                  <div className="text-center">
                                                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                                                    <p className="text-xs text-gray-600">
                                                      {file.type.split("/")[1].toUpperCase()}
                                                    </p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="destructive"
                                                className="h-5 w-5 p-0 rounded-full text-xs"
                                                onClick={() => removeProofFile(index)}
                                              >
                                                ×
                                              </Button>
                                            </div>
                                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                                              {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded font-medium">
                                              {index + 1}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label htmlFor="proofLink" className="text-base font-semibold">
                                External Proof Links (Optional)
                              </Label>
                              <Input
                                id="proofLink"
                                type="url"
                                placeholder="https://link-to-your-completed-work.com"
                                value={workSubmissionData.proofLinks[0]}
                                onChange={(e) =>
                                  setWorkSubmissionData((prev) => ({
                                    ...prev,
                                    proofLinks: [e.target.value, ...prev.proofLinks.slice(1)],
                                  }))
                                }
                              />
                              <p className="text-xs text-gray-500">
                                Add links to YouTube videos, social media posts, websites, or other external proof
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="additionalNotes" className="text-base font-semibold">
                                Additional Notes (Optional)
                              </Label>
                              <Textarea
                                id="additionalNotes"
                                placeholder="Any additional information or notes for the client..."
                                value={workSubmissionData.additionalNotes}
                                onChange={(e) =>
                                  setWorkSubmissionData((prev) => ({ ...prev, additionalNotes: e.target.value }))
                                }
                                rows={3}
                                className="resize-none"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="sticky bottom-0 bg-white border-t pt-4 mt-6 -mx-6 px-6 pb-4">
                              <div className="flex justify-end space-x-3">
                                <DialogTrigger asChild>
                                  <Button type="button" variant="outline">
                                    Cancel
                                  </Button>
                                </DialogTrigger>
                                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                                  {submitting ? "Submitting Work..." : "Submit Completed Work"}
                                </Button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {!hasSubmittedWork && !reservationStatus.isReserved && settings?.isEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleReserveJob}
                    disabled={isReserving}
                    className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 font-semibold py-3 rounded-xl transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  >
                    {isReserving ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Reserving Job...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Timer className="h-4 w-4 mr-2" />
                        Reserve for{" "}
                        {settings.defaultReservationMinutes >= 60
                          ? `${Math.round(settings.defaultReservationMinutes / 60)} Hour${Math.round(settings.defaultReservationMinutes / 60) > 1 ? "s" : ""}`
                          : `${settings.defaultReservationMinutes} Minutes`}
                      </div>
                    )}
                  </Button>
                )}

                {!isJobCompleted ? (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={handleStartChat}
                    disabled={contacting}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {contacting ? "Starting Chat..." : "Contact Client"}
                  </Button>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800 font-medium">Job Completed & Paid</p>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Communication is no longer available for completed jobs.
                    </p>
                  </div>
                )}

                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">Work Submission Tips:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• Complete all required steps first</li>
                        <li>• Provide clear proof of completion</li>
                        <li>• Include screenshots or links as evidence</li>
                        <li>• Payment released after approval</li>
                        {settings?.isEnabled && <li>• 💡 Reserve jobs to hold them while you decide</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {job.poster?.firstName?.[0] || "U"}
                      {job.poster?.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.poster?.firstName || "Unknown"} {job.poster?.lastName || "User"}
                    </p>
                    <p className="text-sm text-gray-600">@{job.poster?.username || "unknown"}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 text-yellow-400 fill-current" />
                    {job.poster?.rating || 0} ({job.poster?.totalReviews || 0} reviews)
                  </div>
                </div>

                <Separator />

                <div className="text-sm text-gray-600">
                  <p>
                    Member since{" "}
                    {formatDistanceToNow(new Date(job.poster?.createdAt || new Date()), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

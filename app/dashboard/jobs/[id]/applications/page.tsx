"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Star, MapPin, Clock, DollarSign, ExternalLink, Check, X, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  getJobById,
  getJobApplications,
  acceptJobApplication,
  rejectJobApplication,
  type Job,
  type JobApplication,
} from "@/lib/jobs"

export default function JobApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Loading job and applications for:", jobId)
        const [jobData, applicationsData] = await Promise.all([getJobById(jobId), getJobApplications(jobId)])

        if (!jobData) {
          toast.error("Job not found")
          router.push("/dashboard/jobs")
          return
        }

        if (jobData.userId !== user?.id) {
          toast.error("You don't have permission to view these applications")
          router.push("/dashboard/jobs")
          return
        }

        setJob(jobData)
        setApplications(applicationsData)
        console.log("[v0] Loaded applications:", applicationsData)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast.error("Failed to load applications")
      } finally {
        setLoading(false)
      }
    }

    if (jobId && user?.id) {
      fetchData()
    }
  }, [jobId, user?.id, router])

  const handleAcceptApplication = async (applicationId: string) => {
    setActionLoading(applicationId)
    try {
      console.log("[v0] Accepting application and processing instant payment:", applicationId)

      // Find the application to get the proposed budget
      const application = applications.find((app) => app.id === applicationId)
      if (!application) {
        throw new Error("Application not found")
      }

      console.log("[v0] Processing payment of $", application.proposedBudget)

      await acceptJobApplication(applicationId, user!.id)

      toast.success(`Application accepted! Payment of $${application.proposedBudget} released to worker instantly!`)

      // Refresh data
      const [updatedApplications, updatedJob] = await Promise.all([getJobApplications(jobId), getJobById(jobId)])

      setApplications(updatedApplications)
      setJob(updatedJob)

      setTimeout(() => {
        router.push("/dashboard/jobs")
      }, 2000)
    } catch (error) {
      console.error("[v0] Error accepting application:", error)
      toast.error("Failed to accept application and process payment")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    setActionLoading(applicationId)
    try {
      console.log("[v0] Rejecting application:", applicationId)
      await rejectJobApplication(applicationId, user!.id, "Application rejected by employer")
      toast.success("Application rejected")
      const updatedApplications = await getJobApplications(jobId)
      setApplications(updatedApplications)
    } catch (error) {
      console.error("[v0] Error rejecting application:", error)
      toast.error("Failed to reject application")
    } finally {
      setActionLoading(null)
    }
  }

  const handleContactApplicant = (applicantId: string) => {
    router.push(`/dashboard/messages?userId=${applicantId}&jobId=${jobId}`)
  }

  const pendingApplications = applications.filter((app) => app.status === "pending")
  const acceptedApplications = applications.filter((app) => app.status === "accepted")
  const rejectedApplications = applications.filter((app) => app.status === "rejected")

  if (loading) {
    return (
      <>
        <DashboardHeader title="Job Applications" description="Manage applications for your job" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </>
    )
  }

  if (!job) {
    return (
      <>
        <DashboardHeader title="Job Applications" description="Job not found" />
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
      <DashboardHeader title="Job Applications" description={`Applications for "${job.title}"`} />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Jobs
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{job.title}</span>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">{applications.length} Applications</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                  <span>
                    ${job.budgetMin} - ${job.budgetMax}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{job.workersNeeded} workers needed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingApplications.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted & Paid ({acceptedApplications.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedApplications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow border-2 border-blue-100">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {application.applicant.firstName[0]}
                            {application.applicant.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">@{application.applicant.username}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm ml-1 font-medium">{application.applicant.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              ({application.applicant.totalReviews} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-700">${application.proposedBudget}</div>
                          <div className="text-sm text-green-600">Payment Amount</div>
                          <div className="text-xs text-gray-500 mt-1">{application.estimatedDuration}</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Application Details</h4>
                        <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                          {application.coverLetter}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-gray-800">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.applicant.skills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {application.portfolioLinks.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-gray-800">Portfolio</h4>
                          <div className="space-y-1">
                            {application.portfolioLinks.map((link, index) => (
                              <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:text-blue-800 text-sm hover:underline"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <Button
                          size="lg"
                          onClick={() => handleAcceptApplication(application.id)}
                          disabled={actionLoading === application.id}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 flex-1"
                        >
                          {actionLoading === application.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Accept & Pay ${application.proposedBudget}
                            </>
                          )}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleRejectApplication(application.id)}
                          disabled={actionLoading === application.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-4"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleContactApplicant(application.applicant.id)}
                          className="px-4"
                        >
                          <MessageCircle className="mr-1 h-4 w-4" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingApplications.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Applications</h3>
                    <p className="text-gray-600">
                      When workers apply to your job, you'll be able to review and accept them here.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="accepted" className="space-y-4">
              {acceptedApplications.map((application) => (
                <Card key={application.id} className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                            {application.applicant.firstName[0]}
                            {application.applicant.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">@{application.applicant.username}</p>
                          <Badge className="bg-green-600 text-white mt-2">✓ Accepted & Paid</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-green-100 p-3 rounded-lg border border-green-300">
                          <div className="text-xl font-bold text-green-800">${application.proposedBudget}</div>
                          <div className="text-sm text-green-700">✓ Payment Released</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {application.acceptedAt && new Date(application.acceptedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContactApplicant(application.applicant.id)}
                        className="bg-white"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Message Worker
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {acceptedApplications.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <Check className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Accepted Applications</h3>
                    <p className="text-gray-600">Applications you accept will appear here with payment confirmation.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedApplications.map((application) => (
                <Card key={application.id} className="border-red-200 opacity-75 bg-red-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-red-100 text-red-700">
                            {application.applicant.firstName[0]}
                            {application.applicant.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">@{application.applicant.username}</p>
                          <Badge className="bg-red-100 text-red-800 mt-1">Rejected</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {rejectedApplications.length === 0 && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <X className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rejected Applications</h3>
                    <p className="text-gray-600">Applications you reject will appear here for your records.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

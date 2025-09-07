"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsCard } from "@/components/dashboard/stats-card"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { ClearNotifications } from "@/components/notifications/clear-notifications"
import {
  MapPin,
  Clock,
  Zap,
  Filter,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Briefcase,
  MessageCircle,
  Sparkles,
  Plus,
  ShoppingBag,
  Search,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { getAvailableJobs } from "@/lib/jobs"
import { getUserApplications } from "@/lib/jobs"
import { getUserDashboardStats, type DashboardStats } from "@/lib/dashboard-stats"
import { getCategoryThumbnail } from "@/lib/categories"
import { getJobsForDashboard } from "@/lib/jobs"
import { LazyImage } from "@/components/ui/lazy-image"

const RecentActivity = dynamic(
  () => import("@/components/dashboard/recent-activity").then((mod) => ({ default: mod.RecentActivity })),
  {
    loading: () => (
      <Card className="bg-white border border-gray-200 rounded-xl shadow-lg">
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
)

export default function DashboardPage() {
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState("Microjobs")
  const [sortBy, setSortBy] = useState("latest")
  const [category, setCategory] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [microjobs, setMicrojobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [userApplications, setUserApplications] = useState([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    activeJobs: 0,
    completedJobs: 0,
    pendingApplications: 0,
  })
  const router = useRouter()
  const { user } = useAuth()

  const tabs = ["Market", "Microjobs"]
  const categories = ["All", "FACEBOOK", "YOUTUBE", "TIKTOK", "TELEGRAM", "TWITTER"]

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        console.log("[v0] Loading dashboard data for user:", user.id)

        const [realStats, jobs, applications] = await Promise.all([
          getUserDashboardStats(user.id),
          getAvailableJobs(user.id),
          getUserApplications(user.id),
        ])

        console.log("[v0] Real dashboard stats loaded:", realStats)
        setStats(realStats)

        console.log("[v0] Loaded jobs:", jobs.length)
        console.log("[v0] Loaded user applications:", applications.length)
        setUserApplications(applications)

        const appliedJobIds = applications.map((app) => app.jobId)
        console.log("[v0] Applied job IDs:", appliedJobIds)

        const filteredJobs = jobs.filter((job) => {
          const isOwnJob = job.userId === user?.id
          const hasApplied = appliedJobIds.includes(job.id)
          console.log("[v0] Job:", job.title, "Own job:", isOwnJob, "Has applied:", hasApplied)
          return !isOwnJob && !hasApplied
        })
        console.log("[v0] Filtered jobs (excluding own and applied):", filteredJobs)

        const jobsWithThumbnails = await Promise.all(
          filteredJobs.map(async (job) => {
            let thumbnail = job.thumbnail
            if (!thumbnail && job.categoryId) {
              thumbnail = await getCategoryThumbnail(job.categoryId)
            }
            return {
              ...job,
              categoryThumbnail: thumbnail,
            }
          }),
        )

        setMicrojobs(jobsWithThumbnails)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    if (typeof window !== "undefined") {
      localStorage.removeItem("notification-counts")
      console.log("[v0] Cleared notification counts from localStorage")
    }
  }, [user?.id])

  const approvedJobs = getJobsForDashboard(microjobs, user?.id).filter((job) => {
    console.log("[v0] Checking job:", job.title, "Status:", job.status)

    const isValidStatus = (job.status === "approved" || job.status === "open") && job.status !== "completed"

    if (!isValidStatus) return false

    // Check if job has reached worker capacity
    const workersNeeded = job.workersNeeded || job.maxWorkers || 1
    const currentApplications = job.applicationsCount || 0

    if (currentApplications >= workersNeeded) {
      console.log("[v0] Excluding job at capacity:", job.title, currentApplications, "of", workersNeeded, "workers")
      return false
    }

    return true
  })

  console.log("[v0] Total jobs:", microjobs.length, "Approved/Open jobs:", approvedJobs.length)

  if (loading) {
    return (
      <>
        <DashboardHeader
          title={t("dashboard.title")}
          description="Welcome back! Here's what's happening with your work."
        />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center animate-pulse shadow-2xl">
              <Sparkles className="h-10 w-10 text-white animate-spin" />
            </div>
            <p className="text-lg font-semibold text-emerald-700">{t("common.loading")}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title={t("dashboard.title")}
        description="Welcome back! Here's what's happening with your work."
      />

      <div className="flex-1 overflow-auto bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex justify-end">
            <ClearNotifications />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <StatsCard
                title={t("dashboard.totalEarnings")}
                value={`$${stats.totalEarnings.toFixed(2)}`}
                description="From completed jobs"
                icon={DollarSign}
                trend={{ value: stats.totalEarnings > 0 ? 12.5 : 0, isPositive: stats.totalEarnings > 0 }}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <StatsCard
                title={t("dashboard.activeJobs")}
                value={stats.activeJobs}
                description="Currently working"
                icon={Briefcase}
                trend={{ value: stats.activeJobs > 0 ? 8.2 : 0, isPositive: stats.activeJobs > 0 }}
              />
            </div>
          </div>

          <div className="mb-8">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <ShoppingBag className="h-6 w-6 text-blue-600 mr-3" />
                  Explore Marketplace
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Discover jobs, services, and connect with freelancers
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/jobs">
                    <Button className="w-full h-20 bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white flex flex-col items-center justify-center space-y-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                      <Briefcase className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Browse Jobs</div>
                        <div className="text-xs opacity-90">Find microjobs</div>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </Button>
                  </Link>

                  <Link href="/marketplace">
                    <Button className="w-full h-20 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex flex-col items-center justify-center space-y-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                      <ShoppingBag className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Services</div>
                        <div className="text-xs opacity-90">Professional services</div>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </Button>
                  </Link>

                  <Link href="/search">
                    <Button className="w-full h-20 bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex flex-col items-center justify-center space-y-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                      <Search className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Search All</div>
                        <div className="text-xs opacity-90">Jobs, services & users</div>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-75" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Available Microjobs</h1>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 border-emerald-200 w-fit text-lg px-4 py-2"
                >
                  {approvedJobs.length} Jobs Available
                </Badge>
              </div>

              <div className="flex items-center space-x-3">
                <Link href="/dashboard/jobs/create">
                  <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 hover:shadow-xl text-white px-6 py-3 font-bold transition-all duration-300 rounded-xl border-0">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Job
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 px-4 py-3"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                <Card className="w-full sm:w-64 shadow-md border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">Sort By</h3>
                    <RadioGroup value={sortBy} onValueChange={setSortBy} className="space-y-2">
                      {[
                        { value: "latest", label: "Latest" },
                        { value: "most-paying", label: "Highest Pay" },
                        { value: "finishing-soon", label: "Urgent" },
                      ].map(({ value, label }) => (
                        <div key={value} className="flex items-center space-x-3">
                          <RadioGroupItem value={value} id={value} />
                          <Label htmlFor={value} className="cursor-pointer text-sm">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card className="w-full sm:w-64 shadow-md border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold text-foreground mb-3">Category</h3>
                    <RadioGroup value={category} onValueChange={setCategory} className="space-y-2">
                      {categories.slice(0, 4).map((cat) => (
                        <div key={cat} className="flex items-center space-x-3">
                          <RadioGroupItem value={cat.toLowerCase()} id={cat.toLowerCase()} />
                          <Label htmlFor={cat.toLowerCase()} className="cursor-pointer text-sm">
                            {cat}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {approvedJobs.map((job, index) => {
                const completedApplications = job.applicationsCount || 0
                const totalNeeded = job.workersNeeded || 1
                const progressPercentage = Math.min((completedApplications / totalNeeded) * 100, 100)

                const jobThumbnail =
                  job.thumbnail || job.categoryThumbnail || "/placeholder.svg?height=200&width=160&text=Microjob"

                const timeAgo = job.createdAt
                  ? new Date(Date.now() - new Date(job.createdAt).getTime()).getDate() - 1 + " days ago"
                  : "Recently posted"

                return (
                  <Card
                    key={job.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white shadow-lg hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex h-56">
                      {/* Left side image */}
                      <div className="relative w-36 flex-shrink-0">
                        <LazyImage
                          src={jobThumbnail || "/placeholder.svg"}
                          alt={job.title}
                          width={144}
                          height={224}
                          className="w-full h-full object-cover rounded-l-lg"
                          priority={index < 3} // Prioritize first 3 images
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                        />
                        <Badge className="absolute top-3 left-3 bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-sm px-3 py-1 font-medium shadow-md">
                          Microjob
                        </Badge>
                      </div>

                      {/* Right side content */}
                      <div className="flex-1 p-4 flex flex-col">
                        {/* Top content section */}
                        <div className="flex-1 space-y-2">
                          <h3 className="font-bold text-base leading-tight line-clamp-2 text-gray-900 group-hover:text-emerald-700 transition-colors min-h-[2.5rem]">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-1 leading-relaxed">{job.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              <span className="font-medium">{job.location || "Remote"}</span>
                            </div>
                            <div className="text-emerald-600 font-bold text-lg">
                              ${job.budgetMin || job.price || "0.50"}
                            </div>
                          </div>
                        </div>

                        {/* Progress section */}
                        <div className="py-2">
                          <Progress value={progressPercentage} className="h-2 bg-gray-100" />
                          <div className="text-xs text-gray-500 mt-1 text-center font-medium">
                            {completedApplications} of {totalNeeded} workers needed
                          </div>
                        </div>

                        {/* Bottom section with guaranteed space for Apply button */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="font-medium">{timeAgo}</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2 text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg hover:scale-105 border-0"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {approvedJobs.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Zap className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-4 text-foreground">No Microjobs Available</h3>
                  <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                    There are currently no approved microjobs. Check back later or create your own!
                  </p>
                  <Link href="/dashboard/jobs/create">
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-heading font-bold px-8 py-4 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl text-base">
                      <Zap className="mr-2 h-5 w-5" />
                      Create First Microjob
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl">
              <RecentActivity />
            </div>

            <div className="space-y-6">
              <Card className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600 mr-2" />
                    Quick Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/dashboard/wallet">
                      <Button className="w-full h-16 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white flex flex-col items-center justify-center space-y-1 rounded-lg transition-all duration-300">
                        <DollarSign className="h-5 w-5" />
                        <span className="text-xs font-bold">Wallet</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/messages">
                      <Button className="w-full h-16 bg-gradient-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white flex flex-col items-center justify-center space-y-1 rounded-lg transition-all duration-300">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs font-bold">Messages</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

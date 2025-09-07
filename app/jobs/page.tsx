"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getJobs, type Job } from "@/lib/jobs"
import { Plus, Search, Filter, Briefcase, TrendingUp, Clock, RotateCcw, Zap } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const JobCard = dynamic(() => import("@/components/jobs/job-card").then((mod) => ({ default: mod.JobCard })), {
  loading: () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          <div className="h-4 bg-gray-100 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  ),
})

const JobFilters = dynamic(() => import("@/components/jobs/job-filters").then((mod) => ({ default: mod.JobFilters })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded"></div>,
})

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState("")
  const [algorithmStatus, setAlgorithmStatus] = useState<{
    type: string
    enabled: boolean
    rotation_hours?: number
  } | null>(null)

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/jobs?${new URLSearchParams(filters as any)}`)
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs || [])
          setAlgorithmStatus(data.algorithm || null)
        } else {
          const jobsData = await getJobs(filters)
          setJobs(jobsData)
        }
      } catch (error) {
        console.error("Failed to load jobs:", error)
        const jobsData = await getJobs(filters)
        setJobs(jobsData)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [filters])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.skillsRequired &&
        job.skillsRequired.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute top-20 right-20 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Find Your Next
                <span className="block text-blue-400">Opportunity</span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Discover thousands of microjobs from $0.01 to $500. Your skills, your schedule, your success.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-medium">{filteredJobs.length}+ Active Jobs</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="font-medium">$0.01-$500 Range</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">Quick Turnaround</span>
              </div>
              {algorithmStatus?.enabled && (
                <>
                  <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
                  <div className="flex items-center gap-2">
                    {algorithmStatus.type === "newest_first" ? (
                      <Zap className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <RotateCcw className="h-4 w-4 text-purple-400" />
                    )}
                    <span className="font-medium text-xs">
                      {algorithmStatus.type === "newest_first"
                        ? "Newest First"
                        : `${algorithmStatus.rotation_hours}h Rotation`}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4">
              <Link href="/jobs/post">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {algorithmStatus?.enabled && (
          <div className="mb-6">
            <div
              className={`p-4 rounded-lg border ${
                algorithmStatus.type === "newest_first"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-purple-50 border-purple-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {algorithmStatus.type === "newest_first" ? (
                    <Zap className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <RotateCcw className="h-5 w-5 text-purple-600" />
                  )}
                  <div>
                    <h3
                      className={`font-semibold ${
                        algorithmStatus.type === "newest_first" ? "text-yellow-800" : "text-purple-800"
                      }`}
                    >
                      {algorithmStatus.type === "newest_first"
                        ? "Newest First Algorithm Active"
                        : "Time Rotation Algorithm Active"}
                    </h3>
                    <p
                      className={`text-sm ${
                        algorithmStatus.type === "newest_first" ? "text-yellow-700" : "text-purple-700"
                      }`}
                    >
                      {algorithmStatus.type === "newest_first"
                        ? "New jobs and recent worker updates appear first"
                        : `Jobs rotate every ${algorithmStatus.rotation_hours} hours for fair visibility`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    algorithmStatus.type === "newest_first"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                      : "bg-purple-100 text-purple-800 border-purple-300"
                  }
                >
                  Active
                </Badge>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search jobs by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium shadow-sm"
            >
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <JobFilters onFiltersChange={handleFiltersChange} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              <Tabs defaultValue="all" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                    <TabsTrigger
                      value="all"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-6 py-2 font-medium transition-all duration-200"
                    >
                      All Jobs ({filteredJobs.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="recent"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-6 py-2 font-medium transition-all duration-200"
                    >
                      Recent
                    </TabsTrigger>
                    <TabsTrigger
                      value="high-budget"
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-6 py-2 font-medium transition-all duration-200"
                    >
                      High Budget
                    </TabsTrigger>
                  </TabsList>

                  <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading jobs...
                      </div>
                    ) : (
                      `${filteredJobs.length} jobs found`
                    )}
                  </div>
                </div>

                <TabsContent value="all" className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-3">
                              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredJobs.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto space-y-6">
                        <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-gray-900">No jobs found</h3>
                          <p className="text-gray-600">
                            Try adjusting your search criteria or be the first to post a job.
                          </p>
                        </div>
                        <Link href="/jobs/post">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm">
                            Post a Job
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recent">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <Clock className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Jobs</h3>
                    <p className="text-gray-600">The newest opportunities will appear here.</p>
                  </div>
                </TabsContent>

                <TabsContent value="high-budget">
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <TrendingUp className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">High Budget Jobs</h3>
                    <p className="text-gray-600">Premium opportunities with higher earnings.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

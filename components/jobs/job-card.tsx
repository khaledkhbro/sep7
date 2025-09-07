"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SellerLevelBadge } from "@/components/seller/seller-level-badge"
import { MapPin, Clock, Users, Star, Timer, Lock, Verified } from "lucide-react"
import type { Job } from "@/lib/jobs"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useLocalReservations, useJobReservationStatus } from "@/hooks/use-local-reservations"
import { useAuth } from "@/contexts/auth-context"

interface JobCardProps {
  job: Job
  showApplyButton?: boolean
}

export function JobCard({ job, showApplyButton = true }: JobCardProps) {
  const progress = Math.min(((job.applicationsCount || 0) / (job.workersNeeded || 1)) * 100, 100)
  const { user } = useAuth()
  const { settings, reserve } = useLocalReservations(user?.id)
  const { status: reservationStatus, refresh: refreshStatus } = useJobReservationStatus(job.id)
  const [isReserving, setIsReserving] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  // Check if this job is favorited
  const isFavorited = false // Removed favorite functionality

  useEffect(() => {
    console.log("[v0] JobCard reservation debug for job:", job.id, job.title)
    console.log("[v0] User ID:", user?.id)
    console.log("[v0] Reservation settings:", settings)
    console.log("[v0] Reservation status:", reservationStatus)
    console.log("[v0] Show apply button:", showApplyButton)
  }, [job.id, job.title, user?.id, settings, reservationStatus, showApplyButton])

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

  const handleReserveJob = async () => {
    console.log("[v0] Reserve job clicked for:", job.id)
    console.log("[v0] Settings enabled:", settings?.isEnabled)
    console.log("[v0] User ID:", user?.id)

    if (!settings?.isEnabled) {
      console.log("[v0] Reservation disabled in settings")
      toast.error("Job reservation is currently disabled")
      return
    }

    if (!user?.id) {
      console.log("[v0] No user ID found")
      toast.error("Please log in to reserve jobs")
      return
    }

    setIsReserving(true)
    try {
      console.log("[v0] Attempting to reserve job with minutes:", settings.defaultReservationMinutes)
      const reservation = await reserve(job.id, settings.defaultReservationMinutes)
      console.log("[v0] Reservation result:", reservation)

      if (reservation) {
        const timeUnit = settings.defaultReservationMinutes >= 60 ? "hour(s)" : "minute(s)"
        const timeValue =
          settings.defaultReservationMinutes >= 60
            ? Math.round(settings.defaultReservationMinutes / 60)
            : settings.defaultReservationMinutes

        toast.success(`Job reserved for ${timeValue} ${timeUnit}!`)
        refreshStatus()
      } else {
        console.log("[v0] Failed to create reservation")
        toast.error("Failed to reserve job")
      }
    } catch (error) {
      console.error("[v0] Reservation error:", error)
      toast.error("Failed to reserve job")
    } finally {
      setIsReserving(false)
    }
  }

  const getThumbnailUrl = () => {
    console.log("[v0] JobCard thumbnail debug for job:", job.id, job.title)
    console.log("[v0] Job thumbnail:", job.thumbnail)
    console.log("[v0] Job subcategory:", job.subcategory)
    console.log("[v0] Job category:", job.category)
    console.log("[v0] Job categoryThumbnail:", job.categoryThumbnail)

    if (job.thumbnail) {
      console.log("[v0] Using job thumbnail:", job.thumbnail)
      return job.thumbnail
    }

    if (job.subcategory?.thumbnail) {
      console.log("[v0] Using subcategory thumbnail:", job.subcategory.thumbnail)
      return job.subcategory.thumbnail
    }

    if (job.categoryThumbnail || job.category?.thumbnail) {
      const categoryThumbnail = job.categoryThumbnail || job.category.thumbnail
      console.log("[v0] Using category thumbnail:", categoryThumbnail)
      return categoryThumbnail
    }

    const placeholder = `/placeholder.svg?height=160&width=280&query=${encodeURIComponent(job.category.name + " microjob")}`
    console.log("[v0] Using placeholder:", placeholder)
    return placeholder
  }

  const thumbnailUrl = getThumbnailUrl()

  return (
    <Card className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden max-w-sm mx-auto">
      <div className="relative">
        <div className="w-full h-40 bg-gray-100 overflow-hidden">
          <img
            src={thumbnailUrl || "/placeholder.svg"}
            alt={job.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `/placeholder.svg?height=160&width=280&query=${encodeURIComponent(job.category.name + " job")}`
            }}
          />
        </div>

        <div className="absolute top-3 left-3">
          <Badge className="bg-emerald-500 text-white font-medium px-3 py-1 text-xs rounded-full shadow-lg">
            Microjob
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md">
            <span className="text-emerald-600 font-bold text-sm">${job.budgetMax}</span>
          </div>
        </div>

        {reservationStatus.isReserved && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg">
              <Lock className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-gray-900">Reserved</div>
              {timeLeft && timeLeft !== "Expired" && (
                <div className="text-xs text-orange-600 font-medium">{timeLeft} left</div>
              )}
              {timeLeft === "Expired" && <div className="text-xs text-red-600 font-medium">Reservation Expired</div>}
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full px-2 py-1"
          >
            {job.category.name}
          </Badge>
          <div className="flex items-center text-gray-500 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {job.postedBy && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {job.postedBy.firstName?.[0] || "U"}
                  {job.postedBy.lastName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-gray-900">{job.postedBy.username || "Anonymous"}</span>
                {job.postedBy.isVerified && <Verified className="h-3 w-3 text-blue-500" />}
              </div>
            </div>
            <SellerLevelBadge sellerId={job.postedBy.id} showName={false} size="sm" />
          </div>
        )}

        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-emerald-600 transition-colors">
          {job.title}
        </h3>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1 text-emerald-500" />
            <span>{job.isRemote ? "Remote" : job.location}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-emerald-500" />
            <span>{job.workersNeeded} needed</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{job.applicationsCount || 0}</span> of {job.workersNeeded}{" "}
              applied
            </span>
            <div className="flex items-center text-emerald-600 font-medium">
              <Star className="h-3 w-3 mr-1 fill-current" />
              <span>4.8</span>
            </div>
          </div>
        </div>

        {showApplyButton && (
          <div className="pt-2 space-y-2">
            {(() => {
              console.log("[v0] Rendering reservation UI - isReserved:", reservationStatus.isReserved)
              console.log("[v0] Settings enabled:", settings?.isEnabled)
              return null
            })()}

            {reservationStatus.isReserved ? (
              <div className="text-center py-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-sm text-orange-700 font-semibold flex items-center justify-center mb-1">
                  <Timer className="h-4 w-4 mr-2" />
                  {timeLeft === "Expired" ? "Reservation Expired" : "You Reserved This Job"}
                </div>
                {timeLeft && timeLeft !== "Expired" && (
                  <div className="text-xs text-orange-600 font-medium">{timeLeft} remaining</div>
                )}
                {timeLeft === "Expired" && (
                  <div className="text-xs text-red-600 font-medium">Apply now or lose this opportunity</div>
                )}
              </div>
            ) : (
              <>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg text-sm">
                  Apply Now • ${job.budgetMax}
                </Button>
                {settings?.isEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleReserveJob}
                    disabled={isReserving}
                    className="w-full border-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500 font-semibold py-3 rounded-xl transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md"
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
                {settings?.isEnabled && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500">💡 Reserve to hold this job while you decide</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

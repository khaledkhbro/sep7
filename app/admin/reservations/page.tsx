"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle, Users, Clock, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ReservationViolation {
  id: string
  userId: string
  userEmail: string
  userName: string
  violationCount: number
  lastViolationAt: string
  totalReservations: number
  expiredReservations: number
  violationRate: number
}

interface ActiveReservation {
  id: string
  jobId: string
  jobTitle: string
  userId: string
  userEmail: string
  userName: string
  reservedAt: string
  expiresAt: string
  timeRemaining: string
  status: "active" | "expiring" | "expired"
}

export default function AdminReservationsPage() {
  const router = useRouter()
  const [violations, setViolations] = useState<ReservationViolation[]>([])
  const [activeReservations, setActiveReservations] = useState<ActiveReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadViolations = async () => {
    try {
      const response = await fetch("/api/admin/reservation-violations")
      if (response.ok) {
        const data = await response.json()
        setViolations(data.violations || [])
      } else {
        console.error("Failed to load violations:", response.status)
        setViolations([]) // Set empty array on error
      }
    } catch (error) {
      console.error("Error loading violations:", error)
      setViolations([]) // Set empty array on error
      toast.error("Failed to load reservation violations")
    }
  }

  const loadActiveReservations = async () => {
    try {
      const response = await fetch("/api/admin/reservation-violations?type=active")
      if (response.ok) {
        const data = await response.json()
        setActiveReservations(data.activeReservations || [])
      } else {
        console.error("Failed to load active reservations:", response.status)
        setActiveReservations([]) // Set empty array on error
      }
    } catch (error) {
      console.error("Error loading active reservations:", error)
      setActiveReservations([]) // Set empty array on error
      toast.error("Failed to load active reservations")
    }
  }

  const resetUserViolations = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/reservation-violations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast.success("User violations reset successfully")
        loadViolations()
      } else {
        toast.error("Failed to reset user violations")
      }
    } catch (error) {
      console.error("Error resetting violations:", error)
      toast.error("Failed to reset user violations")
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([loadViolations(), loadActiveReservations()])
    setRefreshing(false)
    toast.success("Data refreshed")
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadViolations(), loadActiveReservations()])
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadViolations()
      loadActiveReservations()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getViolationSeverity = (rate: number) => {
    if (rate >= 0.8) return { color: "bg-red-100 text-red-800 border-red-200", label: "Critical" }
    if (rate >= 0.5) return { color: "bg-orange-100 text-orange-800 border-orange-200", label: "High" }
    if (rate >= 0.3) return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Medium" }
    return { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Low" }
  }

  const getReservationStatus = (reservation: ActiveReservation) => {
    const now = new Date()
    const expires = new Date(reservation.expiresAt)
    const timeLeft = expires.getTime() - now.getTime()

    if (timeLeft <= 0) return { color: "bg-red-100 text-red-800", label: "Expired" }
    if (timeLeft <= 10 * 60 * 1000) return { color: "bg-orange-100 text-orange-800", label: "Expiring Soon" }
    return { color: "bg-green-100 text-green-800", label: "Active" }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservation Management</h1>
            <p className="text-gray-600 mt-1">Monitor job reservations and user violations</p>
          </div>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeReservations.length}</div>
            <p className="text-xs text-gray-500 mt-1">Currently reserved jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Users with Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{violations.length}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {violations.filter((v) => v.violationRate >= 0.8).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">≥80% violation rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {
                activeReservations.filter((r) => {
                  const timeLeft = new Date(r.expiresAt).getTime() - new Date().getTime()
                  return timeLeft <= 10 * 60 * 1000 && timeLeft > 0
                }).length
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">≤10 minutes left</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Active Reservations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeReservations.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active reservations</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Reserved At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeReservations.map((reservation) => {
                  const status = getReservationStatus(reservation)
                  return (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">{reservation.jobTitle}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reservation.userName}</div>
                          <div className="text-sm text-gray-500">{reservation.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(reservation.reservedAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(reservation.expiresAt).toLocaleString()}</TableCell>
                      <TableCell>{reservation.timeRemaining}</TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>User Violations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No user violations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Total Reservations</TableHead>
                  <TableHead>Expired</TableHead>
                  <TableHead>Violation Rate</TableHead>
                  <TableHead>Last Violation</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => {
                  const severity = getViolationSeverity(violation.violationRate)
                  return (
                    <TableRow key={violation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{violation.userName}</div>
                          <div className="text-sm text-gray-500">{violation.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{violation.totalReservations}</TableCell>
                      <TableCell>{violation.expiredReservations}</TableCell>
                      <TableCell>{(violation.violationRate * 100).toFixed(1)}%</TableCell>
                      <TableCell>{new Date(violation.lastViolationAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={severity.color}>{severity.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetUserViolations(violation.userId)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

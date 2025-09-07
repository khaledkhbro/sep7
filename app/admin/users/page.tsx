"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllUsers, saveUserToDatabase, suspendUserWithReason, activateUser, type User } from "@/lib/auth"
import { getWallet, type Wallet } from "@/lib/wallet"
import { loginAsUser } from "@/lib/admin"
import { useAuth } from "@/contexts/auth-context"
import { Shield, Ban, CheckCircle, LogIn, MoreHorizontal, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SuspensionDialog } from "@/components/admin/suspension-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserWithWallet extends User {
  walletData?: Wallet
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [nameFilter, setNameFilter] = useState("")
  const [emailFilter, setEmailFilter] = useState("")
  const [countryFilter, setCountryFilter] = useState("all")
  const [verifiedFilter, setVerifiedFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10
  const [suspensionDialog, setSuspensionDialog] = useState<{
    isOpen: boolean
    userId: string
    userName: string
  }>({ isOpen: false, userId: "", userName: "" })
  const [suspensionDetailsDialog, setSuspensionDetailsDialog] = useState<{
    isOpen: boolean
    user: User | null
  }>({ isOpen: false, user: null })
  const [actionLoading, setActionLoading] = useState(false)

  const router = useRouter()
  const { user: currentUser, refreshUser } = useAuth()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const usersData = await getAllUsers()
      console.log("[v0] Loading wallet data for", usersData.length, "users")
      const usersWithWallets = await Promise.all(
        usersData.map(async (user) => {
          try {
            const walletData = await getWallet(user.id)
            console.log(
              "[v0] Loaded wallet for user",
              user.id,
              "- Deposit:",
              walletData.depositBalance,
              "Earnings:",
              walletData.earningsBalance,
            )
            return { ...user, walletData }
          } catch (error) {
            console.error("[v0] Failed to load wallet for user", user.id, error)
            return { ...user, walletData: undefined }
          }
        }),
      )
      setUsers(usersWithWallets)
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: "suspend" | "activate" | "verify") => {
    if (action === "suspend") {
      const user = users.find((u) => u.id === userId)
      if (user) {
        setSuspensionDialog({
          isOpen: true,
          userId,
          userName: `${user.firstName} ${user.lastName}`,
        })
      }
      return
    }

    try {
      const users = getAllUsers()
      const userIndex = users.findIndex((u) => u.id === userId)

      if (userIndex === -1) {
        throw new Error("User not found")
      }

      const updatedUser = { ...users[userIndex] }

      if (action === "activate") {
        activateUser(userId)
      } else if (action === "verify") {
        updatedUser.isVerified = true
        saveUserToDatabase(updatedUser)
      }

      await loadUsers()
      alert(`User ${action}d successfully!`)
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
      alert(`Failed to ${action} user. Please try again.`)
    }
  }

  const handleSuspensionConfirm = async (reason: string) => {
    if (!currentUser) return

    setActionLoading(true)
    try {
      suspendUserWithReason(suspensionDialog.userId, reason, currentUser.id)
      await loadUsers()
      setSuspensionDialog({ isOpen: false, userId: "", userName: "" })
      alert("User suspended successfully!")
    } catch (error) {
      console.error("Failed to suspend user:", error)
      alert("Failed to suspend user. Please try again.")
    } finally {
      setActionLoading(false)
    }
  }

  const showSuspensionDetails = (user: User) => {
    setSuspensionDetailsDialog({ isOpen: true, user })
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesName =
      nameFilter === "" || `${user.firstName} ${user.lastName}`.toLowerCase().includes(nameFilter.toLowerCase())

    const matchesEmail = emailFilter === "" || user.email.toLowerCase().includes(emailFilter.toLowerCase())

    const matchesCountry =
      countryFilter === "all" || (user.country && user.country.toLowerCase() === countryFilter.toLowerCase())

    const matchesVerified =
      verifiedFilter === "all" ||
      (verifiedFilter === "verified" && user.isVerified) ||
      (verifiedFilter === "not-verified" && !user.isVerified)

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.userType !== "suspended") ||
      (statusFilter === "inactive" && user.userType === "suspended")

    return matchesSearch && matchesName && matchesEmail && matchesCountry && matchesVerified && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, nameFilter, emailFilter, countryFilter, verifiedFilter, statusFilter])

  const countries = [...new Set(users.map((user) => user.country).filter(Boolean))]

  return (
    <>
      <AdminHeader title="User List" description="Manage platform users and their accounts" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">User ID:</label>
                  <Input placeholder="User ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Name:</label>
                  <Input placeholder="User Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email:</label>
                  <Input
                    placeholder="User Email"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Country:</label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="--Select Country--" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">--Select Country--</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country.toLowerCase()}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Verified For Contest:</label>
                  <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="not-verified">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status:</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadUsers} className="bg-purple-600 hover:bg-purple-700 text-white px-8">
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-purple-600 hover:bg-purple-600">
                          <TableHead className="text-white font-semibold text-center">#</TableHead>
                          <TableHead className="text-white font-semibold text-center">ID</TableHead>
                          <TableHead className="text-white font-semibold text-center">Full Name</TableHead>
                          <TableHead className="text-white font-semibold text-center">Email</TableHead>
                          <TableHead className="text-white font-semibold text-center">Deposit</TableHead>
                          <TableHead className="text-white font-semibold text-center">Earning</TableHead>
                          <TableHead className="text-white font-semibold text-center">Country</TableHead>
                          <TableHead className="text-white font-semibold text-center">Status</TableHead>
                          <TableHead className="text-white font-semibold text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUsers.map((user, index) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="text-center font-medium">
                              <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">
                                {String(startIndex + index + 1).padStart(2, "0")}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{user.id}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <span>
                                  {user.firstName} {user.lastName}
                                </span>
                                {user.userType === "admin" && <Shield className="h-4 w-4 text-purple-500" />}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{user.email}</TableCell>
                            <TableCell className="text-center">
                              {user.walletData ? (
                                <span className="font-medium text-blue-600">
                                  ${user.walletData.depositBalance.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">Loading...</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {user.walletData ? (
                                <span className="font-medium text-green-600">
                                  ${user.walletData.earningsBalance.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">Loading...</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{user.country || "N/A"}</TableCell>
                            <TableCell className="text-center">
                              {user.userType === "suspended" ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                                    Suspended
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => showSuspensionDetails(user)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : user.isVerified ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">
                                  Not Verified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!user.isVerified && (
                                    <DropdownMenuItem onClick={() => handleUserAction(user.id, "verify")}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Verify
                                    </DropdownMenuItem>
                                  )}
                                  {user.userType === "user" && (
                                    <DropdownMenuItem onClick={() => loginAsUser(user.id)}>
                                      <LogIn className="mr-2 h-4 w-4" />
                                      Login as User
                                    </DropdownMenuItem>
                                  )}
                                  {user.userType !== "suspended" ? (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction(user.id, "suspend")}
                                      className="text-red-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Suspend
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => handleUserAction(user.id, "activate")}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-600">No users found matching your criteria.</p>
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of{" "}
                        {filteredUsers.length} users
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="text-gray-600 border-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === pageNum ? "bg-purple-600 text-white" : "text-gray-600 border-gray-300"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                          {totalPages > 5 && (
                            <>
                              <span className="text-gray-400">...</span>
                              <Button
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-8 h-8 p-0 ${
                                  currentPage === totalPages
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-600 border-gray-300"
                                }`}
                              >
                                {totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="text-gray-600 border-gray-300"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SuspensionDialog
        isOpen={suspensionDialog.isOpen}
        onClose={() => setSuspensionDialog({ isOpen: false, userId: "", userName: "" })}
        onConfirm={handleSuspensionConfirm}
        userName={suspensionDialog.userName}
        isLoading={actionLoading}
      />

      <Dialog
        open={suspensionDetailsDialog.isOpen}
        onOpenChange={() => setSuspensionDetailsDialog({ isOpen: false, user: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspension Details</DialogTitle>
            <DialogDescription>Information about this user's suspension</DialogDescription>
          </DialogHeader>

          {suspensionDetailsDialog.user && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700">User:</h4>
                <p className="text-sm">
                  {suspensionDetailsDialog.user.firstName} {suspensionDetailsDialog.user.lastName}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-700">Suspension Reason:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded border">
                  {suspensionDetailsDialog.user.suspensionReason || "No reason provided"}
                </p>
              </div>

              {suspensionDetailsDialog.user.suspendedAt && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Suspended On:</h4>
                  <p className="text-sm">{new Date(suspensionDetailsDialog.user.suspendedAt).toLocaleString()}</p>
                </div>
              )}

              {suspensionDetailsDialog.user.suspendedBy && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Suspended By:</h4>
                  <p className="text-sm">Admin ID: {suspensionDetailsDialog.user.suspendedBy}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAllUsers, type User } from "@/lib/auth"
import { getWallet, addWalletTransaction, type Wallet } from "@/lib/wallet"
import { useAuth } from "@/contexts/auth-context"
import { Search, Plus, Minus, DollarSign, History, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AdminWalletAction {
  id: string
  adminId: string
  adminName: string
  userId: string
  userName: string
  userEmail: string
  actionType: "add_deposit" | "add_earnings" | "subtract_deposit" | "subtract_earnings"
  amount: number
  reason: string
  balanceType: "deposit" | "earnings"
  previousBalance: number
  newBalance: number
  createdAt: string
}

export default function AdminWalletManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userWallet, setUserWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionType, setActionType] = useState<"add" | "subtract">("add")
  const [balanceType, setBalanceType] = useState<"deposit" | "earnings">("deposit")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [adminActions, setAdminActions] = useState<AdminWalletAction[]>([])
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showQuickActionsDialog, setShowQuickActionsDialog] = useState(false)
  const [quickActionUsers, setQuickActionUsers] = useState<string[]>([])

  const { user: currentAdmin } = useAuth()

  useEffect(() => {
    loadUsers()
    loadAdminActions()
  }, [])

  const loadUsers = async () => {
    try {
      const usersData = await getAllUsers()
      setUsers(usersData.filter((u) => u.userType !== "admin"))
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const loadAdminActions = () => {
    const actions = JSON.parse(localStorage.getItem("admin_wallet_actions") || "[]")
    setAdminActions(
      actions.sort(
        (a: AdminWalletAction, b: AdminWalletAction) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    )
  }

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user)
    setLoading(true)
    try {
      const wallet = await getWallet(user.id)
      setUserWallet(wallet)
    } catch (error) {
      console.error("Failed to load user wallet:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !userWallet || !amount || !reason.trim()) {
      alert("Please fill in all required fields")
      return
    }

    const adjustmentAmount = Number.parseFloat(amount)
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      alert("Please enter a valid positive amount")
      return
    }

    // Check if subtracting and user has sufficient balance
    if (actionType === "subtract") {
      const currentBalance = balanceType === "deposit" ? userWallet.depositBalance : userWallet.earningsBalance
      if (currentBalance < adjustmentAmount) {
        alert(`Insufficient ${balanceType} balance. Current balance: $${currentBalance.toFixed(2)}`)
        return
      }
    }

    try {
      setLoading(true)

      const previousBalance = balanceType === "deposit" ? userWallet.depositBalance : userWallet.earningsBalance
      const transactionAmount = actionType === "add" ? adjustmentAmount : -adjustmentAmount
      const transactionType = actionType === "add" ? (balanceType === "deposit" ? "deposit" : "earning") : "withdrawal"

      // Create wallet transaction
      await addWalletTransaction({
        userId: selectedUser.id,
        type: transactionType,
        amount: transactionAmount,
        description: `Admin ${actionType === "add" ? "added" : "subtracted"} ${balanceType} balance: ${reason}`,
        referenceId: `admin_${Date.now()}`,
        referenceType: "admin_adjustment",
        balanceType: balanceType,
      })

      // Record admin action for audit trail
      const adminAction: AdminWalletAction = {
        id: `admin_action_${Date.now()}`,
        adminId: currentAdmin?.id || "unknown",
        adminName: `${currentAdmin?.firstName} ${currentAdmin?.lastName}` || "Unknown Admin",
        userId: selectedUser.id,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        userEmail: selectedUser.email,
        actionType: `${actionType}_${balanceType}` as AdminWalletAction["actionType"],
        amount: adjustmentAmount,
        reason,
        balanceType,
        previousBalance,
        newBalance: actionType === "add" ? previousBalance + adjustmentAmount : previousBalance - adjustmentAmount,
        createdAt: new Date().toISOString(),
      }

      const actions = JSON.parse(localStorage.getItem("admin_wallet_actions") || "[]")
      actions.push(adminAction)
      localStorage.setItem("admin_wallet_actions", JSON.stringify(actions))

      // Refresh wallet data
      const updatedWallet = await getWallet(selectedUser.id)
      setUserWallet(updatedWallet)
      loadAdminActions()

      // Reset form
      setShowActionDialog(false)
      setAmount("")
      setReason("")

      alert(
        `Successfully ${actionType === "add" ? "added" : "subtracted"} $${adjustmentAmount.toFixed(2)} ${actionType === "add" ? "to" : "from"} ${selectedUser.firstName}'s ${balanceType} balance`,
      )
    } catch (error) {
      console.error("Failed to adjust balance:", error)
      alert("Failed to adjust balance. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (
    userIds: string[],
    depositAmount: number,
    earningsAmount: number,
    reason: string,
  ) => {
    if (!reason.trim()) {
      alert("Please provide a reason for the balance adjustment")
      return
    }

    setLoading(true)
    const results = []

    for (const userId of userIds) {
      try {
        const user = users.find((u) => u.id === userId)
        if (!user) {
          results.push(`User ${userId}: Not found`)
          continue
        }

        // Add deposit balance if specified
        if (depositAmount > 0) {
          await addWalletTransaction({
            userId: userId,
            type: "deposit",
            amount: depositAmount,
            description: `Admin added deposit balance: ${reason}`,
            referenceId: `admin_${Date.now()}_${userId}_deposit`,
            referenceType: "admin_adjustment",
            balanceType: "deposit",
          })

          // Record admin action
          const depositAction: AdminWalletAction = {
            id: `admin_action_${Date.now()}_${userId}_deposit`,
            adminId: currentAdmin?.id || "unknown",
            adminName: `${currentAdmin?.firstName} ${currentAdmin?.lastName}` || "Unknown Admin",
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            actionType: "add_deposit",
            amount: depositAmount,
            reason,
            balanceType: "deposit",
            previousBalance: 0, // Will be updated with actual values
            newBalance: depositAmount,
            createdAt: new Date().toISOString(),
          }

          const actions = JSON.parse(localStorage.getItem("admin_wallet_actions") || "[]")
          actions.push(depositAction)
          localStorage.setItem("admin_wallet_actions", JSON.stringify(actions))
        }

        // Add earnings balance if specified
        if (earningsAmount > 0) {
          await addWalletTransaction({
            userId: userId,
            type: "earning",
            amount: earningsAmount,
            description: `Admin added earnings balance: ${reason}`,
            referenceId: `admin_${Date.now()}_${userId}_earnings`,
            referenceType: "admin_adjustment",
            balanceType: "earnings",
          })

          // Record admin action
          const earningsAction: AdminWalletAction = {
            id: `admin_action_${Date.now()}_${userId}_earnings`,
            adminId: currentAdmin?.id || "unknown",
            adminName: `${currentAdmin?.firstName} ${currentAdmin?.lastName}` || "Unknown Admin",
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            actionType: "add_earnings",
            amount: earningsAmount,
            reason,
            balanceType: "earnings",
            previousBalance: 0, // Will be updated with actual values
            newBalance: earningsAmount,
            createdAt: new Date().toISOString(),
          }

          const actions = JSON.parse(localStorage.getItem("admin_wallet_actions") || "[]")
          actions.push(earningsAction)
          localStorage.setItem("admin_wallet_actions", JSON.stringify(actions))
        }

        results.push(`User ${userId}: Successfully added $${depositAmount} deposit + $${earningsAmount} earnings`)
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error)
        results.push(`User ${userId}: Failed to update`)
      }
    }

    setLoading(false)
    loadAdminActions()

    // Refresh selected user wallet if they were updated
    if (selectedUser && userIds.includes(selectedUser.id)) {
      try {
        const updatedWallet = await getWallet(selectedUser.id)
        setUserWallet(updatedWallet)
      } catch (error) {
        console.error("Failed to refresh selected user wallet:", error)
      }
    }

    alert(`Quick Action Results:\n${results.join("\n")}`)
    setShowQuickActionsDialog(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getActionBadge = (actionType: string) => {
    const isAdd = actionType.includes("add")
    return isAdd ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  return (
    <>
      <AdminHeader title="Wallet Management" description="Manage user wallet balances and view audit history" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-900">
                <DollarSign className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => {
                    setQuickActionUsers(["02", "03"])
                    setShowQuickActionsDialog(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Users 02 & 03
                </Button>
                <Button
                  onClick={() => {
                    setSearchQuery("02")
                  }}
                  variant="outline"
                  className="bg-transparent border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Find User 02
                </Button>
                <Button
                  onClick={() => {
                    setSearchQuery("03")
                  }}
                  variant="outline"
                  className="bg-transparent border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Find User 03
                </Button>
              </div>
              <p className="text-sm text-purple-700">
                Quick actions for common balance adjustments. Use "Add to Users 02 & 03" to add $1000 deposit + $500
                earnings to both users at once.
              </p>
            </CardContent>
          </Card>

          {/* Search Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Find User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, username, email, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchQuery && (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.slice(0, 10).map((user) => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                @{user.username} • {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-600">ID: {user.id}</p>
                            <p className="text-green-600">Deposit: ${user.deposit.toFixed(2)}</p>
                            <p className="text-blue-600">Earnings: ${user.earning.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-600">No users found matching your search</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected User Wallet */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Wallet Management - {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                  <Button variant="outline" onClick={() => setShowHistoryDialog(true)} className="bg-transparent">
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : userWallet ? (
                  <>
                    {/* User Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">User Details</p>
                          <p className="font-medium">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </p>
                          <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">User ID</p>
                          <p className="font-mono text-sm">{selectedUser.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Status</p>
                          <Badge
                            className={
                              selectedUser.isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {selectedUser.isVerified ? "Verified" : "Not Verified"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Current Balances */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-blue-900">Deposit Balance</CardTitle>
                          <p className="text-sm text-blue-700">Cannot be withdrawn - used for job posting</p>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-900">
                            ${userWallet.depositBalance.toFixed(2)}
                          </div>
                          <div className="mt-4 space-y-2">
                            <Button
                              onClick={() => {
                                setActionType("add")
                                setBalanceType("deposit")
                                setShowActionDialog(true)
                              }}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Deposit Balance
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setActionType("subtract")
                                setBalanceType("deposit")
                                setShowActionDialog(true)
                              }}
                              className="w-full bg-transparent border-red-300 text-red-600 hover:bg-red-50"
                              disabled={userWallet.depositBalance <= 0}
                            >
                              <Minus className="mr-2 h-4 w-4" />
                              Subtract Deposit Balance
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg text-green-900">Earnings Balance</CardTitle>
                          <p className="text-sm text-green-700">Can be withdrawn by user</p>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-900">
                            ${userWallet.earningsBalance.toFixed(2)}
                          </div>
                          <div className="mt-4 space-y-2">
                            <Button
                              onClick={() => {
                                setActionType("add")
                                setBalanceType("earnings")
                                setShowActionDialog(true)
                              }}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Earnings Balance
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setActionType("subtract")
                                setBalanceType("earnings")
                                setShowActionDialog(true)
                              }}
                              className="w-full bg-transparent border-red-300 text-red-600 hover:bg-red-50"
                              disabled={userWallet.earningsBalance <= 0}
                            >
                              <Minus className="mr-2 h-4 w-4" />
                              Subtract Earnings Balance
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Wallet Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Total Earned</p>
                        <p className="text-xl font-bold text-gray-900">${userWallet.totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-xl font-bold text-gray-900">${userWallet.totalSpent.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Pending Balance</p>
                        <p className="text-xl font-bold text-gray-900">${userWallet.pendingBalance.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDistanceToNow(new Date(userWallet.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Failed to load wallet data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" />
                Recent Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adminActions.length > 0 ? (
                <div className="space-y-3">
                  {adminActions.slice(0, 10).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getActionBadge(action.actionType)}>
                          {action.actionType.includes("add") ? "Added" : "Subtracted"}
                        </Badge>
                        <div>
                          <p className="font-medium text-gray-900">
                            {action.adminName} {action.actionType.includes("add") ? "added" : "subtracted"} $
                            {action.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {action.balanceType} balance for {action.userName} ({action.userEmail})
                          </p>
                          <p className="text-xs text-gray-500">Reason: {action.reason}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{formatDistanceToNow(new Date(action.createdAt), { addSuffix: true })}</p>
                        <p className="text-xs">
                          ${action.previousBalance.toFixed(2)} → ${action.newBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No admin actions recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Balance Adjustment Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "add" ? "Add" : "Subtract"} {balanceType === "deposit" ? "Deposit" : "Earnings"} Balance
            </DialogTitle>
          </DialogHeader>
          {selectedUser && userWallet && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-600">
                  Current {balanceType} balance: $
                  {(balanceType === "deposit" ? userWallet.depositBalance : userWallet.earningsBalance).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason (Required for audit trail)</label>
                <Textarea
                  placeholder="Explain why you are adjusting this user's balance..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {actionType === "subtract" && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      This will subtract ${amount || "0.00"} from the user's {balanceType} balance.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionDialog(false)
                    setAmount("")
                    setReason("")
                  }}
                  className="bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBalanceAdjustment}
                  disabled={!amount || !reason.trim() || loading}
                  className={actionType === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : actionType === "add" ? (
                    <Plus className="mr-2 h-4 w-4" />
                  ) : (
                    <Minus className="mr-2 h-4 w-4" />
                  )}
                  {actionType === "add" ? "Add" : "Subtract"} Balance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Wallet Actions History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {adminActions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance Change</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="text-sm">
                        {new Date(action.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">{new Date(action.createdAt).toLocaleTimeString()}</span>
                      </TableCell>
                      <TableCell className="text-sm">{action.adminName}</TableCell>
                      <TableCell className="text-sm">
                        {action.userName}
                        <br />
                        <span className="text-xs text-gray-500">{action.userEmail}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadge(action.actionType)}>
                          {action.actionType.includes("add") ? "Added" : "Subtracted"} {action.balanceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">${action.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        ${action.previousBalance.toFixed(2)} → ${action.newBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={action.reason}>
                        {action.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No admin actions recorded yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Dialog */}
      <Dialog open={showQuickActionsDialog} onOpenChange={setShowQuickActionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Balance Addition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900">Target Users:</p>
              <p className="text-sm text-blue-700">Users {quickActionUsers.join(", ")}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Deposit Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000.00"
                  defaultValue="1000"
                  id="quickDepositAmount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Earnings Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500.00"
                  defaultValue="500"
                  id="quickEarningsAmount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason (Required for audit trail)</label>
              <Textarea
                placeholder="Admin balance adjustment for users 02 and 03"
                defaultValue="Admin balance adjustment - Initial funding"
                id="quickReason"
                rows={3}
              />
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                This will add the specified amounts to each selected user's wallet balances.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowQuickActionsDialog(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const depositAmount = Number.parseFloat(
                    (document.getElementById("quickDepositAmount") as HTMLInputElement)?.value || "0",
                  )
                  const earningsAmount = Number.parseFloat(
                    (document.getElementById("quickEarningsAmount") as HTMLInputElement)?.value || "0",
                  )
                  const reason = (document.getElementById("quickReason") as HTMLTextAreaElement)?.value || ""

                  if (depositAmount === 0 && earningsAmount === 0) {
                    alert("Please enter at least one amount to add")
                    return
                  }

                  handleQuickAction(quickActionUsers, depositAmount, earningsAmount, reason)
                }}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Balances
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

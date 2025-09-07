"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAdminTransactions, type AdminTransaction } from "@/lib/admin"
import { Search, Filter, Download, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadTransactions()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, statusFilter])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await getAdminTransactions({ limit: 100 })
      setTransactions(data)
    } catch (error) {
      console.error("Failed to load transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (transaction) =>
          transaction.user.firstName.toLowerCase().includes(search) ||
          transaction.user.lastName.toLowerCase().includes(search) ||
          transaction.user.username.toLowerCase().includes(search) ||
          transaction.description.toLowerCase().includes(search) ||
          transaction.id.toLowerCase().includes(search),
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    setFilteredTransactions(filtered)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "deposit":
        return "default"
      case "withdrawal":
        return "secondary"
      case "payment":
        return "destructive"
      case "earning":
        return "default"
      case "refund":
        return "outline"
      default:
        return "outline"
    }
  }

  const exportTransactions = () => {
    const csvContent = [
      ["ID", "User", "Type", "Amount", "Status", "Description", "Date"].join(","),
      ...filteredTransactions.map((t) =>
        [
          t.id,
          `${t.user.firstName} ${t.user.lastName} (${t.user.username})`,
          t.type,
          t.amount,
          t.status,
          `"${t.description}"`,
          new Date(t.createdAt).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const completedTransactions = filteredTransactions.filter((t) => t.status === "completed")
  const pendingTransactions = filteredTransactions.filter((t) => t.status === "pending")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <>
      <AdminHeader title="Transaction Management" description="View and manage all platform transactions" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</div>
                <p className="text-sm text-gray-600">Total Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Total Amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{completedTransactions.length}</div>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{pendingTransactions.length}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by user, description, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="earning">Earning</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadTransactions} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={exportTransactions} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No transactions found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">{transaction.id.slice(0, 12)}...</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.user.firstName} {transaction.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">@{transaction.user.username}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeVariant(transaction.type)}>{transaction.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {transaction.amount > 0 ? "+" : ""}${transaction.amount.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>{transaction.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(transaction.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

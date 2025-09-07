"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { DollarSign, TrendingUp, TrendingDown, MessageSquare, CreditCard, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// Mock data for demonstration
const revenueData = [
  { month: "Jan", deposits: 12500, withdrawals: 8200, chatTransfers: 3400, supportRevenue: 450 },
  { month: "Feb", deposits: 15200, withdrawals: 9800, chatTransfers: 4100, supportRevenue: 620 },
  { month: "Mar", deposits: 18900, withdrawals: 11200, chatTransfers: 5200, supportRevenue: 780 },
  { month: "Apr", deposits: 22100, withdrawals: 13500, chatTransfers: 6800, supportRevenue: 920 },
  { month: "May", deposits: 25800, withdrawals: 15900, chatTransfers: 8200, supportRevenue: 1150 },
  { month: "Jun", deposits: 28400, withdrawals: 17200, chatTransfers: 9500, supportRevenue: 1340 },
]

const commissionBreakdown = [
  { name: "Deposit Fees", value: 35, amount: 15400, color: "#3B82F6" },
  { name: "Withdrawal Fees", value: 28, amount: 12300, color: "#EF4444" },
  { name: "Transaction Fees", value: 25, amount: 11000, color: "#10B981" },
  { name: "Chat Transfer Fees", value: 8, amount: 3500, color: "#F59E0B" },
  { name: "Support Revenue", value: 4, amount: 1800, color: "#8B5CF6" },
]

const recentTransactions = [
  {
    id: "1",
    type: "chat_transfer",
    amount: 50.0,
    commission: 1.0,
    user: "John Doe",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    type: "priority_support",
    amount: 0.2,
    commission: 0.2,
    user: "Jane Smith",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "withdrawal",
    amount: 200.0,
    commission: 2.5,
    user: "Mike Johnson",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
]

export default function FinancialOverviewPage() {
  const [timeRange, setTimeRange] = useState("6months")
  const [loading, setLoading] = useState(false)

  const totalRevenue = revenueData.reduce(
    (sum, month) => sum + month.deposits + month.withdrawals + month.chatTransfers + month.supportRevenue,
    0,
  )

  const monthlyGrowth = (((revenueData[5].deposits - revenueData[4].deposits) / revenueData[4].deposits) * 100).toFixed(
    1,
  )

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "chat_transfer":
        return <MessageSquare className="h-4 w-4 text-blue-600" />
      case "priority_support":
        return <CreditCard className="h-4 w-4 text-purple-600" />
      case "withdrawal":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <DollarSign className="h-4 w-4 text-green-600" />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "chat_transfer":
        return "Chat Transfer"
      case "priority_support":
        return "Priority Support"
      case "withdrawal":
        return "Withdrawal"
      default:
        return "Transaction"
    }
  }

  return (
    <>
      <AdminHeader title="Financial Overview" description="Monitor revenue, commissions, and financial performance" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />+{monthlyGrowth}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chat Transfers</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData[5].chatTransfers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Revenue</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${revenueData[5].supportRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Priority support fees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.1%</div>
                <p className="text-xs text-muted-foreground">Average across all fees</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <ChartContainer
                    config={{
                      deposits: { label: "Deposits", color: "#3B82F6" },
                      withdrawals: { label: "Withdrawals", color: "#EF4444" },
                      chatTransfers: { label: "Chat Transfers", color: "#10B981" },
                      supportRevenue: { label: "Support Revenue", color: "#8B5CF6" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="deposits" stroke="#3B82F6" strokeWidth={2} />
                        <Line type="monotone" dataKey="chatTransfers" stroke="#10B981" strokeWidth={2} />
                        <Line type="monotone" dataKey="supportRevenue" stroke="#8B5CF6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionBreakdown.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: { label: "Revenue" },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={commissionBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {commissionBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent High-Value Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.user}</p>
                        <p className="text-sm text-muted-foreground">{getTransactionLabel(transaction.type)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                      <p className="text-sm text-green-600">+${transaction.commission.toFixed(2)} commission</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

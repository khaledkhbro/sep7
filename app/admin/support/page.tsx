"use client"

import { useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { Search, Filter, MessageSquare, Clock, Zap, AlertCircle, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  chatId?: string
  ticketType: "free" | "priority"
  subject: string
  description: string
  priority: "low" | "normal" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  assignedAdminId?: string
  assignedAdminName?: string
  paymentAmount: number
  responseTimeHours: number
  createdAt: Date
  firstResponseAt?: Date
  resolvedAt?: Date
  closedAt?: Date
  unreadMessages: number
}

// Mock data for demonstration
const mockTickets: SupportTicket[] = [
  {
    id: "1",
    userId: "user1",
    userName: "John Doe",
    userEmail: "john@example.com",
    chatId: "chat-123",
    ticketType: "priority",
    subject: "Payment not processing",
    description:
      "My payment keeps failing when trying to withdraw funds from my wallet. I've tried multiple times but it shows an error.",
    priority: "high",
    status: "open",
    paymentAmount: 0.2,
    responseTimeHours: 1,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadMessages: 3,
  },
  {
    id: "2",
    userId: "user2",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    ticketType: "free",
    subject: "Account verification issue",
    description: "Unable to complete account verification process. The upload keeps failing.",
    priority: "normal",
    status: "in_progress",
    assignedAdminId: "admin1",
    assignedAdminName: "Admin Support",
    paymentAmount: 0,
    responseTimeHours: 48,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    firstResponseAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    unreadMessages: 1,
  },
  {
    id: "3",
    userId: "user3",
    userName: "Mike Johnson",
    userEmail: "mike@example.com",
    ticketType: "free",
    subject: "Profile not updating",
    description: "Changes to my profile are not being saved properly.",
    priority: "low",
    status: "resolved",
    assignedAdminId: "admin1",
    assignedAdminName: "Admin Support",
    paymentAmount: 0,
    responseTimeHours: 48,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    firstResponseAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadMessages: 0,
  },
]

export default function AdminSupportPage() {
  const { user: currentAdmin } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [responseMessage, setResponseMessage] = useState("")
  const [isResponding, setIsResponding] = useState(false)

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === "" ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesType = typeFilter === "all" || ticket.ticketType === typeFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const getStatusBadge = (status: SupportTicket["status"]) => {
    const variants = {
      open: "bg-red-100 text-red-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    }

    const icons = {
      open: AlertCircle,
      in_progress: Clock,
      resolved: CheckCircle,
      closed: XCircle,
    }

    const Icon = icons[status]

    return (
      <Badge className={`${variants[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: SupportTicket["priority"]) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }

    return <Badge className={`${colors[priority]} text-xs`}>{priority.toUpperCase()}</Badge>
  }

  const getTypeIcon = (type: SupportTicket["ticketType"]) => {
    return type === "priority" ? (
      <Zap className="h-4 w-4 text-orange-600" />
    ) : (
      <Clock className="h-4 w-4 text-blue-600" />
    )
  }

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowTicketDialog(true)
  }

  const handleStatusUpdate = async (ticketId: string, newStatus: SupportTicket["status"]) => {
    try {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: newStatus,
                assignedAdminId: newStatus === "in_progress" ? currentAdmin?.id : ticket.assignedAdminId,
                assignedAdminName:
                  newStatus === "in_progress"
                    ? `${currentAdmin?.firstName} ${currentAdmin?.lastName}`
                    : ticket.assignedAdminName,
                firstResponseAt:
                  newStatus === "in_progress" && !ticket.firstResponseAt ? new Date() : ticket.firstResponseAt,
                resolvedAt: newStatus === "resolved" ? new Date() : ticket.resolvedAt,
                closedAt: newStatus === "closed" ? new Date() : ticket.closedAt,
              }
            : ticket,
        ),
      )

      toast.success(`Ticket status updated to ${newStatus.replace("_", " ")}`)
    } catch (error) {
      console.error("Error updating ticket status:", error)
      toast.error("Failed to update ticket status")
    }
  }

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return

    setIsResponding(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update ticket status to in_progress if it's open
      if (selectedTicket.status === "open") {
        await handleStatusUpdate(selectedTicket.id, "in_progress")
      }

      // Clear unread messages
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === selectedTicket.id ? { ...ticket, unreadMessages: 0 } : ticket)),
      )

      setResponseMessage("")
      toast.success("Response sent successfully!")

      // In a real app, this would create a chat message or support message
      console.log("[v0] Admin response sent:", responseMessage)
    } catch (error) {
      console.error("Error sending response:", error)
      toast.error("Failed to send response")
    } finally {
      setIsResponding(false)
    }
  }

  // Statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    priority: tickets.filter((t) => t.ticketType === "priority").length,
    unread: tickets.filter((t) => t.unreadMessages > 0).length,
  }

  return (
    <>
      <AdminHeader title="Support Management" description="Manage user support tickets and provide assistance" />

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.open}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Priority Tickets</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.priority}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
                <Badge variant="destructive" className="h-4 w-4 p-0 text-xs">
                  !
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tickets, users, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="free">Free Support</SelectItem>
                    <SelectItem value="priority">Priority Support</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tickets Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No support tickets found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(ticket.ticketType)}
                              <div>
                                <p className="font-medium">{ticket.subject}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">{ticket.description}</p>
                                {ticket.unreadMessages > 0 && (
                                  <Badge variant="destructive" className="text-xs mt-1">
                                    {ticket.unreadMessages} unread
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {ticket.userName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{ticket.userName}</p>
                                <p className="text-xs text-muted-foreground">{ticket.userEmail}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {ticket.ticketType === "priority" ? (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                  Priority (${ticket.paymentAmount.toFixed(2)})
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Free
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleTicketClick(ticket)}>
                                View
                              </Button>
                              {ticket.status === "open" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleStatusUpdate(ticket.id, "in_progress")}
                                >
                                  Take
                                </Button>
                              )}
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

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Ticket Details
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ticket Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedTicket.ticketType)}
                      <span className="font-medium">{selectedTicket.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Created: {formatDistanceToNow(selectedTicket.createdAt, { addSuffix: true })}</p>
                      {selectedTicket.firstResponseAt && (
                        <p>
                          First Response: {formatDistanceToNow(selectedTicket.firstResponseAt, { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {selectedTicket.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedTicket.userName}</p>
                        <p className="text-sm text-muted-foreground">{selectedTicket.userEmail}</p>
                      </div>
                    </div>
                    {selectedTicket.ticketType === "priority" && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Paid ${selectedTicket.paymentAmount.toFixed(2)} for priority support</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ticket Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Issue Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{selectedTicket.description}</p>
                </CardContent>
              </Card>

              {/* Admin Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Response</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Type your response to the user..."
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={4}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value: SupportTicket["status"]) => handleStatusUpdate(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSendResponse} disabled={!responseMessage.trim() || isResponding}>
                      {isResponding ? "Sending..." : "Send Response"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Link */}
              {selectedTicket.chatId && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">This ticket is linked to a chat conversation</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/chat?chatId=${selectedTicket.chatId}`}>View Chat</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

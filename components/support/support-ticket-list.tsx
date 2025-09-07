"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Clock, MessageSquare, Search, Filter, Zap } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "normal" | "high" | "urgent"
  ticketType: "free" | "priority"
  paymentAmount: number
  responseTimeHours: number
  createdAt: Date
  firstResponseAt?: Date
  resolvedAt?: Date
  unreadMessages: number
}

// Mock data for demonstration
const mockTickets: SupportTicket[] = [
  {
    id: "1",
    subject: "Payment not processing",
    description: "My payment keeps failing when trying to withdraw funds",
    status: "in_progress",
    priority: "high",
    ticketType: "priority",
    paymentAmount: 0.2,
    responseTimeHours: 1,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    firstResponseAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    unreadMessages: 2,
  },
  {
    id: "2",
    subject: "Account verification issue",
    description: "Unable to complete account verification process",
    status: "open",
    priority: "normal",
    ticketType: "free",
    paymentAmount: 0,
    responseTimeHours: 48,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    unreadMessages: 0,
  },
  {
    id: "3",
    subject: "Profile not updating",
    description: "Changes to my profile are not being saved",
    status: "resolved",
    priority: "low",
    ticketType: "free",
    paymentAmount: 0,
    responseTimeHours: 48,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    firstResponseAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadMessages: 0,
  },
]

interface SupportTicketListProps {
  onTicketSelect?: (ticketId: string) => void
}

export function SupportTicketList({ onTicketSelect }: SupportTicketListProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const getStatusBadge = (status: SupportTicket["status"]) => {
    const variants = {
      open: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline",
    } as const

    const labels = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    }

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
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

    return (
      <Badge variant="outline" className={`text-xs ${colors[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: SupportTicket["ticketType"]) => {
    return type === "priority" ? (
      <Zap className="h-4 w-4 text-orange-600" />
    ) : (
      <Clock className="h-4 w-4 text-blue-600" />
    )
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === "" ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesType = typeFilter === "all" || ticket.ticketType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <p className="text-muted-foreground">Manage your support requests and track their progress</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tickets..."
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
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No tickets found</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "You haven't created any support tickets yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeIcon(ticket.ticketType)}
                      <h3 className="font-medium truncate">{ticket.subject}</h3>
                      {ticket.unreadMessages > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {ticket.unreadMessages} new
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}

                      {ticket.ticketType === "priority" && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          Priority (${ticket.paymentAmount.toFixed(2)})
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <div className="mb-1">Created {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</div>
                    {ticket.firstResponseAt && (
                      <div className="text-xs">
                        First response {formatDistanceToNow(ticket.firstResponseAt, { addSuffix: true })}
                      </div>
                    )}
                    {ticket.resolvedAt && (
                      <div className="text-xs text-green-600">
                        Resolved {formatDistanceToNow(ticket.resolvedAt, { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </div>

                {onTicketSelect && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTicketSelect(ticket.id)}
                      className="w-full sm:w-auto"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Conversation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

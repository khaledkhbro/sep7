"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreateSupportTicket } from "@/components/support/create-support-ticket"
import { SupportTicketList } from "@/components/support/support-ticket-list"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus, HelpCircle } from "lucide-react"

export default function SupportPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    // Navigate to ticket conversation or open in modal
    console.log("[v0] Opening ticket conversation:", ticketId)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-blue-600" />
            Support Center
          </h1>
          <p className="text-muted-foreground mt-2">Get help with your account, payments, or technical issues</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <CreateSupportTicket onClose={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Support Ticket List */}
      <SupportTicketList onTicketSelect={handleTicketSelect} />
    </div>
  )
}

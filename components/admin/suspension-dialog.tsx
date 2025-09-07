"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface SuspensionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  userName: string
  isLoading?: boolean
}

export function SuspensionDialog({ isOpen, onClose, onConfirm, userName, isLoading = false }: SuspensionDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      onConfirm(reason.trim())
      setReason("")
    }
  }

  const handleClose = () => {
    setReason("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Suspend User Account
          </DialogTitle>
          <DialogDescription>
            You are about to suspend <strong>{userName}</strong>'s account. Please provide a reason that will be shown
            to the user when they try to log in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="suspension-reason">Suspension Reason *</Label>
            <Textarea
              id="suspension-reason"
              placeholder="Enter the reason for suspension (e.g., violation of terms of service, inappropriate behavior, etc.)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
              required
            />
            <p className="text-sm text-gray-500">
              This message will be displayed to the user when they attempt to log in.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isLoading || !reason.trim()}>
              {isLoading ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/hooks/use-notifications"

export function ClearNotifications() {
  const { clearAllNotifications } = useNotifications()

  const handleClear = () => {
    clearAllNotifications()
    // Force page refresh to update the UI
    window.location.reload()
  }

  return (
    <Button onClick={handleClear} variant="outline" size="sm" className="text-xs bg-transparent">
      Clear All Notifications
    </Button>
  )
}

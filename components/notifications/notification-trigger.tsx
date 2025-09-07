"use client"

import { useNotifications } from "@/hooks/use-notifications"
import { Button } from "@/components/ui/button"

export function NotificationTrigger() {
  const { incrementNotification } = useNotifications()

  const triggerTestNotifications = () => {
    // Simulate new activities
    incrementNotification("my-jobs", 2)
    incrementNotification("messages", 1)
    incrementNotification("wallet", 1)
    incrementNotification("seller-orders", 3)
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Test Notifications</h3>
      <p className="text-sm text-gray-600 mb-3">
        Click to simulate new activities and see notification badges appear in the sidebar.
      </p>
      <Button onClick={triggerTestNotifications} size="sm">
        Trigger Test Notifications
      </Button>
    </div>
  )
}

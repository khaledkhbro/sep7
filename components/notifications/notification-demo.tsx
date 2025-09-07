"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNotificationHelpers } from "./notification-helpers"

export function NotificationDemo() {
  const {
    notifyJobSubmission,
    notifyApplicationAccepted,
    notifyServiceOrder,
    notifyNewMessage,
    notifyWalletUpdate,
    notifyNewReferral,
  } = useNotificationHelpers()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Notification System Demo</CardTitle>
        <CardDescription>
          Click these buttons to simulate different types of notifications. Watch the sidebar navigation for red
          notification badges.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={notifyJobSubmission} variant="outline">
            Simulate Job Submission
          </Button>
          <Button onClick={notifyApplicationAccepted} variant="outline">
            Simulate Application Accepted
          </Button>
          <Button onClick={notifyServiceOrder} variant="outline">
            Simulate Service Order
          </Button>
          <Button onClick={notifyNewMessage} variant="outline">
            Simulate New Message
          </Button>
          <Button onClick={notifyWalletUpdate} variant="outline">
            Simulate Wallet Update
          </Button>
          <Button onClick={notifyNewReferral} variant="outline">
            Simulate New Referral
          </Button>
        </div>
        <div className="text-sm text-gray-600 mt-4">
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Notifications are stored in localStorage and persist across sessions</li>
            <li>Red badges appear on sidebar items when there are new notifications</li>
            <li>Badges automatically disappear when you visit that section</li>
            <li>Counts show up to 99, then display "99+" for higher numbers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

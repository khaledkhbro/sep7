"use client"

import { useNotificationContext } from "./notification-provider"

// Helper functions to trigger notifications from anywhere in the app
export function useNotificationHelpers() {
  const { incrementCount, setCount } = useNotificationContext()

  // Job-related notifications
  const notifyJobSubmission = () => {
    console.log("[v0] Triggering job submission notification")
    incrementCount("myJobs")
  }
  const notifyJobRevision = () => {
    console.log("[v0] Triggering job revision notification")
    incrementCount("myJobs")
  }
  const notifyJobStatusChange = () => {
    console.log("[v0] Triggering job status change notification")
    incrementCount("myJobs")
  }

  // Applied jobs notifications
  const notifyApplicationAccepted = () => {
    console.log("[v0] Triggering application accepted notification")
    incrementCount("appliedJobs")
  }
  const notifyApplicationRejected = () => {
    console.log("[v0] Triggering application rejected notification")
    incrementCount("appliedJobs")
  }
  const notifyReworkRequired = () => {
    console.log("[v0] Triggering rework required notification")
    incrementCount("appliedJobs")
  }

  // Service notifications
  const notifyServiceOrder = () => {
    console.log("[v0] Triggering service order notification")
    incrementCount("myServices")
  }
  const notifyServiceAccepted = () => {
    console.log("[v0] Triggering service accepted notification")
    incrementCount("myServices")
  }
  const notifyServiceRejected = () => {
    console.log("[v0] Triggering service rejected notification")
    incrementCount("myServices")
  }

  // Order notifications
  const notifyBuyerOrderUpdate = () => {
    console.log("[v0] Triggering buyer order update notification")
    incrementCount("buyerOrders")
  }
  const notifySellerOrderUpdate = () => {
    console.log("[v0] Triggering seller order update notification")
    incrementCount("sellerOrders")
  }
  const notifyDeliveryProgress = () => {
    console.log("[v0] Triggering delivery progress notification")
    incrementCount("sellerOrders")
  }

  // Message notifications
  const notifyNewMessage = () => {
    console.log("[v0] Triggering new message notification")
    incrementCount("messages")
  }

  // Wallet notifications
  const notifyWalletUpdate = () => {
    console.log("[v0] Triggering wallet update notification")
    incrementCount("wallet")
  }
  const notifyPaymentReceived = () => {
    console.log("[v0] Triggering payment received notification")
    incrementCount("wallet")
  }
  const notifyRefund = () => {
    console.log("[v0] Triggering refund notification")
    incrementCount("wallet")
  }

  // Referral notifications
  const notifyNewReferral = () => {
    console.log("[v0] Triggering new referral notification")
    incrementCount("refer")
  }
  const notifyReferralEarning = () => {
    console.log("[v0] Triggering referral earning notification")
    incrementCount("refer")
  }

  // General notifications
  const notifyGeneral = () => {
    console.log("[v0] Triggering general notification")
    incrementCount("notifications")
  }

  return {
    // Job notifications
    notifyJobSubmission,
    notifyJobRevision,
    notifyJobStatusChange,

    // Applied job notifications
    notifyApplicationAccepted,
    notifyApplicationRejected,
    notifyReworkRequired,

    // Service notifications
    notifyServiceOrder,
    notifyServiceAccepted,
    notifyServiceRejected,

    // Order notifications
    notifyBuyerOrderUpdate,
    notifySellerOrderUpdate,
    notifyDeliveryProgress,

    // Communication notifications
    notifyNewMessage,

    // Financial notifications
    notifyWalletUpdate,
    notifyPaymentReceived,
    notifyRefund,

    // Referral notifications
    notifyNewReferral,
    notifyReferralEarning,

    // General notifications
    notifyGeneral,

    // Direct count management
    setCount,
  }
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Play, RefreshCw } from "lucide-react"

interface TestResult {
  adminSettings: boolean
  cronEndpoint: boolean
  walletTransactions: boolean
  statusUpdates: boolean
  cleanup: boolean
}

export default function TestRefundsPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults(null)
    setLogs([])

    addLog("🧪 Starting Refund System Test Suite...")

    try {
      // Test 1: Admin Settings API
      addLog("📋 Testing Admin Settings API...")
      let adminSettingsPass = false
      try {
        const response = await fetch("/api/admin/revision-settings")
        const settings = await response.json()

        if (settings.enableAutomaticRefunds && settings.refundOnRevisionTimeout && settings.refundOnRejectionTimeout) {
          addLog("✅ Admin settings configured correctly for automatic refunds")
          adminSettingsPass = true
        } else {
          addLog("❌ Admin settings not configured for automatic refunds")
        }
      } catch (error) {
        addLog(`❌ Admin Settings API failed: ${error}`)
      }

      // Test 2: Create test work proofs with expired deadlines
      addLog("🔧 Creating test work proofs with expired deadlines...")
      const testProofs = []

      // Create expired rejection proof
      const expiredRejectionProof = {
        id: `test-rejection-${Date.now()}`,
        jobId: `test-job-${Date.now()}`,
        applicationId: `test-app-${Date.now()}`,
        workerId: "test-worker-1",
        employerId: "test-employer-1",
        title: "Test Work Proof - Expired Rejection",
        description: "Test work proof for rejection timeout testing",
        submissionText: "This is a test submission",
        proofFiles: [],
        proofLinks: [],
        screenshots: [],
        status: "rejected",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        reviewFeedback: "Test rejection for timeout testing",
        paymentAmount: 50.0,
        submissionNumber: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        rejectionDeadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago (expired)
        worker: {
          id: "test-worker-1",
          firstName: "Test",
          lastName: "Worker",
          username: "testworker1",
        },
        employer: {
          id: "test-employer-1",
          firstName: "Test",
          lastName: "Employer",
          username: "testemployer1",
        },
      }

      // Create expired revision proof
      const expiredRevisionProof = {
        id: `test-revision-${Date.now()}`,
        jobId: `test-job-revision-${Date.now()}`,
        applicationId: `test-app-revision-${Date.now()}`,
        workerId: "test-worker-2",
        employerId: "test-employer-2",
        title: "Test Work Proof - Expired Revision",
        description: "Test work proof for revision timeout testing",
        submissionText: "This is a test submission for revision",
        proofFiles: [],
        proofLinks: [],
        screenshots: [],
        status: "revision_requested",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        reviewFeedback: "Test revision request for timeout testing",
        paymentAmount: 75.0,
        submissionNumber: 1,
        revisionCount: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        revisionDeadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago (expired)
        worker: {
          id: "test-worker-2",
          firstName: "Test",
          lastName: "Worker2",
          username: "testworker2",
        },
        employer: {
          id: "test-employer-2",
          firstName: "Test",
          lastName: "Employer2",
          username: "testemployer2",
        },
      }

      testProofs.push(expiredRejectionProof, expiredRevisionProof)

      // Add to localStorage
      const existingProofs = JSON.parse(localStorage.getItem("marketplace-work-proofs") || "[]")
      const allProofs = [...existingProofs, ...testProofs]
      localStorage.setItem("marketplace-work-proofs", JSON.stringify(allProofs))

      addLog(`✅ Created ${testProofs.length} test work proofs with expired deadlines`)

      // Test 3: Test cron endpoint via secure API
      addLog("⏰ Testing cron job endpoint...")
      let cronEndpointPass = false
      let processedCount = 0

      try {
        const response = await fetch("/api/test-cron", {
          method: "GET",
        })

        const result = await response.json()
        processedCount = result.cronResponse?.processedCount || 0

        if (response.ok && result.success) {
          addLog(`✅ Cron endpoint processed ${processedCount} expired deadlines`)
          cronEndpointPass = true
        } else {
          addLog(`❌ Cron endpoint failed: ${result.error || result.cronResponse?.details}`)
        }
      } catch (error) {
        addLog(`❌ Cron endpoint test failed: ${error}`)
      }

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Test 4: Verify wallet transactions
      addLog("💰 Verifying wallet transactions...")
      let walletTransactionsPass = false

      try {
        const transactions = JSON.parse(localStorage.getItem("wallet_transactions") || "[]")
        let refundCount = 0

        for (const proof of testProofs) {
          const refundTransaction = transactions.find(
            (t: any) => t.referenceId === proof.id && t.type === "refund" && t.status === "completed",
          )

          if (refundTransaction) {
            refundCount++
            addLog(`✅ Found refund transaction for proof ${proof.id}: $${refundTransaction.amount}`)
          } else {
            addLog(`❌ Missing refund transaction for proof ${proof.id}`)
          }
        }

        walletTransactionsPass = refundCount === testProofs.length
        addLog(`📊 Refunds processed: ${refundCount}/${testProofs.length}`)
      } catch (error) {
        addLog(`❌ Wallet transaction verification failed: ${error}`)
      }

      // Test 5: Verify status updates
      addLog("📋 Verifying work proof status updates...")
      let statusUpdatesPass = false

      try {
        const currentProofs = JSON.parse(localStorage.getItem("marketplace-work-proofs") || "[]")
        let updatedCount = 0

        for (const testProof of testProofs) {
          const currentProof = currentProofs.find((p: any) => p.id === testProof.id)

          if (currentProof) {
            const expectedStatus = testProof.status === "rejected" ? "rejected_accepted" : "cancelled_by_worker"

            if (currentProof.status === expectedStatus) {
              updatedCount++
              addLog(`✅ Proof ${testProof.id} status updated to: ${currentProof.status}`)
            } else {
              addLog(
                `❌ Proof ${testProof.id} status not updated. Expected: ${expectedStatus}, Got: ${currentProof.status}`,
              )
            }
          }
        }

        statusUpdatesPass = updatedCount === testProofs.length
        addLog(`📊 Status updates: ${updatedCount}/${testProofs.length}`)
      } catch (error) {
        addLog(`❌ Status update verification failed: ${error}`)
      }

      // Test 6: Cleanup
      addLog("🧹 Cleaning up test data...")
      let cleanupPass = false

      try {
        // Remove test proofs
        const currentProofs = JSON.parse(localStorage.getItem("marketplace-work-proofs") || "[]")
        const testProofIds = testProofs.map((p) => p.id)
        const cleanedProofs = currentProofs.filter((p: any) => !testProofIds.includes(p.id))
        localStorage.setItem("marketplace-work-proofs", JSON.stringify(cleanedProofs))

        // Remove test transactions
        const transactions = JSON.parse(localStorage.getItem("wallet_transactions") || "[]")
        const cleanedTransactions = transactions.filter((t: any) => !testProofIds.includes(t.referenceId))
        localStorage.setItem("wallet_transactions", JSON.stringify(cleanedTransactions))

        addLog(`✅ Cleaned up ${testProofs.length} test work proofs and transactions`)
        cleanupPass = true
      } catch (error) {
        addLog(`❌ Cleanup failed: ${error}`)
      }

      // Set final results
      const finalResults: TestResult = {
        adminSettings: adminSettingsPass,
        cronEndpoint: cronEndpointPass,
        walletTransactions: walletTransactionsPass,
        statusUpdates: statusUpdatesPass,
        cleanup: cleanupPass,
      }

      setResults(finalResults)

      const passedTests = Object.values(finalResults).filter(Boolean).length
      const totalTests = Object.keys(finalResults).length

      if (passedTests === totalTests) {
        addLog("🎉 All tests passed! Refund system is working correctly.")
      } else {
        addLog(`⚠️ ${passedTests}/${totalTests} tests passed. Please check the refund system configuration.`)
      }
    } catch (error) {
      addLog(`❌ Test suite failed: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Clock className="h-4 w-4 text-gray-400" />
    return status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="secondary">Pending</Badge>
    return status ? (
      <Badge variant="default" className="bg-green-600">
        Pass
      </Badge>
    ) : (
      <Badge variant="destructive">Fail</Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Refund System Test Suite</h1>
        <p className="text-gray-600">
          Comprehensive testing of the automatic refund processing system to ensure expired deadlines trigger proper
          refunds.
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={runTests} disabled={isRunning} size="lg" className="w-full sm:w-auto">
          {isRunning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Refund System Tests
            </>
          )}
        </Button>
      </div>

      {results && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {Object.values(results).filter(Boolean).length}/{Object.keys(results).length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.adminSettings)}
                  <span>Admin Settings API</span>
                </div>
                {getStatusBadge(results.adminSettings)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.cronEndpoint)}
                  <span>Cron Job Endpoint</span>
                </div>
                {getStatusBadge(results.cronEndpoint)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.walletTransactions)}
                  <span>Wallet Transactions</span>
                </div>
                {getStatusBadge(results.walletTransactions)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.statusUpdates)}
                  <span>Status Updates</span>
                </div>
                {getStatusBadge(results.statusUpdates)}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.cleanup)}
                  <span>Data Cleanup</span>
                </div>
                {getStatusBadge(results.cleanup)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
          <CardDescription>Detailed logs from the test execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">No logs yet. Run the tests to see detailed output.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

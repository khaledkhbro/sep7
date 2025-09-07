// Test script to verify automatic refund processing system
// This script tests the entire refund flow to ensure deadlines trigger proper refunds

console.log("🧪 Starting Refund System Test Suite...")
console.log("=".repeat(50))

// Test 1: Verify Admin Settings API
async function testAdminSettingsAPI() {
  console.log("\n📋 Test 1: Admin Settings API")
  console.log("-".repeat(30))

  try {
    const response = await fetch("/api/admin/revision-settings")
    const settings = await response.json()

    console.log("✅ Admin Settings API Response:", response.status)
    console.log("📊 Settings loaded:", {
      enableAutomaticRefunds: settings.enableAutomaticRefunds,
      refundOnRevisionTimeout: settings.refundOnRevisionTimeout,
      refundOnRejectionTimeout: settings.refundOnRejectionTimeout,
    })

    if (settings.enableAutomaticRefunds && settings.refundOnRevisionTimeout && settings.refundOnRejectionTimeout) {
      console.log("✅ Admin settings configured correctly for automatic refunds")
      return true
    } else {
      console.log("❌ Admin settings not configured for automatic refunds")
      return false
    }
  } catch (error) {
    console.error("❌ Admin Settings API failed:", error)
    return false
  }
}

// Test 2: Create Test Work Proofs with Expired Deadlines
async function createTestWorkProofs() {
  console.log("\n🔧 Test 2: Creating Test Work Proofs")
  console.log("-".repeat(30))

  try {
    // Import work proof functions
    const { getStoredWorkProofs, saveWorkProofs } = await import("../lib/work-proofs.js")

    const existingProofs = getStoredWorkProofs()
    const testProofs = []

    // Create test proof with expired rejection deadline
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
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      reviewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
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

    // Create test proof with expired revision deadline
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

    // Add test proofs to storage
    const allProofs = [...existingProofs, ...testProofs]
    saveWorkProofs(allProofs)

    console.log("✅ Created test work proofs:")
    console.log(`   - Expired rejection proof: ${expiredRejectionProof.id}`)
    console.log(`   - Expired revision proof: ${expiredRevisionProof.id}`)

    return testProofs
  } catch (error) {
    console.error("❌ Failed to create test work proofs:", error)
    return []
  }
}

// Test 3: Test Cron Job Endpoint
async function testCronEndpoint() {
  console.log("\n⏰ Test 3: Cron Job Endpoint")
  console.log("-".repeat(30))

  try {
    const cronSecret = process.env.CRON_SECRET || "test-secret"
    console.log("🔑 Using CRON_SECRET:", cronSecret ? "SET" : "NOT SET")

    const response = await fetch("/api/cron/process-work-proof-timeouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    console.log("📊 Cron endpoint response:", response.status)
    console.log("📋 Processing result:", {
      success: result.success,
      processedCount: result.processedCount,
      settings: result.settings,
    })

    if (response.ok && result.success) {
      console.log("✅ Cron endpoint working correctly")
      console.log(`✅ Processed ${result.processedCount} expired deadlines`)
      return result.processedCount
    } else {
      console.log("❌ Cron endpoint failed:", result.error || result.details)
      return 0
    }
  } catch (error) {
    console.error("❌ Cron endpoint test failed:", error)
    return 0
  }
}

// Test 4: Verify Wallet Transactions
async function verifyWalletTransactions(testProofs) {
  console.log("\n💰 Test 4: Wallet Transaction Verification")
  console.log("-".repeat(30))

  try {
    // Check if refund transactions were created
    const transactions = JSON.parse(localStorage.getItem("wallet_transactions") || "[]")

    let refundCount = 0
    let totalRefundAmount = 0

    for (const proof of testProofs) {
      const refundTransaction = transactions.find(
        (t) => t.referenceId === proof.id && t.type === "refund" && t.status === "completed",
      )

      if (refundTransaction) {
        refundCount++
        totalRefundAmount += refundTransaction.amount
        console.log(`✅ Found refund transaction for proof ${proof.id}: $${refundTransaction.amount}`)
      } else {
        console.log(`❌ Missing refund transaction for proof ${proof.id}`)
      }
    }

    console.log(`📊 Refund Summary:`)
    console.log(`   - Refunds processed: ${refundCount}/${testProofs.length}`)
    console.log(`   - Total refund amount: $${totalRefundAmount.toFixed(2)}`)

    return refundCount === testProofs.length
  } catch (error) {
    console.error("❌ Wallet transaction verification failed:", error)
    return false
  }
}

// Test 5: Verify Work Proof Status Updates
async function verifyWorkProofUpdates(testProofs) {
  console.log("\n📋 Test 5: Work Proof Status Updates")
  console.log("-".repeat(30))

  try {
    const { getStoredWorkProofs } = await import("../lib/work-proofs.js")
    const currentProofs = getStoredWorkProofs()

    let updatedCount = 0

    for (const testProof of testProofs) {
      const currentProof = currentProofs.find((p) => p.id === testProof.id)

      if (currentProof) {
        const expectedStatus = testProof.status === "rejected" ? "rejected_accepted" : "cancelled_by_worker"

        if (currentProof.status === expectedStatus) {
          updatedCount++
          console.log(`✅ Proof ${testProof.id} status updated to: ${currentProof.status}`)
        } else {
          console.log(
            `❌ Proof ${testProof.id} status not updated. Expected: ${expectedStatus}, Got: ${currentProof.status}`,
          )
        }
      } else {
        console.log(`❌ Test proof ${testProof.id} not found in current proofs`)
      }
    }

    console.log(`📊 Status Update Summary: ${updatedCount}/${testProofs.length} proofs updated correctly`)

    return updatedCount === testProofs.length
  } catch (error) {
    console.error("❌ Work proof status verification failed:", error)
    return false
  }
}

// Test 6: Clean Up Test Data
async function cleanupTestData(testProofs) {
  console.log("\n🧹 Test 6: Cleanup Test Data")
  console.log("-".repeat(30))

  try {
    // Remove test work proofs
    const { getStoredWorkProofs, saveWorkProofs } = await import("../lib/work-proofs.js")
    const currentProofs = getStoredWorkProofs()
    const testProofIds = testProofs.map((p) => p.id)
    const cleanedProofs = currentProofs.filter((p) => !testProofIds.includes(p.id))
    saveWorkProofs(cleanedProofs)

    // Remove test wallet transactions
    const transactions = JSON.parse(localStorage.getItem("wallet_transactions") || "[]")
    const cleanedTransactions = transactions.filter((t) => !testProofIds.includes(t.referenceId))
    localStorage.setItem("wallet_transactions", JSON.stringify(cleanedTransactions))

    console.log(`✅ Cleaned up ${testProofs.length} test work proofs`)
    console.log(`✅ Cleaned up test wallet transactions`)

    return true
  } catch (error) {
    console.error("❌ Cleanup failed:", error)
    return false
  }
}

// Main Test Runner
async function runRefundSystemTests() {
  console.log("🚀 Running Comprehensive Refund System Tests")
  console.log("=".repeat(50))

  const results = {
    adminSettings: false,
    cronEndpoint: false,
    walletTransactions: false,
    statusUpdates: false,
    cleanup: false,
  }

  try {
    // Test 1: Admin Settings
    results.adminSettings = await testAdminSettingsAPI()

    // Test 2: Create test data
    const testProofs = await createTestWorkProofs()

    if (testProofs.length === 0) {
      console.log("❌ Cannot continue tests - failed to create test data")
      return results
    }

    // Test 3: Run cron job
    const processedCount = await testCronEndpoint()
    results.cronEndpoint = processedCount > 0

    // Wait a moment for processing to complete
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Test 4: Verify wallet transactions
    results.walletTransactions = await verifyWalletTransactions(testProofs)

    // Test 5: Verify work proof updates
    results.statusUpdates = await verifyWorkProofUpdates(testProofs)

    // Test 6: Cleanup
    results.cleanup = await cleanupTestData(testProofs)
  } catch (error) {
    console.error("❌ Test suite failed:", error)
  }

  // Print final results
  console.log("\n🏁 Final Test Results")
  console.log("=".repeat(50))

  const testNames = {
    adminSettings: "Admin Settings API",
    cronEndpoint: "Cron Job Endpoint",
    walletTransactions: "Wallet Transactions",
    statusUpdates: "Status Updates",
    cleanup: "Data Cleanup",
  }

  let passedTests = 0
  const totalTests = Object.keys(results).length

  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? "✅ PASS" : "❌ FAIL"
    console.log(`${status} ${testNames[key]}`)
    if (passed) passedTests++
  }

  console.log("-".repeat(50))
  console.log(`📊 Overall Result: ${passedTests}/${totalTests} tests passed`)

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Refund system is working correctly.")
  } else {
    console.log("⚠️  Some tests failed. Please check the refund system configuration.")
  }

  return results
}

// Export for use in browser console or Node.js
if (typeof window !== "undefined") {
  // Browser environment
  window.testRefundSystem = runRefundSystemTests
  console.log("💡 Run 'testRefundSystem()' in the browser console to test the refund system")
} else {
  // Node.js environment
  module.exports = { runRefundSystemTests }
}

// Auto-run if this script is executed directly
if (typeof window !== "undefined" && window.location.pathname.includes("test")) {
  runRefundSystemTests()
}

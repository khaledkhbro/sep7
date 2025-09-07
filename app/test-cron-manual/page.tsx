"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestCronPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const triggerCron = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-cron-now", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Cron Job Test</CardTitle>
          <CardDescription>Test the automatic refund processing system manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={triggerCron} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Trigger Cron Job Now"}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

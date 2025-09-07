"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getJobStatusHistory, getJobStatusColor, getJobStatusLabel, type JobStatusHistory } from "@/lib/jobs"
import { Clock, User, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface JobStatusTimelineProps {
  jobId: string
}

export function JobStatusTimeline({ jobId }: JobStatusTimelineProps) {
  const [statusHistory, setStatusHistory] = useState<JobStatusHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatusHistory = async () => {
      try {
        const history = await getJobStatusHistory(jobId)
        setStatusHistory(history)
      } catch (error) {
        console.error("Failed to load status history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStatusHistory()
  }, [jobId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Status Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusHistory.length > 0 ? (
          <div className="space-y-4">
            {statusHistory.map((entry, index) => (
              <div key={entry.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`}></div>
                  {index < statusHistory.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={getJobStatusColor(entry.newStatus)} size="sm">
                      {getJobStatusLabel(entry.newStatus)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {entry.oldStatus && (
                    <p className="text-sm text-gray-600 mb-1">
                      Changed from <span className="font-medium">{getJobStatusLabel(entry.oldStatus)}</span>
                    </p>
                  )}
                  {entry.notes && <p className="text-sm text-gray-700 mb-2">{entry.notes}</p>}
                  {entry.userId && (
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="mr-1 h-3 w-3" />
                      Updated by user {entry.userId}
                    </div>
                  )}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center mb-1">
                        <FileText className="mr-1 h-3 w-3" />
                        Additional Details:
                      </div>
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <div key={key} className="text-gray-600">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No status history available</p>
        )}
      </CardContent>
    </Card>
  )
}

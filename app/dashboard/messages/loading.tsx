import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="h-screen flex">
      {/* Chat List Skeleton */}
      <div className="w-80 border-r bg-card/30 p-4">
        <div className="mb-6">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-64" : "w-48"}`} />
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

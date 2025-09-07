export default function EarningsNewsLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="text-center space-y-2">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
      </div>

      {/* Stats Banner Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* News Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex space-x-2">
          <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

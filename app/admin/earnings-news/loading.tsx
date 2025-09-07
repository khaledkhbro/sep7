export default function AdminEarningsNewsLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* News List Skeleton */}
      <div className="border rounded-lg p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="flex space-x-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

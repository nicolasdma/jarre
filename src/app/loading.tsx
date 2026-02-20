export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-j-bg">
      {/* Header placeholder */}
      <div className="border-b border-j-border px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="h-5 w-20 bg-j-border animate-pulse" />
          <div className="flex gap-6">
            <div className="h-4 w-16 bg-j-border animate-pulse" />
            <div className="h-4 w-16 bg-j-border animate-pulse" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 py-12">
        {/* Engagement bar skeleton */}
        <div className="flex items-center gap-6 mb-8 p-4 border border-j-border">
          <div className="h-8 w-20 bg-j-border animate-pulse" />
          <div className="h-2 flex-1 bg-j-border animate-pulse" />
          <div className="h-8 w-16 bg-j-border animate-pulse" />
        </div>

        {/* Session CTA skeleton */}
        <div className="mb-12 border border-j-border p-6">
          <div className="h-5 w-48 bg-j-border animate-pulse mb-3" />
          <div className="h-4 w-72 bg-j-border animate-pulse mb-4" />
          <div className="h-10 w-36 bg-j-border animate-pulse" />
        </div>

        {/* Hero skeleton */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-j-border" />
            <div className="h-3 w-44 bg-j-border animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-j-border animate-pulse mb-1" />
          <div className="h-7 w-56 bg-j-border animate-pulse" />
          <div className="h-4 w-80 bg-j-border animate-pulse mt-4" />
          <div className="flex gap-4 mt-6">
            <div className="h-10 w-36 bg-j-border animate-pulse" />
            <div className="h-10 w-36 bg-j-border animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat-skeleton-${i}`} className="text-center">
              <div className="h-10 w-12 bg-j-border animate-pulse mx-auto mb-2" />
              <div className="h-3 w-24 bg-j-border animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Mastery levels skeleton */}
        <div className="mb-12">
          <div className="h-3 w-36 bg-j-border animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`mastery-skeleton-${i}`} className="border border-j-border p-4 text-center">
                <div className="h-7 w-8 bg-j-border animate-pulse mx-auto mb-2" />
                <div className="h-3 w-16 bg-j-border animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

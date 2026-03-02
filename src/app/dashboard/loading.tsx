export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-j-bg">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16">
        {/* Hero skeleton */}
        <div className="mb-12">
          <div className="h-3 w-28 bg-j-border/60 rounded mb-4 animate-pulse" />
          <div className="h-10 sm:h-14 w-3/4 bg-j-border/60 rounded mb-2 animate-pulse" />
          <div className="h-6 w-1/2 bg-j-border/40 rounded animate-pulse" />
        </div>

        {/* Input skeleton */}
        <div className="mb-12">
          <div className="h-14 w-full bg-j-border/40 rounded-full animate-pulse" />
        </div>

        {/* Section label skeleton */}
        <div className="mb-6">
          <div className="h-3 w-20 bg-j-border/40 rounded animate-pulse" />
        </div>

        {/* Card grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-j-border bg-j-surface"
            >
              <div className="aspect-video bg-j-border/30 animate-pulse" />
              <div className="p-4 pb-3">
                <div className="h-4 w-3/4 bg-j-border/50 rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-j-border/30 rounded animate-pulse mb-1" />
                <div className="h-3 w-2/3 bg-j-border/30 rounded animate-pulse mb-3" />
                <div className="flex gap-2">
                  <div className="h-2.5 w-16 bg-j-border/30 rounded animate-pulse" />
                  <div className="h-2.5 w-12 bg-j-border/30 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

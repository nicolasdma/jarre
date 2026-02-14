export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-j-bg">
      {/* Header placeholder */}
      <div className="border-b border-j-border px-8 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="h-5 w-20 bg-j-border animate-pulse" />
          <div className="flex gap-6">
            <div className="h-4 w-16 bg-j-border animate-pulse" />
            <div className="h-4 w-16 bg-j-border animate-pulse" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-8 py-12">
        {/* Title skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-j-border" />
            <div className="h-3 w-12 bg-j-border animate-pulse" />
          </div>
          <div className="h-9 w-56 bg-j-border animate-pulse mb-2" />
          <div className="h-4 w-72 bg-j-border animate-pulse" />
        </div>

        {/* Review card skeleton */}
        <div className="border border-j-border p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 w-32 bg-j-border animate-pulse" />
            <div className="h-4 w-20 bg-j-border animate-pulse" />
          </div>

          <div className="space-y-4 mb-8">
            <div className="h-4 w-full bg-j-border animate-pulse" />
            <div className="h-4 w-5/6 bg-j-border animate-pulse" />
            <div className="h-4 w-3/4 bg-j-border animate-pulse" />
          </div>

          <div className="h-24 w-full bg-j-border animate-pulse mb-6" />

          <div className="flex justify-end gap-4">
            <div className="h-10 w-24 bg-j-border animate-pulse" />
            <div className="h-10 w-24 bg-j-border animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}

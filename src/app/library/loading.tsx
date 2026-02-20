export default function LibraryLoading() {
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
        {/* Hero skeleton */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-j-border" />
            <div className="h-3 w-32 bg-j-border animate-pulse" />
          </div>
          <div className="h-10 w-48 bg-j-border animate-pulse mb-2" />
          <div className="h-7 w-64 bg-j-border animate-pulse" />
          <div className="h-4 w-96 bg-j-border animate-pulse mt-6" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`stat-skeleton-${i}`} className="text-center">
              <div className="h-10 w-12 bg-j-border animate-pulse mx-auto mb-2" />
              <div className="h-3 w-20 bg-j-border animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Phase skeleton */}
        {Array.from({ length: 2 }).map((_, phaseIdx) => (
          <section key={`phase-skeleton-${phaseIdx}`} className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 bg-j-border animate-pulse" />
              <div>
                <div className="h-5 w-40 bg-j-border animate-pulse mb-2" />
                <div className="h-3 w-24 bg-j-border animate-pulse" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, cardIdx) => (
                <div
                  key={`card-skeleton-${cardIdx}`}
                  className="border border-j-border p-6"
                >
                  <div className="h-4 w-3/4 bg-j-border animate-pulse mb-3" />
                  <div className="h-3 w-1/2 bg-j-border animate-pulse mb-4" />
                  <div className="h-3 w-full bg-j-border animate-pulse mb-2" />
                  <div className="h-3 w-2/3 bg-j-border animate-pulse" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

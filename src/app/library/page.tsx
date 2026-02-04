import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Resource type badge colors
const typeColors: Record<string, string> = {
  book: 'bg-amber-100 text-amber-800',
  paper: 'bg-blue-100 text-blue-800',
  video: 'bg-red-100 text-red-800',
  course: 'bg-green-100 text-green-800',
  article: 'bg-purple-100 text-purple-800',
};

// Phase names
const phaseNames: Record<string, string> = {
  '1': 'Distributed Systems',
  '2': 'LLMs + Reasoning',
  '3': 'RAG + Memory',
  '4': 'Safety + Guardrails',
  '5': 'Inference + Economics',
  '6': 'Frameworks',
};

export default async function LibraryPage() {
  const supabase = await createClient();

  // Fetch all resources grouped by phase
  const { data: resources, error } = await supabase
    .from('resources')
    .select('*')
    .order('phase')
    .order('title');

  if (error) {
    console.error('Error fetching resources:', error);
    return (
      <div className="min-h-screen bg-stone-50 p-8">
        <p className="text-red-600">Error loading resources: {error.message}</p>
      </div>
    );
  }

  // Group by phase
  type Resource = NonNullable<typeof resources>[number];
  const byPhase: Record<string, Resource[]> = {};

  if (resources) {
    for (const resource of resources) {
      const phase = resource.phase;
      if (!byPhase[phase]) byPhase[phase] = [];
      byPhase[phase].push(resource);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-stone-900">
              Jarre
            </Link>
            <nav className="flex gap-4">
              <Link href="/library" className="text-sm font-medium text-stone-900">
                Library
              </Link>
              <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Library</h1>
          <p className="mt-2 text-stone-600">
            {resources?.length || 0} resources across 6 phases
          </p>
        </div>

        {/* Resources by phase */}
        {Object.entries(byPhase).map(([phase, phaseResources]) => (
          <section key={phase} className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
                {phase}
              </span>
              <h2 className="text-xl font-semibold text-stone-900">
                {phaseNames[phase] || `Phase ${phase}`}
              </h2>
              <span className="text-sm text-stone-500">
                ({phaseResources.length} resources)
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {phaseResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">
                        {resource.title}
                      </CardTitle>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[resource.type] || 'bg-stone-100 text-stone-800'}`}
                      >
                        {resource.type}
                      </span>
                    </div>
                    {resource.author && (
                      <CardDescription>{resource.author}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {resource.description && (
                      <p className="mb-3 text-sm text-stone-600 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {resource.estimated_hours && (
                        <span>{resource.estimated_hours}h estimated</span>
                      )}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open →
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';

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

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all resources with their prerequisite concepts
  const { data: resources, error } = await supabase
    .from('resources')
    .select(`
      *,
      resource_concepts!inner (
        concept_id,
        is_prerequisite
      )
    `)
    .order('phase')
    .order('title');

  if (error) {
    console.error('Error fetching resources:', error);
    return (
      <div className="min-h-screen bg-stone-50">
        <Header currentPage="library" />
        <main className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-red-600">Error loading resources: {error.message}</p>
        </main>
      </div>
    );
  }

  // Get user's concept progress (if logged in)
  let userProgress: Record<string, number> = {};
  if (user) {
    const { data: progress } = await supabase
      .from('concept_progress')
      .select('concept_id, level')
      .eq('user_id', user.id);

    if (progress) {
      userProgress = progress.reduce(
        (acc, p) => {
          acc[p.concept_id] = parseInt(p.level);
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  // Process resources to determine unlock status
  type ResourceWithStatus = NonNullable<typeof resources>[number] & {
    isUnlocked: boolean;
    missingPrerequisites: string[];
    conceptsTaught: string[];
  };

  const resourcesWithStatus: ResourceWithStatus[] = (resources || []).map((resource) => {
    const prerequisites = resource.resource_concepts
      .filter((rc: { is_prerequisite: boolean }) => rc.is_prerequisite)
      .map((rc: { concept_id: string }) => rc.concept_id);

    const conceptsTaught = resource.resource_concepts
      .filter((rc: { is_prerequisite: boolean }) => !rc.is_prerequisite)
      .map((rc: { concept_id: string }) => rc.concept_id);

    // A resource is unlocked if:
    // 1. User is not logged in (show all as available for browsing)
    // 2. User has no prerequisites for this resource
    // 3. User has level >= 1 on all prerequisites
    const missingPrerequisites = prerequisites.filter(
      (prereqId: string) => (userProgress[prereqId] || 0) < 1
    );

    const isUnlocked = !user || prerequisites.length === 0 || missingPrerequisites.length === 0;

    return {
      ...resource,
      isUnlocked,
      missingPrerequisites,
      conceptsTaught,
    };
  });

  // Group by phase
  const byPhase: Record<string, ResourceWithStatus[]> = {};
  for (const resource of resourcesWithStatus) {
    const phase = resource.phase;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(resource);
  }

  // Calculate phase stats
  const phaseStats = Object.entries(byPhase).map(([phase, phaseResources]) => {
    const unlocked = phaseResources.filter((r) => r.isUnlocked).length;
    const total = phaseResources.length;
    return { phase, unlocked, total };
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Library</h1>
          <p className="mt-2 text-stone-600">
            {resources?.length || 0} resources across 6 phases
            {user && (
              <span className="ml-2 text-green-600">
                • {resourcesWithStatus.filter((r) => r.isUnlocked).length} unlocked
              </span>
            )}
          </p>
          {!user && (
            <p className="mt-2 text-sm text-amber-600">
              <Link href="/login" className="underline">
                Sign in
              </Link>{' '}
              to track your progress and see personalized unlock status.
            </p>
          )}
        </div>

        {/* Phase Progress Overview */}
        {user && (
          <div className="mb-8 grid grid-cols-6 gap-2">
            {phaseStats.map(({ phase, unlocked, total }) => (
              <div
                key={phase}
                className="rounded-lg border border-stone-200 bg-white p-3 text-center"
              >
                <p className="text-xs text-stone-500">Phase {phase}</p>
                <p className="text-lg font-bold text-stone-900">
                  {unlocked}/{total}
                </p>
              </div>
            ))}
          </div>
        )}

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
                <Card
                  key={resource.id}
                  className={`transition-shadow ${
                    resource.isUnlocked
                      ? 'hover:shadow-md'
                      : 'opacity-60 bg-stone-50'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {user && (
                          <span
                            className={`text-lg ${
                              resource.isUnlocked ? 'text-green-500' : 'text-stone-400'
                            }`}
                            title={
                              resource.isUnlocked
                                ? 'Unlocked - prerequisites met'
                                : `Locked - need: ${resource.missingPrerequisites.join(', ')}`
                            }
                          >
                            {resource.isUnlocked ? '●' : '○'}
                          </span>
                        )}
                        <CardTitle className="text-base leading-tight">
                          {resource.title}
                        </CardTitle>
                      </div>
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

                    {/* Missing prerequisites */}
                    {user && !resource.isUnlocked && resource.missingPrerequisites.length > 0 && (
                      <p className="mb-3 text-xs text-amber-600">
                        Requires: {resource.missingPrerequisites.slice(0, 3).join(', ')}
                        {resource.missingPrerequisites.length > 3 &&
                          ` +${resource.missingPrerequisites.length - 3} more`}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-stone-500">
                      {resource.estimated_hours && (
                        <span>{resource.estimated_hours}h estimated</span>
                      )}
                      {resource.url && resource.isUnlocked && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Open →
                        </a>
                      )}
                      {resource.isUnlocked && (
                        <Link
                          href={`/evaluate/${resource.id}`}
                          className="ml-auto text-green-600 hover:underline"
                        >
                          Evaluate →
                        </Link>
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

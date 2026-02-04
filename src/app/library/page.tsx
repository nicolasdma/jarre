import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/header';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';

export default async function LibraryPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get language preference
  let lang: Language = 'es';
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;
  }

  const phaseNames = getPhaseNames(lang);

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
          <p className="text-red-600">{t('common.error', lang)}: {error.message}</p>
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

  // Get evaluation stats per resource (if logged in)
  type EvalStats = {
    resourceId: string;
    bestScore: number;
    lastEvaluatedAt: string;
    evalCount: number;
  };
  let evaluationStats: Record<string, EvalStats> = {};

  if (user) {
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('resource_id, overall_score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (evaluations) {
      // Group by resource and calculate stats
      const byResource: Record<string, typeof evaluations> = {};
      for (const e of evaluations) {
        if (!byResource[e.resource_id]) byResource[e.resource_id] = [];
        byResource[e.resource_id].push(e);
      }

      for (const [resourceId, evals] of Object.entries(byResource)) {
        const bestScore = Math.max(...evals.map(e => e.overall_score));
        const lastEvaluatedAt = evals[0].completed_at; // Already sorted desc
        evaluationStats[resourceId] = {
          resourceId,
          bestScore,
          lastEvaluatedAt,
          evalCount: evals.length,
        };
      }
    }
  }

  // Process resources to determine unlock status
  type ResourceWithStatus = NonNullable<typeof resources>[number] & {
    isUnlocked: boolean;
    missingPrerequisites: string[];
    conceptsTaught: string[];
    evalStats: EvalStats | null;
  };

  const resourcesWithStatus: ResourceWithStatus[] = (resources || []).map((resource) => {
    const prerequisites = resource.resource_concepts
      .filter((rc: { is_prerequisite: boolean }) => rc.is_prerequisite)
      .map((rc: { concept_id: string }) => rc.concept_id);

    const conceptsTaught = resource.resource_concepts
      .filter((rc: { is_prerequisite: boolean }) => !rc.is_prerequisite)
      .map((rc: { concept_id: string }) => rc.concept_id);

    const missingPrerequisites = prerequisites.filter(
      (prereqId: string) => (userProgress[prereqId] || 0) < 1
    );

    const isUnlocked = !user || prerequisites.length === 0 || missingPrerequisites.length === 0;

    return {
      ...resource,
      isUnlocked,
      missingPrerequisites,
      conceptsTaught,
      evalStats: evaluationStats[resource.id] || null,
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
    const evaluated = phaseResources.filter((r) => r.evalStats !== null).length;
    const total = phaseResources.length;
    return { phase, unlocked, evaluated, total };
  });

  const totalEvaluated = resourcesWithStatus.filter(r => r.evalStats !== null).length;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">{t('library.title', lang)}</h1>
          <p className="mt-2 text-stone-600">
            {resources?.length || 0} {t('library.resources', lang)} {t('common.across', lang)} 6 {t('common.phases', lang)}
          </p>
          {user && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>
                {resourcesWithStatus.filter((r) => r.isUnlocked).length} {t('library.unlocked', lang).toLowerCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                {totalEvaluated} {t('library.evaluated', lang)}
              </span>
            </div>
          )}
          {!user && (
            <p className="mt-3 text-sm text-amber-600">
              <Link href="/login" className="underline hover:text-amber-700">
                {t('common.signin', lang)}
              </Link>{' '}
              {t('library.signInPrompt', lang)}
            </p>
          )}
        </div>

        {/* Phase Progress Overview */}
        {user && (
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {phaseStats.map(({ phase, unlocked, evaluated, total }) => {
              const progress = total > 0 ? Math.round((evaluated / total) * 100) : 0;
              return (
                <div
                  key={phase}
                  className="relative overflow-hidden rounded-xl border border-stone-200 bg-white p-4"
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-green-50 to-green-100 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="relative">
                    <p className="text-xs font-medium text-stone-500">{t('resource.phase', lang)} {phase}</p>
                    <p className="mt-1 text-lg font-bold text-stone-900">
                      {evaluated}<span className="text-stone-400">/{total}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {t('library.evaluated', lang)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resources by phase */}
        {Object.entries(byPhase).map(([phase, phaseResources]) => (
          <section key={phase} className="mb-12">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
                {phase}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  {phaseNames[phase] || `Fase ${phase}`}
                </h2>
                <p className="text-sm text-stone-500">
                  {phaseResources.length} {phaseResources.length === 1 ? t('library.resource', lang) : t('library.resources', lang)}
                  {user && (
                    <span className="ml-2">
                      · {phaseResources.filter(r => r.evalStats !== null).length} {t('library.evaluated', lang)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {phaseResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isLoggedIn={!!user}
                  language={lang}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

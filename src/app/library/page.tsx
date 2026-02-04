import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/header';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';

// Corner bracket component for decorative framing
function CornerBrackets({ className = '' }: { className?: string }) {
  return (
    <>
      <div className={`absolute top-0 left-0 w-4 h-4 border-l border-t ${className}`} />
      <div className={`absolute top-0 right-0 w-4 h-4 border-r border-t ${className}`} />
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-l border-b ${className}`} />
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-r border-b ${className}`} />
    </>
  );
}

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <div className="min-h-screen bg-[#faf9f6]">
        <Header currentPage="library" />
        <main className="mx-auto max-w-6xl px-8 py-12">
          <p className="font-mono text-sm text-[#7d6b6b]">{t('common.error', lang)}: {error.message}</p>
        </main>
      </div>
    );
  }

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
      const byResource: Record<string, typeof evaluations> = {};
      for (const e of evaluations) {
        if (!byResource[e.resource_id]) byResource[e.resource_id] = [];
        byResource[e.resource_id].push(e);
      }

      for (const [resourceId, evals] of Object.entries(byResource)) {
        const bestScore = Math.max(...evals.map(e => e.overall_score));
        const lastEvaluatedAt = evals[0].completed_at;
        evaluationStats[resourceId] = {
          resourceId,
          bestScore,
          lastEvaluatedAt,
          evalCount: evals.length,
        };
      }
    }
  }

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

  const byPhase: Record<string, ResourceWithStatus[]> = {};
  for (const resource of resourcesWithStatus) {
    const phase = resource.phase;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(resource);
  }

  const totalResources = resources?.length || 0;
  const totalEvaluated = resourcesWithStatus.filter(r => r.evalStats !== null).length;
  const totalUnlocked = resourcesWithStatus.filter(r => r.isUnlocked).length;
  const avgScore = totalEvaluated > 0
    ? Math.round(resourcesWithStatus.filter(r => r.evalStats !== null).reduce((sum, r) => sum + r.evalStats!.bestScore, 0) / totalEvaluated)
    : 0;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-[#4a5d4a]"></div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
              {lang === 'es' ? 'Sistema de Aprendizaje' : 'Learning System'}
            </span>
          </div>

          <h1 className="text-5xl font-bold text-[#2c2c2c] mb-2">
            {t('library.title', lang)}
          </h1>
          <p className="text-3xl font-light text-[#9c9a8e]">
            {lang === 'es' ? 'para dominar sistemas de IA' : 'for AI systems mastery'}
          </p>

          <p className="mt-6 text-[#7a7a6e] max-w-xl leading-relaxed">
            {lang === 'es'
              ? 'Cuando la comprensión superficial no es suficiente. Valida tu conocimiento real de papers, libros y conceptos complejos.'
              : 'When surface-level understanding isn\'t enough. Validate real comprehension of papers, books, and complex concepts.'}
          </p>

          {!user && (
            <p className="mt-6 text-sm text-[#8b7355]">
              <Link href="/login" className="underline hover:text-[#4a5d4a] transition-colors">
                {t('common.signin', lang)}
              </Link>{' '}
              {t('library.signInPrompt', lang)}
            </p>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <p className="text-4xl font-light text-[#2c2c2c]">{totalResources}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('library.resources', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#4a5d4a]">{totalUnlocked}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('library.unlocked', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#4a5d4a]">{totalEvaluated}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('library.evaluated', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#8b7355]">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {lang === 'es' ? 'Promedio' : 'Average'}
            </p>
          </div>
        </div>

        {/* Phase Progress - Only when logged in */}
        {user && (
          <div className="relative mb-16 p-8 bg-white/50">
            <CornerBrackets className="border-[#d4d0c8]" />

            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
                {lang === 'es' ? 'Progreso por Fase' : 'Phase Progress'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {Object.entries(byPhase).map(([phase, phaseResources]) => {
                const evaluated = phaseResources.filter(r => r.evalStats !== null).length;
                const total = phaseResources.length;
                const progress = total > 0 ? Math.round((evaluated / total) * 100) : 0;

                return (
                  <div key={phase} className="text-center">
                    <div className="relative h-1 bg-[#e8e6e0] mb-3">
                      <div
                        className="absolute left-0 top-0 h-full bg-[#4a5d4a] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-1">
                      {t('resource.phase', lang)} {phase}
                    </p>
                    <p className="text-lg font-light text-[#2c2c2c]">
                      {evaluated}<span className="text-[#9c9a8e]">/{total}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resources by Phase */}
        {Object.entries(byPhase).map(([phase, phaseResources]) => (
          <section key={phase} className="mb-16">
            {/* Phase Header */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-5xl font-light text-[#e8e6e0]">
                {phase.toString().padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-xl font-medium text-[#2c2c2c]">
                  {phaseNames[phase] || `${t('resource.phase', lang)} ${phase}`}
                </h2>
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mt-1">
                  {phaseResources.length} {phaseResources.length === 1 ? t('library.resource', lang) : t('library.resources', lang)}
                  {user && (
                    <span className="ml-3">
                      {phaseResources.filter(r => r.evalStats !== null).length} {t('library.evaluated', lang)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Resource Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Footer */}
      <footer className="border-t border-[#e8e6e0] py-8 mt-8">
        <div className="mx-auto max-w-6xl px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase text-center">
            Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

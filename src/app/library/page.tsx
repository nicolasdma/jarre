import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';
import { ProjectMilestone } from './project-milestone';

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
    .order('sort_order');

  if (error) {
    console.error('Error fetching resources:', error);
    return (
      <div className="min-h-screen bg-j-bg">
        <Header currentPage="library" />
        <main className="mx-auto max-w-6xl px-8 py-12">
          <p className="font-mono text-sm text-j-error">{t('common.error', lang)}: {error.message}</p>
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

  // Fetch projects for milestones
  type ProjectWithDetails = {
    id: string;
    title: string;
    phase: string;
    description: string;
    deliverables: string[];
    status: string;
    concepts: Array<{ id: string; name: string }>;
  };
  let projectsByPhase: Record<string, ProjectWithDetails> = {};

  if (user) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('*');

    const { data: projectConcepts } = await supabase
      .from('project_concepts')
      .select('project_id, concept_id');

    const { data: projectProgress } = await supabase
      .from('project_progress')
      .select('project_id, status')
      .eq('user_id', user.id);

    // Fetch concept names for display
    const pcConceptIds = [...new Set((projectConcepts || []).map((pc) => pc.concept_id))];
    const { data: pcConcepts } = pcConceptIds.length > 0
      ? await supabase.from('concepts').select('id, name').in('id', pcConceptIds)
      : { data: [] };

    const conceptNameMap = (pcConcepts || []).reduce(
      (acc, c) => { acc[c.id] = c.name; return acc; },
      {} as Record<string, string>
    );

    const progressMap = (projectProgress || []).reduce(
      (acc, p) => { acc[p.project_id] = p.status; return acc; },
      {} as Record<string, string>
    );

    const conceptsMap = (projectConcepts || []).reduce(
      (acc, pc) => {
        if (!acc[pc.project_id]) acc[pc.project_id] = [];
        acc[pc.project_id].push({ id: pc.concept_id, name: conceptNameMap[pc.concept_id] || pc.concept_id });
        return acc;
      },
      {} as Record<string, Array<{ id: string; name: string }>>
    );

    for (const proj of (allProjects || [])) {
      projectsByPhase[proj.phase] = {
        id: proj.id,
        title: proj.title,
        phase: proj.phase,
        description: proj.description,
        deliverables: proj.deliverables || [],
        status: progressMap[proj.id] || 'not_started',
        concepts: conceptsMap[proj.id] || [],
      };
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

  // Filter out courses, videos, and specific resources from main view
  const hiddenTypes = ['course', 'video'];
  const hiddenIds = [
    'tanenbaum-ch1', 'tanenbaum-ch5', // Distributed Systems book
    'sre-ch3', 'sre-ch4', 'sre-ch6',  // SRE book
    'hussein-backpressure', 'hussein-latency-throughput', // Unavailable videos
  ];
  const visibleResources = resourcesWithStatus.filter(
    r => !hiddenTypes.includes(r.type) && !hiddenIds.includes(r.id)
  );

  // Supplementary resources (videos, etc.) - shown in collapsible section
  const supplementaryResources = resourcesWithStatus.filter(
    r => r.type === 'video' && !hiddenIds.includes(r.id)
  );

  const byPhase: Record<string, ResourceWithStatus[]> = {};
  for (const resource of visibleResources) {
    const phase = resource.phase;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(resource);
  }

  const totalResources = visibleResources.length;
  const totalEvaluated = visibleResources.filter(r => r.evalStats !== null).length;
  const totalUnlocked = visibleResources.filter(r => r.isUnlocked).length;
  const avgScore = totalEvaluated > 0
    ? Math.round(visibleResources.filter(r => r.evalStats !== null).reduce((sum, r) => sum + r.evalStats!.bestScore, 0) / totalEvaluated)
    : 0;

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <SectionLabel>
            {lang === 'es' ? 'Sistema de Aprendizaje' : 'Learning System'}
          </SectionLabel>

          <h1 className="text-5xl font-bold text-j-text mb-2">
            {t('library.title', lang)}
          </h1>
          <p className="text-3xl font-light text-j-text-tertiary">
            {lang === 'es' ? 'para dominar sistemas de IA' : 'for AI systems mastery'}
          </p>

          <p className="mt-6 text-j-text-secondary max-w-xl leading-relaxed">
            {lang === 'es'
              ? 'Cuando la comprensión superficial no es suficiente. Valida tu conocimiento real de papers, libros y conceptos complejos.'
              : 'When surface-level understanding isn\'t enough. Validate real comprehension of papers, books, and complex concepts.'}
          </p>

          {!user && (
            <p className="mt-6 text-sm text-j-warm-dark">
              <Link href="/login" className="underline hover:text-j-accent transition-colors">
                {t('common.signin', lang)}
              </Link>{' '}
              {t('library.signInPrompt', lang)}
            </p>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <p className="text-4xl font-light text-j-text">{totalResources}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.resources', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-accent">{totalUnlocked}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.unlocked', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-accent">{totalEvaluated}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.evaluated', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-warm-dark">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {lang === 'es' ? 'Promedio' : 'Average'}
            </p>
          </div>
        </div>

        {/* Phase Progress - Only when logged in */}
        {user && (
          <div className="relative mb-16 p-8 bg-white/50">
            <CornerBrackets className="border-j-border-input" />

            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {lang === 'es' ? 'Progreso por Fase' : 'Phase Progress'}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
              {Object.entries(byPhase).map(([phase, phaseResources]) => {
                const evaluated = phaseResources.filter(r => r.evalStats !== null).length;
                const total = phaseResources.length;
                const progress = total > 0 ? Math.round((evaluated / total) * 100) : 0;

                return (
                  <div key={phase} className="text-center">
                    <div className="relative h-1 bg-j-border mb-3">
                      <div
                        className="absolute left-0 top-0 h-full bg-j-accent transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {t('resource.phase', lang)} {phase}
                    </p>
                    <p className="text-lg font-light text-j-text">
                      {evaluated}<span className="text-j-text-tertiary">/{total}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resources by Phase with Project Milestones */}
        {Object.entries(byPhase).map(([phase, phaseResources]) => (
          <section key={phase} className="mb-16">
            {/* Phase Header */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-5xl font-light text-j-border">
                {phase.toString().padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-xl font-medium text-j-text">
                  {phaseNames[phase] || `${t('resource.phase', lang)} ${phase}`}
                </h2>
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
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

            {/* Project Milestone after this phase */}
            {user && projectsByPhase[phase] && (
              <ProjectMilestone
                project={projectsByPhase[phase]}
                isLoggedIn={!!user}
                language={lang}
              />
            )}
          </section>
        ))}

        {/* Supplementary Resources (Videos) */}
        {supplementaryResources.length > 0 && (
          <details className="mb-16 group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-4 py-4 border-t border-b border-j-border hover:bg-j-bg-hover transition-colors">
                <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                  {lang === 'es' ? 'Recursos Complementarios' : 'Supplementary Resources'}
                </span>
                <span className="text-xs text-j-text-tertiary">
                  ({supplementaryResources.length} {lang === 'es' ? 'videos' : 'videos'})
                </span>
                <span className="ml-auto text-j-text-tertiary group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </div>
            </summary>
            <div className="pt-8">
              <p className="text-sm text-j-text-secondary mb-6">
                {lang === 'es'
                  ? 'Videos y materiales adicionales para profundizar en los temas.'
                  : 'Videos and additional materials to dive deeper into topics.'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {supplementaryResources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/item flex items-start gap-3 p-4 border border-j-border hover:border-j-accent transition-colors"
                  >
                    <span className="text-lg">▶</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-j-text group-hover/item:text-j-accent transition-colors line-clamp-2">
                        {resource.title}
                      </p>
                      {resource.author && (
                        <p className="text-xs text-j-text-tertiary mt-1">{resource.author}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </details>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-j-border py-8 mt-8">
        <div className="mx-auto max-w-6xl px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
            Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>

    </div>
  );
}

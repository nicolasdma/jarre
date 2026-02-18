import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { LanguageSelector } from '@/components/language-selector';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { CornerBrackets } from '@/components/ui/corner-brackets';
import { LibraryContent } from './library-content';

export const metadata: Metadata = {
  title: 'Library — Jarre',
  description: 'Browse and manage your learning resources',
};

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
    const [
      { data: allProjects },
      { data: projectConcepts },
      { data: projectProgress },
    ] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('project_concepts').select('project_id, concept_id'),
      supabase.from('project_progress').select('project_id, status').eq('user_id', user.id),
    ]);

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
    // Phase 10 — alternate track, hidden from main view
    'p10-ai-strategy', 'p10-ai-discovery', 'p10-build-vs-buy',
    'p10-ai-governance', 'p10-enterprise-arch', 'p10-change-management',
    'p10-ai-economics', 'p10-ai-consulting', 'p10-aws-ai-cert',
  ];
  // Phases that should not appear in the library (empty or integrated)
  const hiddenPhases = ['0', '6', '9', '10'];
  const visibleResources = resourcesWithStatus.filter(
    r => !hiddenTypes.includes(r.type) && !hiddenIds.includes(r.id) && !hiddenPhases.includes(r.phase)
  );

  // Supplementary resources (videos, etc.) - shown in collapsible section
  const supplementaryResources = resourcesWithStatus.filter(
    r => r.type === 'video' && !hiddenIds.includes(r.id) && !hiddenPhases.includes(r.phase)
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

      <main className="mx-auto max-w-6xl px-8 py-12 j-grid-bg">
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
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-4xl font-light text-j-text">{totalResources}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.resources', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-4xl font-light text-j-accent">{totalUnlocked}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.unlocked', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-4xl font-light text-j-accent">{totalEvaluated}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.evaluated', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-4xl font-light text-j-warm-dark">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {lang === 'es' ? 'Promedio' : 'Average'}
            </p>
          </div>
        </div>

        {/* Phase Tabs + Resources + Supplementary */}
        <LibraryContent
          byPhase={byPhase}
          projectsByPhase={projectsByPhase}
          supplementaryResources={supplementaryResources}
          isLoggedIn={!!user}
          language={lang}
          phaseNames={phaseNames}
        />
      </main>

      {/* Settings */}
      {user && (
        <div className="mx-auto max-w-6xl px-8 border-t border-j-border pt-8 mt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
            {t('dashboard.settings', lang)}
          </p>
          <LanguageSelector currentLanguage={lang} />
        </div>
      )}

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

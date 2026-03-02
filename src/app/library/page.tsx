import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { LanguageSelector } from '@/components/language-selector';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { CornerBrackets } from '@/components/ui/corner-brackets';
import { PlanBanner } from '@/components/billing/plan-banner';
import { IS_MANAGED } from '@/lib/config';
import { FREE_VOICE_MINUTES } from '@/lib/constants';
import { TABLES } from '@/lib/db/tables';
import { LibraryContent } from './library-content';
import type { PipelineCourseData } from '../dashboard/pipeline-course-card';

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
      .from(TABLES.userProfiles)
      .select('language')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;
  }

  let subscriptionStatus = 'free';
  let monthlyUsed = 0;
  let voiceMinutesUsed = 0;
  let voiceMinutesLimit = FREE_VOICE_MINUTES;
  if (user && IS_MANAGED) {
    const { data: billingProfile } = await supabase
      .from(TABLES.userProfiles)
      .select('subscription_status')
      .eq('id', user.id)
      .single();
    subscriptionStatus = billingProfile?.subscription_status || 'free';
    voiceMinutesLimit = subscriptionStatus === 'active' ? Infinity : FREE_VOICE_MINUTES;

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    const { data: tokenRows } = await supabase
      .from(TABLES.tokenUsage)
      .select('tokens')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString());
    monthlyUsed = (tokenRows || []).reduce((sum, row) => sum + (row.tokens || 0), 0);

    if (subscriptionStatus !== 'active') {
      const { data: voiceRows } = await supabase
        .from(TABLES.voiceSessions)
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', monthEnd.toISOString());

      const totalSeconds = (voiceRows || []).reduce(
        (sum, row) => sum + (row.duration_seconds || 0),
        0,
      );
      voiceMinutesUsed = Math.round((totalSeconds / 60) * 10) / 10;
    }
  }
  const monthlyLimit = subscriptionStatus === 'active' ? 2_000_000 : 50_000;

  const phaseNames = getPhaseNames(lang);

  let resourcesQuery = supabase
    .from(TABLES.resources)
    .select(`
      *,
      resource_concepts!inner (
        concept_id,
        is_prerequisite
      )
    `)
    .eq('is_archived', false);

  resourcesQuery = user
    ? resourcesQuery.or(`created_by.is.null,created_by.eq.${user.id}`)
    : resourcesQuery.is('created_by', null);

  const { data: resources, error } = await resourcesQuery
    .order('phase')
    .order('sort_order');

  if (error) {
    console.error('Error fetching resources:', error);
    return (
      <div className="min-h-screen bg-j-bg">
        <Header currentPage="library" />
        <main className="mx-auto max-w-6xl px-4 sm:px-8 py-12">
          <p className="font-mono text-sm text-j-error">{t('common.error', lang)}: {error.message}</p>
        </main>
      </div>
    );
  }

  const allResourceIds = (resources || []).map((resource) => resource.id);
  const sectionCounts: Record<string, number> = {};

  if (allResourceIds.length > 0) {
    const { data: sections } = await supabase
      .from(TABLES.resourceSections)
      .select('resource_id')
      .in('resource_id', allResourceIds);

    for (const section of sections || []) {
      sectionCounts[section.resource_id] = (sectionCounts[section.resource_id] || 0) + 1;
    }
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

  const learnProgressMap: Record<string, { activeSection: number; completedSections: number[] }> = {};
  if (user && allResourceIds.length > 0) {
    const { data: learnProgressRows } = await supabase
      .from(TABLES.learnProgress)
      .select('resource_id, active_section, completed_sections')
      .eq('user_id', user.id)
      .in('resource_id', allResourceIds);

    for (const row of learnProgressRows || []) {
      learnProgressMap[row.resource_id] = {
        activeSection: row.active_section ?? 1,
        completedSections: row.completed_sections ?? [],
      };
    }
  }

  type EvalStats = {
    resourceId: string;
    bestScore: number;
    lastEvaluatedAt: string;
    evalCount: number;
  };
  const evaluationStats: Record<string, EvalStats> = {};

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
  const projectsByPhase: Record<string, ProjectWithDetails> = {};

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

  // Fetch user's external resources
  type UserResourceRow = {
    id: string;
    title: string;
    type: string;
    status: string;
    summary: string | null;
    coverage_score: number | null;
    created_at: string;
    url: string | null;
  };
  let userResources: UserResourceRow[] = [];

  if (user) {
    const { data: ur } = await supabase
      .from('user_resources')
      .select('id, title, type, status, summary, coverage_score, created_at, url')
      .eq('user_id', user.id)
      .in('status', ['completed', 'processing'])
      .order('created_at', { ascending: false });
    userResources = ur || [];
  }

  // Fetch user resource → concept links for cross-referencing in ResourceCards
  type RelatedUserResource = {
    id: string;
    title: string;
    type: string;
    url: string | null;
  };
  const userResourcesByConceptId = new Map<string, RelatedUserResource[]>();

  if (user) {
    const { data: urcLinks } = await supabase
      .from('user_resource_concepts')
      .select('concept_id, user_resource_id, user_resources!inner(id, title, type, url, status)')
      .eq('user_resources.user_id', user.id)
      .eq('user_resources.status', 'completed');

    if (urcLinks) {
      for (const link of urcLinks) {
        const ur = link.user_resources as unknown as { id: string; title: string; type: string; url: string | null };
        const existing = userResourcesByConceptId.get(link.concept_id) || [];
        if (!existing.some(r => r.id === ur.id)) {
          existing.push({ id: ur.id, title: ur.title, type: ur.type, url: ur.url });
        }
        userResourcesByConceptId.set(link.concept_id, existing);
      }
    }
  }

  type ResourceWithStatus = NonNullable<typeof resources>[number] & {
    isUnlocked: boolean;
    missingPrerequisites: string[];
    conceptsTaught: string[];
    evalStats: EvalStats | null;
    relatedUserResources: RelatedUserResource[];
    progress: { activeSection: number; completedSections: number[] } | null;
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

    // Collect related user resources from all concepts this resource teaches
    const seenIds = new Set<string>();
    const relatedUserResources: RelatedUserResource[] = [];
    for (const conceptId of conceptsTaught) {
      const related = userResourcesByConceptId.get(conceptId) || [];
      for (const ur of related) {
        if (!seenIds.has(ur.id)) {
          seenIds.add(ur.id);
          relatedUserResources.push(ur);
        }
      }
    }

    return {
      ...resource,
      isUnlocked,
      missingPrerequisites,
      conceptsTaught,
      evalStats: evaluationStats[resource.id] || null,
      relatedUserResources,
      progress: learnProgressMap[resource.id] || null,
    };
  });

  // Pipeline-generated courses use ids prefixed by yt- and can be placed in inferred phases.
  const pipelineCourses: PipelineCourseData[] = resourcesWithStatus
    .filter((resource) => {
      const isPipelineResource = resource.id.startsWith('yt-')
        || (resource.phase === '0' && (resource.type === 'video' || resource.type === 'lecture'));
      return isPipelineResource && (sectionCounts[resource.id] || 0) > 0;
    })
    .map((resource) => ({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      url: resource.url || null,
      summary: (resource.activate_data as { summary?: string } | null)?.summary ?? null,
      sectionCount: sectionCounts[resource.id] || 0,
      createdAt: resource.created_at,
      isOwner: !!user && resource.created_by === user.id,
      evalStats: resource.evalStats
        ? { bestScore: resource.evalStats.bestScore, evalCount: resource.evalStats.evalCount }
        : null,
      progress: resource.progress,
    }));

  pipelineCourses.sort((a, b) => {
    const priority = (course: PipelineCourseData) => {
      if (
        course.progress
        && course.progress.completedSections.length > 0
        && course.progress.completedSections.length < course.sectionCount
      ) return 0;
      if (!course.evalStats) return 1;
      return 2;
    };

    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filter out courses, videos, and specific resources from main view
  const hiddenTypes = ['course', 'video'];
  const hiddenIds = [
    'tanenbaum-ch1', 'tanenbaum-ch5', // Distributed Systems book
    'sre-ch3', 'sre-ch4', 'sre-ch6',  // SRE book
    'hussein-backpressure', 'hussein-latency-throughput', // Unavailable videos
  ];
  // Phases that should not appear in the library: Math (supplementary) and Enterprise (alternate track)
  const hiddenPhases = ['0', '11'];
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
    <div className="min-h-screen bg-j-bg j-bg-texture">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 j-grid-bg j-hero-gradient">
        {/* Hero Section */}
        <div className="mb-16">
          <SectionLabel>
            {lang === 'es' ? 'Sistema de Aprendizaje' : 'Learning System'}
          </SectionLabel>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-normal italic tracking-tight text-j-text mb-2 font-[family-name:var(--j-font-display)]">
            {t('library.title', lang)}
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl font-light text-j-text-tertiary">
            {lang === 'es' ? 'para dominar sistemas de IA' : 'for AI systems mastery'}
          </p>

          <p className="mt-6 text-j-text-secondary max-w-xl leading-relaxed">
            {lang === 'es'
              ? 'Cuando la comprensión superficial no es suficiente. Valida tu conocimiento real de papers, libros y conceptos complejos.'
              : 'When surface-level understanding isn\'t enough. Validate real comprehension of papers, books, and complex concepts.'}
          </p>

          {user && (
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 border border-j-border px-4 py-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary">
                {lang === 'es' ? 'Nuevo en esta fase' : 'New in this phase'}
              </span>
              <Link
                href="/library?tab=resources"
                className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-accent hover:underline"
              >
                {lang === 'es' ? 'Pestaña Recursos' : 'Resources Tab'}
              </Link>
              <span className="text-xs text-j-text-secondary">
                {lang === 'es'
                  ? 'Los cursos creados desde YouTube se integran a tu currícula y a Mi Sistema.'
                  : 'YouTube-generated courses are integrated into your curriculum and My System.'}
              </span>
            </div>
          )}

          {user && IS_MANAGED && (
            <div className="mt-6">
              <PlanBanner
                status={subscriptionStatus}
                used={monthlyUsed}
                limit={monthlyLimit}
                voiceMinutesUsed={voiceMinutesUsed}
                voiceMinutesLimit={voiceMinutesLimit}
                language={lang}
              />
            </div>
          )}

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-16">
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light text-j-text">{totalResources}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.resources', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light text-j-accent">{totalUnlocked}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.unlocked', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light text-j-accent">{totalEvaluated}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('library.evaluated', lang)}
            </p>
          </div>
          <div className="relative text-center p-4">
            <CornerBrackets size="sm" className="border-j-border dark:border-j-accent/20" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light text-j-warm-dark">{avgScore > 0 ? `${avgScore}%` : '—'}</p>
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
          userResources={userResources}
          pipelineCourses={pipelineCourses}
          isLoggedIn={!!user}
          language={lang}
          phaseNames={phaseNames}
        />
      </main>

      {/* Settings */}
      {user && (
        <div className="mx-auto max-w-6xl px-4 sm:px-8 border-t border-j-border pt-8 mt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
            {t('dashboard.settings', lang)}
          </p>
          <LanguageSelector currentLanguage={lang} />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-j-border py-8 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
            Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>

    </div>
  );
}

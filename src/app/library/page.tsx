import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { LanguageSelector } from '@/components/language-selector';
import { t, getPhaseNames, type Language } from '@/lib/translations';
import { IS_MANAGED } from '@/lib/config';
import { FREE_VOICE_MINUTES } from '@/lib/constants';
import { TABLES } from '@/lib/db/tables';
import { LibraryContent } from './library-content';

export const metadata: Metadata = {
  title: 'Library — Jarre',
  description: 'Browse and manage your learning resources',
};

function chooseDominantPhase(phases: string[]): string | null {
  if (phases.length === 0) return null;

  const frequencies = new Map<string, number>();
  for (const phase of phases) {
    const key = String(phase);
    frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return Number(a[0]) - Number(b[0]);
    })[0][0] ?? null;
}

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang: Language = 'es';
  let userCurrentPhase = '1';
  let subscriptionStatus = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from(TABLES.userProfiles)
      .select('language, current_phase, subscription_status')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;
    userCurrentPhase = profile?.current_phase ? String(profile.current_phase) : '1';
    subscriptionStatus = profile?.subscription_status || 'free';
  }

  let monthlyUsed = 0;
  let voiceMinutesUsed = 0;
  let voiceMinutesLimit = FREE_VOICE_MINUTES;
  if (user && IS_MANAGED) {
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

  const resourcesSelect = `
      *,
      resource_concepts!inner (
        concept_id,
        is_prerequisite
      )
    `;

  const buildCoreResourcesQuery = () =>
    supabase
      .from(TABLES.resources)
      .select(resourcesSelect)
      .eq('is_archived', false)
      .is('created_by', null)
      .order('phase')
      .order('sort_order');

  let resourcesResult = await buildCoreResourcesQuery().eq('curriculum_source', 'core');

  // Backward compatibility: environments without the new column should still work.
  if (
    resourcesResult.error &&
    (resourcesResult.error.code === '42703' ||
      resourcesResult.error.message.includes('curriculum_source'))
  ) {
    resourcesResult = await buildCoreResourcesQuery();
  }

  const { data: resources, error } = resourcesResult;

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

  const userResourcesByPhase: Record<string, UserResourceRow[]> = {};

  if (user && userResources.length > 0) {
    const userResourceIds = userResources.map((resource) => resource.id);
    const { data: phaseLinks } = await supabase
      .from(TABLES.userResourceConcepts)
      .select('user_resource_id, concept_id')
      .in('user_resource_id', userResourceIds);

    const conceptIds = [...new Set((phaseLinks || []).map((link) => link.concept_id))];
    const { data: conceptRows } = conceptIds.length > 0
      ? await supabase
          .from(TABLES.concepts)
          .select('id, phase')
          .in('id', conceptIds)
      : { data: [] };

    const conceptPhaseMap = (conceptRows || []).reduce((acc, concept) => {
      acc[concept.id] = String(concept.phase);
      return acc;
    }, {} as Record<string, string>);

    const phasesByUserResourceId = new Map<string, string[]>();
    for (const link of phaseLinks || []) {
      const phase = conceptPhaseMap[link.concept_id];
      if (!phase) continue;

      const existing = phasesByUserResourceId.get(link.user_resource_id) || [];
      existing.push(phase);
      phasesByUserResourceId.set(link.user_resource_id, existing);
    }

    const fallbackPhase = userCurrentPhase || '1';
    for (const resource of userResources) {
      const linkedPhases = phasesByUserResourceId.get(resource.id) || [];
      const dominantPhase = chooseDominantPhase(linkedPhases) || fallbackPhase;
      if (!userResourcesByPhase[dominantPhase]) userResourcesByPhase[dominantPhase] = [];
      userResourcesByPhase[dominantPhase].push(resource);
    }
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
      .from(TABLES.userResourceConcepts)
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

  // Filter out only courses and specific resources from main view.
  // Videos should remain visible in their curriculum phase.
  const hiddenTypes = ['course'];
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

  // Supplementary resources are the ones intentionally excluded by type.
  const supplementaryResources = resourcesWithStatus.filter(
    r => hiddenTypes.includes(r.type) && !hiddenIds.includes(r.id) && !hiddenPhases.includes(r.phase)
  );

  const byPhase: Record<string, ResourceWithStatus[]> = {};
  for (const resource of visibleResources) {
    const phase = resource.phase;
    if (!byPhase[phase]) byPhase[phase] = [];
    byPhase[phase].push(resource);
  }

  const totalResources = visibleResources.length + userResources.length;
  const totalEvaluated = visibleResources.filter(r => r.evalStats !== null).length;
  const totalUnlocked = visibleResources.filter(r => r.isUnlocked).length;
  const avgScore = totalEvaluated > 0
    ? Math.round(visibleResources.filter(r => r.evalStats !== null).reduce((sum, r) => sum + r.evalStats!.bestScore, 0) / totalEvaluated)
    : 0;

  return (
    <div className="min-h-screen bg-j-bg j-bg-texture">
      <Header currentPage="library" />

      <main className="w-full pb-12 sm:pb-16">
        <LibraryContent
          byPhase={byPhase}
          projectsByPhase={projectsByPhase}
          supplementaryResources={supplementaryResources}
          userResourcesByPhase={userResourcesByPhase}
          isLoggedIn={!!user}
          language={lang}
          phaseNames={phaseNames}
          showPlanBanner={!!user && IS_MANAGED}
          subscriptionStatus={subscriptionStatus}
          monthlyUsed={monthlyUsed}
          monthlyLimit={monthlyLimit}
          voiceMinutesUsed={voiceMinutesUsed}
          voiceMinutesLimit={voiceMinutesLimit}
          totalResources={totalResources}
          totalUnlocked={totalUnlocked}
          totalEvaluated={totalEvaluated}
          avgScore={avgScore}
        />
      </main>

      {/* Settings */}
      {user && (
        <div className="grid gap-0 lg:grid-cols-4">
          <div className="hidden border-r border-j-border lg:block" />
          <div className="mt-8 border-t border-j-border px-4 pt-8 sm:px-8 lg:col-span-3 lg:px-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              {t('dashboard.settings', lang)}
            </p>
            <LanguageSelector currentLanguage={lang} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 border-t border-j-border py-8">
        <div className="grid gap-0 lg:grid-cols-4">
          <div className="hidden border-r border-j-border lg:block" />
          <div className="px-4 sm:px-8 lg:col-span-3 lg:px-10">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
              Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

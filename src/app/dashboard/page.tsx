import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { PlanBanner } from '@/components/billing/plan-banner';
import { IS_MANAGED } from '@/lib/config';
import { FREE_VOICE_MINUTES } from '@/lib/constants';
import type { Language } from '@/lib/translations';
import { DashboardContent } from './dashboard-content';
import type { PipelineCourseData } from './pipeline-course-card';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'YouTube Studio — Jarre',
  description: 'Generate courses from videos and connect them to your Jarre curriculum',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let lang: Language = 'es';
  const sectionCounts: Record<string, number> = {};
  const evalStats: Record<string, { bestScore: number; evalCount: number }> = {};

  // Fetch user profile (personal data — requires auth)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  lang = (profile?.language || 'es') as Language;

  // Fetch subscription status and token usage for billing banner
  let subscriptionStatus = 'free';
  let monthlyUsed = 0;
  if (IS_MANAGED) {
    const { data: billingProfile } = await supabase
      .from(TABLES.userProfiles)
      .select('subscription_status')
      .eq('id', user.id)
      .single();
    subscriptionStatus = billingProfile?.subscription_status || 'free';

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const { data: tokenRows } = await supabase
      .from(TABLES.tokenUsage)
      .select('tokens')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString());
    monthlyUsed = (tokenRows || []).reduce((sum, r) => sum + (r.tokens || 0), 0);
  }
  const monthlyLimit = subscriptionStatus === 'active' ? 2_000_000 : 50_000;

  // Voice minutes used this month
  let voiceMinutesUsed = 0;
  const voiceMinutesLimit = subscriptionStatus === 'active' ? Infinity : FREE_VOICE_MINUTES;
  if (IS_MANAGED && subscriptionStatus !== 'active') {
    const now2 = new Date();
    const mStart = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), 1));
    const mEnd = new Date(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth() + 1, 1));
    const { data: voiceRows } = await supabase
      .from(TABLES.voiceSessions)
      .select('duration_seconds')
      .eq('user_id', user.id)
      .gte('created_at', mStart.toISOString())
      .lt('created_at', mEnd.toISOString());
    const totalSeconds = (voiceRows || []).reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
    voiceMinutesUsed = Math.round(totalSeconds / 60 * 10) / 10;
  }

  // Fetch pipeline-generated resources (video/lecture types)
  const { data: resources } = await supabase
    .from('resources')
    .select('id, title, type, url, activate_data, created_at')
    .eq('created_by', user.id)
    .in('type', ['video', 'lecture']);

  const allResources = resources || [];
  const allResourceIds = allResources.map((r) => r.id);

  // Fetch section counts for all candidates
  if (allResourceIds.length > 0) {
    const { data: sections } = await supabase
      .from('resource_sections')
      .select('resource_id')
      .in('resource_id', allResourceIds);

    if (sections) {
      for (const s of sections) {
        sectionCounts[s.resource_id] = (sectionCounts[s.resource_id] || 0) + 1;
      }
    }
  }

  // Keep only resources with at least 1 section
  const withSections = allResources.filter((r) => (sectionCounts[r.id] || 0) > 0);
  const pipelineResources = withSections;
  const resourceIds = pipelineResources.map((r) => r.id);

  // Fetch evaluations, learn_progress, and user_resources in parallel
  const progressMap: Record<string, { activeSection: number; completedSections: number[] }> = {};
  const ownedResourceIds = new Set<string>();

  if (resourceIds.length > 0) {
    const [evalResult, progressResult, userResourcesResult] = await Promise.all([
      supabase
        .from('evaluations')
        .select('resource_id, overall_score')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .in('resource_id', resourceIds),
      supabase
        .from(TABLES.learnProgress)
        .select('resource_id, active_section, completed_sections')
        .eq('user_id', user.id)
        .in('resource_id', resourceIds),
      supabase
        .from(TABLES.userResources)
        .select('resource_id')
        .eq('user_id', user.id)
        .in('resource_id', resourceIds),
    ]);

    // Process evaluations
    if (evalResult.data) {
      const byResource: Record<string, number[]> = {};
      for (const e of evalResult.data) {
        if (!byResource[e.resource_id]) byResource[e.resource_id] = [];
        byResource[e.resource_id].push(e.overall_score);
      }
      for (const [resourceId, scores] of Object.entries(byResource)) {
        evalStats[resourceId] = {
          bestScore: Math.max(...scores),
          evalCount: scores.length,
        };
      }
    }

    // Process learn_progress
    if (progressResult.data) {
      for (const p of progressResult.data) {
        progressMap[p.resource_id] = {
          activeSection: p.active_section ?? 1,
          completedSections: p.completed_sections ?? [],
        };
      }
    }

    // Process user_resources
    if (userResourcesResult.data) {
      for (const ur of userResourcesResult.data) {
        ownedResourceIds.add(ur.resource_id);
      }
    }
  }

  // Build course data with smart sorting:
  // 1) In progress first, 2) unevaluated, 3) completed — then by newest
  const courses: PipelineCourseData[] = pipelineResources.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url,
    summary: (r.activate_data as { summary?: string } | null)?.summary ?? null,
    sectionCount: sectionCounts[r.id] || 0,
    createdAt: r.created_at,
    evalStats: evalStats[r.id] || null,
    isOwner: ownedResourceIds.has(r.id),
    progress: progressMap[r.id] || null,
  }));

  courses.sort((a, b) => {
    const priority = (c: PipelineCourseData) => {
      if (c.progress && c.progress.completedSections.length > 0 && c.progress.completedSections.length < c.sectionCount) return 0; // in progress
      if (!c.evalStats) return 1; // unevaluated
      return 2; // completed
    };
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-j-bg j-bg-texture">
      <Header currentPage="library" />

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 j-grid-bg j-hero-gradient">
        {/* Hero Section */}
        <div className="mb-12">
          <SectionLabel>
            {lang === 'es' ? 'Studio Complementario' : 'Companion Studio'}
          </SectionLabel>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-normal italic tracking-tight text-j-text mb-2 font-[family-name:var(--j-font-display)]">
            {lang === 'es' ? 'De YouTube al currículo' : 'From YouTube to curriculum'}
          </h1>
          <p className="text-xl sm:text-2xl font-light text-j-text-tertiary">
            {lang === 'es' ? 'Generá cursos que viven dentro de Jarre, no aparte.' : 'Generate courses that live inside Jarre, not outside it.'}
          </p>
          <p className="mt-4 text-sm text-j-text-secondary max-w-2xl">
            {lang === 'es'
              ? 'Cada curso creado se integra con secciones, evaluación y review. Lo vas a ver en Library > Cursos.'
              : 'Every generated course integrates with sections, evaluation, and review. You will find it in Library > Courses.'}
          </p>
          <div className="mt-6">
            <Link
              href="/library"
              className="font-mono text-[10px] tracking-[0.15em] uppercase border border-j-border-input px-4 py-2 text-j-text hover:border-j-accent transition-colors"
            >
              {lang === 'es' ? 'Volver a Library' : 'Back to Library'}
            </Link>
          </div>
          {IS_MANAGED && (
            <div className="mt-4">
              <PlanBanner status={subscriptionStatus} used={monthlyUsed} limit={monthlyLimit} voiceMinutesUsed={voiceMinutesUsed} voiceMinutesLimit={voiceMinutesLimit} />
            </div>
          )}
        </div>

        {/* Input + Stats + Course Grid */}
        <DashboardContent
          courses={courses}
          language={lang}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-j-border py-8 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
            Jarre · {lang === 'es' ? 'Currículo + Studio de Ingesta' : 'Curriculum + Ingestion Studio'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

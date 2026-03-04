'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FolderTree, Layers } from 'lucide-react';
import { t, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';
import { UserResourceCard } from './user-resource-card';
import { ProjectMilestone } from './project-milestone';
import { InsightBar } from '@/components/insights/InsightBar';
import { UnifiedIntakePanel } from './unified-intake-panel';
import { PlanBanner } from '@/components/billing/plan-banner';

interface EvalStats {
  resourceId: string;
  bestScore: number;
  lastEvaluatedAt: string;
  evalCount: number;
}

interface RelatedUserResource {
  id: string;
  title: string;
  type: string;
  url: string | null;
}

interface ResourceWithStatus {
  id: string;
  title: string;
  type: string;
  phase: string;
  author?: string;
  description?: string;
  url?: string;
  estimated_hours?: number;
  sort_order?: number;
  isUnlocked: boolean;
  missingPrerequisites: string[];
  conceptsTaught: string[];
  evalStats: EvalStats | null;
  relatedUserResources: RelatedUserResource[];
}

interface ProjectWithDetails {
  id: string;
  title: string;
  phase: string;
  description: string;
  deliverables: string[];
  status: string;
  concepts: Array<{ id: string; name: string }>;
}

interface UserResource {
  id: string;
  title: string;
  type: string;
  status: string;
  summary: string | null;
  coverage_score: number | null;
  created_at: string;
  url: string | null;
}

interface LibraryContentProps {
  byPhase: Record<string, ResourceWithStatus[]>;
  projectsByPhase: Record<string, ProjectWithDetails>;
  supplementaryResources: ResourceWithStatus[];
  userResourcesByPhase: Record<string, UserResource[]>;
  isLoggedIn: boolean;
  language: Language;
  phaseNames: Record<string, string>;
  showPlanBanner: boolean;
  subscriptionStatus: string;
  monthlyUsed: number;
  monthlyLimit: number;
  voiceMinutesUsed: number;
  voiceMinutesLimit: number;
  totalResources: number;
  totalUnlocked: number;
  totalEvaluated: number;
  avgScore: number;
}

type ActiveCurriculumPhase = 'all' | string;

function parseInitialSession(value: string | null): ActiveCurriculumPhase | null {
  if (!value) return null;
  if (value === 'resources' || value === 'courses' || value === 'external') return 'all';
  if (value === 'all' || /^\d+$/.test(value)) return value;
  return null;
}

export function LibraryContent({
  byPhase,
  projectsByPhase,
  supplementaryResources,
  userResourcesByPhase,
  isLoggedIn,
  language,
  phaseNames,
  showPlanBanner,
  subscriptionStatus,
  monthlyUsed,
  monthlyLimit,
  voiceMinutesUsed,
  voiceMinutesLimit,
  totalResources,
  totalUnlocked,
  totalEvaluated,
  avgScore,
}: LibraryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCurriculumPhase, setActiveCurriculumPhase] = useState<ActiveCurriculumPhase>('all');
  const [hydrated, setHydrated] = useState(false);

  const phases = useMemo(() => {
    const keys = new Set([...Object.keys(byPhase), ...Object.keys(userResourcesByPhase)]);
    return [...keys].sort((a, b) => Number(a) - Number(b));
  }, [byPhase, userResourcesByPhase]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const fromUrl = parseInitialSession(tab);
    const fromStorage = parseInitialSession(localStorage.getItem('jarre-library-session'));
    const initial = fromUrl || fromStorage || 'all';

    // Initial hydration from URL/localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCurriculumPhase(initial);
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('jarre-library-session', activeCurriculumPhase);
  }, [activeCurriculumPhase, hydrated]);

  const resolvedActivePhase: ActiveCurriculumPhase =
    activeCurriculumPhase === 'all' || phases.includes(activeCurriculumPhase)
      ? activeCurriculumPhase
      : 'all';

  const visiblePhases = resolvedActivePhase === 'all' ? phases : [resolvedActivePhase];

  const countByPhase = (phase: string): number => {
    const coreCount = byPhase[phase]?.length ?? 0;
    const externalCount = userResourcesByPhase[phase]?.length ?? 0;
    return coreCount + externalCount;
  };

  const totalSessionResources = phases.reduce((sum, phase) => sum + countByPhase(phase), 0);

  return (
    <div className="grid gap-0 lg:grid-cols-4">
      <aside className="border-b border-j-border lg:col-span-1 lg:border-r lg:border-b-0">
        <div className="p-4 sm:p-5 lg:sticky lg:top-[74px] lg:h-[calc(100vh-74px)] lg:overflow-y-auto">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {language === 'es' ? 'Currículas' : 'Curricula'}
          </p>

          <div className="mt-4 border border-j-border bg-j-bg">
            <div className="flex items-center gap-2 border-b border-j-border px-3 py-2">
              <FolderTree size={14} className="text-j-accent" />
              <span className="font-mono text-[11px] tracking-[0.12em] text-j-text uppercase">
                AI Engineering
              </span>
            </div>

            <nav className="space-y-1 p-2">
              <SessionButton
                active={resolvedActivePhase === 'all'}
                onClick={() => setActiveCurriculumPhase('all')}
                label={language === 'es' ? 'TODAS' : 'ALL'}
                count={totalSessionResources}
              />

              {phases.map((phase) => {
                const phaseLabel = `${phase.toString().padStart(2, '0')} ${phaseNames[phase] || `${t('resource.phase', language)} ${phase}`}`;
                return (
                  <SessionButton
                    key={phase}
                    active={resolvedActivePhase === phase}
                    onClick={() => setActiveCurriculumPhase(phase)}
                    label={phaseLabel}
                    count={countByPhase(phase)}
                  />
                );
              })}
            </nav>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-j-text-tertiary">
            <Layers size={14} />
            <span>
              {totalSessionResources} {totalSessionResources === 1 ? t('library.resource', language) : t('library.resources', language)}
            </span>
          </div>
        </div>
      </aside>

      <div className="px-4 pb-8 pt-6 sm:px-8 lg:col-span-3 lg:px-10">
        {showPlanBanner && (
          <div className="mb-4">
            <PlanBanner
              status={subscriptionStatus}
              used={monthlyUsed}
              limit={monthlyLimit}
              voiceMinutesUsed={voiceMinutesUsed}
              voiceMinutesLimit={voiceMinutesLimit}
              language={language}
            />
          </div>
        )}

        {!isLoggedIn && (
          <p className="mb-4 text-sm text-j-warm-dark">
            <Link href="/login" className="underline hover:text-j-accent transition-colors">
              {t('common.signin', language)}
            </Link>{' '}
            {t('library.signInPrompt', language)}
          </p>
        )}

        {isLoggedIn && (
          <div className="mb-2 flex items-center gap-6 border-y border-j-border/50 py-3">
            <StatChip value={totalResources} label={t('library.resources', language)} />
            <span className="text-j-border">·</span>
            <StatChip value={totalUnlocked} label={language === 'es' ? 'desbloqueados' : 'unlocked'} accent />
            <span className="text-j-border">·</span>
            <StatChip value={totalEvaluated} label={language === 'es' ? 'evaluados' : 'evaluated'} accent />
            {avgScore > 0 && (
              <>
                <span className="text-j-border">·</span>
                <StatChip value={`${avgScore}%`} label={language === 'es' ? 'promedio' : 'avg'} warm />
              </>
            )}
          </div>
        )}

        {isLoggedIn && <InsightBar language={language} />}

        <UnifiedIntakePanel
          language={language}
          onResourceAdded={() => router.refresh()}
        />

        {visiblePhases.map((phase) => {
          const phaseResources = byPhase[phase] || [];
          const phaseExternalResources = userResourcesByPhase[phase] || [];
          const phaseCount = phaseResources.length + phaseExternalResources.length;

          return (
            <section key={phase} className="mb-16">
              <div className="mb-6 flex items-center gap-3">
                <span className="font-mono text-2xl font-light text-j-border sm:text-3xl">
                  {phase.toString().padStart(2, '0')}
                </span>
                <div>
                  <h2 className="text-xl font-medium text-j-text">
                    {phaseNames[phase] || `${t('resource.phase', language)} ${phase}`}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
                    {phaseCount} {phaseCount === 1 ? t('library.resource', language) : t('library.resources', language)}
                  </p>
                </div>
              </div>

              {phaseResources.length > 0 && (
                <div className="mb-8">
                  <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                    {language === 'es' ? 'Ruta Base' : 'Core Curriculum'}
                  </p>
                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {phaseResources.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        isLoggedIn={isLoggedIn}
                        language={language}
                      />
                    ))}
                  </div>
                </div>
              )}

              {phaseExternalResources.length > 0 && (
                <div className="mb-8">
                  <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                    {language === 'es' ? 'Recursos Añadidos' : 'Added Resources'}
                  </p>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {phaseExternalResources.map((resource) => (
                      <UserResourceCard key={resource.id} resource={resource} language={language} />
                    ))}
                  </div>
                </div>
              )}

              {phaseCount === 0 && (
                <div className="border border-dashed border-j-border p-10 text-center">
                  <p className="text-sm text-j-text-secondary">
                    {language === 'es'
                      ? 'Todavía no hay recursos en esta sesión.'
                      : 'No resources yet in this session.'}
                  </p>
                </div>
              )}

              {isLoggedIn && projectsByPhase[phase] && (
                <ProjectMilestone
                  project={projectsByPhase[phase]}
                  isLoggedIn={isLoggedIn}
                  language={language}
                />
              )}
            </section>
          );
        })}

        {resolvedActivePhase === 'all' && supplementaryResources.length > 0 && (
          <details className="group mb-16 border border-j-border">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-3 p-4 transition-colors hover:bg-j-bg-hover">
                <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                  {language === 'es' ? 'Recursos Complementarios' : 'Supplementary Resources'}
                </span>
                <span className="text-xs text-j-text-tertiary">({supplementaryResources.length})</span>
                <span className="ml-auto text-j-text-tertiary transition-transform group-open:rotate-180">▼</span>
              </div>
            </summary>
            <div className="border-t border-j-border p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {supplementaryResources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/item flex items-start gap-3 border border-j-border p-4 transition-colors hover:border-j-accent"
                  >
                    <span className="text-lg">▶</span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm text-j-text transition-colors group-hover/item:text-j-accent">
                        {resource.title}
                      </p>
                      {resource.author && (
                        <p className="mt-1 text-xs text-j-text-tertiary">{resource.author}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function SessionButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left font-mono text-[10px] tracking-[0.13em] uppercase transition-colors ${
        active
          ? 'bg-j-accent/10 text-j-accent'
          : 'text-j-text-tertiary hover:bg-j-bg-hover hover:text-j-text'
      }`}
    >
      <span className="line-clamp-1">{label}</span>
      <span className="text-[9px]">{count}</span>
    </button>
  );
}

function StatChip({
  value,
  label,
  accent,
  warm,
}: {
  value: number | string;
  label: string;
  accent?: boolean;
  warm?: boolean;
}) {
  const valueColor = warm
    ? 'text-j-warm-dark'
    : accent
      ? 'text-j-accent'
      : 'text-j-text';

  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-mono text-sm font-medium ${valueColor}`}>{value}</span>
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary">{label}</span>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layers, Plus, Sparkles } from 'lucide-react';
import { t, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';
import { UserResourceCard } from './user-resource-card';
import { ProjectMilestone } from './project-milestone';
import { AddResourceModal } from '@/components/resources/AddResourceModal';
import { InsightBar } from '@/components/insights/InsightBar';
import { VoiceModeLauncher } from '@/components/voice/VoiceModeLauncher';
import { DashboardContent } from '../dashboard/dashboard-content';
import type { PipelineCourseData } from '../dashboard/pipeline-course-card';

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
  userResources: UserResource[];
  pipelineCourses?: PipelineCourseData[];
  isLoggedIn: boolean;
  language: Language;
  phaseNames: Record<string, string>;
}

type GlobalTab = 'curriculum' | 'resources';
type ActiveCurriculumPhase = 'all' | string;

export function LibraryContent({
  byPhase,
  projectsByPhase,
  supplementaryResources,
  userResources,
  pipelineCourses = [],
  isLoggedIn,
  language,
  phaseNames,
}: LibraryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeGlobalTab, setActiveGlobalTab] = useState<GlobalTab>('curriculum');
  const [activeCurriculumPhase, setActiveCurriculumPhase] = useState<ActiveCurriculumPhase>('all');
  const [hydrated, setHydrated] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);

  const phases = useMemo(
    () => Object.keys(byPhase).sort((a, b) => Number(a) - Number(b)),
    [byPhase],
  );

  useEffect(() => {
    const normalizeTab = (
      value: string | null,
    ): { globalTab: GlobalTab; curriculumPhase: ActiveCurriculumPhase } | null => {
      if (!value) return null;
      if (value === 'resources' || value === 'courses' || value === 'external') {
        return { globalTab: 'resources', curriculumPhase: 'all' };
      }
      if (value === 'all' || /^\d+$/.test(value)) {
        return { globalTab: 'curriculum', curriculumPhase: value as ActiveCurriculumPhase };
      }
      return null;
    };

    const tab = searchParams.get('tab');
    const tabFromUrl = tab && /^(all|resources|courses|external|\d+)$/.test(tab) ? tab : null;
    const saved = localStorage.getItem('jarre-library-phase');
    const initial = normalizeTab(tabFromUrl) || normalizeTab(saved) || {
      globalTab: 'curriculum' as const,
      curriculumPhase: 'all' as const,
    };

    /* eslint-disable react-hooks/set-state-in-effect */
    setActiveGlobalTab(initial.globalTab);
    setActiveCurriculumPhase(initial.curriculumPhase);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    const valueToPersist = activeGlobalTab === 'resources' ? 'resources' : activeCurriculumPhase;
    localStorage.setItem('jarre-library-phase', valueToPersist);
  }, [activeGlobalTab, activeCurriculumPhase, hydrated]);

  const activeCurriculumView: ActiveCurriculumPhase =
    activeCurriculumPhase === 'all' || phases.includes(activeCurriculumPhase)
      ? activeCurriculumPhase
      : 'all';

  const visiblePhases = activeCurriculumView === 'all' ? phases : [activeCurriculumView];
  const totalPhaseResources = phases.reduce((sum, phase) => sum + byPhase[phase].length, 0);

  return (
    <>
      <div className="sticky top-0 z-20 bg-j-bg/95 backdrop-blur-md border-b border-j-border -mx-4 px-4 sm:-mx-8 sm:px-8 mb-0">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            <TabButton
              active={activeGlobalTab === 'curriculum'}
              onClick={() => setActiveGlobalTab('curriculum')}
              label={language === 'es' ? 'Currícula' : 'Curriculum'}
              icon={<Layers size={13} />}
              badge={totalPhaseResources}
            />
            <TabButton
              active={activeGlobalTab === 'resources'}
              onClick={() => setActiveGlobalTab('resources')}
              label={language === 'es' ? 'Recursos' : 'Resources'}
              icon={<Sparkles size={13} />}
              badge={pipelineCourses.length + userResources.length}
            />
          </div>

          {isLoggedIn && (
            <div className="flex-shrink-0 pb-2 pl-4">
              <button
                onClick={() => setShowAddResource(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors"
              >
                <Plus size={12} />
                {language === 'es' ? 'Recurso' : 'Resource'}
              </button>
            </div>
          )}
        </div>

        {activeGlobalTab === 'curriculum' && (
          <div className="flex gap-0 overflow-x-auto scrollbar-hide border-t border-j-border/40 mt-0">
            <PhaseTabButton
              active={activeCurriculumView === 'all'}
              onClick={() => setActiveCurriculumPhase('all')}
              label={language === 'es' ? 'Todas' : 'All'}
            />
            {phases.map((phase) => {
              const phaseResources = byPhase[phase];
              const evaluated = phaseResources.filter((r) => r.evalStats !== null).length;
              const isComplete = phaseResources.length > 0 && evaluated === phaseResources.length;
              const hasProgress = evaluated > 0;

              return (
                <PhaseTabButton
                  key={phase}
                  active={activeCurriculumView === phase}
                  onClick={() => setActiveCurriculumPhase(phase)}
                  label={phase.toString().padStart(2, '0')}
                  dot={isLoggedIn && hasProgress ? (isComplete ? 'complete' : 'partial') : undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-8" />

      {isLoggedIn && <InsightBar language={language} />}

      {activeGlobalTab === 'resources' && (
        <section className="mb-16">
          <div className="mb-6 border border-j-border bg-j-surface/50 p-4 sm:p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {language === 'es' ? 'Recursos' : 'Resources'}
            </p>
            <p className="mt-2 text-sm text-j-text-secondary">
              {language === 'es'
                ? 'Todo en un solo lugar: cursos de YouTube y recursos externos, ordenados por tipo para que encuentres rápido lo que necesitás.'
                : 'Everything in one place: YouTube courses and external resources, organized by type so you can find what you need quickly.'}
            </p>
          </div>

          <div className="mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {language === 'es' ? 'Cursos de YouTube' : 'YouTube Courses'}
            </p>
          </div>
          <DashboardContent courses={pipelineCourses} language={language} />

          {isLoggedIn ? (
            <>
              <div className="mt-12 pt-8 border-t border-j-border flex items-center gap-3 mb-6">
                <Sparkles size={16} className="text-j-accent" />
                <h2 className="text-xl font-medium text-j-text">
                  {language === 'es' ? 'Mis Recursos Externos' : 'My External Resources'}
                </h2>
                <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
                  ({userResources.length})
                </span>
              </div>

              {userResources.length === 0 ? (
                <div className="border border-dashed border-j-border p-10 text-center">
                  <p className="text-sm text-j-text-secondary">
                    {language === 'es'
                      ? 'Todavía no agregaste recursos externos.'
                      : 'You have not added external resources yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {userResources.map((ur) => (
                    <UserResourceCard key={ur.id} resource={ur} language={language} />
                  ))}
                </div>
              )}

              <div className="mt-10">
                <VoiceModeLauncher
                  language={language}
                  showFreeform
                  showDebate={false}
                  freeformLabel={language === 'es' ? 'Sesión libre' : 'Freeform session'}
                />
              </div>
            </>
          ) : (
            <div className="mt-10 border border-dashed border-j-border p-10 text-center">
              <p className="text-sm text-j-text-secondary">
                {language === 'es'
                  ? 'Inicia sesión para guardar recursos externos y usar sesión libre.'
                  : 'Sign in to save external resources and use freeform sessions.'}
              </p>
            </div>
          )}
        </section>
      )}

      {activeGlobalTab === 'curriculum' && visiblePhases.map((phase) => {
        const phaseResources = byPhase[phase];
        if (!phaseResources) return null;

        return (
          <section key={phase} className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-2xl sm:text-3xl font-light text-j-border">
                {phase.toString().padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-xl font-medium text-j-text">
                  {phaseNames[phase] || `${t('resource.phase', language)} ${phase}`}
                </h2>
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                  {phaseResources.length} {phaseResources.length === 1 ? t('library.resource', language) : t('library.resources', language)}
                  {isLoggedIn && (
                    <span className="ml-3">
                      {phaseResources.filter((r) => r.evalStats !== null).length} {t('library.evaluated', language)}
                    </span>
                  )}
                </p>
              </div>
            </div>

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

      {activeGlobalTab === 'curriculum' && activeCurriculumView === 'all' && supplementaryResources.length > 0 && (
        <details className="mb-16 group border border-j-border">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-3 p-4 hover:bg-j-bg-hover transition-colors">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {language === 'es' ? 'Recursos Complementarios' : 'Supplementary Resources'}
              </span>
              <span className="text-xs text-j-text-tertiary">
                ({supplementaryResources.length})
              </span>
              <span className="ml-auto text-j-text-tertiary group-open:rotate-180 transition-transform">▼</span>
            </div>
          </summary>
          <div className="p-4 sm:p-6 border-t border-j-border">
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

      <AddResourceModal
        isOpen={showAddResource}
        onClose={() => setShowAddResource(false)}
        language={language}
        onResourceAdded={() => router.refresh()}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-4 py-3 font-mono text-[11px] tracking-[0.14em] uppercase
        border-b-2 transition-colors flex items-center gap-2
        ${active
          ? 'border-j-accent text-j-text'
          : 'border-transparent text-j-text-tertiary hover:text-j-text-secondary hover:border-j-border'
        }
      `}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className={`
          inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[9px] font-mono rounded-sm
          ${active ? 'bg-j-accent/20 text-j-accent' : 'bg-j-surface text-j-text-tertiary'}
        `}>
          {badge}
        </span>
      )}
    </button>
  );
}

function PhaseTabButton({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: 'complete' | 'partial';
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-2 font-mono text-[10px] tracking-[0.15em] uppercase
        border-b-2 transition-colors
        ${active
          ? 'border-j-accent text-j-text'
          : 'border-transparent text-j-text-muted hover:text-j-text-secondary'
        }
      `}
    >
      <span className="flex items-center gap-1.5">
        {label}
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              dot === 'complete' ? 'bg-j-accent' : 'bg-j-warm-dark'
            }`}
          />
        )}
      </span>
    </button>
  );
}

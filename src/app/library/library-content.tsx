'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Layers, Plus, Sparkles, Video } from 'lucide-react';
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

type ActivePhase = 'all' | 'external' | 'courses' | string;

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
  const [activePhase, setActivePhase] = useState<ActivePhase>('all');
  const [hydrated, setHydrated] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);

  const phases = useMemo(
    () => Object.keys(byPhase).sort((a, b) => Number(a) - Number(b)),
    [byPhase],
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    const tabFromUrl = tab && /^(all|courses|external|\d+)$/.test(tab) ? tab : null;
    const saved = localStorage.getItem('jarre-library-phase');
    const initial = (tabFromUrl || saved || 'all') as ActivePhase;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivePhase(initial);
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (hydrated) localStorage.setItem('jarre-library-phase', activePhase);
  }, [activePhase, hydrated]);

  const activeView: ActivePhase =
    activePhase === 'all' || activePhase === 'courses' || activePhase === 'external' || phases.includes(activePhase)
      ? activePhase
      : 'all';

  const visiblePhases = activeView === 'all' ? phases : [activeView];
  const totalPhaseResources = phases.reduce((sum, phase) => sum + byPhase[phase].length, 0);

  return (
    <>
      <div className="sticky top-0 z-20 bg-j-bg/95 backdrop-blur-md border border-j-border mb-10 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {language === 'es' ? 'Hub Unificado' : 'Unified Hub'}
              </p>
              <p className="text-sm text-j-text-secondary">
                {language === 'es'
                  ? 'Currícula, cursos de YouTube y recursos externos en un solo flujo.'
                  : 'Curriculum, YouTube courses, and external resources in one flow.'}
              </p>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => setShowAddResource(true)}
                className="flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors"
              >
                <Plus size={14} />
                {language === 'es' ? 'Recurso' : 'Resource'}
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <TabButton
              active={activeView === 'all'}
              onClick={() => setActivePhase('all')}
              label={language === 'es' ? 'Currícula' : 'Curriculum'}
              icon={<Layers size={13} />}
              badge={totalPhaseResources}
            />

            {isLoggedIn && (
              <TabButton
                active={activeView === 'courses'}
                onClick={() => setActivePhase('courses')}
                label={language === 'es' ? 'Cursos' : 'Courses'}
                icon={<Video size={13} />}
                badge={pipelineCourses.length}
              />
            )}

            {isLoggedIn && (
              <TabButton
                active={activeView === 'external'}
                onClick={() => setActivePhase('external')}
                label={language === 'es' ? 'Mis Recursos' : 'My Resources'}
                icon={<Sparkles size={13} />}
                badge={userResources.length}
              />
            )}

            {phases.map((phase) => {
              const phaseResources = byPhase[phase];
              const evaluated = phaseResources.filter((r) => r.evalStats !== null).length;
              const isComplete = phaseResources.length > 0 && evaluated === phaseResources.length;
              const hasProgress = evaluated > 0;

              return (
                <TabButton
                  key={phase}
                  active={activeView === phase}
                  onClick={() => setActivePhase(phase)}
                  label={`${phase.toString().padStart(2, '0')} · ${phaseNames[phase] || phase}`}
                  icon={<BookOpen size={13} />}
                  dot={isLoggedIn && hasProgress ? (isComplete ? 'complete' : 'partial') : undefined}
                />
              );
            })}
          </div>
        </div>
      </div>

      {isLoggedIn && <InsightBar language={language} />}

      {activeView === 'courses' && isLoggedIn && (
        <section className="mb-16">
          <div className="mb-6 border border-j-border bg-j-surface/50 p-4 sm:p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {language === 'es' ? 'Studio de Cursos' : 'Course Studio'}
            </p>
            <p className="mt-2 text-sm text-j-text-secondary">
              {language === 'es'
                ? 'Creá cursos desde YouTube y se integran automáticamente a la currícula, evaluación y Mi Sistema.'
                : 'Create courses from YouTube and they are automatically integrated into curriculum, evaluation, and My System.'}
            </p>
          </div>
          <DashboardContent courses={pipelineCourses} language={language} />
        </section>
      )}

      {activeView === 'external' && isLoggedIn && (
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
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
        </section>
      )}

      {activeView !== 'external' && activeView !== 'courses' && visiblePhases.map((phase) => {
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

      {activeView === 'all' && supplementaryResources.length > 0 && (
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
  dot,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  dot?: 'complete' | 'partial';
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-2 font-mono text-[11px] tracking-[0.12em] uppercase
        border transition-colors min-h-[44px] flex items-center
        ${active
          ? 'border-j-accent text-j-text bg-j-surface'
          : 'border-j-border text-j-text-tertiary hover:text-j-text-secondary hover:border-j-accent/40'
        }
      `}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              dot === 'complete' ? 'bg-j-accent' : 'bg-j-warm-dark'
            }`}
          />
        )}
        {badge !== undefined && (
          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-mono bg-j-accent/20 text-j-accent rounded-full">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}

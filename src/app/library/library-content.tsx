'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { t, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';
import { UserResourceCard } from './user-resource-card';
import { ProjectMilestone } from './project-milestone';
import { AddResourceModal } from '@/components/resources/AddResourceModal';
import { InsightBar } from '@/components/insights/InsightBar';
import { VoiceModeLauncher } from '@/components/voice/VoiceModeLauncher';

interface EvalStats {
  resourceId: string;
  bestScore: number;
  lastEvaluatedAt: string;
  evalCount: number;
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
  isLoggedIn: boolean;
  language: Language;
  phaseNames: Record<string, string>;
}

type ActivePhase = 'all' | 'external' | string;

export function LibraryContent({
  byPhase,
  projectsByPhase,
  supplementaryResources,
  userResources,
  isLoggedIn,
  language,
  phaseNames,
}: LibraryContentProps) {
  const router = useRouter();
  const [activePhase, setActivePhase] = useState<ActivePhase>('all');
  const [hydrated, setHydrated] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const phases = Object.keys(byPhase);

  useEffect(() => {
    const saved = localStorage.getItem('jarre-library-phase');
    setActivePhase(saved ?? '1');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem('jarre-library-phase', activePhase);
  }, [activePhase, hydrated]);

  const visiblePhases = activePhase === 'all' ? phases : [activePhase];

  return (
    <>
      {/* Phase Tab Bar */}
      <div className="sticky top-0 z-10 bg-j-bg/95 backdrop-blur-sm border-b border-j-border mb-10 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          <TabButton
            active={activePhase === 'all'}
            onClick={() => setActivePhase('all')}
            label={language === 'es' ? 'TODAS' : 'ALL'}
          />
          {phases.map((phase) => {
            const phaseResources = byPhase[phase];
            const evaluated = phaseResources.filter(r => r.evalStats !== null).length;
            const total = phaseResources.length;
            const hasProgress = evaluated > 0;
            const isComplete = evaluated === total;

            return (
              <TabButton
                key={phase}
                active={activePhase === phase}
                onClick={() => setActivePhase(phase)}
                label={phase.toString().padStart(2, '0')}
                dot={
                  isLoggedIn && hasProgress
                    ? isComplete ? 'complete' : 'partial'
                    : undefined
                }
              />
            );
          })}
          {isLoggedIn && (
            <button
              onClick={() => setShowAddResource(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase border-b-2 border-transparent text-j-accent hover:text-j-accent/80 transition-colors ml-auto"
            >
              <Plus size={14} />
              {language === 'es' ? 'Recurso' : 'Resource'}
            </button>
          )}
          {isLoggedIn && userResources.length > 0 && (
            <TabButton
              active={activePhase === 'external'}
              onClick={() => setActivePhase('external')}
              label="✦"
              badge={userResources.length}
            />
          )}
        </div>
      </div>

      {/* Insight suggestions */}
      {isLoggedIn && <InsightBar language={language} />}

      {/* External resources view */}
      {activePhase === 'external' && isLoggedIn && (
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <span className="font-mono text-3xl sm:text-5xl font-light text-j-border">
              ✦
            </span>
            <div>
              <h2 className="text-xl font-medium text-j-text">
                {language === 'es' ? 'Mis Recursos' : 'My Resources'}
              </h2>
              <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                {userResources.length} {language === 'es' ? 'externos' : 'external'}
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {userResources.map((ur) => (
              <UserResourceCard key={ur.id} resource={ur} language={language} />
            ))}
          </div>
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

      {/* Resources by Phase */}
      {activePhase !== 'external' && visiblePhases.map((phase) => {
        const phaseResources = byPhase[phase];
        if (!phaseResources) return null;

        return (
          <section key={phase} className="mb-16">
            {/* Phase Header */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-3xl sm:text-5xl font-light text-j-border">
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
                      {phaseResources.filter(r => r.evalStats !== null).length} {t('library.evaluated', language)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Resource Grid */}
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

            {/* Project Milestone after this phase */}
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

      {/* Supplementary Resources - only in "all" view */}
      {activePhase === 'all' && supplementaryResources.length > 0 && (
        <details className="mb-16 group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-4 py-4 border-t border-b border-j-border hover:bg-j-bg-hover transition-colors">
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {language === 'es' ? 'Recursos Complementarios' : 'Supplementary Resources'}
              </span>
              <span className="text-xs text-j-text-tertiary">
                ({supplementaryResources.length} videos)
              </span>
              <span className="ml-auto text-j-text-tertiary group-open:rotate-180 transition-transform">
                ▼
              </span>
            </div>
          </summary>
          <div className="pt-8">
            <p className="text-sm text-j-text-secondary mb-6">
              {language === 'es'
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

      {/* Add Resource Modal */}
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
  dot,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: 'complete' | 'partial';
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase
        border-b-2 transition-colors min-h-[44px] flex items-center
        ${active
          ? 'border-j-accent text-j-text'
          : 'border-transparent text-j-text-tertiary hover:text-j-text-secondary'
        }
      `}
    >
      <span className="flex items-center gap-1.5">
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

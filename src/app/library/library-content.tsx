'use client';

import { useState, useEffect } from 'react';
import { t, type Language } from '@/lib/translations';
import { ResourceCard } from './resource-card';
import { ProjectMilestone } from './project-milestone';

interface EvalStats {
  resourceId: string;
  bestScore: number;
  lastEvaluatedAt: string;
  evalCount: number;
}

export interface ResourceWithStatus {
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

export interface ProjectWithDetails {
  id: string;
  title: string;
  phase: string;
  description: string;
  deliverables: string[];
  status: string;
  concepts: Array<{ id: string; name: string }>;
}

interface LibraryContentProps {
  byPhase: Record<string, ResourceWithStatus[]>;
  projectsByPhase: Record<string, ProjectWithDetails>;
  supplementaryResources: ResourceWithStatus[];
  isLoggedIn: boolean;
  language: Language;
  phaseNames: Record<string, string>;
}

type ActivePhase = 'all' | string;

export function LibraryContent({
  byPhase,
  projectsByPhase,
  supplementaryResources,
  isLoggedIn,
  language,
  phaseNames,
}: LibraryContentProps) {
  const [activePhase, setActivePhase] = useState<ActivePhase>('all');
  const [hydrated, setHydrated] = useState(false);
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
      <div className="sticky top-0 z-10 bg-j-bg/95 backdrop-blur-sm border-b border-j-border mb-10 -mx-8 px-8">
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
        </div>
      </div>

      {/* Resources by Phase */}
      {visiblePhases.map((phase) => {
        const phaseResources = byPhase[phase];
        if (!phaseResources) return null;

        return (
          <section key={phase} className="mb-16">
            {/* Phase Header */}
            <div className="flex items-center gap-4 mb-8">
              <span className="font-mono text-5xl font-light text-j-border">
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}

function TabButton({
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
        flex-shrink-0 px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase
        border-b-2 transition-colors
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
      </span>
    </button>
  );
}

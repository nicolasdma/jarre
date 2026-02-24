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

interface PipelineCourse {
  id: string;
  title: string;
  url: string | null;
  type: string;
  activate_data: { summary?: string } | null;
}

interface LibraryContentProps {
  byPhase: Record<string, ResourceWithStatus[]>;
  projectsByPhase: Record<string, ProjectWithDetails>;
  supplementaryResources: ResourceWithStatus[];
  userResources: UserResource[];
  pipelineCourses?: PipelineCourse[];
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
  const [activePhase, setActivePhase] = useState<ActivePhase>('all');
  const [hydrated, setHydrated] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
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
            <TabButton
              active={activePhase === 'courses'}
              onClick={() => setActivePhase('courses')}
              label={language === 'es' ? 'CURSOS' : 'COURSES'}
              badge={pipelineCourses.length > 0 ? pipelineCourses.length : undefined}
            />
          )}
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

      {/* Pipeline Courses view */}
      {activePhase === 'courses' && isLoggedIn && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <span className="font-mono text-3xl sm:text-5xl font-light text-j-border">
                ▶
              </span>
              <div>
                <h2 className="text-xl font-medium text-j-text">
                  {language === 'es' ? 'Mis Cursos' : 'My Courses'}
                </h2>
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                  {pipelineCourses.length > 0
                    ? `${pipelineCourses.length} ${language === 'es' ? 'generados desde YouTube' : 'generated from YouTube'}`
                    : (language === 'es' ? 'Pega una URL de YouTube y genera un curso completo' : 'Paste a YouTube URL and generate a full course')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateCourse(true)}
              className="flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors"
            >
              <Plus size={14} />
              {language === 'es' ? 'Crear Curso' : 'Create Course'}
            </button>
          </div>

          {pipelineCourses.length === 0 && (
            <div className="text-center py-16 border border-dashed border-j-border">
              <p className="text-4xl mb-4">▶</p>
              <p className="text-j-text-secondary mb-6">
                {language === 'es'
                  ? 'Aún no has creado ningún curso. Pega una URL de YouTube para empezar.'
                  : 'You haven\'t created any courses yet. Paste a YouTube URL to get started.'}
              </p>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="px-6 py-2.5 font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors"
              >
                {language === 'es' ? 'Crear mi primer curso' : 'Create my first course'}
              </button>
            </div>
          )}

          {pipelineCourses.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pipelineCourses.map((course) => (
                <a
                  key={course.id}
                  href={`/learn/${course.id}`}
                  className="group block p-6 border border-j-border hover:border-j-accent transition-colors"
                >
                  <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                    {course.type}
                  </p>
                  <h3 className="text-j-text group-hover:text-j-accent transition-colors mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.activate_data?.summary && (
                    <p className="text-xs text-j-text-secondary line-clamp-3">
                      {course.activate_data.summary}
                    </p>
                  )}
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Resources by Phase */}
      {activePhase !== 'external' && activePhase !== 'courses' && visiblePhases.map((phase) => {
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

      {/* Create Course Modal */}
      {showCreateCourse && (
        <CreateCourseModal
          onClose={() => setShowCreateCourse(false)}
          language={language}
          onComplete={() => {
            setShowCreateCourse(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

const STAGE_LABELS: Record<string, Record<string, string>> = {
  es: {
    resolve: 'Descargando transcripción...',
    segment: 'Segmentando contenido...',
    content: 'Generando secciones...',
    video_map: 'Mapeando video...',
    concepts: 'Enlazando conceptos...',
    write_db: 'Guardando en base de datos...',
  },
  en: {
    resolve: 'Downloading transcript...',
    segment: 'Segmenting content...',
    content: 'Generating sections...',
    video_map: 'Mapping video...',
    concepts: 'Linking concepts...',
    write_db: 'Writing to database...',
  },
};

function CreateCourseModal({
  onClose,
  language,
  onComplete,
}: {
  onClose: () => void;
  language: Language;
  onComplete: () => void;
}) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle'); // idle | polling | completed | failed
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stagesCompleted, setStagesCompleted] = useState(0);
  const [totalStages, setTotalStages] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), title: title.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error creating course');
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      setJobId(data.jobId);
      setStatus('polling');
    } catch {
      setError(language === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll for pipeline status
  useEffect(() => {
    if (status !== 'polling' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pipeline/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        setCurrentStage(data.currentStage);
        setStagesCompleted(data.stagesCompleted);
        setTotalStages(data.totalStages);

        if (data.status === 'completed') {
          setStatus('completed');
          setResourceId(data.resourceId);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.error || 'Pipeline failed');
          clearInterval(interval);
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, jobId]);

  const progressPercent = totalStages > 0 ? Math.round((stagesCompleted / totalStages) * 100) : 0;
  const labels = STAGE_LABELS[language] || STAGE_LABELS.es;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-j-bg border border-j-border w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg text-j-text">
            {language === 'es' ? 'Crear Curso desde YouTube' : 'Create Course from YouTube'}
          </h2>
          <button
            onClick={onClose}
            className="text-j-text-tertiary hover:text-j-text transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {status === 'idle' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase block mb-2">
                  YouTube URL *
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 border border-j-border bg-transparent text-j-text text-sm focus:border-j-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase block mb-2">
                  {language === 'es' ? 'Título (opcional)' : 'Title (optional)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'es' ? 'Se detecta automáticamente' : 'Auto-detected from video'}
                  className="w-full px-3 py-2 border border-j-border bg-transparent text-j-text text-sm focus:border-j-accent focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-j-error">{error}</p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 font-mono text-[11px] tracking-[0.15em] uppercase text-j-text-tertiary hover:text-j-text transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !url.trim()}
                className="px-4 py-2 font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {submitting
                  ? (language === 'es' ? 'Creando...' : 'Creating...')
                  : (language === 'es' ? 'Crear Curso' : 'Create Course')}
              </button>
            </div>
          </>
        )}

        {(status === 'polling' || status === 'completed' || status === 'failed') && (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
                  {language === 'es' ? 'Progreso' : 'Progress'}
                </span>
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  {stagesCompleted}/{totalStages}
                </span>
              </div>
              <div className="w-full h-2 bg-j-border overflow-hidden">
                <div
                  className="h-full bg-j-accent transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Current stage */}
            {status === 'polling' && currentStage && (
              <p className="text-sm text-j-text-secondary animate-pulse">
                {labels[currentStage] || currentStage}
              </p>
            )}

            {/* Completed */}
            {status === 'completed' && (
              <div className="text-center py-4">
                <p className="text-j-accent mb-4">
                  {language === 'es' ? '¡Curso creado exitosamente!' : 'Course created successfully!'}
                </p>
                <button
                  onClick={() => {
                    if (resourceId) {
                      router.push(`/learn/${resourceId}`);
                    } else {
                      onComplete();
                    }
                  }}
                  className="px-6 py-2 font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-colors"
                >
                  {language === 'es' ? 'Ir al Curso →' : 'Go to Course →'}
                </button>
              </div>
            )}

            {/* Failed */}
            {status === 'failed' && (
              <div className="py-4">
                <p className="text-j-error text-sm mb-2">
                  {language === 'es' ? 'Error en el pipeline:' : 'Pipeline error:'}
                </p>
                <p className="text-xs text-j-text-secondary">{error}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setJobId(null);
                    setError(null);
                    setStagesCompleted(0);
                  }}
                  className="mt-4 px-4 py-2 font-mono text-[11px] tracking-[0.15em] uppercase border border-j-border text-j-text-tertiary hover:text-j-text transition-colors"
                >
                  {language === 'es' ? 'Intentar de nuevo' : 'Try again'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
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

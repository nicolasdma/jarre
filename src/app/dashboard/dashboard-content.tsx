'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PricingModal } from '@/components/billing/pricing-modal';
import type { Language } from '@/lib/translations';
import { PipelineCourseCard, type PipelineCourseData } from './pipeline-course-card';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import { isValidYoutubeUrl } from '@/lib/utils/youtube';

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

const PENDING_JOB_KEY = 'jarre-pending-job';

const EXAMPLE_VIDEOS = [
  {
    title: '3Blue1Brown — But what is a neural network?',
    url: 'https://www.youtube.com/watch?v=aircAruvnKk',
    videoId: 'aircAruvnKk',
  },
  {
    title: 'Fireship — 100+ Computer Science Concepts Explained',
    url: 'https://www.youtube.com/watch?v=XASY30EfGAc',
    videoId: 'XASY30EfGAc',
  },
  {
    title: 'Veritasium — The Surprising Secret of Synchronization',
    url: 'https://www.youtube.com/watch?v=t-_VPRCtiUg',
    videoId: 't-_VPRCtiUg',
  },
];

type PipelineStatus = 'idle' | 'submitting' | 'polling' | 'completed' | 'failed';
type IntakeMode = 'course' | 'external';
type ExternalResourceType = 'youtube' | 'article' | 'paper' | 'book' | 'podcast' | 'other';
type ExternalStatus = 'idle' | 'submitting' | 'completed' | 'failed';

const EXTERNAL_RESOURCE_TYPES: Array<{
  value: ExternalResourceType;
  label: { es: string; en: string };
}> = [
  { value: 'youtube', label: { es: 'YouTube', en: 'YouTube' } },
  { value: 'article', label: { es: 'Artículo', en: 'Article' } },
  { value: 'paper', label: { es: 'Paper', en: 'Paper' } },
  { value: 'book', label: { es: 'Libro', en: 'Book' } },
  { value: 'podcast', label: { es: 'Podcast', en: 'Podcast' } },
  { value: 'other', label: { es: 'Otro', en: 'Other' } },
];

interface DashboardContentProps {
  courses: PipelineCourseData[];
  language: Language;
  onExternalResourceAdded?: () => void;
}

const MAX_STAGGER_ITEMS = 9;

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const immediateVariants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export function DashboardContent({ courses, language, onExternalResourceAdded }: DashboardContentProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [mode, setMode] = useState<IntakeMode>('course');
  const [url, setUrl] = useState('');
  const [externalTitle, setExternalTitle] = useState('');
  const [externalType, setExternalType] = useState<ExternalResourceType>('youtube');
  const [externalNotes, setExternalNotes] = useState('');
  const [externalStatus, setExternalStatus] = useState<ExternalStatus>('idle');
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalResourceId, setExternalResourceId] = useState<string | null>(null);

  // Pipeline state
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stagesCompleted, setStagesCompleted] = useState(0);
  const [totalStages, setTotalStages] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [resourceId, setResourceId] = useState<string | null>(null);

  const isProcessing = status === 'submitting' || status === 'polling';
  const isExternalProcessing = externalStatus === 'submitting';
  const labels = STAGE_LABELS[language] || STAGE_LABELS.es;
  const progressPercent = totalStages > 0 ? Math.round((stagesCompleted / totalStages) * 100) : 0;

  const handleCourseSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed || isProcessing) return;

    // Client-side YouTube URL validation
    if (!isValidYoutubeUrl(trimmed)) {
      setError(language === 'es'
        ? 'Por favor ingresa una URL válida de YouTube.'
        : 'Please enter a valid YouTube URL.');
      setStatus('failed');
      return;
    }

    setStatus('submitting');
    setError(null);
    setNeedsAuth(false);
    setNeedsUpgrade(false);

    try {
      const res = await fetchWithKeys('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (res.status === 401) {
        setNeedsAuth(true);
        setStatus('failed');
        return;
      }

      if (res.status === 429) {
        setNeedsUpgrade(true);
        setError(language === 'es'
          ? 'Alcanzaste tu limite mensual de tokens.'
          : 'Monthly token limit exceeded.');
        setStatus('failed');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error creating course');
        setStatus('failed');
        return;
      }

      const data = await res.json();

      if (data.alreadyExists) {
        setResourceId(data.resourceId);
        setStatus('completed');
        return;
      }

      setJobId(data.jobId);
      localStorage.setItem(PENDING_JOB_KEY, data.jobId);
      setStatus('polling');
    } catch {
      setError(language === 'es' ? 'Error de conexión' : 'Connection error');
      setStatus('failed');
    }
  };

  const handleExternalSubmit = async () => {
    if (isExternalProcessing) return;

    const trimmedUrl = url.trim();
    const trimmedTitle = externalTitle.trim();
    const trimmedNotes = externalNotes.trim();

    if (!trimmedTitle) {
      setExternalError(language === 'es' ? 'El título es obligatorio.' : 'Title is required.');
      setExternalStatus('failed');
      return;
    }

    if (!trimmedUrl && !trimmedNotes) {
      setExternalError(language === 'es' ? 'Ingresá una URL o notas.' : 'Provide a URL or notes.');
      setExternalStatus('failed');
      return;
    }

    setExternalStatus('submitting');
    setExternalError(null);
    setExternalResourceId(null);

    try {
      const res = await fetchWithKeys('/api/resources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          url: trimmedUrl || undefined,
          type: externalType,
          userNotes: trimmedNotes || undefined,
        }),
      });

      if (res.status === 401) {
        setExternalStatus('failed');
        setExternalError(language === 'es' ? 'Inicia sesión para agregar recursos.' : 'Log in to add resources.');
        return;
      }

      if (res.status === 429) {
        setExternalStatus('failed');
        setExternalError(language === 'es' ? 'Alcanzaste tu límite mensual de tokens.' : 'Monthly token limit exceeded.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        setExternalStatus('failed');
        setExternalError(data.error || (language === 'es' ? 'No se pudo procesar el recurso.' : 'Failed to process resource.'));
        return;
      }

      const data = await res.json() as { resourceId?: string };
      setExternalResourceId(data.resourceId || null);
      setExternalStatus('completed');
      onExternalResourceAdded?.();
    } catch {
      setExternalStatus('failed');
      setExternalError(language === 'es' ? 'Error de conexión' : 'Connection error');
    }
  };

  const handleSubmit = async () => {
    if (mode === 'course') {
      await handleCourseSubmit();
      return;
    }

    await handleExternalSubmit();
  };

  const pollErrorCountRef = useRef(0);

  // Recover pending job from localStorage on mount
  useEffect(() => {
    try {
      const savedJobId = localStorage.getItem(PENDING_JOB_KEY);
      if (!savedJobId || jobId) return;

      // Check if the job is still running
      fetchWithKeys(`/api/pipeline/${savedJobId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) {
            localStorage.removeItem(PENDING_JOB_KEY);
            return;
          }
          if (data.status === 'completed') {
            localStorage.removeItem(PENDING_JOB_KEY);
            if (data.resourceId) {
              setResourceId(data.resourceId);
              setStatus('completed');
            }
          } else if (data.status === 'failed') {
            localStorage.removeItem(PENDING_JOB_KEY);
          } else {
            // Still running — resume polling
            setJobId(savedJobId);
            setStatus('polling');
            if (data.currentStage) setCurrentStage(data.currentStage);
            if (data.stagesCompleted) setStagesCompleted(data.stagesCompleted);
            if (data.totalStages) setTotalStages(data.totalStages);
          }
        })
        .catch(() => {
          localStorage.removeItem(PENDING_JOB_KEY);
        });
    } catch {
      // localStorage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for pipeline status
  useEffect(() => {
    if (status !== 'polling' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithKeys(`/api/pipeline/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        pollErrorCountRef.current = 0;
        setCurrentStage(data.currentStage);
        setStagesCompleted(data.stagesCompleted);
        setTotalStages(data.totalStages);

        if (data.status === 'completed') {
          setStatus('completed');
          setResourceId(data.resourceId);
          localStorage.removeItem(PENDING_JOB_KEY);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setError(data.error || 'Pipeline failed');
          localStorage.removeItem(PENDING_JOB_KEY);
          clearInterval(interval);
        }
      } catch {
        pollErrorCountRef.current += 1;
        if (pollErrorCountRef.current >= 3) {
          setStatus('failed');
          setError(language === 'es'
            ? 'Se perdió la conexión con el servidor. Intenta recargar la página.'
            : 'Lost connection to server. Try reloading the page.');
          localStorage.removeItem(PENDING_JOB_KEY);
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, jobId, language]);

  // Auto-navigate on completion
  useEffect(() => {
    if (status === 'completed' && resourceId) {
      router.push(`/learn/${resourceId}`);
    }
  }, [status, resourceId, router]);

  const resetPipeline = () => {
    setStatus('idle');
    setJobId(null);
    setError(null);
    setNeedsAuth(false);
    setNeedsUpgrade(false);
    setUrl('');
    setStagesCompleted(0);
    setCurrentStage(null);
    setResourceId(null);
    localStorage.removeItem(PENDING_JOB_KEY);
  };

  const resetExternal = () => {
    setExternalStatus('idle');
    setExternalError(null);
    setExternalResourceId(null);
    setExternalTitle('');
    setExternalType('youtube');
    setExternalNotes('');
    setUrl('');
  };

  return (
    <>
      {/* Hero Input */}
      <div className="mb-12">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            disabled={isProcessing || isExternalProcessing}
            onClick={() => setMode('course')}
            className={`px-3 py-1.5 text-[11px] font-mono tracking-[0.12em] uppercase border transition-colors ${
              mode === 'course'
                ? 'border-j-accent text-j-accent bg-j-accent/10'
                : 'border-j-border text-j-text-tertiary hover:text-j-text'
            } disabled:opacity-50`}
          >
            {language === 'es' ? 'Curso YouTube' : 'YouTube Course'}
          </button>
          <button
            type="button"
            disabled={isProcessing || isExternalProcessing}
            onClick={() => setMode('external')}
            className={`px-3 py-1.5 text-[11px] font-mono tracking-[0.12em] uppercase border transition-colors ${
              mode === 'external'
                ? 'border-j-accent text-j-accent bg-j-accent/10'
                : 'border-j-border text-j-text-tertiary hover:text-j-text'
            } disabled:opacity-50`}
          >
            {language === 'es' ? 'Recurso Externo' : 'External Resource'}
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-3"
        >
          {mode === 'external' && (
            <input
              type="text"
              value={externalTitle}
              onChange={(e) => setExternalTitle(e.target.value)}
              disabled={isExternalProcessing}
              placeholder={language === 'es' ? 'Título del recurso' : 'Resource title'}
              className="w-full px-4 py-3 bg-j-surface border border-j-border rounded-xl text-j-text text-sm placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60 transition-colors"
            />
          )}

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isProcessing || isExternalProcessing}
            placeholder={mode === 'course'
              ? (language === 'es' ? 'Pega un link de YouTube. Nosotros hacemos el resto.' : "Paste a YouTube link. We'll do the rest.")
              : (language === 'es' ? 'URL del recurso (opcional si agregás notas)' : 'Resource URL (optional if you add notes)')}
            className="w-full px-4 py-3 bg-j-surface border border-j-border rounded-xl text-j-text text-sm placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60 transition-colors"
          />

          {mode === 'external' && (
            <>
              <div className="flex flex-wrap gap-2">
                {EXTERNAL_RESOURCE_TYPES.map((typeOption) => (
                  <button
                    key={typeOption.value}
                    type="button"
                    disabled={isExternalProcessing}
                    onClick={() => setExternalType(typeOption.value)}
                    className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] border transition-colors ${
                      externalType === typeOption.value
                        ? 'border-j-accent text-j-accent bg-j-accent/10'
                        : 'border-j-border text-j-text-tertiary hover:text-j-text'
                    } disabled:opacity-50`}
                  >
                    {typeOption.label[language]}
                  </button>
                ))}
              </div>
              <textarea
                value={externalNotes}
                onChange={(e) => setExternalNotes(e.target.value)}
                disabled={isExternalProcessing}
                rows={4}
                placeholder={language === 'es'
                  ? 'Notas opcionales: ideas clave, resumen, aprendizajes...'
                  : 'Optional notes: key ideas, summary, learnings...'}
                className="w-full px-4 py-3 bg-j-surface border border-j-border rounded-xl text-j-text text-sm placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60 transition-colors resize-y"
              />
            </>
          )}

          <button
            type="submit"
            disabled={mode === 'course'
              ? (!url.trim() || isProcessing)
              : (isExternalProcessing || !externalTitle.trim() || (!url.trim() && !externalNotes.trim()))}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-j-text text-j-bg hover:bg-j-accent transition-colors disabled:opacity-30 disabled:hover:bg-j-text"
          >
            <ArrowUp size={16} />
            <span className="font-mono text-[11px] tracking-[0.15em] uppercase">
              {mode === 'course'
                ? (language === 'es' ? 'Generar curso' : 'Generate course')
                : (language === 'es' ? 'Analizar recurso' : 'Analyze resource')}
            </span>
          </button>
        </form>

        {/* Inline progress */}
        {mode === 'course' && isProcessing && (
          <div className="mt-4 px-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-1 bg-j-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-j-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progressPercent, 5)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-j-text-tertiary shrink-0">
                {stagesCompleted}/{totalStages}
              </span>
            </div>
            {currentStage && (
              <p className="font-mono text-[11px] text-j-text-secondary animate-pulse">
                {labels[currentStage] || currentStage}
              </p>
            )}
            {status === 'submitting' && (
              <p className="font-mono text-[11px] text-j-text-secondary animate-pulse">
                {language === 'es' ? 'Iniciando pipeline...' : 'Starting pipeline...'}
              </p>
            )}
          </div>
        )}

        {/* Auth required */}
        {mode === 'course' && status === 'failed' && needsAuth && (
          <div className="mt-4 px-2 flex items-center gap-3">
            <p className="text-sm text-j-text-secondary flex-1">
              {language === 'es'
                ? 'Inicia sesión para generar cursos.'
                : 'Log in to generate courses.'}
              {' '}
              <Link href="/login" className="text-j-accent hover:underline">
                {language === 'es' ? 'Iniciar sesión' : 'Log in'}
              </Link>
            </p>
          </div>
        )}

        {/* Budget exceeded */}
        {mode === 'course' && status === 'failed' && needsUpgrade && (
          <div className="mt-4 px-2 flex items-center gap-3">
            <p className="text-sm text-j-error flex-1">{error}</p>
            <Link
              href="/settings"
              className="font-mono text-[11px] tracking-[0.15em] uppercase text-j-accent hover:underline shrink-0"
            >
              {language === 'es' ? 'API keys' : 'API keys'}
            </Link>
            <button
              onClick={() => setShowPricing(true)}
              className="font-mono text-[11px] tracking-[0.15em] uppercase text-j-accent hover:underline shrink-0"
            >
              Upgrade
            </button>
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
          </div>
        )}

        {/* Error */}
        {mode === 'course' && status === 'failed' && !needsAuth && !needsUpgrade && error && (
          <div className="mt-4 px-2 flex items-center gap-3">
            <p className="text-sm text-j-error flex-1">{error}</p>
            <button
              onClick={resetPipeline}
              className="font-mono text-[11px] tracking-[0.15em] uppercase text-j-text-tertiary hover:text-j-text transition-colors shrink-0"
            >
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        )}

        {/* Completed (brief flash before redirect) */}
        {mode === 'course' && status === 'completed' && (
          <div className="mt-4 px-2">
            <p className="font-mono text-[11px] text-j-accent">
              {language === 'es' ? 'Curso creado — redirigiendo...' : 'Course created — redirecting...'}
            </p>
          </div>
        )}

        {mode === 'external' && externalStatus === 'submitting' && (
          <div className="mt-4 px-2">
            <p className="font-mono text-[11px] text-j-text-secondary animate-pulse">
              {language === 'es' ? 'Analizando y vinculando al currículo...' : 'Analyzing and linking to curriculum...'}
            </p>
          </div>
        )}

        {mode === 'external' && externalStatus === 'failed' && externalError && (
          <div className="mt-4 px-2 flex items-center gap-3">
            <p className="text-sm text-j-error flex-1">{externalError}</p>
            <button
              onClick={resetExternal}
              className="font-mono text-[11px] tracking-[0.15em] uppercase text-j-text-tertiary hover:text-j-text transition-colors shrink-0"
            >
              {language === 'es' ? 'Reintentar' : 'Retry'}
            </button>
          </div>
        )}

        {mode === 'external' && externalStatus === 'completed' && (
          <div className="mt-4 px-2 flex items-center gap-3">
            <p className="text-sm text-j-accent flex-1">
              {language === 'es' ? 'Recurso analizado y guardado.' : 'Resource analyzed and saved.'}
            </p>
            {externalResourceId && (
              <Link
                href={`/resources/${externalResourceId}`}
                className="font-mono text-[11px] tracking-[0.15em] uppercase text-j-accent hover:underline shrink-0"
              >
                {language === 'es' ? 'Abrir' : 'Open'}
              </Link>
            )}
          </div>
        )}

      </div>

      {/* Section header */}
      {courses.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase shrink-0">
            {language === 'es' ? 'Cursos' : 'Courses'}
            <span className="ml-2 text-j-text-secondary">({courses.length})</span>
          </h2>
        </div>
      )}

      {/* Course grid */}
      {courses.length > 0 && (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                variants={prefersReducedMotion ? undefined : (index < MAX_STAGGER_ITEMS ? itemVariants : immediateVariants)}
                layout
                exit="exit"
              >
                <PipelineCourseCard course={course} language={language} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty state — only when idle and no courses */}
      {mode === 'course' && courses.length === 0 && status === 'idle' && (
        <div className="py-12">
          <p className="text-sm text-j-text-tertiary text-center mb-8">
            {language === 'es'
              ? 'Pega un link de YouTube arriba para generar tu primer curso, o prueba con uno de estos:'
              : 'Paste a YouTube link above to generate your first course, or try one of these:'}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {EXAMPLE_VIDEOS.map((video) => (
              <button
                key={video.videoId}
                onClick={() => setUrl(video.url)}
                className="group text-left overflow-hidden rounded-xl border border-j-border bg-j-surface hover:border-j-accent/60 transition-all hover:shadow-md"
              >
                <div className="relative aspect-video bg-j-border/30 overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-j-text-secondary group-hover:text-j-accent transition-colors line-clamp-2">
                    {video.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

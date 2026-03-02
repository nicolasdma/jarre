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

interface DashboardContentProps {
  courses: PipelineCourseData[];
  language: Language;
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

export function DashboardContent({ courses, language }: DashboardContentProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [url, setUrl] = useState('');

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
  const labels = STAGE_LABELS[language] || STAGE_LABELS.es;
  const progressPercent = totalStages > 0 ? Math.round((stagesCompleted / totalStages) * 100) : 0;

  const handleSubmit = async () => {
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

  return (
    <>
      {/* Hero Input */}
      <div className="mb-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isProcessing}
            placeholder={language === 'es' ? 'Pega un link de YouTube. Nosotros hacemos el resto.' : "Paste a YouTube link. We'll do the rest."}
            className="w-full pl-5 pr-14 py-4 bg-j-surface border border-j-border rounded-full text-j-text text-base placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={!url.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-j-text text-j-bg hover:bg-j-accent transition-colors disabled:opacity-30 disabled:hover:bg-j-text"
          >
            <ArrowUp size={18} />
          </button>
        </form>

        {/* Inline progress */}
        {isProcessing && (
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
        {status === 'failed' && needsAuth && (
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
        {status === 'failed' && needsUpgrade && (
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
        {status === 'failed' && !needsAuth && !needsUpgrade && error && (
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
        {status === 'completed' && (
          <div className="mt-4 px-2">
            <p className="font-mono text-[11px] text-j-accent">
              {language === 'es' ? 'Curso creado — redirigiendo...' : 'Course created — redirecting...'}
            </p>
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
      {courses.length === 0 && status === 'idle' && (
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

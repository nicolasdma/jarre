'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import { isValidYoutubeUrl } from '@/lib/utils/youtube';
import type { Language } from '@/lib/translations';

type GenerationStatus = 'idle' | 'submitting' | 'polling' | 'failed';

const STAGE_LABELS: Record<Language, Record<string, string>> = {
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

interface MissingCourseContentProps {
  resourceId: string;
  resourceTitle: string;
  sourceUrl?: string | null;
  language: Language;
}

export function MissingCourseContent({
  resourceId,
  resourceTitle,
  sourceUrl,
  language,
}: MissingCourseContentProps) {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState(sourceUrl ?? '');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stagesCompleted, setStagesCompleted] = useState(0);
  const [totalStages, setTotalStages] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const isEs = language === 'es';
  const isProcessing = status === 'submitting' || status === 'polling';

  const progress = useMemo(() => {
    if (totalStages <= 0) return 0;
    return Math.round((stagesCompleted / totalStages) * 100);
  }, [stagesCompleted, totalStages]);

  const labels = STAGE_LABELS[language] || STAGE_LABELS.es;

  const startGeneration = async () => {
    if (isProcessing) return;

    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedUrl) {
      setStatus('failed');
      setError(isEs ? 'Pegá un link de YouTube para generar este recurso.' : 'Paste a YouTube link to generate this resource.');
      return;
    }

    if (!isValidYoutubeUrl(trimmedUrl)) {
      setStatus('failed');
      setError(isEs ? 'El link no parece una URL válida de YouTube.' : 'This does not look like a valid YouTube URL.');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetchWithKeys('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, url: trimmedUrl }),
      });

      if (res.status === 401) {
        setStatus('failed');
        setError(isEs ? 'Necesitás iniciar sesión para generar este recurso.' : 'You need to log in to generate this resource.');
        return;
      }

      if (res.status === 429) {
        setStatus('failed');
        setError(isEs ? 'Alcanzaste tu límite mensual de tokens.' : 'Monthly token limit exceeded.');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        setStatus('failed');
        setError(data.error || (isEs ? 'No se pudo iniciar la generación.' : 'Could not start generation.'));
        return;
      }

      const data = await res.json();

      if (data.alreadyExists && data.resourceId) {
        router.replace(`/learn/${data.resourceId}`);
        router.refresh();
        return;
      }

      if (!data.jobId) {
        setStatus('failed');
        setError(isEs ? 'No se recibió jobId del pipeline.' : 'Pipeline jobId was not returned.');
        return;
      }

      setJobId(data.jobId);
      setStatus('polling');
    } catch {
      setStatus('failed');
      setError(isEs ? 'Error de conexión al iniciar el pipeline.' : 'Connection error while starting the pipeline.');
    }
  };

  useEffect(() => {
    if (status !== 'polling' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithKeys(`/api/pipeline/${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        setCurrentStage(data.currentStage);
        setStagesCompleted(data.stagesCompleted || 0);
        setTotalStages(data.totalStages || 6);

        if (data.status === 'completed') {
          clearInterval(interval);
          const finalResourceId = data.resourceId || resourceId;
          router.replace(`/learn/${finalResourceId}`);
          router.refresh();
          return;
        }

        if (data.status === 'failed') {
          clearInterval(interval);
          setStatus('failed');
          setError(data.error || (isEs ? 'Falló la generación del contenido.' : 'Content generation failed.'));
        }
      } catch {
        // Keep polling; transient network errors are expected.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, jobId, resourceId, router, isEs]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-j-bg p-8">
      <div className="w-full max-w-xl border border-j-border bg-j-surface p-6 sm:p-8">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
          {isEs ? 'Contenido faltante' : 'Missing content'}
        </p>

        <h1 className="text-lg sm:text-xl text-j-text mb-2">{resourceTitle}</h1>
        <p className="text-sm text-j-text-secondary mb-6">
          {isEs
            ? 'Este recurso aún no tiene secciones generadas. Pegá o ajustá su link de YouTube para crearlas.'
            : 'This resource does not have generated sections yet. Paste or adjust its YouTube link to generate them.'}
        </p>

        <div className="mb-5">
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isProcessing}
            placeholder={isEs
              ? 'https://www.youtube.com/watch?v=...'
              : 'https://www.youtube.com/watch?v=...'}
            className="w-full px-4 py-3 bg-j-surface border border-j-border rounded-xl text-j-text text-sm placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60 transition-colors"
          />
          <p className="mt-2 text-xs text-j-text-tertiary">
            {isEs
              ? 'Si ya existía un link, podés corregirlo antes de generar.'
              : 'If a link already existed, you can correct it before generating.'}
          </p>
        </div>

        {isProcessing && (
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-1 bg-j-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-j-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-j-text-tertiary">
                {stagesCompleted}/{totalStages}
              </span>
            </div>
            <p className="font-mono text-[11px] text-j-text-secondary">
              {currentStage
                ? (labels[currentStage] || currentStage)
                : (isEs ? 'Iniciando pipeline...' : 'Starting pipeline...')}
            </p>
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-j-error">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={startGeneration}
            disabled={isProcessing}
            className="font-mono text-[11px] tracking-[0.15em] uppercase bg-j-accent text-j-text-on-accent px-4 py-2 hover:bg-j-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing
              ? (isEs ? 'Generando...' : 'Generating...')
              : (isEs ? 'Generar contenido' : 'Generate content')}
          </button>

          <Link href="/library" className="text-sm text-j-text-tertiary hover:text-j-text transition-colors">
            {isEs ? '← Volver a biblioteca' : '← Back to library'}
          </Link>
        </div>
      </div>
    </div>
  );
}

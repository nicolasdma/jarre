'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, Loader2 } from 'lucide-react';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import { isValidYoutubeUrl } from '@/lib/utils/youtube';
import type { Language } from '@/lib/translations';

type IntakeStatus = 'idle' | 'submitting' | 'polling' | 'completed' | 'failed';
type ResultKind = 'pipeline' | 'external';
type ExternalResourceType = 'youtube' | 'article' | 'paper' | 'book' | 'podcast' | 'other';

interface IntakeResult {
  kind: ResultKind;
  resourceId: string | null;
}

interface UnifiedIntakePanelProps {
  language: Language;
  onResourceAdded?: () => void;
}

const PENDING_JOB_KEY = 'jarre-unified-intake-job';

const STAGE_LABELS: Record<string, Record<string, string>> = {
  es: {
    resolve: 'Descargando transcripción...',
    segment: 'Segmentando contenido...',
    content: 'Generando secciones...',
    video_map: 'Mapeando video...',
    concepts: 'Vinculando conceptos...',
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

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/i);
  if (!match) return null;
  return match[0].replace(/[),.;!?]+$/, '');
}

function inferExternalType(input: string, url: string | null): ExternalResourceType {
  const source = `${input} ${url ?? ''}`.toLowerCase();

  if (url && isValidYoutubeUrl(url)) return 'youtube';
  if (source.includes('podcast') || source.includes('spotify.com/show') || source.includes('apple.com/podcast')) {
    return 'podcast';
  }
  if (source.includes('arxiv.org') || source.includes('doi.org') || source.includes('.pdf') || source.includes('paper')) {
    return 'paper';
  }
  if (source.includes('book') || source.includes('libro')) return 'book';
  if (url) return 'article';

  return 'other';
}

function inferTitle(input: string, url: string | null, language: Language): string {
  const withoutUrl = url ? input.replace(url, ' ') : input;
  const candidate = withoutUrl
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (candidate) return candidate.slice(0, 120);

  if (url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname
        .split('/')
        .filter(Boolean)
        .slice(0, 2)
        .join(' ')
        .replace(/[-_]/g, ' ')
        .trim();

      if (path) {
        return `${host} · ${path}`.slice(0, 120);
      }

      return host.slice(0, 120);
    } catch {
      // fall through to fallback
    }
  }

  return language === 'es' ? 'Recurso externo' : 'External resource';
}

function stripUrl(input: string, url: string | null): string {
  if (!url) return input.trim();
  return input.replace(url, ' ').replace(/\s+/g, ' ').trim();
}

export function UnifiedIntakePanel({ language, onResourceAdded }: UnifiedIntakePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<IntakeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [stagesCompleted, setStagesCompleted] = useState(0);
  const [totalStages, setTotalStages] = useState(6);
  const [result, setResult] = useState<IntakeResult | null>(null);

  const pollErrorCountRef = useRef(0);
  const labels = STAGE_LABELS[language] || STAGE_LABELS.es;
  const progressPercent = totalStages > 0 ? Math.round((stagesCompleted / totalStages) * 100) : 0;
  const isBusy = status === 'submitting' || status === 'polling';

  const submitLabel = useMemo(() => {
    if (isBusy) {
      return language === 'es' ? 'Procesando' : 'Processing';
    }
    return language === 'es' ? 'Agregar a mi currícula' : 'Add to curriculum';
  }, [isBusy, language]);

  const resetState = () => {
    setStatus('idle');
    setError(null);
    setNeedsAuth(false);
    setNeedsUpgrade(false);
    setJobId(null);
    setCurrentStage(null);
    setStagesCompleted(0);
    setTotalStages(6);
    setResult(null);
    localStorage.removeItem(PENDING_JOB_KEY);
  };

  const submitYoutube = async (url: string) => {
    const res = await fetchWithKeys('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (res.status === 401) {
      setNeedsAuth(true);
      setStatus('failed');
      return;
    }

    if (res.status === 429) {
      setNeedsUpgrade(true);
      setError(language === 'es' ? 'Alcanzaste tu límite mensual de tokens.' : 'Monthly token limit exceeded.');
      setStatus('failed');
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({} as { error?: string }));
      setError(data.error || (language === 'es' ? 'No se pudo iniciar el pipeline.' : 'Pipeline start failed.'));
      setStatus('failed');
      return;
    }

    const data = await res.json() as {
      jobId?: string;
      resourceId?: string;
      alreadyExists?: boolean;
    };

    if (data.alreadyExists) {
      setStatus('completed');
      setResult({ kind: 'pipeline', resourceId: data.resourceId || null });
      onResourceAdded?.();
      return;
    }

    if (!data.jobId) {
      setError(language === 'es' ? 'No se recibió jobId del pipeline.' : 'No pipeline jobId returned.');
      setStatus('failed');
      return;
    }

    setJobId(data.jobId);
    localStorage.setItem(PENDING_JOB_KEY, data.jobId);
    setStatus('polling');
  };

  const submitExternal = async (input: string, url: string | null) => {
    const notes = stripUrl(input, url);
    const title = inferTitle(input, url, language);
    const type = inferExternalType(input, url);

    if (!url && !notes) {
      setError(language === 'es' ? 'Agregá un link o una nota corta.' : 'Add a URL or a short note.');
      setStatus('failed');
      return;
    }

    const res = await fetchWithKeys('/api/resources/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        url: url || undefined,
        type,
        userNotes: notes || undefined,
      }),
    });

    if (res.status === 401) {
      setNeedsAuth(true);
      setStatus('failed');
      return;
    }

    if (res.status === 429) {
      setNeedsUpgrade(true);
      setError(language === 'es' ? 'Alcanzaste tu límite mensual de tokens.' : 'Monthly token limit exceeded.');
      setStatus('failed');
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({} as { error?: string }));
      setError(data.error || (language === 'es' ? 'No se pudo analizar el recurso.' : 'Could not analyze resource.'));
      setStatus('failed');
      return;
    }

    const data = await res.json() as { resourceId?: string };
    setStatus('completed');
    setResult({ kind: 'external', resourceId: data.resourceId || null });
    onResourceAdded?.();
  };

  const handleSubmit = async () => {
    if (isBusy) return;

    const input = prompt.trim();
    if (!input) return;

    setStatus('submitting');
    setError(null);
    setNeedsAuth(false);
    setNeedsUpgrade(false);
    setResult(null);

    const url = extractFirstUrl(input);
    const isYoutube = !!url && isValidYoutubeUrl(url);

    try {
      if (isYoutube && url) {
        await submitYoutube(url);
        return;
      }
      await submitExternal(input, url);
    } catch {
      setError(language === 'es' ? 'Error de conexión.' : 'Connection error.');
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (status !== 'polling' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetchWithKeys(`/api/pipeline/${jobId}`);
        if (!res.ok) return;

        const data = await res.json() as {
          status: string;
          currentStage?: string | null;
          stagesCompleted?: number;
          totalStages?: number;
          resourceId?: string | null;
          error?: string;
        };

        pollErrorCountRef.current = 0;
        setCurrentStage(data.currentStage || null);
        if (typeof data.stagesCompleted === 'number') setStagesCompleted(data.stagesCompleted);
        if (typeof data.totalStages === 'number') setTotalStages(data.totalStages);

        if (data.status === 'completed') {
          clearInterval(interval);
          localStorage.removeItem(PENDING_JOB_KEY);
          setStatus('completed');
          setResult({ kind: 'pipeline', resourceId: data.resourceId || null });
          onResourceAdded?.();
          return;
        }

        if (data.status === 'failed') {
          clearInterval(interval);
          localStorage.removeItem(PENDING_JOB_KEY);
          setStatus('failed');
          setError(data.error || (language === 'es' ? 'El pipeline falló.' : 'Pipeline failed.'));
        }
      } catch {
        pollErrorCountRef.current += 1;
        if (pollErrorCountRef.current >= 3) {
          clearInterval(interval);
          localStorage.removeItem(PENDING_JOB_KEY);
          setStatus('failed');
          setError(language === 'es'
            ? 'Se perdió la conexión con el servidor. Intentá nuevamente.'
            : 'Lost connection to server. Please try again.');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, language, onResourceAdded, status]);

  useEffect(() => {
    const savedJobId = localStorage.getItem(PENDING_JOB_KEY);
    if (!savedJobId || jobId) return;

    fetchWithKeys(`/api/pipeline/${savedJobId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          localStorage.removeItem(PENDING_JOB_KEY);
          return;
        }

        if (data.status === 'completed') {
          localStorage.removeItem(PENDING_JOB_KEY);
          setStatus('completed');
          setResult({ kind: 'pipeline', resourceId: data.resourceId || null });
          return;
        }

        if (data.status === 'failed') {
          localStorage.removeItem(PENDING_JOB_KEY);
          return;
        }

        setJobId(savedJobId);
        setStatus('polling');
        setCurrentStage(data.currentStage || null);
        if (typeof data.stagesCompleted === 'number') setStagesCompleted(data.stagesCompleted);
        if (typeof data.totalStages === 'number') setTotalStages(data.totalStages);
      })
      .catch(() => {
        localStorage.removeItem(PENDING_JOB_KEY);
      });
  }, [jobId]);

  return (
    <section className="mb-10 border border-j-border bg-j-surface/40 p-4 sm:p-5">
      <div className="mb-3">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
          {language === 'es' ? 'Entrada Unificada' : 'Unified Intake'}
        </p>
        <p className="mt-2 text-sm text-j-text-secondary">
          {language === 'es'
            ? 'Pegá un link de YouTube, artículo, paper o escribí notas. Lo procesamos y lo ubicamos en la sesión correcta de tu currícula.'
            : 'Paste a YouTube/video/article link or write notes. We process it and place it in the right curriculum session.'}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="space-y-3"
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          disabled={isBusy}
          placeholder={language === 'es'
            ? 'Ej: https://youtu.be/...\n o \nhttps://arxiv.org/... Este paper conecta con attention y optimización.'
            : 'Example: https://youtu.be/... or https://arxiv.org/... This connects with attention and optimization.'}
          className="w-full resize-y rounded-xl border border-j-border bg-j-bg px-4 py-3 text-sm text-j-text placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isBusy || !prompt.trim()}
          className="h-11 w-full rounded-xl bg-j-text px-4 text-[11px] font-mono uppercase tracking-[0.14em] text-j-bg transition-colors hover:bg-j-accent disabled:opacity-40"
        >
          <span className="inline-flex items-center gap-2">
            {isBusy ? <Loader2 size={15} className="animate-spin" /> : <ArrowUp size={15} />}
            {submitLabel}
          </span>
        </button>
      </form>

      {(status === 'submitting' || status === 'polling') && (
        <div className="mt-4 border-t border-j-border pt-4">
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-j-border">
            <div
              className="h-full rounded-full bg-j-accent transition-all duration-500"
              style={{ width: `${Math.max(progressPercent, status === 'submitting' ? 8 : 12)}%` }}
            />
          </div>
          <p className="font-mono text-[11px] text-j-text-secondary">
            {status === 'submitting'
              ? (language === 'es' ? 'Iniciando procesamiento...' : 'Starting processing...')
              : (currentStage ? (labels[currentStage] || currentStage) : (language === 'es' ? 'Procesando...' : 'Processing...'))}
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-4 border-t border-j-border pt-4 text-sm text-j-error">
          <p>{error || (language === 'es' ? 'No pudimos procesar este contenido.' : 'Could not process this content.')}</p>
          {needsAuth && (
            <p className="mt-2 text-j-text-secondary">
              {language === 'es' ? 'Necesitás iniciar sesión para guardar recursos.' : 'You need to log in to save resources.'}
            </p>
          )}
          {needsUpgrade && (
            <p className="mt-2 text-j-text-secondary">
              {language === 'es' ? 'Llegaste al límite mensual de tokens.' : 'You reached the monthly token limit.'}
            </p>
          )}
          <button
            type="button"
            onClick={resetState}
            className="mt-3 text-[11px] font-mono uppercase tracking-[0.14em] text-j-text-tertiary transition-colors hover:text-j-text"
          >
            {language === 'es' ? 'Limpiar' : 'Clear'}
          </button>
        </div>
      )}

      {status === 'completed' && result && (
        <div className="mt-4 border-t border-j-border pt-4 text-sm">
          <p className="text-j-accent">
            {result.kind === 'pipeline'
              ? (language === 'es' ? 'Curso generado y asignado a la currícula.' : 'Course generated and assigned to curriculum.')
              : (language === 'es' ? 'Recurso analizado y conectado a la currícula.' : 'Resource analyzed and linked to curriculum.')}
          </p>
          {result.resourceId && (
            <Link
              href={result.kind === 'pipeline' ? `/learn/${result.resourceId}` : `/resources/${result.resourceId}`}
              className="mt-2 inline-block text-[11px] font-mono uppercase tracking-[0.14em] text-j-accent transition-colors hover:underline"
            >
              {language === 'es' ? 'Abrir' : 'Open'}
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              resetState();
              setPrompt('');
            }}
            className="ml-4 text-[11px] font-mono uppercase tracking-[0.14em] text-j-text-tertiary transition-colors hover:text-j-text"
          >
            {language === 'es' ? 'Agregar otro' : 'Add another'}
          </button>
        </div>
      )}
    </section>
  );
}

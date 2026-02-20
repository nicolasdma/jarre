'use client';

import { useState } from 'react';
import { X, Plus, Loader2, ExternalLink, Link2, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '@/lib/translations';

type ResourceType = 'youtube' | 'article' | 'paper' | 'book' | 'podcast' | 'other';

interface ConceptLinkResult {
  extractedConceptName: string;
  curriculumConceptName: string;
  relationship: string;
  relevanceScore: number;
  explanation: string;
}

interface IngestResponse {
  resourceId: string;
  summary: string;
  extractedConcepts: Array<{ name: string; description: string; relevance: number }>;
  links: ConceptLinkResult[];
  coverageScore: number;
  totalTokensUsed: number;
}

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onResourceAdded?: () => void;
}

const RESOURCE_TYPES: { value: ResourceType; label: { es: string; en: string } }[] = [
  { value: 'youtube', label: { es: 'YouTube', en: 'YouTube' } },
  { value: 'article', label: { es: 'Artículo', en: 'Article' } },
  { value: 'paper', label: { es: 'Paper', en: 'Paper' } },
  { value: 'book', label: { es: 'Libro', en: 'Book' } },
  { value: 'podcast', label: { es: 'Podcast', en: 'Podcast' } },
  { value: 'other', label: { es: 'Otro', en: 'Other' } },
];

const RELATIONSHIP_LABELS: Record<string, { es: string; en: string }> = {
  extends: { es: 'Extiende', en: 'Extends' },
  applies: { es: 'Aplica', en: 'Applies' },
  contrasts: { es: 'Contrasta', en: 'Contrasts' },
  exemplifies: { es: 'Ejemplifica', en: 'Exemplifies' },
  relates: { es: 'Relaciona', en: 'Relates' },
};

export function AddResourceModal({ isOpen, onClose, language, onResourceAdded }: AddResourceModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ResourceType>('youtube');
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const lang = language;
  const isEs = lang === 'es';

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setType('youtube');
    setUserNotes('');
    setError(null);
    setResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError(isEs ? 'El título es obligatorio' : 'Title is required');
      return;
    }
    if (!url.trim() && !userNotes.trim()) {
      setError(isEs ? 'Ingresá una URL o notas' : 'Provide a URL or notes');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/resources/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim() || undefined,
          type,
          userNotes: userNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || (isEs ? 'Error al procesar el recurso' : 'Failed to process resource'));
      }

      const data: IngestResponse = await res.json();
      setResult(data);
      onResourceAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEs ? 'Error inesperado' : 'Unexpected error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-j-bg border border-j-border rounded-lg shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-j-border">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                {isEs ? 'Recurso Externo' : 'External Resource'}
              </p>
              <h2 className="text-xl font-semibold text-j-text mt-1">
                {isEs ? 'Agregar recurso' : 'Add resource'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-j-text-tertiary hover:text-j-text transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {!result ? (
              /* Input Form */
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block font-mono text-xs text-j-text-secondary mb-2">
                    {isEs ? 'Título' : 'Title'} *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isEs ? 'Nombre del recurso' : 'Resource name'}
                    className="w-full bg-transparent border border-j-border rounded px-3 py-2 text-sm text-j-text placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none transition-colors"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block font-mono text-xs text-j-text-secondary mb-2">URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-transparent border border-j-border rounded px-3 py-2 text-sm text-j-text placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none transition-colors"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block font-mono text-xs text-j-text-secondary mb-2">
                    {isEs ? 'Tipo' : 'Type'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {RESOURCE_TYPES.map((rt) => (
                      <button
                        key={rt.value}
                        onClick={() => setType(rt.value)}
                        className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                          type === rt.value
                            ? 'border-j-accent text-j-accent bg-j-accent/10'
                            : 'border-j-border text-j-text-tertiary hover:border-j-text-secondary'
                        }`}
                      >
                        {rt.label[lang]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-mono text-xs text-j-text-secondary mb-2">
                    {isEs ? 'Notas' : 'Notes'}
                    <span className="text-j-text-tertiary ml-2">
                      {isEs ? '(tus ideas, apuntes, o resumen del contenido)' : '(your ideas, notes, or content summary)'}
                    </span>
                  </label>
                  <textarea
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={4}
                    placeholder={isEs
                      ? 'Qué aprendiste, qué te llamó la atención, ideas clave...'
                      : 'What you learned, what caught your attention, key ideas...'}
                    className="w-full bg-transparent border border-j-border rounded px-3 py-2 text-sm text-j-text placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none transition-colors resize-y"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="space-y-1">
                    <p className="text-sm text-j-error">{error}</p>
                    <p className="text-xs text-j-text-tertiary">
                      {isEs ? 'Podés volver a intentar con el botón de abajo.' : 'You can try again with the button below.'}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-j-accent/10 border border-j-accent text-j-accent rounded font-mono text-sm hover:bg-j-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isEs ? 'Analizando...' : 'Analyzing...'}
                    </>
                  ) : error ? (
                    <>
                      <RefreshCw size={16} />
                      {isEs ? 'Reintentar análisis' : 'Retry analysis'}
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      {isEs ? 'Analizar y vincular' : 'Analyze & link'}
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Results View */
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                    {isEs ? 'Resumen' : 'Summary'}
                  </p>
                  <p className="text-sm text-j-text-secondary leading-relaxed">{result.summary}</p>
                </div>

                {/* Extracted Concepts */}
                <div>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                    {isEs ? 'Conceptos Extraídos' : 'Extracted Concepts'}
                    <span className="ml-2 text-j-accent">{result.extractedConcepts.length}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.extractedConcepts.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs font-mono bg-j-accent/5 border border-j-border rounded text-j-text-secondary"
                        title={c.description}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Curriculum Links */}
                {result.links.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                      {isEs ? 'Conexiones al Currículo' : 'Curriculum Connections'}
                      <span className="ml-2 text-j-accent">{result.links.length}</span>
                    </p>
                    <div className="space-y-2">
                      {result.links.map((link, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 border border-j-border rounded bg-j-accent/5"
                        >
                          <Link2 size={14} className="text-j-accent mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-j-text">
                                {link.curriculumConceptName}
                              </span>
                              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-j-accent/10 text-j-accent border border-j-accent/20">
                                {RELATIONSHIP_LABELS[link.relationship]?.[lang] || link.relationship}
                              </span>
                            </div>
                            <p className="text-xs text-j-text-tertiary mt-1">
                              {link.extractedConceptName} → {link.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.links.length === 0 && (
                  <p className="text-sm text-j-text-tertiary italic">
                    {isEs
                      ? 'No se encontraron conexiones directas con el currículo.'
                      : 'No direct curriculum connections found.'}
                  </p>
                )}

                {/* Coverage */}
                <div className="flex items-center gap-4 pt-2 border-t border-j-border">
                  <div>
                    <p className="font-mono text-[10px] text-j-text-tertiary uppercase">
                      {isEs ? 'Cobertura' : 'Coverage'}
                    </p>
                    <p className="text-lg font-light text-j-accent">
                      {Math.round(result.coverageScore * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-j-text-tertiary uppercase">
                      {isEs ? 'Tokens' : 'Tokens'}
                    </p>
                    <p className="text-lg font-light text-j-text-secondary">
                      {result.totalTokensUsed.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Link
                    href={`/resources/${result.resourceId}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-j-accent/10 border border-j-accent text-j-accent rounded font-mono text-sm hover:bg-j-accent/20 transition-colors"
                    onClick={handleClose}
                  >
                    {isEs ? 'Explorar recurso' : 'Explore resource'}
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    onClick={handleClose}
                    className="px-4 py-3 border border-j-border text-j-text-secondary rounded font-mono text-sm hover:border-j-accent hover:text-j-accent transition-colors"
                  >
                    {isEs ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import type { Language } from '@/lib/translations';

type CopilotTurn = {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: CopilotSuggestion[];
};

export type CopilotSuggestion = {
  title: string;
  url: string;
  type: 'youtube' | 'article' | 'paper' | 'book' | 'podcast' | 'other';
  phaseHint?: string;
  reason: string;
};

type CopilotResponse = {
  reply: string;
  suggestedResources: CopilotSuggestion[];
};

interface CurriculumCopilotDialogProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onUseSuggestion: (suggestion: CopilotSuggestion) => void;
}

export function CurriculumCopilotDialog({
  isOpen,
  onClose,
  language,
  onUseSuggestion,
}: CurriculumCopilotDialogProps) {
  const [turns, setTurns] = useState<CopilotTurn[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEs = language === 'es';
  const canSend = input.trim().length > 0 && !isLoading;

  const welcome = useMemo(
    () => (isEs
      ? 'Contame qué parte de la currícula te está costando y te propongo un ajuste concreto.'
      : 'Tell me which part of the curriculum is blocking you and I will suggest a concrete adjustment.'),
    [isEs],
  );

  if (!isOpen) return null;

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    const nextTurns = [...turns, { role: 'user' as const, content: userMessage }];
    setTurns(nextTurns);

    try {
      const res = await fetchWithKeys('/api/curriculum/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: nextTurns.map((turn) => ({ role: turn.role, content: turn.content })),
        }),
      });

      if (res.status === 401) {
        throw new Error(isEs ? 'Necesitas iniciar sesion para usar el copilot curricular.' : 'You need to sign in to use curriculum copilot.');
      }

      if (res.status === 429) {
        throw new Error(isEs ? 'Alcanzaste el limite mensual de tokens.' : 'Monthly token limit exceeded.');
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || (isEs ? 'No se pudo obtener respuesta del copilot.' : 'Could not get copilot response.'));
      }

      const data = await res.json() as CopilotResponse;

      setTurns((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.reply,
          suggestions: data.suggestedResources || [],
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEs ? 'Error inesperado.' : 'Unexpected error.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl border border-j-border bg-j-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-j-border px-4 py-3 sm:px-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-text-tertiary">
              {isEs ? 'Curriculum Copilot' : 'Curriculum Copilot'}
            </p>
            <p className="mt-1 text-sm text-j-text-secondary">{welcome}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-j-text-tertiary transition-colors hover:text-j-text"
            aria-label={isEs ? 'Cerrar' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {turns.length === 0 && (
            <div className="border border-dashed border-j-border p-4">
              <p className="text-sm text-j-text-secondary">
                {isEs
                  ? 'Ejemplo: "Me pierdo en makemore-bigram y no entiendo algebra lineal. Quiero una fase puente de 7 dias."'
                  : 'Example: "I get lost in makemore-bigram and don\'t understand linear algebra. I want a 7-day bridge phase."'}
              </p>
            </div>
          )}

          {turns.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`border p-3 ${
                turn.role === 'user'
                  ? 'ml-6 border-j-accent/40 bg-j-accent/5'
                  : 'mr-6 border-j-border bg-j-surface/40'
              }`}
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
                {turn.role === 'user' ? (isEs ? 'Tú' : 'You') : 'Jarre'}
              </p>
              <p className="whitespace-pre-wrap text-sm text-j-text">{turn.content}</p>

              {turn.role === 'assistant' && (turn.suggestions?.length || 0) > 0 && (
                <div className="mt-3 space-y-2 border-t border-j-border pt-3">
                  {turn.suggestions!.map((suggestion, suggestionIndex) => (
                    <div key={`${suggestion.url}-${suggestionIndex}`} className="border border-j-border bg-j-bg p-3">
                      <p className="text-sm text-j-text">{suggestion.title}</p>
                      <p className="mt-1 text-xs text-j-text-tertiary">{suggestion.reason}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {suggestion.phaseHint && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-j-accent">
                            {isEs ? `Fase sugerida ${suggestion.phaseHint}` : `Phase ${suggestion.phaseHint}`}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onUseSuggestion(suggestion)}
                          className="font-mono text-[10px] uppercase tracking-[0.14em] text-j-accent transition-colors hover:underline"
                        >
                          {isEs ? 'Usar en entrada unificada' : 'Use in unified intake'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-j-text-secondary">
              <Loader2 size={14} className="animate-spin" />
              {isEs ? 'Pensando ajuste curricular...' : 'Thinking through curriculum adjustment...'}
            </div>
          )}

          {error && (
            <p className="text-sm text-j-error">{error}</p>
          )}
        </div>

        <form onSubmit={sendMessage} className="border-t border-j-border px-4 py-3 sm:px-5">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              className="w-full resize-y border border-j-border bg-j-bg px-3 py-2 text-sm text-j-text placeholder:text-j-text-tertiary focus:border-j-accent focus:outline-none"
              placeholder={isEs
                ? 'Describe el bloqueo, objetivo y tiempo (ej: 7 dias, 90 min/dia).'
                : 'Describe the blocker, goal, and available time (e.g. 7 days, 90 min/day).'}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-10 items-center gap-2 bg-j-text px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-j-bg transition-colors hover:bg-j-accent disabled:opacity-40"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {isEs ? 'Enviar' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

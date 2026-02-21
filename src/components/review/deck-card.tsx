'use client';

import { OrbitalLines } from '@/components/ui/orbital-lines';

interface DeckCardProps {
  conceptId: string;
  conceptName: string;
  phase: number;
  masteryLevel: number;
  isUnlocked: boolean;
  totalCards: number;
  dueCards: number;
  nextDueAt: string | null;
  language: 'es' | 'en';
}

const MASTERY_LABELS: Record<number, { es: string; en: string }> = {
  0: { es: 'Expuesto', en: 'Exposed' },
  1: { es: 'Entendido', en: 'Understood' },
  2: { es: 'Aplicado', en: 'Applied' },
  3: { es: 'Criticado', en: 'Criticized' },
  4: { es: 'Enseñado', en: 'Taught' },
};

/** Simple numeric hash from string for deterministic variant selection */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function DeckCard({
  conceptId,
  conceptName,
  phase,
  masteryLevel,
  isUnlocked,
  totalCards,
  dueCards,
  nextDueAt,
  language,
}: DeckCardProps) {
  const daysUntilDue = nextDueAt
    ? Math.max(0, Math.ceil((new Date(nextDueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  if (!isUnlocked) {
    return (
      <div className="relative p-4 rounded-xl overflow-hidden border border-j-border/30 bg-white dark:bg-j-bg-card opacity-50">
        <OrbitalLines variant={hashCode(conceptId)} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase">
              Phase {phase}
            </span>
            <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase">
              🔒
            </span>
          </div>
          <p className="text-sm text-j-text-tertiary font-medium truncate">{conceptName}</p>
          <p className="text-[10px] text-j-text-tertiary mt-2">
            {language === 'es' ? 'Avanza en el learn flow' : 'Progress in learn flow'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-4 rounded-xl overflow-hidden border border-j-border/30 bg-white dark:bg-j-bg-card hover:border-j-accent/50 transition-all duration-300 j-card-orbital">
      <OrbitalLines variant={hashCode(conceptId)} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase">
            Phase {phase}
          </span>
          <span className="font-mono text-[9px] tracking-[0.1em] text-j-accent uppercase">
            {MASTERY_LABELS[masteryLevel]?.[language] || `Lvl ${masteryLevel}`}
          </span>
        </div>
        <p className="text-sm text-j-text font-medium truncate">{conceptName}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-mono text-[10px] text-j-text-tertiary">
            {totalCards} {language === 'es' ? 'tarjetas' : 'cards'}
          </span>
          {dueCards > 0 ? (
            <span className="font-mono text-[10px] tracking-[0.1em] bg-j-accent text-j-text-on-accent px-2 py-0.5 rounded-md">
              {dueCards} {language === 'es' ? 'pendientes' : 'due'}
            </span>
          ) : daysUntilDue !== null && daysUntilDue > 0 ? (
            <span className="font-mono text-[10px] text-j-text-tertiary">
              {language === 'es' ? `en ${daysUntilDue}d` : `in ${daysUntilDue}d`}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-j-accent">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

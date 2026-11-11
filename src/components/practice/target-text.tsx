import { cn } from '@/lib/utils';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { pronunciationFor } from '@/lib/practice/pronunciation';
import type { ExtraWord, TargetWord } from '@/lib/practice/scoring';

/**
 * Color only: no weight, size, padding or inserted text changes with the
 * state, so the target never moves while the learner speaks or after scoring.
 */
const STATE_CLASS = {
  plain: 'text-j-text-body',
  pending: 'text-j-text-body',
  said: 'text-j-success',
  // Counted as said, so the same green, with a dashed line that asks for a check by ear.
  alias: 'text-j-success underline decoration-dashed decoration-j-text-secondary decoration-1 underline-offset-4',
  missed: 'text-j-error underline decoration-dotted decoration-1 underline-offset-4',
} as const;

type Look = keyof typeof STATE_CLASS;

function lookOf(w: TargetWord, colored: boolean): Look {
  if (!colored) return 'plain';
  if (w.state === 'said') return w.viaAlias ? 'alias' : 'said';
  return w.state;
}

const LOOK_TITLE: Partial<Record<Look, string>> = {
  alias: 'Nombre: el reconocedor no lo conoce. Revisalo con el audio.',
};

interface TargetTextProps {
  /** From alignWords, always: before an attempt too, so the markup is the same before and after. */
  words: TargetWord[];
  terms: readonly KeyTerm[];
  /** Paint the attempt; false shows the plain text. */
  colored: boolean;
  /** Respellings under the key terms that have one. */
  showRespelling?: boolean;
  /** The word whose help is open. */
  activeIndex?: number | null;
  onWord?: (index: number, el: HTMLElement) => void;
}

/**
 * The drill's English text, one button per word (tap: how it sounds). A key
 * term's words are grouped so its respelling sits under the whole name.
 */
export function TargetText({ words, terms, colored, showRespelling = false, activeIndex = null, onWord }: TargetTextProps) {
  // Runs of words: a key term's words together, every other word alone.
  const runs: number[][] = [];
  words.forEach((w, i) => {
    const prev = runs[runs.length - 1];
    if (prev && w.term !== null && words[prev[0]].term === w.term) prev.push(i);
    else runs.push([i]);
  });

  const button = (i: number) => {
    const w = words[i];
    const look = lookOf(w, colored);
    return (
      <button
        type="button"
        data-word-index={i}
        data-word-state={colored ? (w.viaAlias ? 'alias' : w.state) : 'plain'}
        title={LOOK_TITLE[look]}
        onClick={(e) => onWord?.(i, e.currentTarget)}
        className={cn(
          'inline cursor-pointer p-0 text-left align-baseline [font:inherit]',
          'hover:bg-j-bg-alt focus-visible:outline focus-visible:outline-1 focus-visible:outline-j-accent',
          activeIndex === i && 'bg-j-accent-light',
          STATE_CLASS[look],
        )}
      >
        {w.word}
      </button>
    );
  };
  const wordsOf = (run: number[]) =>
    run.map((i, k) => (
      <span key={i}>
        {button(i)}
        {k < run.length - 1 ? ' ' : null}
      </span>
    ));

  return (
    <p className={cn('text-lg', showRespelling ? 'leading-[2.3]' : 'leading-relaxed')} lang="en" data-testid="target-text">
      {runs.map((run, r) => {
        const space = r < runs.length - 1 ? ' ' : null;
        const first = words[run[0]];
        const term = first.term !== null ? terms[first.term] ?? null : null;
        const say = term ? pronunciationFor(first.word, term)?.say ?? null : null;
        return (
          <span key={run[0]}>
            {showRespelling && say ? (
              <ruby className="[ruby-position:under]">
                {wordsOf(run)}
                <rt className="font-mono text-[10px] tracking-normal text-j-warm-dark" lang="es">{say}</rt>
              </ruby>
            ) : (
              wordsOf(run)
            )}
            {space}
          </span>
        );
      })}
    </p>
  );
}

/** What the colors mean, and the words heard that are not in the text (kept out of it, so it never reflows). */
export function TargetLegend({ words, extras, showExtras }: { words: TargetWord[]; extras: ExtraWord[]; showExtras: boolean }) {
  const hasAlias = words.some((w) => w.viaAlias);
  return (
    <div className="space-y-2">
      <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        <span className="text-j-success">● dicho</span>
        <span className="text-j-error">● faltó</span>
        {hasAlias && (
          <span>
            <span className="text-j-success underline decoration-dashed decoration-j-text-secondary underline-offset-4">nombre</span>: el reconocedor no lo conoce, revisalo con el audio
          </span>
        )}
      </p>
      {showExtras && extras.length > 0 && (
        <p className="text-sm text-j-text-tertiary" data-testid="extra-words">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Se oyó de más: </span>
          <span lang="en">{extras.map((e) => e.word).join(' · ')}</span>
        </p>
      )}
    </div>
  );
}

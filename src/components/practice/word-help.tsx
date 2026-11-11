'use client';

/**
 * How a word sounds, on demand: a popover on the tapped word of the drill
 * text, and the strip of words to drill after an attempt. Both read the word
 * with the browser's English voice and show the Spanish-ear respelling when
 * the lesson or the dictionary has one (src/lib/practice/pronunciation.ts).
 */

import { useMemo, useSyncExternalStore } from 'react';
import { Popover } from 'radix-ui';
import { Volume2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { cleanWord, pronunciationFor, type PracticeWord, type Pronunciation } from '@/lib/practice/pronunciation';
import { heardInstead, type WordAlignment } from '@/lib/practice/scoring';
import { canSpeak, speakEnglish } from './speak';

const noSubscribe = () => () => {};

function useCanSpeak(): boolean {
  return useSyncExternalStore(noSubscribe, canSpeak, () => false);
}

/** What the help shows for a target word: the whole key term when the word is part of one. */
export interface WordHelpSubject {
  text: string;
  speak: string;
  pronunciation: Pronunciation | null;
  /** The recognizer wrote this instead, or wrote the name as this sound-alike. */
  heard: string | null;
  kind: 'said' | 'alias' | 'missed' | 'plain';
}

export function subjectFor(alignment: WordAlignment, index: number, terms: readonly KeyTerm[], colored: boolean): WordHelpSubject {
  const w = alignment.words[index];
  const term = w.term !== null ? terms[w.term] ?? null : null;
  const text = term ? term.term : cleanWord(w.word);
  const kind = !colored ? 'plain' : w.state === 'said' ? (w.viaAlias ? 'alias' : 'said') : w.state === 'missed' ? 'missed' : 'plain';
  return {
    text,
    speak: term ? term.speak : text,
    pronunciation: pronunciationFor(w.word, term),
    heard: kind === 'alias' ? w.heardAs : kind === 'missed' ? heardInstead(alignment, index) : null,
    kind,
  };
}

function SpeakButtons({ text, disabled, onBeforeSpeak }: { text: string; disabled?: boolean; onBeforeSpeak?: () => void }) {
  const can = useCanSpeak();
  if (!can) return <p className="text-xs text-j-text-tertiary">Este navegador no tiene voz para leerlo.</p>;
  const say = (rate: number) => {
    onBeforeSpeak?.();
    speakEnglish(text, rate);
  };
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => say(0.8)}
        disabled={disabled}
        className="flex min-h-[40px] items-center gap-1.5 border border-j-border-input px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-secondary hover:border-j-accent hover:text-j-accent disabled:opacity-40"
      >
        <Volume2 size={13} /> Escuchar
      </button>
      <button
        type="button"
        onClick={() => say(0.55)}
        disabled={disabled}
        className="min-h-[40px] border border-j-border-input px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-secondary hover:border-j-accent hover:text-j-accent disabled:opacity-40"
      >
        Lento
      </button>
    </div>
  );
}

function Respelling({ pronunciation }: { pronunciation: Pronunciation | null }) {
  if (!pronunciation) return <p className="text-xs text-j-text-tertiary">Sin guía escrita: escuchalo.</p>;
  return (
    <p className="leading-tight">
      <span className="font-mono text-base text-j-warm-dark" lang="es">{pronunciation.say}</span>
      {pronunciation.ipa && <span className="ml-2 font-mono text-[11px] text-j-text-tertiary">/{pronunciation.ipa}/</span>}
    </p>
  );
}

/** Popover anchored to the tapped word. */
export function WordHelpPopover({
  anchor,
  subject,
  onClose,
  speakDisabled,
  onBeforeSpeak,
}: {
  anchor: HTMLElement | null;
  subject: WordHelpSubject | null;
  onClose: () => void;
  /** While the mic is open: the voice would end up in the take. */
  speakDisabled?: boolean;
  onBeforeSpeak?: () => void;
}) {
  // A fresh ref object per anchor: Popper measures it on open.
  const anchorRef = useMemo(() => ({ current: anchor as HTMLElement }), [anchor]);
  const open = Boolean(anchor && subject);
  return (
    <Popover.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Popover.Anchor virtualRef={anchorRef} />
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={6}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          data-testid="word-help"
          className="z-50 w-[min(20rem,calc(100vw-2rem))] space-y-3 border border-j-border bg-j-bg-white p-4 shadow-lg"
        >
          {subject && (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-medium text-j-text" lang="en">{subject.text}</p>
                <Popover.Close aria-label="Cerrar" className="-mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center text-j-text-tertiary hover:text-j-text">
                  <X size={14} />
                </Popover.Close>
              </div>
              <Respelling pronunciation={subject.pronunciation} />
              <SpeakButtons text={subject.speak} disabled={speakDisabled} onBeforeSpeak={onBeforeSpeak} />
              {subject.kind === 'alias' && (
                <p className="text-xs text-j-text-secondary">
                  El reconocedor escribió «{subject.heard}»: no conoce el nombre, así que cuenta como dicho. Revisalo con tu toma.
                </p>
              )}
              {subject.kind === 'missed' && (
                <p className="text-xs text-j-error">{subject.heard ? `Se oyó «${subject.heard}».` : 'No se oyó.'}</p>
              )}
              {speakDisabled && <p className="text-xs text-j-text-tertiary">Terminá de hablar para escucharlo.</p>}
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** After an attempt: the words to drill, each with its voice and respelling. */
export function PracticeWords({
  items,
  terms,
  onBeforeSpeak,
}: {
  items: PracticeWord[];
  terms: readonly KeyTerm[];
  onBeforeSpeak?: () => void;
}) {
  const can = useCanSpeak();
  if (items.length === 0) return null;
  return (
    <section className="space-y-2" aria-label="Palabras para practicar" data-testid="practice-words">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-warm">Palabras para practicar</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const term = item.term !== null ? terms[item.term] ?? null : null;
          const p = pronunciationFor(item.text, term);
          return (
            <li key={`${item.kind}-${item.text}`}>
              <button
                type="button"
                disabled={!can}
                onClick={() => {
                  onBeforeSpeak?.();
                  speakEnglish(term ? term.speak : item.text, 0.8);
                }}
                title={item.kind === 'alias' ? 'El reconocedor no conoce el nombre: revisalo con tu toma' : undefined}
                className={cn(
                  'flex min-h-[44px] max-w-full items-center gap-2 border px-3 py-1.5 text-left hover:border-j-accent',
                  item.kind === 'alias' ? 'border-dashed border-j-border-input' : 'border-j-border-input',
                )}
              >
                <Volume2 size={13} className="shrink-0 text-j-text-tertiary" />
                <span className="min-w-0">
                  <span className="block text-sm text-j-text" lang="en">{item.text}</span>
                  {(p || item.heard) && (
                    <span className="block font-mono text-[10px] text-j-text-tertiary">
                      {p && <span className="text-j-warm-dark" lang="es">{p.say}</span>}
                      {p && item.heard && ' · '}
                      {item.heard && <span>{item.kind === 'alias' ? 'el reconocedor escribió' : 'se oyó'} «{item.heard}»</span>}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

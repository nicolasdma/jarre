'use client';

/**
 * Say-it: the one real recall beat in the feed, and always optional. The
 * question is on screen; you can say it aloud (a countdown + the browser
 * recognizer, judged by the lenient third party), or just tap to reveal, or
 * scroll on. It reuses the practice machinery untouched: useRecallAnswer and
 * /api/practice/recall-eval for the judge, the recall reducer/countdown, and
 * recordRecall so a "La tenía" feeds FSRS and the generator's weak-first
 * re-surfacing. The reference recording plays from the shared feed audio only
 * on reveal, so the answer is never given away on scroll-in.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  initialRecallState,
  recallPrompt,
  recallReducer,
  remainingSeconds,
  type RecallRating,
} from '@/lib/practice/recall';
import { recordRecall } from '@/components/practice/best-scores';
import { useRecallAnswer } from '@/components/practice/use-recall-answer';
import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import type { FeedAudioController } from '../feed-audio';
import { ParticipationPill, PostShell, TapButton } from './post-shell';

const RATINGS: { id: RecallRating; label: string }[] = [
  { id: 'got', label: 'La tenía' },
  { id: 'partial', label: 'A medias' },
  { id: 'missed', label: 'No salió' },
];

export function SayIt({
  post,
  graph,
  controller,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  graph: FeedGraph;
  controller: FeedAudioController | null;
  active: boolean;
  reducedMotion: boolean;
}) {
  const drill = post.drillSlug ? graph.drills[post.drillSlug] : undefined;
  const ask = post.drillSlug ? graph.asks[post.drillSlug] : undefined;
  const concept = graph.concepts.find((c) => c.id === post.conceptId);
  const [state, dispatch] = useReducer(recallReducer, undefined, () => initialRecallState());
  const [now, setNow] = useState(() => Date.now());
  const [rated, setRated] = useState<RecallRating | null>(null);
  const answer = useRecallAnswer(graph.resourceId, post.drillSlug ?? '');
  const { finish: finishAnswer, start: startAnswer, reset: resetAnswer } = answer;

  // The countdown clock, only while thinking and on screen.
  useEffect(() => {
    if (!active || state.phase !== 'thinking') return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: 'tick', now: t });
    }, 100);
    return () => window.clearInterval(id);
  }, [active, state.phase]);

  // Entering the answer: stop listening and play the reference recording.
  useEffect(() => {
    if (state.phase !== 'answer') return;
    finishAnswer(state.answeredAfter !== null && state.answeredAfter >= state.seconds);
    if (controller && drill?.audioUrl) {
      controller.prime();
      controller.setActive(post.key, drill.audioUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Scrolling away resets the beat (no half-finished countdown lingering).
  useEffect(() => {
    if (active) return;
    resetAnswer();
    setRated(null);
    dispatch({ type: 'again' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const begin = useCallback(() => {
    controller?.prime();
    startAnswer();
    const t = Date.now();
    setNow(t);
    dispatch({ type: 'start', now: t });
  }, [controller, startAnswer]);

  const reveal = useCallback(() => {
    dispatch({ type: 'skip', now: Date.now() });
  }, []);

  const rate = useCallback(
    (rating: RecallRating) => {
      setRated(rating);
      if (post.drillSlug) recordRecall(graph.resourceId, post.drillSlug, rating);
    },
    [graph.resourceId, post.drillSlug],
  );

  if (!drill) return null;
  const question = recallPrompt(drill.title, ask).question;
  const left = remainingSeconds(state, now);
  const judged = answer.judgement?.kind === 'evaluated' ? answer.judgement.evaluation : null;

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${concept?.name ?? drill.title}: decilo`}
      eyebrow={<>
        <span>Decilo{concept ? ` · ${concept.name}` : ''}</span>
        <ParticipationPill post={post} />
      </>}
      hint={state.phase === 'ready' ? 'Decilo si querés, o tocá para ver · o seguí' : undefined}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--fp-soft)' }}>
        En inglés, de memoria
      </p>
      <h2 className="text-2xl font-semibold leading-snug sm:text-3xl" lang={ask ? 'en' : 'es'} style={{ color: 'var(--fp-ink)' }}>
        {question}
      </h2>

      {state.phase === 'ready' && (
        <div className="flex flex-wrap gap-2">
          <TapButton tone="accent" onClick={begin}>Decilo en voz alta</TapButton>
          <TapButton onClick={reveal}>Ver la respuesta</TapButton>
        </div>
      )}

      {state.phase === 'thinking' && (
        <div className="space-y-3">
          <p className="font-mono text-6xl font-semibold tabular-nums" style={{ color: 'var(--fp-ink)' }}>
            {left}<span className="ml-1 text-xl" style={{ color: 'var(--fp-soft)' }}>s</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: answer.status === 'listening' ? 'var(--fp-accent)' : 'var(--fp-soft)' }}>
            {answer.status === 'listening' ? '● Te escucho…' : 'Hablando…'}
          </p>
          <TapButton onClick={reveal}>Ya está → ver la respuesta</TapButton>
        </div>
      )}

      {(state.phase === 'answer' || state.phase === 'rated') && (
        <div className="space-y-4">
          {judged && (
            <div className="rounded-xl border px-4 py-3" style={{ background: 'var(--fp-surface)', borderColor: 'color-mix(in srgb, var(--fp-accent) 35%, transparent)' }}>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--fp-accent)' }}>Evaluación</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--fp-ink)' }}>
                {RATINGS.find((r) => r.id === judged.rating)?.label}
              </p>
              {judged.tip && <p className="mt-1 text-sm" lang="es" style={{ color: 'var(--fp-soft)' }}>{judged.tip}</p>}
            </div>
          )}
          <div className="rounded-xl border px-4 py-3" style={{ background: 'var(--fp-surface)', borderColor: 'color-mix(in srgb, var(--fp-soft) 35%, transparent)' }}>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--fp-soft)' }}>La respuesta</p>
            <p className="mt-1 text-lg leading-relaxed" lang="en" style={{ color: 'var(--fp-ink)' }}>{drill.textEn.replace(/\s*\/\s*/g, ' ')}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cómo te salió">
            {RATINGS.map((r) => (
              <TapButton key={r.id} selected={rated === r.id} onClick={() => rate(r.id)}>{r.label}</TapButton>
            ))}
          </div>
        </div>
      )}
    </PostShell>
  );
}

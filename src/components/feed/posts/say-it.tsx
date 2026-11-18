'use client';

/**
 * Say-it as a voice-note card: the interview question arrives as a message
 * bubble, a big mic invites you to answer out loud (in English, from memory),
 * and the model answer comes back as a voice note (play + waveform +
 * transcript). Always optional: tap "ver la respuesta" or scroll on.
 *
 * It reuses the practice machinery untouched: useRecallAnswer and
 * /api/practice/recall-eval for the lenient judge, the recall reducer and
 * countdown, and recordRecall so a "La tenía" feeds FSRS and the generator's
 * weak-first re-surfacing. The reference recording never plays by itself
 * (same rule as the lesson's recall mode): after the reveal it is a voice
 * note with its own play button, so scrolling in never gives the answer away.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useFeedContext } from '../feed-context';
import { InlineText } from './inline-text';
import { useFeedAudioStatus, useFeedAudioTime } from '../use-feed-audio';
import { AccountAvatar, CardFrame, Caption, Media, lessonHrefFor, participationHint } from './card-frame';
import { Waveform, formatSeconds } from './audio-bits';

const RATINGS: { id: RecallRating; label: string }[] = [
  { id: 'got', label: 'La tenía' },
  { id: 'partial', label: 'A medias' },
  { id: 'missed', label: 'No salió' },
];

/** The answer's voice note: play/pause, waveform with progress, time. */
function AnswerNote({ postKey, src, text }: { postKey: string; src: string | null; text: string }) {
  const { controller } = useFeedContext();
  const status = useFeedAudioStatus(controller);
  const mine = status.activeKey === postKey;
  const time = useFeedAudioTime(mine ? controller : null);
  const playing = mine && status.playing;
  const progress = mine && status.duration > 0 ? Math.min(1, time / status.duration) : 0;
  const onClick = () => {
    if (!controller || !src) return;
    controller.prime();
    if (!mine) {
      controller.setActive(postKey, src);
      controller.play();
    } else controller.toggle();
  };
  return (
    <div className="ml-auto w-[88%] rounded-[20px] rounded-br-[6px] px-3.5 py-3" style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}>
      {src && (
        <div className="mb-2 flex items-center gap-3" style={{ ['--fp-ink' as string]: 'var(--fp-on-accent)', ['--fp-accent' as string]: 'var(--fp-on-accent)' }}>
          <button
            type="button"
            onClick={onClick}
            aria-label={playing ? 'Pausar la respuesta' : 'Escuchar la respuesta'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] focus-visible:outline focus-visible:outline-2"
            style={{ background: 'color-mix(in srgb, currentColor 18%, transparent)' }}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <Waveform seed={postKey} progress={progress} count={28} height={24} />
          <span className="font-mono text-[11px] tabular-nums opacity-80">{mine && status.duration > 0 ? formatSeconds(status.duration) : ''}</span>
        </div>
      )}
      <p lang="en" className="text-[14px] leading-[1.45]">{text}</p>
    </div>
  );
}

export function SayIt({ post, active, reducedMotion }: { post: FeedPost; active: boolean; reducedMotion: boolean }) {
  const { graph, accounts, controller, audioUrl } = useFeedContext();
  const drill = post.drillSlug ? graph.drills[post.drillSlug] : undefined;
  const ask = post.drillSlug ? graph.asks[post.drillSlug] : undefined;
  const account = post.conceptId ? accounts[post.conceptId] ?? null : null;
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

  // Entering the answer: stop listening. The reference recording waits for its play button.
  useEffect(() => {
    if (state.phase !== 'answer') return;
    finishAnswer(state.answeredAfter !== null && state.answeredAfter >= state.seconds);
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

  // Reveal from either phase: the reducer only skips from 'thinking', so a
  // reveal straight from 'ready' (no mic) passes through it without listening.
  const reveal = useCallback(() => {
    const t = Date.now();
    dispatch({ type: 'start', now: t });
    dispatch({ type: 'skip', now: t });
  }, []);

  const again = useCallback(() => {
    resetAnswer();
    setRated(null);
    dispatch({ type: 'again' });
  }, [resetAnswer]);

  const rate = useCallback(
    (rating: RecallRating) => {
      setRated(rating);
      if (post.drillSlug) recordRecall(graph.resourceId, post.drillSlug, rating);
    },
    [graph.resourceId, post.drillSlug],
  );

  if (!drill) return null;
  const reference = audioUrl(post.drillSlug);
  const question = recallPrompt(drill.title, ask).question;
  const left = remainingSeconds(state, now);
  const judged = answer.judgement?.kind === 'evaluated' ? answer.judgement.evaluation : null;
  const answered = state.phase === 'answer' || state.phase === 'rated';
  const listening = answer.status === 'listening';

  const media = (
    <Media post={post} className="flex min-h-[440px] flex-col px-4 pb-5 pt-5">
      {/* The question, as an incoming message. */}
      <div className="flex items-end gap-2">
        <AccountAvatar account={account} size={26} />
        <div className="max-w-[86%] rounded-[20px] rounded-bl-[6px] px-4 py-3" style={{ background: 'color-mix(in srgb, var(--fp-ink) 10%, transparent)' }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--fp-soft)' }}>pregunta de entrevista</p>
          <p lang={ask ? 'en' : 'es'} className="text-[17px] font-semibold leading-snug" style={{ color: 'var(--fp-ink)' }}><InlineText text={question} /></p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6">
        {state.phase === 'ready' && (
          <>
            <button
              type="button"
              onClick={begin}
              aria-label="Decilo en voz alta"
              className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ background: 'var(--fp-accent)', color: 'var(--fp-on-accent)' }}
            >
              {!reducedMotion && <span aria-hidden className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ background: 'var(--fp-accent)', animationDuration: '2.4s' }} />}
              <Mic size={38} strokeWidth={2} />
            </button>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--fp-ink)' }}>Decilo en voz alta · en inglés</p>
            <button type="button" onClick={reveal} className="text-[13px] underline underline-offset-4 focus-visible:outline focus-visible:outline-2" style={{ color: 'var(--fp-soft)' }}>
              o ver la respuesta
            </button>
          </>
        )}

        {state.phase === 'thinking' && (
          <>
            <div
              className="flex h-28 w-28 items-center justify-center rounded-full border-4"
              style={{ borderColor: listening ? 'var(--fp-accent)' : 'color-mix(in srgb, var(--fp-ink) 25%, transparent)', color: 'var(--fp-ink)' }}
            >
              <span className="font-mono text-[44px] font-black tabular-nums">{left}</span>
            </div>
            <p className={cn('text-[13px] font-semibold uppercase tracking-[0.12em]', listening && !reducedMotion && 'animate-pulse')} style={{ color: listening ? 'var(--fp-accent)' : 'var(--fp-soft)' }}>
              {listening ? '● te escucho' : 'hablando…'}
            </p>
            <button
              type="button"
              onClick={reveal}
              className="min-h-[44px] rounded-full px-5 text-[14px] font-semibold focus-visible:outline focus-visible:outline-2"
              style={{ background: 'var(--fp-ink)', color: 'var(--fp-bg)' }}
            >
              Ya está → la respuesta
            </button>
          </>
        )}

        {answered && (
          <div className="flex w-full flex-col gap-3">
            {judged && (
              <p className="self-center rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: 'color-mix(in srgb, var(--fp-ink) 12%, transparent)', color: 'var(--fp-ink)' }}>
                {RATINGS.find((r) => r.id === judged.rating)?.label}
                {judged.tip ? ` · ${judged.tip}` : ''}
              </p>
            )}
            <AnswerNote postKey={post.key} src={reference} text={drill.textEn.replace(/\s*\/\s*/g, ' ')} />
            <div className="mt-1 flex flex-wrap justify-center gap-2" role="group" aria-label="Cómo te salió">
              {RATINGS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={rated === r.id}
                  onClick={() => rate(r.id)}
                  className="min-h-[40px] rounded-full border-2 px-3.5 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2"
                  style={
                    rated === r.id
                      ? { background: 'var(--fp-ink)', color: 'var(--fp-bg)', borderColor: 'var(--fp-ink)' }
                      : { borderColor: 'color-mix(in srgb, var(--fp-ink) 30%, transparent)', color: 'var(--fp-ink)' }
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Media>
  );

  return (
    <CardFrame
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${account?.title ?? drill.title}: decilo`}
      kindLabel="Decilo · nota de voz"
      hint={participationHint(post)}
      media={media}
      actions={{
        audioSrc: answered ? reference : null,
        onRepeat: state.phase === 'ready' ? undefined : again,
        lessonHref: lessonHrefFor(graph.resourceId, post),
      }}
      caption={<Caption handle={account?.handle}>{drill.title}</Caption>}
    />
  );
}

'use client';

/**
 * The feed: a centered column of self-contained post cards that scrolls like
 * a social feed (no full-screen snap pages), endlessly extended. The rest mode
 * (owner, 2026-11-18): mostly passive, varied, occasionally inviting a recall,
 * never forcing one, never ending. On top, the lesson's topics as a stories
 * row. No side rail and no study chrome on any screen (owner, 2026-11-18: it
 * should feel like a relaxed social feed, not a study page); the keyboard
 * shortcuts work without a visible legend.
 *
 * Kept light for a machine that overheats (doc 03 §3.4):
 * - ONE audio element + ONE clock (feed-audio.ts): only the active post sounds,
 *   and a time tick re-renders only the playing card's strip/caption.
 * - ONE IntersectionObserver over a thin band across the middle of the
 *   viewport gives the active card; no onScroll handler.
 * - A mount window of active ±4: other cards are a placeholder at their last
 *   measured height (one ResizeObserver), so the DOM of cards stays small.
 * - Bounded memory (feed-window.ts): descriptors far behind are dropped into a
 *   spacer of their height, and rebuilt exactly from the deterministic
 *   scheduler if you scroll back. A long scroll holds a few dozen, not
 *   thousands.
 * - Long sessions: the recordings around the reader are re-signed ahead of
 *   their URLs' expiry (POST /api/feed/sign-audio), only when `resignAudio`.
 *
 * a11y: nothing sounds without a gesture (prime on first tap/key); captions are
 * always on; a visible sound control; prefers-reduced-motion stops autoplay
 * and animation; ↑/↓ (and j/k) move between cards, Space plays or pauses the
 * active card's recording.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Volume2, VolumeX } from 'lucide-react';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { loadBestScores } from '@/components/practice/best-scores';
import { isRecallDue } from '@/lib/practice/recall';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { feedAccounts } from '@/lib/feed/feed-identity';
import { createFeedGenerator, type FeedGenerator, type LearnerState } from '@/lib/feed/feed-generator';
import type { FeedPost } from '@/lib/feed/feed-post';
import {
  dropCount,
  postAt,
  rebuildCount,
  rebuildRange,
  slugsToResign,
  windowEnd,
  type StreamWindow,
} from '@/lib/feed/feed-window';
import { useFeedAudio, useFeedAudioStatus } from './use-feed-audio';
import { FeedContext, type FeedContextValue } from './feed-context';
import { createSavedStore, type SavedStore } from './feed-saved';
import { PostCard, feedAudioSrc } from './posts/post-card';
import { TopicStories } from './topic-stories';
import { lessonHasCodeTabs } from '@/lib/lessons/code-tabs';
import { warmCodeVariants } from './use-code-variants';

const INITIAL_BATCH = 10;
const EXTEND_BY = 8;
const EXTEND_WHEN_WITHIN = 4;
const MOUNT_WINDOW = 4;
const ACTIVE_DEBOUNCE_MS = 120;
const PLACEHOLDER_HEIGHT = 620;
/** How far ahead a topic jump may generate to find a post about it. */
const JUMP_LOOKAHEAD = 60;
/** Posts around the reader whose recordings are re-signed in a long session. */
const RESIGN_AHEAD = 8;

/** Build the cheap learner state from this device's best-scores (weak/due concepts). */
function buildLearnerState(graph: FeedGraph): LearnerState {
  const strength: Record<string, number> = {};
  const due = new Set<string>();
  try {
    const scores = loadBestScores(graph.resourceId);
    for (const c of graph.concepts) {
      // A concept is as strong as its drills' recall: "La tenía" raises it.
      let total = 0;
      let got = 0;
      for (const slug of c.drillSlugs) {
        const rec = scores[slug]?.recall;
        if (rec) {
          total++;
          got += rec.got > 0 ? 1 : 0;
          if (isRecallDue(rec)) due.add(c.id);
        }
      }
      strength[c.id] = total === 0 ? 0.4 : got / total;
    }
  } catch {
    // No storage: a neutral learner. The generator still runs.
  }
  return { conceptStrength: strength, dueConceptIds: [...due] };
}

function isTyping(el: Element | null): boolean {
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable));
}

interface FeedState extends StreamWindow {
  /** Height of the dropped descriptors before `base` (the spacer). */
  spacer: number;
}

export function Feed({
  graph,
  day,
  resignAudio = false,
}: {
  graph: FeedGraph;
  day: string;
  /** Re-sign recordings ahead of their URLs' expiry (the real, signed-URL feed). */
  resignAudio?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const controller = useFeedAudio(!reducedMotion);
  const status = useFeedAudioStatus(controller);
  const accounts = useMemo(() => feedAccounts(graph), [graph]);

  const genRef = useRef<FeedGenerator | null>(null);
  const learnerRef = useRef<LearnerState>({});
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const heights = useRef(new Map<string, number>());
  /** Heights of dropped descriptors, by absolute index (numbers only). */
  const droppedHeights = useRef<number[]>([]);
  const debounceRef = useRef<number | null>(null);
  const pendingJump = useRef<number | null>(null);
  const loadedAt = useRef(0);
  const signedAt = useRef(new Map<string, number>());
  const resigning = useRef(false);

  const [feed, setFeed] = useState<FeedState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saved, setSaved] = useState<SavedStore | null>(null);
  const [resigned, setResigned] = useState<Record<string, string>>({});
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());

  const newGenerator = useCallback(
    () => createFeedGenerator(graph, learnerRef.current, { resourceId: graph.resourceId, day }),
    [graph, day],
  );

  // Client-only: the learner, the generator, the saved store, then the first batch.
  useEffect(() => {
    learnerRef.current = buildLearnerState(graph);
    loadedAt.current = Date.now();
    genRef.current = newGenerator();
    setSaved(createSavedStore(graph.resourceId));
    setFeed({ base: 0, posts: genRef.current.take(INITIAL_BATCH), spacer: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A lesson with JS | TS tabs: fetch the type-stripper before a code card
  // needs it, so the card opens on JS instead of flashing the TS first.
  useEffect(() => {
    if (lessonHasCodeTabs(graph.resourceId)) void warmCodeVariants();
  }, [graph.resourceId]);

  // Extend ahead (infinite), drop far behind (bounded), rebuild on the way back.
  useEffect(() => {
    if (!feed || !genRef.current) return;
    if (activeIndex >= windowEnd(feed) - EXTEND_WHEN_WITHIN) {
      setFeed({ ...feed, posts: [...feed.posts, ...genRef.current.take(EXTEND_BY)] });
      return;
    }
    const drop = dropCount(feed, activeIndex);
    if (drop) {
      let sum = 0;
      feed.posts.slice(0, drop).forEach((p, i) => {
        const h = heights.current.get(p.key) ?? PLACEHOLDER_HEIGHT;
        droppedHeights.current[feed.base + i] = h;
        heights.current.delete(p.key);
        sum += h;
      });
      setFeed({ base: feed.base + drop, posts: feed.posts.slice(drop), spacer: feed.spacer + sum });
      return;
    }
    const back = rebuildCount(feed, activeIndex);
    if (back) {
      const from = feed.base - back;
      const rebuilt = rebuildRange((n) => newGenerator().take(n), from, feed.base);
      let sum = 0;
      rebuilt.forEach((p, i) => {
        const h = droppedHeights.current[from + i] ?? PLACEHOLDER_HEIGHT;
        heights.current.set(p.key, h);
        sum += h;
      });
      setFeed({ base: from, posts: [...rebuilt, ...feed.posts], spacer: Math.max(0, feed.spacer - sum) });
    }
  }, [activeIndex, feed, newGenerator]);

  // One IntersectionObserver: the card crossing a thin band a little above the
  // middle of the viewport is the active one (works for cards of any height).
  // The spacer of dropped posts counts as "just before the window", which is
  // what triggers their rebuild when you scroll back into it.
  useEffect(() => {
    if (!feed) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.index));
        if (!hit.length) return;
        const next = Math.min(...hit);
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => setActiveIndex(next), ACTIVE_DEBOUNCE_MS);
      },
      { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    for (const el of cardRefs.current.values()) io.observe(el);
    if (spacerRef.current) io.observe(spacerRef.current);
    return () => {
      io.disconnect();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [feed]);

  // Remember each mounted card's height, so its placeholder keeps the scroll stable.
  const resizeObserver = useMemo(
    () =>
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver((entries) => {
            for (const e of entries) {
              const key = (e.target as HTMLElement).dataset.key;
              // Border box: the card plus its bottom spacing, so a placeholder (or
              // the spacer of dropped posts) takes exactly the room the card took.
              const h = e.borderBoxSize?.[0]?.blockSize ?? e.contentRect.height;
              if (key && (e.target as HTMLElement).dataset.mounted === 'true') heights.current.set(key, h);
            }
          }),
    [],
  );
  useEffect(() => () => resizeObserver?.disconnect(), [resizeObserver]);

  const audioUrl = useCallback(
    (slug: string | undefined) => (slug ? resigned[slug] ?? graph.drills[slug]?.audioUrl ?? null : null),
    [resigned, graph],
  );

  // The active post is the only one the feed autoplays (nugget recordings).
  useEffect(() => {
    if (!controller || !feed) return;
    const post = postAt(feed, activeIndex);
    if (post) controller.setActive(post.key, feedAudioSrc(post, audioUrl));
  }, [controller, feed, activeIndex, audioUrl]);

  // What this session has shown: accumulates, survives the drop of old posts.
  useEffect(() => {
    const id = feed ? postAt(feed, activeIndex)?.conceptId : null;
    if (id && !seen.has(id)) setSeen(new Set([...seen, id]));
  }, [feed, activeIndex, seen]);

  // Long session: re-sign the recordings of the posts around the reader before
  // their signed URLs expire (4 h), so a feed left open keeps sounding.
  useEffect(() => {
    if (!resignAudio || !feed || resigning.current) return;
    const around = feed.posts.slice(Math.max(0, activeIndex - feed.base - 1), activeIndex - feed.base + RESIGN_AHEAD);
    const slugs = slugsToResign(around, signedAt.current, loadedAt.current, Date.now(), (s) => Boolean(graph.drills[s]?.audioUrl));
    if (!slugs.length) return;
    resigning.current = true;
    fetch('/api/feed/sign-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId: graph.resourceId, slugs }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ urls: Record<string, string | null> }>) : null))
      .then((data) => {
        if (!data) return;
        const now = Date.now();
        const next: Record<string, string> = {};
        for (const [slug, url] of Object.entries(data.urls)) {
          if (url) {
            next[slug] = url;
            signedAt.current.set(slug, now);
          }
        }
        if (Object.keys(next).length) setResigned((prev) => ({ ...prev, ...next }));
      })
      .catch(() => undefined)
      .finally(() => {
        resigning.current = false;
      });
  }, [resignAudio, feed, activeIndex, graph]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = cardRefs.current.get(index);
      if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    },
    [reducedMotion],
  );

  // A topic jump: the next post about that topic, generating ahead if needed.
  const jumpTo = useCallback(
    (conceptId: string) => {
      if (!feed || !genRef.current) return;
      const ahead = feed.posts.findIndex((p, i) => feed.base + i > activeIndex && p.conceptId === conceptId);
      if (ahead >= 0) {
        scrollToIndex(feed.base + ahead);
        return;
      }
      const extra: FeedPost[] = [];
      for (let i = 0; i < JUMP_LOOKAHEAD; i++) {
        const p = genRef.current.next();
        extra.push(p);
        if (p.conceptId === conceptId) break;
      }
      const at = extra.findIndex((p) => p.conceptId === conceptId);
      if (at >= 0) pendingJump.current = windowEnd(feed) + at;
      setFeed({ ...feed, posts: [...feed.posts, ...extra] });
    },
    [feed, activeIndex, scrollToIndex],
  );

  useEffect(() => {
    if (pendingJump.current === null) return;
    const target = pendingJump.current;
    pendingJump.current = null;
    // The target is beyond the mount window: its placeholder is in the DOM, so scroll to it.
    requestAnimationFrame(() => scrollToIndex(target));
  }, [feed, scrollToIndex]);

  // Keyboard: ↑/↓ and j/k between cards, Space plays/pauses the active recording.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement) || !feed) return;
      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'PageDown') {
        e.preventDefault();
        controller?.prime();
        scrollToIndex(Math.min(windowEnd(feed) - 1, activeIndex + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToIndex(Math.max(feed.base, activeIndex - 1));
      } else if (e.key === ' ' && !(document.activeElement instanceof HTMLButtonElement) && status.hasAudio) {
        e.preventDefault();
        controller?.prime();
        controller?.toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [feed, activeIndex, scrollToIndex, controller, status.hasAudio]);

  const ctx: FeedContextValue = useMemo(
    () => ({ graph, accounts, controller, saved, audioUrl }),
    [graph, accounts, controller, saved, audioUrl],
  );
  const order = useMemo(() => graph.concepts.map((c) => c.id), [graph]);

  return (
    <FeedContext.Provider value={ctx}>
      <div className="min-h-[100svh] bg-[#fafafa] text-neutral-900 dark:bg-black dark:text-neutral-100" onPointerDown={() => controller?.prime()}>
        <style>{'@keyframes feedcard-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'}</style>

        {/* The top bar: a quiet way back, the name of the place, and the sound. */}
        <header className="sticky top-0 z-20 border-b border-black/[0.08] bg-[#fafafa]/90 backdrop-blur-md dark:border-white/[0.09] dark:bg-black/85">
          <div className="mx-auto flex h-14 max-w-[470px] items-center gap-2 px-3">
            <Link
              href={`/learn/${encodeURIComponent(graph.resourceId)}`}
              className="-ml-1.5 flex h-10 items-center gap-0.5 rounded-full pl-1 pr-2.5 text-[13px] text-neutral-700 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10"
            >
              <ChevronLeft size={20} /> Lección
            </Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="font-[family-name:var(--font-serif-display)] text-[26px] leading-none">feed</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!controller) return;
                if (!status.unlocked) controller.prime();
                else controller.toggle();
              }}
              aria-label={!status.unlocked ? 'Activar sonido' : status.playing ? 'Pausar audio' : 'Reproducir audio'}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline focus-visible:outline-2 dark:hover:bg-white/10"
            >
              {status.unlocked ? <Volume2 size={21} /> : <VolumeX size={21} />}
            </button>
          </div>
        </header>

        <div className="mx-auto flex max-w-[470px] justify-center">
          <main className="w-full min-w-0 max-w-[470px] px-2.5 pb-24 pt-2.5 sm:px-0 sm:pt-4">
            <TopicStories accounts={accounts} order={order} seen={seen} onJump={jumpTo} />

            {!feed ? (
              <p className="py-24 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">Armando tu repaso…</p>
            ) : (
              <div role="feed" aria-label="Feed" aria-busy={false} className="mt-3 flex flex-col sm:mt-4">
                {feed.base > 0 && (
                  <div ref={spacerRef} aria-hidden data-index={feed.base - 1} style={{ height: feed.spacer }} />
                )}
                {feed.posts.map((post, i) => {
                  const index = feed.base + i;
                  const near = Math.abs(index - activeIndex) <= MOUNT_WINDOW;
                  return (
                    <div
                      key={post.key}
                      data-index={index}
                      data-key={post.key}
                      data-mounted={near ? 'true' : 'false'}
                      ref={(el) => {
                        const prev = cardRefs.current.get(index);
                        if (prev && prev !== el) resizeObserver?.unobserve(prev);
                        if (el) {
                          cardRefs.current.set(index, el);
                          resizeObserver?.observe(el);
                        } else cardRefs.current.delete(index);
                      }}
                      className="scroll-mt-16 pb-3.5 sm:pb-5"
                      style={near ? undefined : { height: heights.current.get(post.key) ?? PLACEHOLDER_HEIGHT }}
                    >
                      {near ? <PostCard post={post} active={index === activeIndex} reducedMotion={reducedMotion} /> : null}
                    </div>
                  );
                })}
              </div>
            )}
          </main>

        </div>
      </div>
    </FeedContext.Provider>
  );
}

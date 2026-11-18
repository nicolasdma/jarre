'use client';

/**
 * The feed scroller: a vertical, snap-per-viewport, endlessly extending list
 * of lesson posts. The rest mode (owner, 2026-11-18): mostly passive, varied,
 * occasionally inviting a recall, never forcing one, never ending.
 *
 * Kept light for a machine that overheats (doc 03 §3.4):
 * - ONE audio element + ONE clock (feed-audio.ts): only the active post sounds,
 *   and a time tick re-renders only the active caption, never this container.
 * - ONE IntersectionObserver gives the active index; scroll never runs an
 *   onScroll handler per frame.
 * - A mount window of active ±2: far posts are a fixed-height placeholder
 *   (content-visibility + contain-intrinsic-size), so the list of <audio>,
 *   recognizers and observers stays tiny.
 * - The generator is pure and cheap; batches are re-sequenced in memory, no
 *   network, on a sentinel near the end.
 *
 * a11y: nothing sounds without a gesture (prime on first tap/key); captions are
 * always on; a visible pause control; prefers-reduced-motion stops autoplay and
 * animation; arrows / Page keys move posts and Space toggles the active audio.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { loadBestScores } from '@/components/practice/best-scores';
import { isRecallDue } from '@/lib/practice/recall';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { createFeedGenerator, type FeedGenerator, type LearnerState } from '@/lib/feed/feed-generator';
import type { FeedPost } from '@/lib/feed/feed-post';
import { useFeedAudio, useFeedAudioStatus } from './use-feed-audio';
import { PostCard, feedAudioSrc } from './posts/post-card';
import type { FeedStats } from './posts/milestone';

const INITIAL_BATCH = 10;
const EXTEND_BY = 8;
const EXTEND_WHEN_WITHIN = 3;
const WINDOW = 2;
const ACTIVE_DEBOUNCE_MS = 130;

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

export function Feed({ graph, day }: { graph: FeedGraph; day: string }) {
  const reducedMotion = useReducedMotion();
  const controller = useFeedAudio(!reducedMotion);
  const status = useFeedAudioStatus(controller);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const genRef = useRef<FeedGenerator | null>(null);
  const sectionRefs = useRef(new Map<number, HTMLElement>());
  const debounceRef = useRef<number | null>(null);

  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Client-only: build the learner and the generator once, then the first batch.
  useEffect(() => {
    const learner = buildLearnerState(graph);
    genRef.current = createFeedGenerator(graph, learner, { resourceId: graph.resourceId, day });
    setPosts(genRef.current.take(INITIAL_BATCH));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Extend the stream before the end comes into view (infinite).
  useEffect(() => {
    if (!posts || !genRef.current) return;
    if (activeIndex >= posts.length - EXTEND_WHEN_WITHIN) {
      setPosts((prev) => (prev ? [...prev, ...genRef.current!.take(EXTEND_BY)] : prev));
    }
  }, [activeIndex, posts]);

  // One IntersectionObserver → the active index (debounced so a fast scroll
  // past five posts does not fire five play/pause).
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !posts) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.index);
          if (e.isIntersecting && (!best || e.intersectionRatio > best.ratio)) best = { index: idx, ratio: e.intersectionRatio };
        }
        if (!best) return;
        const next = best.index;
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => setActiveIndex(next), ACTIVE_DEBOUNCE_MS);
      },
      { root, threshold: [0.6] },
    );
    for (const el of sectionRefs.current.values()) io.observe(el);
    return () => {
      io.disconnect();
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [posts]);

  // The active post is the only one that sounds. feedAudioSrc decides what (if
  // anything); say-it passes null and plays its own reference on reveal.
  useEffect(() => {
    if (!controller || !posts) return;
    const post = posts[activeIndex];
    if (post) controller.setActive(post.key, feedAudioSrc(post, graph));
  }, [controller, posts, activeIndex, graph]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = sectionRefs.current.get(index);
      if (el) el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    },
    [reducedMotion],
  );

  // Keyboard navigation + play/pause, without clobbering typing or buttons.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
      if (typing) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToIndex(Math.min((posts?.length ?? 1) - 1, activeIndex + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToIndex(Math.max(0, activeIndex - 1));
      } else if (e.key === ' ' && !(el instanceof HTMLButtonElement)) {
        if (status.hasAudio) {
          e.preventDefault();
          controller?.prime();
          controller?.toggle();
        }
      }
    },
    [activeIndex, posts, scrollToIndex, status.hasAudio, controller],
  );

  const stats: FeedStats = useMemo(() => {
    const introduced = new Set((posts ?? []).filter((p) => p.profile.novelty === 'new').map((p) => p.conceptId));
    const learner = genRef.current ? buildLearnerState(graph) : { dueConceptIds: [] as string[] };
    return { covered: introduced.size, total: graph.concepts.length, due: learner.dueConceptIds?.length ?? 0 };
  }, [posts, graph]);

  if (!posts) {
    return (
      <div className="flex h-[100svh] items-center justify-center bg-j-bg">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-j-text-tertiary">Armando tu feed…</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollerRef}
      role="feed"
      aria-label="Feed de repaso"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => controller?.prime()}
      className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <style>{'@keyframes feedpost-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'}</style>

      {/* A quiet way back to the lesson; never an auto-redirect or a hard stop. */}
      <Link
        href={`/learn/${graph.resourceId}`}
        className="fixed left-4 top-4 z-10 rounded-full bg-j-bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-secondary backdrop-blur-sm"
      >
        ← Lección
      </Link>

      {posts.map((post, index) => {
        const near = Math.abs(index - activeIndex) <= WINDOW;
        return (
          <div
            key={post.key}
            data-index={index}
            ref={(el) => {
              if (el) sectionRefs.current.set(index, el);
              else sectionRefs.current.delete(index);
            }}
            // Placeholder keeps the scroll height so snapping never jumps.
            style={near ? undefined : { height: '100svh', contentVisibility: 'auto', containIntrinsicSize: '100svh' }}
            className="snap-start snap-always"
          >
            {near ? (
              <PostCard
                post={post}
                graph={graph}
                controller={controller}
                active={index === activeIndex}
                reducedMotion={reducedMotion}
                stats={stats}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

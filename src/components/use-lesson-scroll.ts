'use client';

/**
 * Where the lesson page sits when the learner changes section or step, or
 * comes back to the lesson (owner, 2026-11-18):
 *
 * - A section opened for the first time in this visit shows its heading at the
 *   top, right under the sticky header; one the learner already scrolled in
 *   opens where they left it (lib/learn/scroll-memory.ts).
 * - Another step opens where the learner left that step, or at its top.
 * - Coming back from the feed or the library (a new mount) lands on the same
 *   place. The page scrolls AppShell's column, which the browser does not
 *   restore on back/forward, so nothing here competes with it; on a push
 *   navigation Next scrolls the page to the top during commit, and the restore
 *   runs after that (a passive effect).
 *
 * Every scroll is attributed to the place on screen and remembered; while a
 * change is being applied nothing is recorded, so the jump itself never
 * overwrites a memory.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { appScroller, contentTopOf, lessonHeaderHeight, maxScrollOf } from '@/lib/learn/app-scroller';
import { createScrollMemory, offsetFrom, scrollTopFor, sectionKey, stepKey, HEADING_GAP, type ScrollMemory } from '@/lib/learn/scroll-memory';

interface Place {
  step: string;
  /** The open reading section, only on the reading step. */
  sectionId: string | null;
}

/** Frames a restore keeps trying while the page is still too short to reach its target. */
const RETRY_FRAMES = 20;

function sectionElement(sectionId: string): Element | null {
  return document.querySelector(`[data-learn-section="${CSS.escape(sectionId)}"]`);
}

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function keyOf(place: Place): string {
  return place.sectionId ? sectionKey(place.sectionId) : stepKey(place.step);
}

export function useLessonScroll({ lessonId, step, sectionId }: { lessonId: string; step: string; sectionId: string | null }) {
  const place: Place = { step, sectionId: step === 'learn' ? sectionId : null };
  const memoryRef = useRef<ScrollMemory | null>(null);
  const memory = useCallback(() => (memoryRef.current ??= createScrollMemory(lessonId, sessionStore())), [lessonId]);
  /** What the current scroll belongs to; null while a change is applied. */
  const shownRef = useRef<Place | null>(null);
  const frameRef = useRef<number | null>(null);

  const record = useCallback(
    (at: Place) => {
      const scroller = appScroller();
      const el = at.sectionId ? sectionElement(at.sectionId) : null;
      if (at.sectionId && el) {
        memory().set(keyOf(at), offsetFrom({ scrollTop: scroller.scrollTop, anchorTop: contentTopOf(scroller, el), headerHeight: lessonHeaderHeight() }));
      } else if (!at.sectionId) {
        memory().set(keyOf(at), Math.round(scroller.scrollTop));
      }
    },
    [memory],
  );

  /** Shows `at` where it was left (or from its top), then attributes scrolling to it. */
  const show = useCallback(
    (at: Place, offset?: number) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      shownRef.current = null;
      const scroller = appScroller();
      const remembered = offset ?? memory().get(keyOf(at)) ?? 0;
      const target = (): { top: number; short: boolean } => {
        const max = maxScrollOf(scroller);
        const el = at.sectionId ? sectionElement(at.sectionId) : null;
        if (el) {
          const anchorTop = contentTopOf(scroller, el);
          const headerHeight = lessonHeaderHeight();
          const wanted = anchorTop - headerHeight - HEADING_GAP + remembered;
          return { top: scrollTopFor({ anchorTop, headerHeight, offset: remembered, maxScroll: max }), short: wanted > max };
        }
        return { top: Math.min(remembered, Math.max(max, 0)), short: remembered > max };
      };
      let frames = 0;
      const apply = () => {
        frameRef.current = null;
        const { top, short } = target();
        scroller.scrollTop = top;
        // Content that is still growing (a question that loads, a figure): keep the target for a few frames.
        if (short && ++frames < RETRY_FRAMES) frameRef.current = requestAnimationFrame(apply);
      };
      apply();
      shownRef.current = at;
    },
    [memory],
  );

  // Remember every scroll for the place on screen; write it down a moment later and when leaving.
  useEffect(() => {
    const scroller = appScroller();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      const at = shownRef.current;
      if (!at) return;
      record(at);
      clearTimeout(timer);
      timer = setTimeout(() => memory().flush(), 300);
    };
    const onHide = () => memory().flush();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      clearTimeout(timer);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      memory().flush();
    };
  }, [memory, record]);

  // Arriving at the lesson (load, the feed, the library): the place it was left in this visit, or the top.
  const mountedRef = useRef(false);
  useEffect(() => {
    const at: Place = { step, sectionId: step === 'learn' ? sectionId : null };
    if (memory().get(keyOf(at)) !== undefined) {
      show(at);
    } else {
      // Not seen in this visit: the page from its top (a column left scrolled by the feed would open mid-page).
      appScroller().scrollTop = 0;
      shownRef.current = at;
    }
    // Only on mount: later changes go through the layout effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changing step or section inside the page: before the frame paints, so the new section never flashes elsewhere.
  const placeKey = keyOf(place);
  const previousRef = useRef<Place>(place);
  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = place;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (keyOf(previous) === placeKey) return;
    show(place);
    // A new section on the reading step: focus its heading, so a screen reader announces it and Tab goes on from there.
    if (place.sectionId && previous.step === place.step) focusHeading(place.sectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, show]);

  /** The open section again from its heading (its entry in the table of contents tapped once more). */
  const toSectionHeading = useCallback(() => {
    if (!place.sectionId) return;
    show(place, 0);
    focusHeading(place.sectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeKey, show]);

  return { toSectionHeading };
}

function focusHeading(sectionId: string) {
  sectionElement(sectionId)?.querySelector<HTMLElement>('[data-section-heading]')?.focus({ preventScroll: true });
}

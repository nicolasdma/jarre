/**
 * The page does not scroll the window: AppShell's content column does
 * (components/app-shell.tsx). `window.scrollTo` and `window.scrollY` do nothing
 * there; everything that moves the page goes through these.
 */

import { HEADING_GAP } from './scroll-memory';

/** The nearest ancestor that scrolls vertically, or the document. */
export function scrollParentOf(el: Element | null): HTMLElement {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

/** The element that scrolls the app's pages. */
export function appScroller(): HTMLElement {
  return scrollParentOf(document.getElementById('main-content'));
}

function isDocument(scroller: HTMLElement): boolean {
  return scroller === document.scrollingElement || scroller === document.documentElement;
}

/** Top edge of the scroller's visible area, in viewport pixels. */
export function viewportTopOf(scroller: HTMLElement): number {
  return isDocument(scroller) ? 0 : scroller.getBoundingClientRect().top;
}

/** An element's top in the scroller's content coordinates. */
export function contentTopOf(scroller: HTMLElement, el: Element): number {
  return el.getBoundingClientRect().top - viewportTopOf(scroller) + scroller.scrollTop;
}

export function maxScrollOf(scroller: HTMLElement): number {
  return scroller.scrollHeight - scroller.clientHeight;
}

/** Height of the lesson's sticky header (`data-lesson-header`), 0 without one. */
export function lessonHeaderHeight(): number {
  return document.querySelector('[data-lesson-header]')?.getBoundingClientRect().height ?? 0;
}

/**
 * Scrolls just enough for `el`'s top to be on screen under the sticky header:
 * nothing when it already is, so a control the learner is looking at never
 * moves under their finger.
 */
export function revealBelowHeader(el: Element | null): void {
  if (!el) return;
  const scroller = appScroller();
  const header = lessonHeaderHeight();
  const top = el.getBoundingClientRect().top - viewportTopOf(scroller);
  const visible = isDocument(scroller) ? window.innerHeight : scroller.clientHeight;
  if (top >= header && top < visible - 48) return;
  scroller.scrollTop = Math.max(0, Math.round(scroller.scrollTop + top - header - HEADING_GAP));
}

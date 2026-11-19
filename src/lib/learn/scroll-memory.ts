/**
 * Where the learner was in each part of a lesson, for this visit (owner,
 * 2026-11-18: "cuando cambio de sección quiero que SIEMPRE abra con el scroll
 * arriba de esa sección, bien posicionado, o en el último lugar donde scrolleé
 * en esa sección").
 *
 * A reading section is remembered as an offset from its resting place (its
 * heading just under the sticky header), not as an absolute scroll: the
 * sections above it collapse and expand, so the same place in a section sits
 * at a different page scroll each time it opens. A step other than the
 * reading is remembered as its plain scroll.
 *
 * Kept in sessionStorage: it survives a reload and the round trip to the feed
 * or the library in the same tab, and is gone in a new visit.
 */

/** Pixels between the sticky header and a section's top when it opens. */
export const HEADING_GAP = 8;

export const sectionKey = (sectionId: string) => `section:${sectionId}`;
export const stepKey = (step: string) => `step:${step}`;

interface Placement {
  /** The section's top, in the scroller's content coordinates. */
  anchorTop: number;
  /** Height of the sticky header over the content. */
  headerHeight: number;
}

/** The scroll that shows a section `offset` px past its heading-at-the-top place, clamped to what the page allows. */
export function scrollTopFor({ anchorTop, headerHeight, offset = 0, maxScroll }: Placement & { offset?: number; maxScroll: number }): number {
  const target = anchorTop - headerHeight - HEADING_GAP + offset;
  return Math.round(Math.min(Math.max(target, 0), Math.max(maxScroll, 0)));
}

/** How far past its heading-at-the-top place the learner is (0 when above it). */
export function offsetFrom({ scrollTop, anchorTop, headerHeight }: Placement & { scrollTop: number }): number {
  return Math.max(0, Math.round(scrollTop - (anchorTop - headerHeight - HEADING_GAP)));
}

export interface ScrollMemory {
  get: (key: string) => number | undefined;
  set: (key: string, value: number) => void;
  /** Writes what changed to storage. */
  flush: () => void;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createScrollMemory(lessonId: string, storage: KeyValueStorage | null): ScrollMemory {
  const storageKey = `jarre.scroll.${lessonId}`;
  const values = new Map<string, number>();
  try {
    const saved = JSON.parse(storage?.getItem(storageKey) ?? '{}') as Record<string, unknown>;
    for (const [k, v] of Object.entries(saved)) if (typeof v === 'number' && Number.isFinite(v)) values.set(k, v);
  } catch {
    // Unreadable: start empty.
  }
  let dirty = false;
  return {
    get: (key) => values.get(key),
    set: (key, value) => {
      if (values.get(key) === value) return;
      values.set(key, value);
      dirty = true;
    },
    flush: () => {
      if (!dirty || !storage) return;
      dirty = false;
      try {
        storage.setItem(storageKey, JSON.stringify(Object.fromEntries(values)));
      } catch {
        // Full or blocked: the memory still works for this page.
      }
    },
  };
}

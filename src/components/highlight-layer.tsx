'use client';

import { useEffect, useRef } from 'react';
import { buildRangeForAnchor, supportsHighlightAPI } from '@/lib/text-anchor';
import type { Annotation } from '@/types';

interface HighlightLayerProps {
  annotations: Annotation[];
  containerRef: React.RefObject<HTMLElement | null>;
  activeAnnotationId: string | null;
  onAnnotationClick?: (annotationId: string) => void;
}

const HIGHLIGHT_NAME = 'jarre-highlights';
const ACTIVE_HIGHLIGHT_NAME = 'jarre-highlight-active';
const STYLE_ID = 'jarre-highlight-css';

/**
 * Inject ::highlight() CSS rules dynamically (Turbopack can't parse them at build time).
 */
function ensureHighlightCSS() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    ::highlight(${HIGHLIGHT_NAME}) {
      background-color: var(--j-highlight);
    }
    ::highlight(${ACTIVE_HIGHLIGHT_NAME}) {
      background-color: var(--j-highlight-active);
    }
  `;
  document.head.appendChild(style);
}

/**
 * Applies visual highlights to the DOM based on stored annotations.
 * Uses CSS Custom Highlight API when available, falls back to <mark> wrapping.
 */
export function HighlightLayer({
  annotations,
  containerRef,
  activeAnnotationId,
  onAnnotationClick,
}: HighlightLayerProps) {
  const marksRef = useRef<HTMLElement[]>([]);
  const usesCSS = useRef(supportsHighlightAPI());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || annotations.length === 0) {
      cleanup(usesCSS.current, marksRef.current);
      marksRef.current = [];
      return;
    }

    if (usesCSS.current) {
      ensureHighlightCSS();
      applyCSSHighlights(container, annotations, activeAnnotationId);
    } else {
      const marks = applyMarkFallback(container, annotations, activeAnnotationId, onAnnotationClick);
      marksRef.current = marks;
    }

    return () => {
      cleanup(usesCSS.current, marksRef.current);
      marksRef.current = [];
    };
  }, [annotations, containerRef, activeAnnotationId, onAnnotationClick]);

  return null;
}

// ---------------------------------------------------------------------------
// CSS Custom Highlight API path
// ---------------------------------------------------------------------------

function applyCSSHighlights(
  container: HTMLElement,
  annotations: Annotation[],
  activeId: string | null
) {
  const highlights = CSS as unknown as { highlights: Map<string, Highlight> };

  const ranges: Range[] = [];
  const activeRanges: Range[] = [];

  for (const ann of annotations) {
    const segmentEl = container.querySelector(
      `[data-segment-index="${ann.segmentIndex}"]`
    ) as HTMLElement | null;
    if (!segmentEl) continue;

    const range = buildRangeForAnchor(
      {
        selectedText: ann.selectedText,
        prefix: ann.prefix,
        suffix: ann.suffix,
        segmentIndex: ann.segmentIndex,
      },
      segmentEl
    );
    if (!range) continue;

    if (ann.id === activeId) {
      activeRanges.push(range);
    }
    ranges.push(range);
  }

  if (ranges.length > 0) {
    highlights.highlights.set(HIGHLIGHT_NAME, new Highlight(...ranges));
  } else {
    highlights.highlights.delete(HIGHLIGHT_NAME);
  }

  if (activeRanges.length > 0) {
    highlights.highlights.set(ACTIVE_HIGHLIGHT_NAME, new Highlight(...activeRanges));
  } else {
    highlights.highlights.delete(ACTIVE_HIGHLIGHT_NAME);
  }
}

// ---------------------------------------------------------------------------
// <mark> fallback path (for browsers without CSS Highlight API)
// ---------------------------------------------------------------------------

function applyMarkFallback(
  container: HTMLElement,
  annotations: Annotation[],
  activeId: string | null,
  onAnnotationClick?: (id: string) => void
): HTMLElement[] {
  // Clean previous marks first
  const existingMarks = container.querySelectorAll('mark[data-annotation-id]');
  existingMarks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      parent.normalize();
    }
  });

  const marks: HTMLElement[] = [];

  for (const ann of annotations) {
    const segmentEl = container.querySelector(
      `[data-segment-index="${ann.segmentIndex}"]`
    ) as HTMLElement | null;
    if (!segmentEl) continue;

    const range = buildRangeForAnchor(
      {
        selectedText: ann.selectedText,
        prefix: ann.prefix,
        suffix: ann.suffix,
        segmentIndex: ann.segmentIndex,
      },
      segmentEl
    );
    if (!range) continue;

    const mark = document.createElement('mark');
    mark.setAttribute('data-annotation-id', ann.id);
    mark.className = ann.id === activeId
      ? 'jarre-highlight jarre-highlight-active'
      : 'jarre-highlight';

    if (onAnnotationClick) {
      mark.style.cursor = 'pointer';
      mark.addEventListener('click', () => onAnnotationClick(ann.id));
    }

    try {
      range.surroundContents(mark);
      marks.push(mark);
    } catch {
      // surroundContents fails if range spans partial nodes — skip
    }
  }

  return marks;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

function cleanup(usesCSS: boolean, marks: HTMLElement[]) {
  if (usesCSS) {
    const highlights = CSS as unknown as { highlights: Map<string, Highlight> };
    highlights.highlights.delete(HIGHLIGHT_NAME);
    highlights.highlights.delete(ACTIVE_HIGHLIGHT_NAME);
  } else {
    for (const mark of marks) {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    }
  }
}

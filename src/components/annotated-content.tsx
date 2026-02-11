'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SectionContent } from './section-content';
import { SelectionPopover } from './selection-popover';
import { HighlightLayer } from './highlight-layer';
import { AnnotationsPanel } from './annotations-panel';
import { createAnchor } from '@/lib/text-anchor';
import type { Annotation, InlineQuiz } from '@/types';
import type { FigureRegistry } from '@/lib/figure-registry';

interface AnnotatedContentProps {
  sectionId: string;
  markdown: string;
  conceptId?: string;
  sectionIndex?: number;
  figures?: FigureRegistry;
  inlineQuizzes?: InlineQuiz[];
}

/**
 * Wraps SectionContent with text highlighting and annotations.
 * Manages annotation state, selection handling, and coordinates the highlight
 * layer, selection popover, and annotations panel.
 */
export function AnnotatedContent({
  sectionId,
  markdown,
  conceptId,
  sectionIndex,
  figures,
  inlineQuizzes,
}: AnnotatedContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch annotations on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchAnnotations() {
      try {
        const res = await fetch(`/api/annotations/${sectionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setAnnotations(data.map(mapDbAnnotation));
          setLoaded(true);
        }
      } catch (err) {
        console.error('[AnnotatedContent] Failed to fetch annotations:', err);
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAnnotations();
    return () => { cancelled = true; };
  }, [sectionId]);

  // Create a new highlight from current selection
  const handleHighlight = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (!selection || !container) return;

    const anchor = createAnchor(selection, container);
    if (!anchor) return;

    // Optimistic: create a temp annotation
    const tempId = `temp-${Date.now()}`;
    const tempAnnotation: Annotation = {
      id: tempId,
      userId: '',
      sectionId,
      selectedText: anchor.selectedText,
      prefix: anchor.prefix,
      suffix: anchor.suffix,
      segmentIndex: anchor.segmentIndex,
      note: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAnnotations((prev) => [...prev, tempAnnotation]);
    selection.removeAllRanges();

    // Persist to API
    fetch(`/api/annotations/${sectionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText: anchor.selectedText,
        prefix: anchor.prefix,
        suffix: anchor.suffix,
        segmentIndex: anchor.segmentIndex,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to create annotation');
        const data = await res.json();
        const real = mapDbAnnotation(data);
        // Replace temp with real
        setAnnotations((prev) =>
          prev.map((a) => (a.id === tempId ? real : a))
        );
      })
      .catch((err) => {
        console.error('[AnnotatedContent] Failed to save annotation:', err);
        // Revert optimistic update
        setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
      });
  }, [sectionId]);

  // Update note on an annotation (debounced in AnnotationCard)
  const handleNoteUpdate = useCallback(
    (annotationId: string, note: string) => {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === annotationId ? { ...a, note, updatedAt: new Date().toISOString() } : a
        )
      );

      fetch(`/api/annotations/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotationId, note }),
      }).catch((err) => {
        console.error('[AnnotatedContent] Failed to update note:', err);
      });
    },
    [sectionId]
  );

  // Delete an annotation
  const handleDelete = useCallback(
    (annotationId: string) => {
      const removed = annotations.find((a) => a.id === annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));

      fetch(`/api/annotations/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotationId }),
      }).catch((err) => {
        console.error('[AnnotatedContent] Failed to delete annotation:', err);
        // Revert
        if (removed) {
          setAnnotations((prev) => [...prev, removed]);
        }
      });
    },
    [sectionId, annotations]
  );

  // Click annotation in panel → scroll to highlight in content
  const handleAnnotationClick = useCallback((annotationId: string) => {
    setActiveAnnotationId(annotationId);

    // Find the mark element or segment
    const container = containerRef.current;
    if (!container) return;

    const mark = container.querySelector(`mark[data-annotation-id="${annotationId}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // For CSS Highlight API: scroll to the segment
    const ann = annotations.find((a) => a.id === annotationId);
    if (ann) {
      const segment = container.querySelector(`[data-segment-index="${ann.segmentIndex}"]`);
      segment?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [annotations]);

  // Click a highlight in the content → activate it in panel
  const handleHighlightClick = useCallback((annotationId: string) => {
    setActiveAnnotationId(annotationId);
  }, []);

  return (
    <>
      <div ref={containerRef} className="relative">
        <SectionContent
          markdown={markdown}
          conceptId={conceptId}
          sectionIndex={sectionIndex}
          figures={figures}
          inlineQuizzes={inlineQuizzes}
        />

        <SelectionPopover
          containerRef={containerRef}
          onHighlight={handleHighlight}
        />

        {loaded && (
          <HighlightLayer
            annotations={annotations}
            containerRef={containerRef}
            activeAnnotationId={activeAnnotationId}
            onAnnotationClick={handleHighlightClick}
          />
        )}
      </div>

      {/* Annotations panel: xl+ only (fixed right sidebar) */}
      {loaded && annotations.length > 0 && (
        <AnnotationsPanel
          annotations={annotations}
          activeAnnotationId={activeAnnotationId}
          onAnnotationClick={handleAnnotationClick}
          onNoteUpdate={handleNoteUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapDbAnnotation(row: Record<string, unknown>): Annotation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    sectionId: row.section_id as string,
    selectedText: row.selected_text as string,
    prefix: (row.prefix as string) || '',
    suffix: (row.suffix as string) || '',
    segmentIndex: (row.segment_index as number) || 0,
    note: (row.note as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SectionContent } from './section-content';
import { SelectionPopover } from './selection-popover';
import { HighlightLayer } from './highlight-layer';
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
 * Wraps SectionContent with text highlighting.
 * Users can select text to create persistent highlights (stored as annotations).
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
  const [loaded, setLoaded] = useState(false);
  const cancelledRef = useRef(false);

  const highlights = annotations.filter((a) => a.selectedText);

  // Fetch existing annotations on mount
  useEffect(() => {
    cancelledRef.current = false;

    fetch(`/api/annotations/${sectionId}`)
      .then(async (res) => {
        if (cancelledRef.current) return;
        if (res.ok) {
          const data = await res.json();
          setAnnotations(data.map(mapDbAnnotation));
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.error('[AnnotatedContent] Failed to fetch annotations:', err);
        if (!cancelledRef.current) setLoaded(true);
      });

    return () => { cancelledRef.current = true; };
  }, [sectionId]);

  // Create a new highlight from current selection
  const handleHighlight = useCallback(() => {
    const selection = window.getSelection();
    const container = containerRef.current;
    if (!selection || !container) return;

    const anchor = createAnchor(selection, container);
    if (!anchor) return;

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
        setAnnotations((prev) =>
          prev.map((a) => (a.id === tempId ? real : a))
        );
      })
      .catch((err) => {
        console.error('[AnnotatedContent] Failed to save annotation:', err);
        setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
      });
  }, [sectionId]);

  return (
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
        enabled={true}
      />

      {loaded && (
        <HighlightLayer
          annotations={highlights}
          containerRef={containerRef}
          activeAnnotationId={null}
          onAnnotationClick={() => {}}
        />
      )}
    </div>
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

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SectionContent } from './section-content';
import { SelectionPopover } from './selection-popover';
import { HighlightLayer } from './highlight-layer';
import { NotebookPanel } from './notebook-panel';
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

const NOTEBOOK_SAVE_DEBOUNCE_MS = 800;

/**
 * Wraps SectionContent with text highlighting and a continuous notebook panel.
 * Manages highlights (for HighlightLayer) and notebook HTML (for NotebookPanel).
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
  const notebookRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [notebookHtml, setNotebookHtml] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [highlightMode, setHighlightMode] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Only highlights (non-empty selectedText) go to the HighlightLayer
  const highlights = annotations.filter((a) => a.selectedText);

  // Track which annotation IDs have been inserted as marks in the notebook.
  // Built from the notebook HTML (not from annotations state), so we only
  // track IDs that are actually present in the editor DOM.
  const markAnnotationIds = useRef(new Set<string>());

  // Fetch annotations + notebook content in parallel on mount.
  // Reconcile: inject <mark> for any annotation not already in the notebook HTML.
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [annotationsRes, notebookRes] = await Promise.all([
          fetch(`/api/annotations/${sectionId}`),
          fetch(`/api/section-notes/${sectionId}`),
        ]);

        if (cancelled) return;

        let fetchedAnnotations: Annotation[] = [];
        let notebookContent = '';

        if (annotationsRes.ok) {
          const data = await annotationsRes.json();
          fetchedAnnotations = data.map(mapDbAnnotation);
        }
        if (notebookRes.ok) {
          const data = await notebookRes.json();
          notebookContent = data.content || '';
        }

        // Reconcile: inject marks for highlights missing from notebook
        const highlightsToInject = fetchedAnnotations.filter(
          (a) => a.selectedText && !notebookContent.includes(`data-annotation-id="${a.id}"`)
        );

        if (highlightsToInject.length > 0) {
          const marksHtml = highlightsToInject
            .map((a) => `<mark data-annotation-id="${a.id}">${escapeHtml(a.selectedText)}</mark>`)
            .join(' ');

          const separator = notebookContent.length > 0 ? ' ' : '';
          notebookContent = notebookContent + separator + marksHtml;

          // Persist the reconciled notebook
          fetch(`/api/section-notes/${sectionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: notebookContent }),
          }).catch((err) => {
            console.error('[AnnotatedContent] Failed to save reconciled notebook:', err);
          });
        }

        // Update the set of mark IDs present in the notebook
        const markIds = new Set<string>();
        const markRegex = /data-annotation-id="([^"]+)"/g;
        let match;
        while ((match = markRegex.exec(notebookContent)) !== null) {
          markIds.add(match[1]);
        }
        markAnnotationIds.current = markIds;

        setAnnotations(fetchedAnnotations);
        setNotebookHtml(notebookContent);
        setLoaded(true);
      } catch (err) {
        console.error('[AnnotatedContent] Failed to fetch data:', err);
        if (!cancelled) setLoaded(true);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [sectionId]);

  // Save notebook HTML to API (debounced)
  const saveNotebook = useCallback((html: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/section-notes/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      }).catch((err) => {
        console.error('[AnnotatedContent] Failed to save notebook:', err);
      });
    }, NOTEBOOK_SAVE_DEBOUNCE_MS);
  }, [sectionId]);

  // Cleanup save timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Handle notebook content changes from the editor
  const handleNotebookChange = useCallback((html: string) => {
    saveNotebook(html);
  }, [saveNotebook]);

  // When marks are deleted from the notebook, delete corresponding annotations
  const handleMarksDeleted = useCallback((deletedIds: string[]) => {
    for (const annotationId of deletedIds) {
      markAnnotationIds.current.delete(annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));

      fetch(`/api/annotations/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotationId }),
      }).catch((err) => {
        console.error('[AnnotatedContent] Failed to delete annotation:', err);
      });
    }
  }, [sectionId]);

  // Insert a mark into the notebook editor
  const insertMarkInNotebook = useCallback((annotationId: string, text: string) => {
    const editor = notebookRef.current;
    if (!editor) return;

    const markHtml = `<mark data-annotation-id="${annotationId}">${escapeHtml(text)}</mark>`;

    // If editor has focus and a cursor position, insert there
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      document.execCommand('insertHTML', false, markHtml + ' ');
    } else {
      // Append at end
      const needsSpace = editor.innerHTML.length > 0 && !editor.innerHTML.endsWith(' ') && !editor.innerHTML.endsWith('\n');
      editor.innerHTML += (needsSpace ? ' ' : '') + markHtml + ' ';
    }

    // Track the new mark ID
    markAnnotationIds.current.add(annotationId);

    // Trigger save immediately
    const html = editor.innerHTML;
    saveNotebook(html);
  }, [saveNotebook]);

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

    // Persist to API, then insert mark in notebook with real ID
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
        // Insert into notebook with the real annotation ID
        insertMarkInNotebook(real.id, real.selectedText);
      })
      .catch((err) => {
        console.error('[AnnotatedContent] Failed to save annotation:', err);
        setAnnotations((prev) => prev.filter((a) => a.id !== tempId));
      });
  }, [sectionId, insertMarkInNotebook]);

  // Click a highlight in the content → scroll to its mark in notebook
  const handleHighlightClick = useCallback((annotationId: string) => {
    const editor = notebookRef.current;
    if (!editor) return;

    const mark = editor.querySelector(`mark[data-annotation-id="${annotationId}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief flash effect
      mark.classList.add('ring-2', 'ring-j-accent');
      setTimeout(() => mark.classList.remove('ring-2', 'ring-j-accent'), 1500);
    }
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
          enabled={highlightMode}
        />

        {loaded && (
          <HighlightLayer
            annotations={highlights}
            containerRef={containerRef}
            activeAnnotationId={null}
            onAnnotationClick={handleHighlightClick}
          />
        )}
      </div>

      {/* Notebook panel: continuous editable surface */}
      {loaded && (
        <NotebookPanel
          initialContent={notebookHtml}
          highlightMode={highlightMode}
          onToggleHighlight={() => setHighlightMode((prev) => !prev)}
          onContentChange={handleNotebookChange}
          onMarksDeleted={handleMarksDeleted}
          knownAnnotationIds={markAnnotationIds.current}
          editorRef={notebookRef}
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface NotebookPanelProps {
  initialContent: string;
  highlightMode: boolean;
  onToggleHighlight: () => void;
  onContentChange: (html: string) => void;
  onMarksDeleted: (deletedIds: string[]) => void;
  /** Known annotation IDs currently in the notebook */
  knownAnnotationIds: Set<string>;
  /** Ref exposed so parent can insert marks programmatically */
  editorRef: React.RefObject<HTMLDivElement | null>;
}

const SAVE_DEBOUNCE_MS = 600;
const LS_WIDTH_KEY = 'jarre:notebook-width';
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

/**
 * Continuous notebook surface using contentEditable.
 * Renders free text + inline <mark> spans for highlights.
 * No rich formatting — plaintext + marks only.
 */
export function NotebookPanel({
  initialContent,
  highlightMode,
  onToggleHighlight,
  onContentChange,
  onMarksDeleted,
  knownAnnotationIds,
  editorRef,
}: NotebookPanelProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mountedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // Panel width — persisted in localStorage
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH;
    const stored = localStorage.getItem(LS_WIDTH_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed;
    }
    return DEFAULT_WIDTH;
  });

  // Drag-to-resize from the left edge
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;

    function onMouseMove(ev: MouseEvent) {
      if (!isDraggingRef.current) return;
      // Dragging left increases width, dragging right decreases
      const delta = startX - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      setWidth(newWidth);
    }

    function onMouseUp() {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width]);

  // Persist width to localStorage on change
  useEffect(() => {
    localStorage.setItem(LS_WIDTH_KEY, String(width));
  }, [width]);

  // Set initial content on mount only (no React-controlled innerHTML)
  useEffect(() => {
    if (editorRef.current && !mountedRef.current) {
      editorRef.current.innerHTML = initialContent;
      mountedRef.current = true;
    }
  }, [initialContent, editorRef]);

  // Detect deleted marks by diffing current mark IDs vs known annotation IDs
  const checkDeletedMarks = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentMarks = editor.querySelectorAll('mark[data-annotation-id]');
    const currentIds = new Set<string>();
    currentMarks.forEach((mark) => {
      const id = mark.getAttribute('data-annotation-id');
      if (id) currentIds.add(id);
    });

    const deleted: string[] = [];
    knownAnnotationIds.forEach((id) => {
      if (!currentIds.has(id)) deleted.push(id);
    });

    if (deleted.length > 0) {
      onMarksDeleted(deleted);
    }
  }, [editorRef, knownAnnotationIds, onMarksDeleted]);

  const polishNotes = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor || isPolishing) return;

    const html = editor.innerHTML.trim();
    if (!html) return;

    setIsPolishing(true);
    try {
      const res = await fetch('/api/section-notes/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: html }),
      });

      if (!res.ok) {
        console.error('[NotesPolish] API error:', res.status);
        return;
      }

      const data = await res.json();
      if (data.content) {
        editor.innerHTML = data.content;
        onContentChange(data.content);
      }
    } catch (error) {
      console.error('[NotesPolish] Failed:', error);
    } finally {
      setIsPolishing(false);
    }
  }, [editorRef, isPolishing, onContentChange]);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onContentChange(editor.innerHTML);
      checkDeletedMarks();
    }, SAVE_DEBOUNCE_MS);
  }, [editorRef, onContentChange, checkDeletedMarks]);

  // Intercept paste: insert plaintext only
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Auto-focus: any printable keypress focuses the editor immediately
  useEffect(() => {
    function handleGlobalKeydown(e: KeyboardEvent) {
      const editor = editorRef.current;
      if (!editor) return;

      // Already focused on the editor — do nothing
      if (document.activeElement === editor) return;

      // Skip if user is typing in another input/textarea/contentEditable
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) return;

      // Skip modifier combos (Ctrl+C, Cmd+V, etc.) and non-printable keys
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;

      // Focus editor and place cursor at end
      editor.focus();
      const selection = window.getSelection();
      if (selection) {
        selection.selectAllChildren(editor);
        selection.collapseToEnd();
      }
      // The keypress will naturally insert the character now that editor has focus
    }

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, [editorRef]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <aside
      className="hidden xl:flex fixed right-0 top-[60px] h-[calc(100vh-60px)] border-l border-j-border bg-j-bg z-40 flex-col"
      style={{ width: `${width}px` }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-j-accent/30 transition-colors z-20"
      />

      {/* Header */}
      <div className="sticky top-0 bg-j-bg border-b border-j-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            Notas
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={polishNotes}
              disabled={isPolishing}
              className={`font-mono text-[10px] tracking-wider px-1.5 py-0.5 transition-colors rounded-sm ${
                isPolishing
                  ? 'text-j-accent opacity-60 cursor-wait'
                  : 'text-j-text-tertiary hover:text-j-text-secondary'
              }`}
              title="Formatear notas con AI"
            >
              {isPolishing ? '...' : 'FORMAT'}
            </button>
            <button
              type="button"
              onClick={onToggleHighlight}
              className={`font-mono text-[10px] tracking-wider px-1.5 py-0.5 transition-colors rounded-sm ${
                highlightMode
                  ? 'bg-j-highlight/60 text-j-text'
                  : 'text-j-text-tertiary hover:text-j-text-secondary'
              }`}
              title={highlightMode ? 'Subrayado activo' : 'Subrayado inactivo'}
            >
              HL
            </button>
          </div>
        </div>
      </div>

      {/* Editor wrapper (relative for overlay) */}
      <div className="relative flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable={!isPolishing}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          className={`h-full px-4 py-3 text-sm text-j-text-body font-[Georgia,_'Times_New_Roman',_serif] italic leading-relaxed outline-none notebook-editor transition-opacity ${isPolishing ? 'opacity-40' : ''}`}
          style={{ whiteSpace: 'pre-wrap', minHeight: '100px' }}
          data-placeholder="Escribe tus notas aqui..."
        />

        {/* Polish loading overlay */}
        {isPolishing && (
          <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-j-bg/90 border border-j-border rounded-full shadow-sm">
              <div className="w-3 h-3 border-2 border-j-text-tertiary border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-[10px] tracking-wider text-j-text-secondary">
                Formateando notas...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CSS for placeholder via :empty pseudo-element */}
      <style>{`
        .notebook-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--j-text-tertiary);
          opacity: 0.5;
          pointer-events: none;
        }
        .notebook-editor mark[data-annotation-id] {
          background-color: var(--j-highlight);
          border-radius: 2px;
          padding: 0 1px;
          box-shadow: inset 0 -2px 0 0 var(--j-highlight), inset 0 -8px 0 -4px var(--j-highlight);
        }
      `}</style>
    </aside>
  );
}

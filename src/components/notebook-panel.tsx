'use client';

import { useRef, useEffect, useCallback } from 'react';

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <aside className="hidden xl:flex fixed right-0 top-[60px] w-[280px] h-[calc(100vh-60px)] border-l border-j-border bg-j-bg z-40 flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-j-bg border-b border-j-border px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            Notas
          </span>
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

      {/* Editable notebook surface */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="flex-1 overflow-y-auto px-4 py-3 text-xs text-j-text-body font-[Georgia,_'Times_New_Roman',_serif] italic leading-relaxed outline-none notebook-editor"
        style={{ whiteSpace: 'pre-wrap', minHeight: '100px' }}
        data-placeholder="Escribe tus notas aqui..."
      />

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

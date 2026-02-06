'use client';

import { useCallback, useRef, useEffect } from 'react';
import { Tldraw, Editor, getSnapshot, loadSnapshot, TLStoreSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { t, type Language } from '@/lib/translations';

interface CanvasNotesProps {
  resourceId: string;
  initialData: unknown;
  language: Language;
  onSave: (data: unknown) => void;
}

export function CanvasNotes({ resourceId, initialData, language, onSave }: CanvasNotesProps) {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  // Save canvas data with debounce
  const saveCanvas = useCallback(() => {
    if (!editorRef.current) return;

    const snapshot = getSnapshot(editorRef.current.store);
    const serialized = JSON.stringify(snapshot);

    // Skip if unchanged
    if (serialized === lastSavedRef.current) return;

    lastSavedRef.current = serialized;
    onSave(snapshot);
  }, [onSave]);

  // Debounced save on changes
  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveCanvas, 1000);
  }, [saveCanvas]);

  // Mount editor and load initial data
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Load initial data if present
      if (initialData) {
        try {
          loadSnapshot(editor.store, initialData as TLStoreSnapshot);
        } catch (err) {
          console.error('[Canvas] Failed to load snapshot:', err);
        }
      }

      // Listen for changes
      editor.store.listen(handleChange, { source: 'user', scope: 'document' });
    },
    [initialData, handleChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Final save
      saveCanvas();
    };
  }, [saveCanvas]);

  return (
    <div className="relative h-full w-full">
      <Tldraw
        onMount={handleMount}
        inferDarkMode={false}
        persistenceKey={`canvas-${resourceId}`}
      />
      <div className="absolute bottom-2 right-2 rounded bg-stone-900/70 px-2 py-1 text-xs text-white">
        {t('study.canvasHint', language)}
      </div>
    </div>
  );
}

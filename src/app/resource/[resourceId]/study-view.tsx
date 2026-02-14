'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SplitPaneLayout } from './split-pane-layout';
import { PdfViewer } from './pdf-viewer';
import { t, type Language } from '@/lib/translations';

// Dynamic import for tldraw (no SSR, ~500KB bundle)
const CanvasNotes = dynamic(
  () => import('./canvas-notes').then((mod) => mod.CanvasNotes),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-stone-100">
        <p className="text-sm text-stone-500">Loading canvas...</p>
      </div>
    ),
  }
);

interface StudyViewProps {
  resourceId: string;
  resourceUrl: string | null;
  resourceTitle: string;
  startPage?: number | null;
  endPage?: number | null;
  initialCanvasData: unknown;
  initialSplitPosition: number;
  language: Language;
}

export function StudyView({
  resourceId,
  resourceUrl,
  resourceTitle,
  startPage,
  endPage,
  initialCanvasData,
  initialSplitPosition,
  language,
}: StudyViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const splitPositionRef = useRef(initialSplitPosition);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save canvas data to API
  const handleCanvasSave = useCallback(
    async (data: unknown) => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/notes/${resourceId}/canvas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvas_data: data }),
        });

        if (!response.ok) {
          console.error('[StudyView] Failed to save canvas:', await response.text());
          setSaveError(true);
        } else {
          setSaveError(false);
        }
      } catch (error) {
        console.error('[StudyView] Error saving canvas:', error);
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    },
    [resourceId]
  );

  // Save split position with debounce
  const handlePositionChange = useCallback(
    (position: number) => {
      // Clamp position to valid range (must match Panel minSize/maxSize)
      const clampedPosition = Math.max(20, Math.min(80, position));

      // Skip if unchanged
      if (clampedPosition === splitPositionRef.current) return;
      splitPositionRef.current = clampedPosition;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/notes/${resourceId}/layout`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ split_position: clampedPosition }),
          });

          if (!response.ok) {
            console.error('[StudyView] Failed to save layout:', await response.text());
          }
        } catch (error) {
          console.error('[StudyView] Error saving layout:', error);
        }
      }, 500);
    },
    [resourceId]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <SplitPaneLayout
        leftPane={<PdfViewer url={resourceUrl} title={resourceTitle} language={language} startPage={startPage} endPage={endPage} />}
        rightPane={
          <CanvasNotes
            resourceId={resourceId}
            initialData={initialCanvasData}
            language={language}
            onSave={handleCanvasSave}
          />
        }
        defaultPosition={initialSplitPosition}
        onPositionChange={handlePositionChange}
      />
      {(isSaving || saveError) && (
        <div className={`absolute bottom-2 left-2 rounded px-2 py-1 text-xs text-white ${
          saveError ? 'bg-red-600/90' : 'bg-stone-900/70'
        }`}>
          {saveError
            ? (language === 'es' ? 'No guardado' : 'Not saved')
            : t('study.saving', language)}
        </div>
      )}
    </div>
  );
}

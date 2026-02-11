'use client';

import { AnnotationCard } from './annotation-card';
import type { Annotation } from '@/types';

interface AnnotationsPanelProps {
  annotations: Annotation[];
  activeAnnotationId: string | null;
  onAnnotationClick: (annotationId: string) => void;
  onNoteUpdate: (annotationId: string, note: string) => void;
  onDelete: (annotationId: string) => void;
}

/**
 * Fixed right sidebar panel showing all highlights + notes.
 * Only visible on xl+ breakpoint (≥1280px).
 */
export function AnnotationsPanel({
  annotations,
  activeAnnotationId,
  onAnnotationClick,
  onNoteUpdate,
  onDelete,
}: AnnotationsPanelProps) {
  return (
    <aside className="hidden xl:block fixed right-0 top-[60px] w-[280px] h-[calc(100vh-60px)] border-l border-j-border bg-j-bg overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-j-bg border-b border-j-border px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            Notas
          </span>
          <span className="font-mono text-[10px] text-j-text-tertiary">
            {annotations.length}
          </span>
        </div>
      </div>

      {/* Annotation list */}
      <div className="p-2 space-y-1">
        {annotations.map((annotation) => (
          <AnnotationCard
            key={annotation.id}
            annotation={annotation}
            isActive={annotation.id === activeAnnotationId}
            onClick={() => onAnnotationClick(annotation.id)}
            onNoteUpdate={onNoteUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </aside>
  );
}

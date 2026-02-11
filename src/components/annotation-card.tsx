'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Annotation } from '@/types';

interface AnnotationCardProps {
  annotation: Annotation;
  isActive: boolean;
  onClick: () => void;
  onNoteUpdate: (annotationId: string, note: string) => void;
  onDelete: (annotationId: string) => void;
}

const DEBOUNCE_MS = 500;

/**
 * Single annotation card in the sidebar panel.
 * Shows the highlighted text, optional note (editable), and delete button.
 */
export function AnnotationCard({
  annotation,
  isActive,
  onClick,
  onNoteUpdate,
  onDelete,
}: AnnotationCardProps) {
  const [note, setNote] = useState(annotation.note || '');
  const [isEditing, setIsEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync from prop when annotation changes externally
  useEffect(() => {
    setNote(annotation.note || '');
  }, [annotation.note]);

  const handleNoteChange = useCallback(
    (value: string) => {
      setNote(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onNoteUpdate(annotation.id, value);
      }, DEBOUNCE_MS);
    },
    [annotation.id, onNoteUpdate]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const truncatedText =
    annotation.selectedText.length > 80
      ? annotation.selectedText.slice(0, 80) + '…'
      : annotation.selectedText;

  return (
    <div
      className={`border-l-2 px-3 py-2 cursor-pointer transition-colors ${
        isActive
          ? 'border-j-warm bg-j-warm-light'
          : 'border-j-border hover:border-j-warm-muted hover:bg-j-bg-hover'
      }`}
      onClick={onClick}
    >
      {/* Highlighted text preview */}
      <p className="text-xs text-j-text leading-relaxed mb-1 bg-j-highlight/30 px-1 -mx-1 inline">
        &ldquo;{truncatedText}&rdquo;
      </p>

      {/* Note area */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          onBlur={() => {
            if (!note.trim()) setIsEditing(false);
          }}
          placeholder="Agregar nota…"
          className="w-full mt-1 text-xs text-j-text-body bg-transparent border-none outline-none resize-none placeholder:text-j-text-tertiary"
          rows={1}
        />
      ) : note ? (
        <p
          className="text-xs text-j-text-secondary mt-1 cursor-text"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {note}
        </p>
      ) : (
        <button
          type="button"
          className="text-[10px] text-j-text-tertiary mt-1 hover:text-j-text-secondary transition-colors font-mono tracking-wider uppercase"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          + Nota
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(annotation.id);
        }}
        className="text-[10px] text-j-text-tertiary hover:text-j-error mt-1 ml-1 float-right font-mono transition-colors"
        title="Eliminar"
      >
        ×
      </button>
    </div>
  );
}

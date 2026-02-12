'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { gradeLabel } from '@/lib/exercises/grading';
import type { LabelExercise, ExerciseResult } from '@/types';

interface Props {
  exercise: LabelExercise;
  onSubmit: (result: ExerciseResult) => void;
}

function DraggableLabel({ id, text, disabled }: { id: string; text: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`inline-block font-mono text-[10px] tracking-[0.1em] px-3 py-1.5 border border-j-border-input bg-j-bg cursor-grab active:cursor-grabbing hover:border-j-accent transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      {text}
    </div>
  );
}

function DropZone({ id, label, placed }: { id: string; label?: string; placed?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`inline-flex items-center justify-center min-w-[100px] h-8 border-2 border-dashed font-mono text-[10px] tracking-[0.1em] transition-colors ${
        placed
          ? 'border-j-accent bg-j-accent-light text-j-text'
          : isOver
          ? 'border-j-warm bg-j-warm-light text-j-text-secondary'
          : 'border-j-border text-j-text-tertiary'
      }`}
    >
      {placed || label || '?'}
    </div>
  );
}

export function LabelExerciseComponent({ exercise, onSubmit }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});

  // Track which labels are placed
  const placedLabels = new Set(Object.values(placements));
  const availableLabels = exercise.labels.filter((l) => !placedLabels.has(l));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const label = active.id as string;
      const zoneId = over.id as string;

      // Only allow dropping on valid zones
      if (!exercise.zones.find((z) => z.id === zoneId)) return;

      setPlacements((prev) => {
        const next = { ...prev };
        // Remove label from any previous zone
        for (const [key, val] of Object.entries(next)) {
          if (val === label) delete next[key];
        }
        // Place in new zone
        next[zoneId] = label;
        return next;
      });
    },
    [exercise.zones]
  );

  function handleSubmit() {
    const score = gradeLabel(placements, exercise.zones);
    onSubmit({
      exerciseId: exercise.id,
      score,
      isCorrect: score >= 70,
      details: { placements },
    });
  }

  const allPlaced = Object.keys(placements).length === exercise.zones.length;

  return (
    <div className="space-y-4">
      <DndContext onDragEnd={handleDragEnd}>
        {/* SVG diagram with drop zones */}
        <div className="border border-j-border bg-j-bg p-4 overflow-x-auto">
          <svg viewBox={exercise.svgViewBox} width="100%" style={{ minHeight: 200 }}>
            <g dangerouslySetInnerHTML={{ __html: exercise.svgElements }} />
          </svg>

          {/* Drop zones (positioned below SVG) */}
          <div className="flex flex-wrap gap-3 mt-4">
            {exercise.zones.map((zone) => (
              <DropZone
                key={zone.id}
                id={zone.id}
                placed={placements[zone.id]}
              />
            ))}
          </div>
        </div>

        {/* Available labels */}
        <div className="flex flex-wrap gap-2">
          {availableLabels.map((label) => (
            <DraggableLabel key={label} id={label} text={label} disabled={false} />
          ))}
        </div>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={!allPlaced}
        className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
      >
        Verificar etiquetas
      </button>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { gradeSequence } from '@/lib/exercises/grading';
import type { SequenceExercise, ExerciseResult } from '@/types';

interface Props {
  exercise: SequenceExercise;
  onSubmit: (result: ExerciseResult) => void;
}

function SortableStep({ id, text }: { id: string; text: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 bg-j-bg border border-j-border-input px-4 py-3 cursor-grab active:cursor-grabbing hover:border-j-accent transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-j-text-tertiary flex-shrink-0">
        <circle cx="3" cy="3" r="1.5" fill="currentColor" />
        <circle cx="9" cy="3" r="1.5" fill="currentColor" />
        <circle cx="3" cy="9" r="1.5" fill="currentColor" />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      </svg>
      <span className="text-sm text-j-text">{text}</span>
    </div>
  );
}

export function SequenceExerciseComponent({ exercise, onSubmit }: Props) {
  // Shuffle initial order
  const shuffled = useMemo(() => {
    const items = [...exercise.steps];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }, [exercise.steps]);

  const [items, setItems] = useState(shuffled);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function handleSubmit() {
    const userOrder = items.map((i) => i.id);
    const score = gradeSequence(userOrder, exercise.correctOrder);
    onSubmit({
      exerciseId: exercise.id,
      score,
      isCorrect: score >= 70,
      details: { userOrder, correctOrder: exercise.correctOrder },
    });
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((step) => (
              <SortableStep key={step.id} id={step.id} text={step.text} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleSubmit}
        className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
      >
        Verificar orden
      </button>
    </div>
  );
}

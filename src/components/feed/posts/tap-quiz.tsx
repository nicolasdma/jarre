'use client';

/**
 * Tap-quiz: an inline quiz from the lesson. Tap an option to see which was
 * right and why; or just scroll past. Optional, never blocking.
 */

import { useState } from 'react';
import type { FeedPost } from '@/lib/feed/feed-post';
import type { FeedGraph } from '@/lib/feed/feed-graph';
import { ParticipationPill, PostShell, TapButton } from './post-shell';

export function TapQuiz({
  post,
  graph,
  active,
  reducedMotion,
}: {
  post: FeedPost;
  graph: FeedGraph;
  active: boolean;
  reducedMotion: boolean;
}) {
  const quiz = post.quizId ? graph.quizzes[post.quizId] : undefined;
  const concept = graph.concepts.find((c) => c.id === post.conceptId);
  const [picked, setPicked] = useState<string | null>(null);
  if (!quiz) return null;

  const options: { label: string; text: string }[] =
    quiz.format === 'tf'
      ? [{ label: 'true', text: 'Verdadero' }, { label: 'false', text: 'Falso' }]
      : quiz.options ?? [];
  const revealed = picked !== null;

  return (
    <PostShell
      post={post}
      active={active}
      reducedMotion={reducedMotion}
      label={`${concept?.name ?? 'Quiz'}: quiz`}
      eyebrow={<>
        <span>Quiz{concept ? ` · ${concept.name}` : ''}</span>
        <ParticipationPill post={post} />
      </>}
      hint={revealed ? undefined : 'Tocá una opción · o seguí scrolleando'}
    >
      <h2 className="text-2xl font-semibold leading-snug sm:text-3xl" lang="en" style={{ color: 'var(--fp-ink)' }}>
        {quiz.question}
      </h2>
      <div className="flex flex-col gap-2" role="group" aria-label="Opciones">
        {options.map((o) => {
          const isCorrect = o.label === quiz.correctAnswer;
          const isPicked = picked === o.label;
          const show = revealed && (isCorrect || isPicked);
          return (
            <TapButton
              key={o.label}
              onClick={() => !revealed && setPicked(o.label)}
              selected={show && isCorrect}
              className={isPicked && !isCorrect ? 'line-through opacity-80' : undefined}
              aria-label={`${o.text}${show ? (isCorrect ? ' (correcta)' : ' (tu elección)') : ''}`}
            >
              <span className="flex items-center gap-2">
                {show && <span aria-hidden>{isCorrect ? '✓' : '×'}</span>}
                <span lang="en">{o.text}</span>
              </span>
            </TapButton>
          );
        })}
      </div>
      {revealed && quiz.explanation && (
        <p className="border-l-2 pl-4 text-sm leading-relaxed sm:text-base" lang="en" style={{ color: 'var(--fp-soft)', borderColor: 'color-mix(in srgb, var(--fp-accent) 40%, transparent)' }}>
          {quiz.explanation}
        </p>
      )}
    </PostShell>
  );
}

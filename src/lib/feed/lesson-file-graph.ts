/**
 * A lesson JSON file (docs/lesson-format.md) straight to the feed graph's
 * input, without a database: the same mapping scripts/seed-lesson.ts applies
 * to the tables (mapQuiz, mapCard), so what the dev preview shows is what the
 * real feed shows once the lesson is seeded.
 *
 * Only the dev preview uses it (src/app/dev/feed-preview). Pure: the caller
 * reads the file and says which drills have a recording.
 */

import { mapCard, mapQuiz, type Lesson } from '@/lib/lessons/lesson-format';
import type { PracticeDrill } from '@/components/practice/types';
import type { PhraseSegment } from '@/lib/practice/phrase-segments';
import type { BuildFeedGraphInput } from './feed-graph';

export interface LessonFileAudio {
  /** URL the browser can play, or null when the drill has no recording. */
  url: string | null;
  segments: PhraseSegment[] | null;
}

export function lessonFileGraphInput(
  lesson: Lesson,
  audioFor: (drillId: string, textEn: string) => LessonFileAudio,
): BuildFeedGraphInput {
  const concepts = lesson.concepts.map((c, i) => ({
    id: c.id,
    name: c.name,
    definition: c.definition,
    sortOrder: i,
    sectionMarkdown: c.section?.markdown ?? null,
  }));

  const quizzes = lesson.concepts.flatMap((c) =>
    c.quizzes.map((q, i) => {
      const { options, correct_answer } = mapQuiz(q);
      return {
        id: `${c.id}#quiz-${i}`,
        conceptId: c.id,
        format: q.format,
        question: q.question,
        options,
        correctAnswer: correct_answer,
        explanation: q.explanation ?? '',
      };
    }),
  );

  const cards = lesson.concepts.flatMap((c) =>
    c.cards
      .filter((k) => k.type === 'recall')
      .map((k, i) => {
        const { front_content, back_content } = mapCard(k);
        const prompt = typeof front_content.prompt === 'string' ? front_content.prompt : '';
        const answer = typeof back_content.definition === 'string' ? back_content.definition : '';
        return { id: `${c.id}#card-${i}`, conceptId: c.id, prompt, answer };
      })
      .filter((k) => k.prompt && k.answer),
  );

  const drills: PracticeDrill[] = lesson.drills.map((d) => {
    const audio = audioFor(d.id, d.text_en);
    return {
      slug: d.id,
      title: d.title,
      priority: d.priority,
      textEn: d.text_en,
      textEs: d.text_es ?? null,
      audioUrl: audio.url,
      conceptId: d.concept ?? null,
      segments: audio.segments,
    };
  });

  return { resourceId: lesson.id, concepts, quizzes, cards, drills, interview: lesson.interview ?? null };
}

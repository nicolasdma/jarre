/**
 * A lesson JSON read from disk and shaped exactly like the props
 * /learn/<id> hands to LearnFlow, so the learn view can be measured
 * (CPU, frames, heap, renders) without a session or the database.
 *
 * Only for local measurement: enabled when JARRE_PERF_LESSON points at a
 * lesson file (docs/lesson-format.md). The mapping is the one
 * scripts/seed-lesson.ts writes to the tables and page.tsx reads back.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  LessonSchema,
  drillSegments,
  mapQuiz,
  normalizeSectionMarkdown,
  resolveQuizHeading,
  sectionHeadings,
  segmentsSidecarPath,
  stableUuid,
  type DrillSegmentsFile,
  type Lesson,
} from '@/lib/lessons/lesson-format';
import type { PracticeDrill } from '@/components/practice/types';
import type { InlineQuiz } from '@/types';

/** The lesson file to measure, or null when the harness is off. */
export function perfLessonPath(): string | null {
  const raw = process.env.JARRE_PERF_LESSON;
  if (!raw) return null;
  return resolve(raw.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'));
}

export function readPerfLesson(path: string): Lesson {
  return LessonSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
}

/** The drill's local recording, as seed-lesson.ts finds it. */
export function localDrillAudio(lessonPath: string, drill: Lesson['drills'][number]): string | null {
  const dir = dirname(lessonPath);
  const candidates = [drill.audio ? resolve(dir, drill.audio) : null, join(dir, 'audios', `${drill.id}.m4a`)];
  return candidates.find((p): p is string => Boolean(p && existsSync(p))) ?? null;
}

export interface PerfLessonProps {
  resourceId: string;
  resourceTitle: string;
  sections: { id: string; conceptId: string; sectionTitle: string; contentMarkdown: string; sortOrder: number }[];
  concepts: { id: string; name: string; canonical_definition: string }[];
  quizzesBySectionId: Record<string, InlineQuiz[]>;
  drills: PracticeDrill[];
  interviewConfig: unknown;
}

export function perfLessonProps(lessonPath: string, audioUrl: (drillId: string) => string): PerfLessonProps {
  const lesson = readPerfLesson(lessonPath);
  const resourceId = lesson.id;
  const sections = lesson.concepts.map((c, i) => {
    const markdown = normalizeSectionMarkdown(c.section.markdown);
    const headings = sectionHeadings(markdown);
    const id = stableUuid(`${resourceId}/section/${c.id}`);
    const quizzes: InlineQuiz[] = c.quizzes.map((q, qi) => {
      const mapped = mapQuiz(q);
      return {
        id: stableUuid(`${resourceId}/quiz/${c.id}/${qi}`),
        sectionId: id,
        positionAfterHeading: resolveQuizHeading(q, headings),
        sortOrder: qi,
        format: q.format,
        questionText: q.question,
        options: mapped.options,
        correctAnswer: mapped.correct_answer,
        explanation: q.explanation,
        justificationHint: q.justification_hint ?? undefined,
      };
    });
    return { id, concept: c, markdown, sortOrder: i + 1, quizzes };
  });

  const drills: PracticeDrill[] = lesson.drills
    .map((d) => {
      const local = localDrillAudio(lessonPath, d);
      const sidecarPath = local ? segmentsSidecarPath(local) : null;
      const sidecar = sidecarPath && existsSync(sidecarPath)
        ? (JSON.parse(readFileSync(sidecarPath, 'utf8')) as DrillSegmentsFile)
        : null;
      const sha1 = local ? createHash('sha1').update(readFileSync(local)).digest('hex') : null;
      return {
        slug: d.id,
        title: d.title,
        priority: d.priority,
        textEn: d.text_en,
        textEs: d.text_es ?? null,
        audioUrl: local ? audioUrl(d.id) : null,
        conceptId: d.concept ?? null,
        segments: drillSegments(d, sidecar, sha1).segments,
      };
    })
    // The same order fetchPracticeDrills reads: priority, then slug.
    .sort((a, b) => a.priority - b.priority || a.slug.localeCompare(b.slug));

  return {
    resourceId,
    resourceTitle: lesson.title,
    sections: sections.map((s) => ({
      id: s.id,
      conceptId: s.concept.id,
      sectionTitle: s.concept.section.title,
      contentMarkdown: s.markdown,
      sortOrder: s.sortOrder,
    })),
    concepts: lesson.concepts.map((c) => ({ id: c.id, name: c.name, canonical_definition: c.definition })),
    quizzesBySectionId: Object.fromEntries(sections.map((s) => [s.id, s.quizzes])),
    drills,
    interviewConfig: lesson.interview ?? null,
  };
}

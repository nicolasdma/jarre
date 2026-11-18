/**
 * The dev preview's lesson: a lesson JSON on disk (docs/lesson-format.md),
 * named by FEED_PREVIEW_LESSON, with its recordings in the `audios/` folder
 * next to it (the layout scripts/seed-lesson.ts reads). Development only: the
 * page and the audio route 404 before calling anything here outside
 * `next dev`.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LessonSchema, drillSegments, segmentsSidecarPath, type DrillSegmentsFile, type Lesson } from '@/lib/lessons/lesson-format';

export const PREVIEW_ENV = 'FEED_PREVIEW_LESSON';

/** Drill ids are file names; anything else never reaches the file system. */
const DRILL_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function previewLessonPath(): string | null {
  const p = process.env[PREVIEW_ENV];
  return p && p.trim() ? path.resolve(p.trim()) : null;
}

export function loadPreviewLesson(): { lesson: Lesson } | { error: string } {
  const file = previewLessonPath();
  if (!file) return { error: `Set ${PREVIEW_ENV} to a lesson JSON path and restart \`npm run dev\`.` };
  if (!existsSync(file)) return { error: `${PREVIEW_ENV} points to a missing file: ${file}` };
  const parsed = LessonSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
  if (!parsed.success) return { error: `Not a valid lesson: ${parsed.error.issues.slice(0, 3).map((i) => i.message).join('; ')}` };
  return { lesson: parsed.data };
}

/** The recording of a drill on disk, or null. */
export function previewAudioFile(drillId: string): string | null {
  const file = previewLessonPath();
  if (!file || !DRILL_ID.test(drillId)) return null;
  const audio = path.join(path.dirname(file), 'audios', `${drillId}.m4a`);
  return existsSync(audio) ? audio : null;
}

/** The phrase timings for a drill's recording, when its sidecar still fits. */
export function previewSegments(drillId: string, textEn: string): { start: number; end: number }[] | null {
  const audio = previewAudioFile(drillId);
  if (!audio) return null;
  const sidecarPath = segmentsSidecarPath(audio);
  if (!existsSync(sidecarPath)) return null;
  try {
    const sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8')) as DrillSegmentsFile;
    const sha1 = createHash('sha1').update(readFileSync(audio)).digest('hex');
    return drillSegments({ text_en: textEn }, sidecar, sha1).segments;
  } catch {
    return null;
  }
}

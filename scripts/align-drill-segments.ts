#!/usr/bin/env tsx
/**
 * Where every phrase (" / ") of a lesson's drills sits in its recording, for
 * Frase por frase.
 *
 *   npx tsx scripts/align-drill-segments.ts <lesson.json> [--only id1,id2] [--force]
 *
 * For each drill with a local audio file (same lookup as seed-lesson.ts):
 * local Whisper word timings (mlx_whisper, large-v3-turbo, the model the
 * lesson audios are cut with; cached by the file's hash in the system temp
 * dir), the text aligned to them word by word, and each cut snapped to the
 * silence the audio has between two phrases (sentence-timing.ts
 * detectPauses). The result goes next to the audio as
 * `<audio name>.segments.json`; seed-lesson.ts reads it when the text and the
 * audio are still the ones it was made from. Nothing is written for a drill
 * whose recording does not say its text (it keeps playing with approximate
 * cuts and says so). Local only: no paid API.
 *
 * Re-runnable: drills without audio are skipped, a segments file that still
 * matches its text and audio is kept, and anything re-recorded or re-written
 * is measured again. Run it after every new batch of audio, then re-seed.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { LessonSchema, segmentsSidecarPath, type DrillSegmentsFile, type Lesson } from '../src/lib/lessons/lesson-format';
import { drillPhrases, placePhrases, type TimedWord } from '../src/lib/practice/phrase-segments';
import { detectPauses } from '../src/lib/practice/sentence-timing';

const ASR_MODEL = 'mlx-community/whisper-large-v3-turbo';
const SAMPLE_RATE = 16000;
const CACHE = join(tmpdir(), 'jarre-whisper');

function expandHome(p: string): string {
  return p.startsWith('~/') ? join(process.env.HOME ?? '', p.slice(2)) : p;
}

function localAudioFor(lessonDir: string, drill: Lesson['drills'][number]): string | null {
  const candidates = [drill.audio ? resolve(lessonDir, expandHome(drill.audio)) : null, join(lessonDir, 'audios', `${drill.id}.m4a`)];
  return candidates.find((p): p is string => Boolean(p && existsSync(p))) ?? null;
}

function whisperWords(file: string, sha1: string): TimedWord[] {
  mkdirSync(CACHE, { recursive: true });
  const json = join(CACHE, `${sha1}.json`);
  if (!existsSync(json)) {
    execFileSync('mlx_whisper', [file, '--model', ASR_MODEL, '--language', 'en', '--word-timestamps', 'True',
      '--output-format', 'json', '--output-dir', CACHE, '--output-name', sha1, '--verbose', 'False'], { stdio: 'ignore' });
  }
  const out = JSON.parse(readFileSync(json, 'utf8').replace(/\bNaN\b/g, 'null')) as { segments: { words?: TimedWord[] }[] };
  return out.segments.flatMap((s) => s.words ?? []).filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end));
}

function decode(file: string): Float32Array {
  const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SAMPLE_RATE), '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
}

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--only');
  if (!file) throw new Error('Usage: npx tsx scripts/align-drill-segments.ts <lesson.json> [--only id1,id2] [--force]');
  const onlyAt = args.indexOf('--only');
  const only = onlyAt >= 0 ? new Set(args[onlyAt + 1]?.split(',')) : null;
  const force = args.includes('--force');

  const path = resolve(expandHome(file));
  const lessonDir = dirname(path);
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
  let written = 0;
  let kept = 0;
  const failed: string[] = [];

  for (const drill of lesson.drills) {
    if (only && !only.has(drill.id)) continue;
    const audio = localAudioFor(lessonDir, drill);
    if (!audio) continue;
    let sha1: string;
    try {
      sha1 = createHash('sha1').update(readFileSync(audio)).digest('hex');
    } catch {
      continue; // moved away while this runs
    }
    const out = segmentsSidecarPath(audio);
    if (!force && existsSync(out)) {
      const prev = JSON.parse(readFileSync(out, 'utf8')) as DrillSegmentsFile;
      if (prev.text === drill.text_en && prev.audio?.sha1 === sha1) {
        kept++;
        continue;
      }
    }

    const phrases = drillPhrases(drill.text_en);
    let samples: Float32Array;
    let words: TimedWord[];
    try {
      samples = decode(audio);
      words = whisperWords(audio, sha1);
    } catch (error) {
      // A file moved or half-written while this runs: skip it, the next run picks it up.
      failed.push(drill.id);
      console.log(`SKIP  ${drill.id}: could not read ${audio} (${error instanceof Error ? error.message.split('\n')[0] : error})`);
      continue;
    }
    const pauses = detectPauses(samples, SAMPLE_RATE);
    const placed = placePhrases(phrases, words, { duration: pauses.duration, pauses });
    const snapped = placed.boundaries.filter((b) => b.pause).length;
    const line = `${drill.id}: ${phrases.length} phrases, ${placed.matched}/${placed.total} words matched, ${snapped}/${placed.boundaries.length} cuts in a silence`;
    if (placed.problems.length > 0) {
      failed.push(drill.id);
      console.log(`SKIP  ${line}\n      ${placed.problems.join('\n      ')}`);
      continue;
    }
    const body: DrillSegmentsFile = {
      version: 1,
      drill: drill.id,
      text: drill.text_en,
      audio: { sha1, duration: Math.round(pauses.duration * 1000) / 1000 },
      asr: ASR_MODEL,
      segments: placed.segments.map((s, i) => ({ ...s, text: phrases[i] })),
      boundaries: placed.boundaries,
    };
    writeFileSync(out, `${JSON.stringify(body, null, 2)}\n`);
    written++;
    console.log(`OK    ${line}`);
  }

  console.log(`Done: ${written} written, ${kept} already current, ${failed.length} skipped${failed.length ? ` (${failed.join(', ')})` : ''}.`);
  if (failed.length) process.exitCode = 2;
}

main();

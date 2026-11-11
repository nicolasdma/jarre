#!/usr/bin/env tsx
/**
 * Load a lesson JSON into the content tables, idempotently.
 *
 *   npx tsx scripts/seed-lesson.ts <lesson.json> [--user <uuid>] [--tts] [--dry-run]
 *
 * Writes: concepts, resources, resource_concepts, resource_sections,
 * inline_quizzes, question_bank, concept_cards, lesson_drills, drill audio in
 * the `lesson-audio` bucket; for the owner: concept_progress at level 1 and
 * the cards enrolled in review_schedule (same rows as /api/review/enroll).
 *
 * Re-running updates in place: every row has a stable id derived from the
 * lesson, so review progress survives. Rows the lesson no longer has are
 * deactivated (quizzes, questions, cards) or deleted (drills, sections).
 *
 * Drill audio: the drill's `audio` path, else `<lesson dir>/audios/<drill id>.m4a`,
 * else (only with --tts) Gemini TTS saved to that same path. Format:
 * docs/lesson-format.md.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '../src/lib/db/tables';
import {
  LessonSchema,
  drillAudioPath,
  mapCard,
  mapQuiz,
  normalizeSectionMarkdown,
  resolveQuizHeading,
  sectionHeadings,
  stableUuid,
  type Lesson,
} from '../src/lib/lessons/lesson-format';
import { synthesizeDrillSpeech } from '../src/lib/llm/gemini-tts';

loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });

const AUDIO_BUCKET = 'lesson-audio';
const TTS_PACE_MS = 20_000;

interface Args {
  file: string;
  userId?: string;
  tts: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { file: '', tts: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--user') args.userId = argv[++i];
    else if (a === '--tts') args.tts = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (!a.startsWith('--')) args.file = a;
    else throw new Error(`Unknown flag ${a}`);
  }
  if (!args.file) throw new Error('Usage: npx tsx scripts/seed-lesson.ts <lesson.json> [--user <uuid>] [--tts] [--dry-run]');
  return args;
}

function expandHome(p: string): string {
  return p.startsWith('~/') ? join(process.env.HOME ?? '', p.slice(2)) : p;
}

type Db = SupabaseClient;

async function must<T>(label: string, op: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await op;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

function localAudioFor(lessonDir: string, drill: Lesson['drills'][number]): string | null {
  const candidates = [drill.audio ? resolve(lessonDir, expandHome(drill.audio)) : null, join(lessonDir, 'audios', `${drill.id}.m4a`)];
  return candidates.find((p): p is string => Boolean(p && existsSync(p))) ?? null;
}

async function generateAudio(text: string, out: string): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const { pcm, sampleRate } = await synthesizeDrillSpeech(text, apiKey);
  mkdirSync(dirname(out), { recursive: true });
  const raw = `${out}.pcm`;
  writeFileSync(raw, pcm);
  try {
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', raw, '-c:a', 'aac', '-b:a', '96k', out]);
  } finally {
    rmSync(raw, { force: true });
  }
}

// ---------------------------------------------------------------------------
// Owner
// ---------------------------------------------------------------------------

async function pickOwner(db: Db, explicit?: string): Promise<{ id: string; label: string }> {
  if (explicit) return { id: explicit, label: 'from --user' };
  const rows = await must('user_profiles', db
    .from(TABLES.userProfiles)
    .select('id, display_name, last_active_at, total_evaluations')
    .order('last_active_at', { ascending: false, nullsFirst: false })
    .limit(5));
  const list = (rows ?? []) as { id: string; display_name: string | null; last_active_at: string | null; total_evaluations: number }[];
  if (list.length === 0) throw new Error('No user_profiles rows: pass --user <uuid>');
  const top = list[0];
  console.log(`  user_profiles: ${list.length >= 5 ? '5+' : list.length} candidates; most recently active first:`);
  for (const r of list) console.log(`    ${r.id}  ${r.display_name ?? '(no name)'}  last_active=${r.last_active_at ?? '-'}  evals=${r.total_evaluations}`);
  return { id: top.id, label: `${top.display_name ?? '(no name)'}, most recently active` };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = resolve(expandHome(args.file));
  const lessonDir = dirname(file);
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const resourceId = lesson.id;

  console.log(`Lesson ${resourceId}: ${lesson.concepts.length} concepts, ${lesson.drills.length} drills, phase ${lesson.phase}, track ${lesson.track}`);

  // Validate every section/quiz placement before touching the DB.
  const sections = lesson.concepts.map((c, i) => {
    const markdown = normalizeSectionMarkdown(c.section.markdown);
    const headings = sectionHeadings(markdown);
    return {
      concept: c,
      id: stableUuid(`${resourceId}/section/${c.id}`),
      sortOrder: i + 1,
      markdown,
      quizHeadings: c.quizzes.map((q) => resolveQuizHeading(q, headings)),
    };
  });

  // Audio plan.
  const audio = lesson.drills.map((d) => ({ drill: d, local: localAudioFor(lessonDir, d) }));
  const missing = audio.filter((a) => !a.local);
  console.log(`  audio: ${audio.length - missing.length}/${audio.length} drills have a local file`);
  if (missing.length > 0 && args.tts) {
    console.log(`  generating ${missing.length} with Gemini TTS (${TTS_PACE_MS / 1000}s between calls)…`);
    for (const [i, a] of missing.entries()) {
      if (args.dryRun) break;
      const out = join(lessonDir, 'audios', `${a.drill.id}.m4a`);
      await generateAudio(a.drill.text_en, out);
      a.local = out;
      console.log(`    ${a.drill.id} → ${out}`);
      if (i < missing.length - 1) await new Promise((r) => setTimeout(r, TTS_PACE_MS));
    }
  } else if (missing.length > 0) {
    console.log(`  without audio (pass --tts to generate): ${missing.map((a) => a.drill.id).join(', ')}`);
  }

  if (args.dryRun) {
    console.log('Dry run: lesson is valid, nothing written.');
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const now = new Date().toISOString();

  // Concepts. Slugs equal ids: lesson ids are namespaced (e.g. interview-*) so
  // they never collide with another track's concept (BACKLOG item 5).
  await must('concepts', db.from(TABLES.concepts).upsert(lesson.concepts.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.id,
    canonical_definition: c.definition,
    phase: lesson.phase,
    track: lesson.track,
    updated_at: now,
  })), { onConflict: 'id' }));

  // Resource: core curriculum (created_by NULL), no source URL (nothing to ingest).
  await must('resources', db.from(TABLES.resources).upsert({
    id: resourceId,
    title: lesson.title,
    type: 'article',
    url: null,
    author: null,
    phase: lesson.phase,
    description: lesson.description,
    estimated_hours: Math.max(0.5, Math.round(lesson.concepts.length * 0.25 * 2) / 2),
    sort_order: 0,
    curriculum_source: 'core',
    is_archived: false,
    created_by: null,
    track: lesson.track,
    language: lesson.language,
    activate_data: lesson.activate ?? null,
    // Needs supabase/migrations/20261111020000_resource_interview.sql. Only
    // written when the lesson has the key, so lessons without an interview
    // block seed on a database that does not have the column yet.
    ...(lesson.interview !== undefined ? { interview: lesson.interview } : {}),
    updated_at: now,
  }, { onConflict: 'id' }));

  await must('resource_concepts', db.from(TABLES.resourceConcepts).upsert(
    lesson.concepts.map((c) => ({ resource_id: resourceId, concept_id: c.id, is_prerequisite: false })),
    { onConflict: 'resource_id,concept_id' },
  ));

  // Sections: drop the ones the lesson no longer has (their quizzes cascade).
  const existingSections = (await must('resource_sections', db.from(TABLES.resourceSections)
    .select('id').eq('resource_id', resourceId))) as { id: string }[];
  const keepSections = new Set(sections.map((s) => s.id));
  const staleSections = existingSections.map((s) => s.id).filter((id) => !keepSections.has(id));
  if (staleSections.length > 0) {
    await must('question_bank (stale section refs)', db.from(TABLES.questionBank).update({ resource_section_id: null }).in('resource_section_id', staleSections));
    await must('resource_sections (stale)', db.from(TABLES.resourceSections).delete().in('id', staleSections));
  }
  // Two-step so a reordered lesson never trips UNIQUE(resource_id, concept_id, sort_order).
  await must('resource_sections (park)', db.from(TABLES.resourceSections).upsert(sections.map((s) => ({
    id: s.id, resource_id: resourceId, concept_id: s.concept.id, section_title: s.concept.section.title,
    sort_order: -s.sortOrder, content_markdown: s.markdown, manually_reviewed: true,
  })), { onConflict: 'id' }));
  await must('resource_sections', db.from(TABLES.resourceSections).upsert(sections.map((s) => ({
    id: s.id, resource_id: resourceId, concept_id: s.concept.id, section_title: s.concept.section.title,
    sort_order: s.sortOrder, content_markdown: s.markdown, manually_reviewed: true,
  })), { onConflict: 'id' }));

  // Inline quizzes, open questions, cards: stable ids, stale ones deactivated.
  const quizRows = sections.flatMap((s) => s.concept.quizzes.map((q, i) => ({
    id: stableUuid(`${resourceId}/quiz/${s.concept.id}/${i}`),
    section_id: s.id,
    position_after_heading: s.quizHeadings[i],
    sort_order: i,
    format: q.format,
    question_text: q.question,
    ...mapQuiz(q),
    explanation: q.explanation,
    justification_hint: q.justification_hint ?? null,
    is_active: true,
  })));
  const questionRows = sections.flatMap((s) => s.concept.open.map((q, i) => ({
    id: stableUuid(`${resourceId}/open/${s.concept.id}/${i}`),
    concept_id: s.concept.id,
    type: q.type,
    format: 'open',
    question_text: q.question,
    expected_answer: q.expected_answer,
    difficulty: q.difficulty,
    resource_section_id: s.id,
    is_active: true,
    updated_at: now,
  })));
  const cardRows = lesson.concepts.flatMap((c) => c.cards.map((card, i) => ({
    id: stableUuid(`${resourceId}/card/${c.id}/${i}`),
    concept_id: c.id,
    card_type: card.type,
    ...mapCard(card),
    difficulty: card.difficulty,
    is_active: true,
  })));

  if (quizRows.length) await must('inline_quizzes', db.from(TABLES.inlineQuizzes).upsert(quizRows, { onConflict: 'id' }));
  if (questionRows.length) await must('question_bank', db.from(TABLES.questionBank).upsert(questionRows, { onConflict: 'id' }));
  if (cardRows.length) await must('concept_cards', db.from(TABLES.conceptCards).upsert(cardRows, { onConflict: 'id' }));

  const conceptIds = lesson.concepts.map((c) => c.id);
  const deactivate = async (table: string, column: string, values: string[], keep: string[]) => {
    const rows = (await must(table, db.from(table).select('id').in(column, values).eq('is_active', true))) as { id: string }[];
    const keepSet = new Set(keep);
    const stale = rows.map((r) => r.id).filter((id) => !keepSet.has(id));
    if (stale.length) await must(`${table} (deactivate)`, db.from(table).update({ is_active: false }).in('id', stale));
    return stale.length;
  };
  const staleQuizzes = await deactivate(TABLES.inlineQuizzes, 'section_id', sections.map((s) => s.id), quizRows.map((r) => r.id));
  const staleQuestions = await deactivate(TABLES.questionBank, 'concept_id', conceptIds, questionRows.map((r) => r.id));
  const staleCards = await deactivate(TABLES.conceptCards, 'concept_id', conceptIds, cardRows.map((r) => r.id));

  // Drill audio → Storage, then drill rows.
  let uploaded = 0;
  for (const a of audio) {
    if (!a.local) continue;
    const path = drillAudioPath(resourceId, a.drill.id);
    const { error } = await db.storage.from(AUDIO_BUCKET).upload(path, readFileSync(a.local), { contentType: 'audio/mp4', upsert: true });
    if (error) throw new Error(`upload ${path}: ${error.message}`);
    uploaded++;
  }
  const drillRows = audio.map((a) => ({
    resource_id: resourceId,
    slug: a.drill.id,
    priority: a.drill.priority,
    title: a.drill.title,
    text_en: a.drill.text_en,
    text_es: a.drill.text_es ?? null,
    audio_path: a.local ? drillAudioPath(resourceId, a.drill.id) : null,
    updated_at: now,
  }));
  if (drillRows.length) await must('lesson_drills', db.from(TABLES.lessonDrills).upsert(drillRows, { onConflict: 'resource_id,slug' }));
  const existingDrills = (await must('lesson_drills', db.from(TABLES.lessonDrills).select('id, slug').eq('resource_id', resourceId))) as { id: string; slug: string }[];
  const drillSlugs = new Set(lesson.drills.map((d) => d.id));
  const staleDrills = existingDrills.filter((d) => !drillSlugs.has(d.slug)).map((d) => d.id);
  if (staleDrills.length) await must('lesson_drills (stale)', db.from(TABLES.lessonDrills).delete().in('id', staleDrills));

  // Owner: mastery level 1 (never lowered) so the cards join the review deck.
  const owner = await pickOwner(db, args.userId);
  console.log(`  owner: ${owner.id} (${owner.label})`);
  const progress = (await must('concept_progress', db.from(TABLES.conceptProgress)
    .select('concept_id, level').eq('user_id', owner.id).in('concept_id', conceptIds))) as { concept_id: string; level: string }[];
  const atLeastOne = new Set(progress.filter((p) => Number(p.level) >= 1).map((p) => p.concept_id));
  const toRaise = conceptIds.filter((id) => !atLeastOne.has(id));
  if (toRaise.length) {
    await must('concept_progress', db.from(TABLES.conceptProgress).upsert(
      toRaise.map((id) => ({ user_id: owner.id, concept_id: id, level: '1', updated_at: now })),
      { onConflict: 'user_id,concept_id' },
    ));
  }

  const enrolled = (await must('review_schedule', db.from(TABLES.reviewSchedule)
    .select('card_id').eq('user_id', owner.id).in('card_id', cardRows.map((c) => c.id)))) as { card_id: string }[];
  const enrolledIds = new Set(enrolled.map((r) => r.card_id));
  const newSchedule = cardRows.filter((c) => !enrolledIds.has(c.id)).map((c) => ({
    user_id: owner.id, card_id: c.id, ease_factor: 2.5, interval_days: 0, repetition_count: 0, streak: 0,
    correct_count: 0, incorrect_count: 0, next_review_at: now, fsrs_state: 0, fsrs_reps: 0, fsrs_lapses: 0,
  }));
  if (newSchedule.length) await must('review_schedule', db.from(TABLES.reviewSchedule).insert(newSchedule));

  console.log([
    `Done: ${resourceId}`,
    `  concepts ${conceptIds.length} · sections ${sections.length} · quizzes ${quizRows.length} · open ${questionRows.length} · cards ${cardRows.length}`,
    `  drills ${drillRows.length} (${uploaded} with audio uploaded to ${AUDIO_BUCKET})`,
    `  deactivated stale: quizzes ${staleQuizzes}, questions ${staleQuestions}, cards ${staleCards}; deleted stale: sections ${staleSections.length}, drills ${staleDrills.length}`,
    `  owner progress raised to 1 on ${toRaise.length} concepts; ${newSchedule.length} cards enrolled in review`,
    `  open: /learn/${resourceId} · practice: /resource/${resourceId}/practice`,
  ].join('\n'));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

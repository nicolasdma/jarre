#!/usr/bin/env npx tsx
/**
 * seed-review-mc.ts
 *
 * Migrates inline_quizzes from resource_sections into question_bank as MC/TF format.
 * Resolves concept_id via inline_quizzes → resource_sections → concept_id.
 * Creates review_schedule entries for the authenticated user.
 *
 * Usage:
 *   npx tsx scripts/seed-review-mc.ts [--user-id <uuid>] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const userIdIndex = args.indexOf('--user-id');
const userId = userIdIndex !== -1 ? args[userIdIndex + 1] : null;

async function main() {
  console.log(`[seed-review-mc] Starting... ${dryRun ? '(DRY RUN)' : ''}`);

  // 1. Fetch all active inline quizzes with their section's concept_id
  const { data: quizzes, error: quizError } = await supabase
    .from('inline_quizzes')
    .select(`
      id,
      section_id,
      format,
      question_text,
      options,
      correct_answer,
      explanation,
      resource_sections!inner (
        concept_id
      )
    `)
    .eq('is_active', true);

  if (quizError) {
    console.error('[seed-review-mc] Error fetching inline quizzes:', quizError);
    process.exit(1);
  }

  if (!quizzes || quizzes.length === 0) {
    console.log('[seed-review-mc] No active inline quizzes found.');
    return;
  }

  console.log(`[seed-review-mc] Found ${quizzes.length} inline quizzes to migrate`);

  // 2. Check which quizzes already exist in question_bank (by question_text + concept_id)
  const { data: existingQuestions } = await supabase
    .from('question_bank')
    .select('question_text, concept_id')
    .in('format', ['mc', 'tf']);

  const existingSet = new Set(
    (existingQuestions || []).map((q) => `${q.concept_id}::${q.question_text}`)
  );

  // 3. Build question_bank rows
  const rows: Array<{
    concept_id: string;
    type: string;
    format: string;
    question_text: string;
    options: unknown;
    correct_answer: string;
    explanation: string;
    difficulty: number;
    is_active: boolean;
  }> = [];

  let skipped = 0;

  for (const quiz of quizzes) {
    const section = quiz.resource_sections as unknown as { concept_id: string };
    const conceptId = section.concept_id;

    if (!conceptId) {
      console.warn(`[seed-review-mc] Skipping quiz ${quiz.id}: no concept_id`);
      skipped++;
      continue;
    }

    const key = `${conceptId}::${quiz.question_text}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    // Map inline quiz format to question_bank format
    const format = quiz.format === 'tf' ? 'tf' : 'mc';

    rows.push({
      concept_id: conceptId,
      type: 'fact', // default type for migrated quizzes
      format,
      question_text: quiz.question_text,
      options: format === 'tf' ? null : quiz.options,
      correct_answer: quiz.correct_answer,
      explanation: quiz.explanation,
      difficulty: 1, // inline quizzes are generally easier
      is_active: true,
    });
  }

  console.log(`[seed-review-mc] ${rows.length} new questions to insert, ${skipped} skipped (duplicate or no concept)`);

  if (rows.length === 0) {
    console.log('[seed-review-mc] Nothing to do.');
    return;
  }

  if (dryRun) {
    console.log('[seed-review-mc] DRY RUN — would insert:');
    for (const row of rows) {
      console.log(`  ${row.format.toUpperCase()} | ${row.concept_id} | ${row.question_text.slice(0, 60)}...`);
    }
    return;
  }

  // 4. Insert into question_bank
  const { data: inserted, error: insertError } = await supabase
    .from('question_bank')
    .insert(rows)
    .select('id, concept_id, format');

  if (insertError) {
    console.error('[seed-review-mc] Error inserting questions:', insertError);
    process.exit(1);
  }

  console.log(`[seed-review-mc] Inserted ${inserted?.length || 0} questions into question_bank`);

  // 5. Create review_schedule entries for the user (if user-id provided)
  if (userId && inserted && inserted.length > 0) {
    const scheduleRows = inserted.map((q) => ({
      user_id: userId,
      question_id: q.id,
      ease_factor: 2.5,
      interval_days: 0,
      repetition_count: 0,
      next_review_at: new Date().toISOString(),
      streak: 0,
      correct_count: 0,
      incorrect_count: 0,
    }));

    const { error: scheduleError } = await supabase
      .from('review_schedule')
      .upsert(scheduleRows, { onConflict: 'user_id,question_id' });

    if (scheduleError) {
      console.error('[seed-review-mc] Error creating review_schedule entries:', scheduleError);
    } else {
      console.log(`[seed-review-mc] Created ${scheduleRows.length} review_schedule entries for user ${userId}`);
    }
  } else if (!userId) {
    console.log('[seed-review-mc] No --user-id provided, skipping review_schedule creation');
    console.log('[seed-review-mc] Run with --user-id <uuid> to create review entries');
  }

  // Summary by concept
  const byConcept: Record<string, { mc: number; tf: number }> = {};
  for (const q of inserted || []) {
    const entry = byConcept[q.concept_id] ?? { mc: 0, tf: 0 };
    entry[q.format as 'mc' | 'tf']++;
    byConcept[q.concept_id] = entry;
  }

  console.log('\n[seed-review-mc] Summary by concept:');
  for (const [concept, counts] of Object.entries(byConcept)) {
    console.log(`  ${concept}: ${counts.mc} MC, ${counts.tf} TF`);
  }

  console.log('\n[seed-review-mc] Done!');
}

main().catch((err) => {
  console.error('[seed-review-mc] Fatal error:', err);
  process.exit(1);
});

/**
 * Reseed Ch6 sections: replaces the monolithic section with 5 segmented sections.
 *
 * Steps:
 * 1. Nullify resource_section_id on question_bank entries referencing old Ch6 sections
 * 2. Delete old Ch6 sections
 * 3. Insert new resegmented sections
 * 4. Re-assign question_bank entries to correct new sections by sort_order
 *
 * Run: npx tsx scripts/reseed-ch6-sections.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

// Question bank entries that need re-assignment after sections are recreated.
// Map from question_bank concept_id+type to the new section sort_order.
const QUESTION_SECTION_MAP: Record<string, number> = {
  // From seed-high-order-questions.ts, Ch6 section 0 = "Particionamiento por Clave Primaria"
  // These 3 questions were all assigned to the old monolithic section.
  // Now: scenario about IoT → section 0 (Estrategias), limitation about hash → section 0, error_spot about hotspots → section 1
  'scenario': 0,    // Estrategias de Particionamiento
  'limitation': 0,  // Estrategias de Particionamiento
  'error_spot': 1,  // Cargas Sesgadas y Puntos Calientes
};

async function main() {
  // 1. Get existing Ch6 sections
  const { data: oldSections } = await sb
    .from('resource_sections')
    .select('id')
    .eq('resource_id', 'ddia-ch6');

  if (!oldSections || oldSections.length === 0) {
    console.log('No existing Ch6 sections to replace');
  } else {
    const oldIds = oldSections.map((s) => s.id);

    // 2. Get question_bank entries referencing old sections
    const { data: questions } = await sb
      .from('question_bank')
      .select('id, type, resource_section_id')
      .in('resource_section_id', oldIds);

    if (questions && questions.length > 0) {
      console.log(`Found ${questions.length} question_bank entries to detach`);

      // Nullify FK temporarily
      for (const q of questions) {
        await sb
          .from('question_bank')
          .update({ resource_section_id: null })
          .eq('id', q.id);
      }
      console.log('  Detached question_bank FKs');
    }

    // 3. Delete old sections
    const { error: deleteError } = await sb
      .from('resource_sections')
      .delete()
      .eq('resource_id', 'ddia-ch6');

    if (deleteError) {
      console.error('Error deleting old sections:', deleteError.message);
      process.exit(1);
    }
    console.log(`Deleted ${oldSections.length} old section(s)`);
  }

  // 4. Load and insert new sections
  const raw = JSON.parse(readFileSync(resolve(__dirname, 'output/chapter-06-resegmented.json'), 'utf-8'));

  const sections = raw.map((s: Record<string, unknown>, i: number) => ({
    resource_id: s.resource_id,
    concept_id: s.concept_id,
    section_title: s.section_title,
    sort_order: s.sort_order ?? i,
    content_markdown: s.content_markdown,
    content_original: s.content_original,
  }));

  const { data: inserted, error: insertError } = await sb
    .from('resource_sections')
    .insert(sections)
    .select('id, sort_order, section_title');

  if (insertError) {
    console.error('Error inserting new sections:', insertError.message);
    process.exit(1);
  }

  console.log(`\nInserted ${inserted.length} new sections:`);
  for (const s of inserted) {
    console.log(`  [${s.sort_order}] ${s.section_title} (id=${s.id})`);
  }

  // 5. Re-assign question_bank entries to new sections
  const { data: detached } = await sb
    .from('question_bank')
    .select('id, type')
    .eq('concept_id', 'partitioning')
    .is('resource_section_id', null);

  if (detached && detached.length > 0) {
    // Build sort_order → section_id map
    const sortToId = new Map(inserted.map((s) => [s.sort_order, s.id]));

    for (const q of detached) {
      const targetSort = QUESTION_SECTION_MAP[q.type];
      if (targetSort !== undefined) {
        const targetId = sortToId.get(targetSort);
        if (targetId) {
          await sb
            .from('question_bank')
            .update({ resource_section_id: targetId })
            .eq('id', q.id);
          console.log(`  Re-assigned question ${q.id} (${q.type}) → section ${targetSort}`);
        }
      }
    }
  }

  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

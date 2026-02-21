/**
 * Seed script for kz2h-tokenizers sections.
 *
 * Reads sections from scripts/output/kz2h-tokenizers-sections.json
 * and inserts them into resource_sections table.
 *
 * Usage: npx tsx scripts/seed-kz2h-tokenizers-sections.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RESOURCE_ID = 'kz2h-tokenizers';
const VALID_CONCEPTS = ['tokenization-bpe'];

interface SectionData {
  resource_id: string;
  concept_id: string;
  section_title: string;
  sort_order: number;
  content_markdown: string;
}

async function main() {
  // 1. Read JSON
  const jsonPath = resolve(__dirname, 'output/kz2h-tokenizers-sections.json');
  const raw = readFileSync(jsonPath, 'utf-8');
  const sections: SectionData[] = JSON.parse(raw);

  console.log(`Read ${sections.length} sections from JSON`);

  // 2. Validate
  for (const s of sections) {
    if (s.resource_id !== RESOURCE_ID) {
      console.error(`Invalid resource_id: ${s.resource_id}, expected ${RESOURCE_ID}`);
      process.exit(1);
    }
    if (!VALID_CONCEPTS.includes(s.concept_id)) {
      console.error(`Invalid concept_id: ${s.concept_id}`);
      process.exit(1);
    }
  }

  // 3. Fetch existing section IDs to clean up dependent tables
  const { data: existingSections } = await supabase
    .from('resource_sections')
    .select('id')
    .eq('resource_id', RESOURCE_ID);

  const existingIds = (existingSections ?? []).map((s) => s.id);

  if (existingIds.length > 0) {
    const { error: qbError } = await supabase
      .from('question_bank')
      .delete()
      .in('resource_section_id', existingIds);

    if (qbError) {
      console.error('Error deleting question_bank rows:', qbError.message);
      process.exit(1);
    }

    const { error: quizError } = await supabase
      .from('inline_quizzes')
      .delete()
      .in('section_id', existingIds);

    if (quizError) {
      console.error('Error deleting inline_quizzes:', quizError.message);
      process.exit(1);
    }

    console.log(`Cleaned up dependents for ${existingIds.length} existing sections`);
  }

  // Delete existing sections
  const { error: deleteError } = await supabase
    .from('resource_sections')
    .delete()
    .eq('resource_id', RESOURCE_ID);

  if (deleteError) {
    console.error('Error deleting existing sections:', deleteError.message);
    process.exit(1);
  }
  console.log('Cleared existing sections');

  // 4. Insert new sections
  const rows = sections.map((s) => ({
    resource_id: s.resource_id,
    concept_id: s.concept_id,
    section_title: s.section_title,
    sort_order: s.sort_order,
    content_markdown: s.content_markdown,
  }));

  const { error: insertError } = await supabase
    .from('resource_sections')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting sections:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${rows.length} sections for ${RESOURCE_ID}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

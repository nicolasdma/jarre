import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }

const sb = createClient(url, key);

async function main() {
  // All concepts
  const { data: concepts } = await sb.from('concepts').select('id, name, phase').order('phase');
  console.log(`Total concepts: ${concepts?.length}`);
  for (const c of concepts || []) {
    console.log(`  [phase ${c.phase}] ${c.id} — ${c.name}`);
  }

  // Concept cards
  const { data: cards } = await sb.from('concept_cards').select('concept_id').limit(5);
  console.log(`\nConcept cards sample:`, cards?.map(c => c.concept_id));

  // Check overlap
  const conceptIds = new Set((concepts || []).map(c => c.id));
  const cardConceptIds = new Set((cards || []).map(c => c.concept_id));
  const missing = [...cardConceptIds].filter(id => !conceptIds.has(id));
  if (missing.length > 0) {
    console.log(`\nCard concept IDs NOT in concepts table:`, missing);
  }
}
main();

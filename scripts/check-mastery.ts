import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error('Missing env'); process.exit(1); }

const sb = createClient(url, key);

async function main() {
  const { data, error } = await sb.from('concept_progress').select('concept_id, level, user_id').limit(30);
  if (error) { console.error(error); return; }
  console.log('concept_progress rows:', data?.length);
  for (const row of data || []) {
    console.log(`  ${row.concept_id}: mastery=${row.level}`);
  }
}
main();

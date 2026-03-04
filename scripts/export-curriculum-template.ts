import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import {
  auditCurriculumTemplate,
  buildCoreCurriculumTemplate,
  hasBlockingCurriculumIssues,
} from '../src/lib/curriculum/template';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const outputArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputPath = outputArg
  ? outputArg.replace('--out=', '')
  : 'docs/curriculum/core-template.v1.json';
const strictMode = process.argv.includes('--strict');

async function main() {
  const supabase = createClient(url!, key!, { auth: { persistSession: false } });

  const template = await buildCoreCurriculumTemplate(supabase);
  const audit = auditCurriculumTemplate(template);

  const resolvedOutput = path.resolve(outputPath);
  const resolvedAuditOutput = resolvedOutput.replace(/\.json$/i, '.audit.json');

  await mkdir(path.dirname(resolvedOutput), { recursive: true });
  await writeFile(resolvedOutput, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  await writeFile(resolvedAuditOutput, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');

  console.log(`Template exported: ${resolvedOutput}`);
  console.log(`Audit exported:    ${resolvedAuditOutput}`);

  if (strictMode && hasBlockingCurriculumIssues(audit)) {
    console.error('Blocking curriculum issues detected. Export completed, but strict mode failed.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Template export failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

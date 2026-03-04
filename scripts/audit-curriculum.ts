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

const strictMode = process.argv.includes('--strict');
const jsonMode = process.argv.includes('--json');

async function main() {
  const supabase = createClient(url!, key!, { auth: { persistSession: false } });

  const template = await buildCoreCurriculumTemplate(supabase);
  const report = auditCurriculumTemplate(template);

  console.log('Curriculum Audit Summary');
  console.log(`- Phases: ${report.summary.phaseCount}`);
  console.log(`- Concepts: ${report.summary.conceptCount}`);
  console.log(`- Resources: ${report.summary.resourceCount}`);
  console.log(`- Concepts without teacher: ${report.conceptsWithoutTeacher.length}`);
  console.log(`- Resources without concept mappings: ${report.resourcesWithoutConceptMappings.length}`);
  console.log(`- Backward concept prerequisites: ${report.backwardConceptPrerequisites.length}`);
  console.log(`- Backward resource prerequisites: ${report.backwardResourcePrerequisites.length}`);
  console.log(`- Duplicate core URLs in phase: ${report.duplicateCoreUrlsInPhase.length}`);

  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  }

  if (strictMode && hasBlockingCurriculumIssues(report)) {
    console.error('Blocking curriculum issues detected.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Curriculum audit failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

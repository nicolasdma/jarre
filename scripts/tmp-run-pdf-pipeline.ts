import { config } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { startPipeline } from '../src/lib/pipeline/orchestrator';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env');

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
const resourceId = 'p2-bengio-lm-paper';
const sourceUrl = 'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf';

async function pickUser(): Promise<string> {
  const fromJobs = await supabase
    .from('pipeline_jobs')
    .select('user_id')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fromJobs.data?.user_id) return String(fromJobs.data.user_id);

  const fromProfiles = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (!fromProfiles.data?.id) throw new Error('No user found');
  return String(fromProfiles.data.id);
}

async function getUserLanguage(userId: string): Promise<string> {
  const p = await supabase.from('user_profiles').select('language').eq('id', userId).maybeSingle();
  return (p.data?.language as string | null) || 'es';
}

async function cleanupResource(): Promise<void> {
  const sec = await supabase.from('resource_sections').select('id').eq('resource_id', resourceId);
  if (sec.error) throw sec.error;
  const ids = (sec.data || []).map((s: any) => String(s.id));
  if (ids.length > 0) {
    const qb = await supabase.from('question_bank').delete().in('resource_section_id', ids);
    if (qb.error) throw qb.error;
  }
  const delSec = await supabase.from('resource_sections').delete().eq('resource_id', resourceId);
  if (delSec.error) throw delSec.error;
  const updRes = await supabase
    .from('resources')
    .update({ activate_data: null, updated_at: new Date().toISOString() })
    .eq('id', resourceId);
  if (updRes.error) throw updRes.error;
}

function fmt(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main(): Promise<void> {
  const userId = await pickUser();
  const language = await getUserLanguage(userId);
  await cleanupResource();

  const jobId = randomUUID();
  const t0 = Date.now();
  const stageStart = new Map<string, number>();
  const stageDur = new Map<string, number>();
  let lastStage: string | null = null;
  let lastStatus: string | null = null;

  console.log('START', JSON.stringify({ jobId, userId, language, resourceId }, null, 2));

  await startPipeline({
    jobId,
    userId,
    url: sourceUrl,
    title: 'A Neural Probabilistic Language Model (Bengio 2003)',
    targetResourceId: resourceId,
    targetLanguage: language,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  });

  while (true) {
    await new Promise((r) => setTimeout(r, 1500));

    const row = await supabase
      .from('pipeline_jobs')
      .select('id,status,current_stage,stages_completed,total_stages,resource_id,error,tokens_used,created_at,updated_at')
      .eq('id', jobId)
      .maybeSingle();

    if (row.error) throw row.error;
    const job = row.data as any;
    if (!job) throw new Error('Job disappeared');

    const stage = job.current_stage as string | null;
    const status = String(job.status);

    if (status !== lastStatus || stage !== lastStage) {
      const now = Date.now();
      if (lastStage && stage !== lastStage) {
        const st = stageStart.get(lastStage) ?? now;
        stageDur.set(lastStage, (stageDur.get(lastStage) ?? 0) + (now - st));
      }
      if (stage && stage !== lastStage) {
        stageStart.set(stage, now);
      }

      console.log('STATE', JSON.stringify({
        t: fmt(now - t0),
        status,
        stage,
        done: `${job.stages_completed}/${job.total_stages}`,
      }));

      lastStage = stage;
      lastStatus = status;
    }

    if (status === 'completed' || status === 'failed') {
      const end = Date.now();
      if (lastStage) {
        const st = stageStart.get(lastStage) ?? end;
        stageDur.set(lastStage, (stageDur.get(lastStage) ?? 0) + (end - st));
      }

      const secCount = await supabase
        .from('resource_sections')
        .select('id', { count: 'exact', head: true })
        .eq('resource_id', resourceId);

      const sample = await supabase
        .from('resource_sections')
        .select('section_title,content_markdown,content_original,start_page,end_page')
        .eq('resource_id', resourceId)
        .order('sort_order', { ascending: true })
        .limit(3);

      const stageDurObj = Object.fromEntries([...stageDur.entries()].map(([k, v]) => [k, fmt(v)]));

      console.log('END', JSON.stringify({
        status,
        failedError: job.error || null,
        total: fmt(end - t0),
        tokensUsed: job.tokens_used ?? null,
        stageDurations: stageDurObj,
        sections: secCount.count ?? 0,
        sample: (sample.data || []).map((s: any) => ({
          title: s.section_title,
          startPage: s.start_page,
          endPage: s.end_page,
          markdownHead: String(s.content_markdown || '').slice(0, 200),
          originalHead: String(s.content_original || '').slice(0, 140),
          hasImage: String(s.content_markdown || '').includes('!['),
        })),
      }, null, 2));

      break;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

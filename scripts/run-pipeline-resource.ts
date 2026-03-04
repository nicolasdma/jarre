#!/usr/bin/env tsx
import { config as loadEnv } from 'dotenv';
import { randomUUID } from 'node:crypto';
import { createAdminClient } from '../src/lib/supabase/server';
import { TABLES } from '../src/lib/db/tables';
import { startPipeline } from '../src/lib/pipeline/orchestrator';

// Match Next.js local development behavior: .env.local overrides .env.
loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });

type Args = {
  sourceId: string;
  targetId: string;
  url?: string;
  title?: string;
  userId?: string;
  language?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) continue;
    args[key.slice(2)] = value;
    i += 1;
  }

  return {
    sourceId: args['source-id'] || 'kz2h-makemore-bigram',
    targetId: args['target-id'] || 'kz2h-makemore-bigram',
    url: args.url,
    title: args.title,
    userId: args['user-id'],
    language: args.language,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = createAdminClient();

  const { data: source, error: sourceErr } = await supabase
    .from(TABLES.resources)
    .select('id, title, url, phase, sort_order, estimated_hours, type, author, description, created_by, language')
    .eq('id', args.sourceId)
    .maybeSingle();

  if (sourceErr) throw new Error(`Failed to load source resource: ${sourceErr.message}`);
  if (!source) throw new Error(`Source resource not found: ${args.sourceId}`);

  const effectiveUrl = args.url || source.url;
  if (!effectiveUrl) {
    throw new Error(`No URL available. Source "${args.sourceId}" has no URL and --url was not provided.`);
  }

  let effectiveUserId = args.userId || source.created_by || null;
  if (!effectiveUserId) {
    const { data: fallbackProfile, error: profileErr } = await supabase
      .from(TABLES.userProfiles)
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileErr) throw new Error(`Failed to infer user id: ${profileErr.message}`);
    effectiveUserId = fallbackProfile?.id || null;
  }
  if (!effectiveUserId) {
    throw new Error('Could not infer user id. Pass --user-id explicitly.');
  }

  let effectiveLanguage = args.language || source.language || null;
  if (!effectiveLanguage) {
    const { data: profile, error: profileErr } = await supabase
      .from(TABLES.userProfiles)
      .select('language')
      .eq('id', effectiveUserId)
      .maybeSingle();
    if (profileErr) throw new Error(`Failed to infer language: ${profileErr.message}`);
    effectiveLanguage = profile?.language || 'es';
  }

  const effectiveTitle = args.title || `${source.title} (University/Technical)`;
  const phase = source.phase || '2';
  const sortOrder = typeof source.sort_order === 'number' ? source.sort_order + 1 : 999;

  const { data: existingTarget, error: targetErr } = await supabase
    .from(TABLES.resources)
    .select('id')
    .eq('id', args.targetId)
    .maybeSingle();
  if (targetErr) throw new Error(`Failed to check target resource: ${targetErr.message}`);

  if (existingTarget) {
    const { error: updateErr } = await supabase
      .from(TABLES.resources)
      .update({
        title: effectiveTitle,
        url: effectiveUrl,
        type: source.type || 'lecture',
        phase,
        sort_order: sortOrder,
        estimated_hours: source.estimated_hours ?? null,
        author: source.author ?? null,
        description: source.description ?? null,
        created_by: effectiveUserId,
        is_archived: false,
        language: source.language || effectiveLanguage,
      })
      .eq('id', args.targetId);
    if (updateErr) throw new Error(`Failed to update target resource: ${updateErr.message}`);
  } else {
    const { error: insertErr } = await supabase.from(TABLES.resources).insert({
      id: args.targetId,
      title: effectiveTitle,
      url: effectiveUrl,
      type: source.type || 'lecture',
      phase,
      sort_order: sortOrder,
      estimated_hours: source.estimated_hours ?? null,
      author: source.author ?? null,
      description: source.description ?? null,
      created_by: effectiveUserId,
      is_archived: false,
      language: source.language || effectiveLanguage,
    });
    if (insertErr) throw new Error(`Failed to insert target resource: ${insertErr.message}`);
  }

  const jobId = randomUUID();
  console.log(`Starting pipeline job ${jobId}`);
  console.log(`Source: ${args.sourceId}`);
  console.log(`Target: ${args.targetId}`);
  console.log(`URL: ${effectiveUrl}`);
  console.log(`Language: ${effectiveLanguage}`);

  await startPipeline({
    jobId,
    userId: effectiveUserId,
    url: effectiveUrl,
    title: effectiveTitle,
    targetResourceId: args.targetId,
    targetLanguage: effectiveLanguage,
  });

  let lastStage = '';
  let lastCompleted = -1;
  const startedAt = Date.now();
  const timeoutMs = 45 * 60 * 1000;

  while (true) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`Timed out waiting for pipeline job ${jobId}`);
    }

    const { data: job, error: jobErr } = await supabase
      .from(TABLES.pipelineJobs)
      .select('status, current_stage, stages_completed, total_stages, error, resource_id')
      .eq('id', jobId)
      .maybeSingle();
    if (jobErr) throw new Error(`Failed to poll job: ${jobErr.message}`);
    if (!job) throw new Error(`Pipeline job not found: ${jobId}`);

    const stage = job.current_stage || 'queued';
    if (stage !== lastStage || job.stages_completed !== lastCompleted) {
      console.log(`[${job.status}] ${stage} (${job.stages_completed}/${job.total_stages})`);
      lastStage = stage;
      lastCompleted = job.stages_completed ?? 0;
    }

    if (job.status === 'completed') {
      console.log(`Pipeline completed. Resource: ${job.resource_id || args.targetId}`);
      return;
    }
    if (job.status === 'failed') {
      throw new Error(`Pipeline failed at ${stage}: ${job.error || 'unknown error'}`);
    }

    await sleep(5000);
  }
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});

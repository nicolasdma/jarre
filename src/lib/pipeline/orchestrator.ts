/**
 * Jarre - Pipeline Orchestrator
 *
 * Executes the 6-stage pipeline:
 *   resolve → segment → content → [video_map ‖ concepts] → write_db → COMPLETED
 * Quizzes are generated in background after write_db marks completed.
 * Supports resume: if a stage is already completed, it's skipped.
 */

import { createLogger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import { PIPELINE_TOTAL_STAGES } from '@/lib/constants';
import { logTokenUsage } from '@/lib/db/token-usage';
import { resolveYouTube } from './stages/resolve-youtube';
import { segmentContent } from './stages/segment-content';
import { generateSections } from './stages/generate-sections';
import { translateContent } from './stages/translate-content';
import { generateQuizzes } from './stages/generate-quizzes';
import { mapVideoSegments } from './stages/map-video-segments';
import { linkConceptsStage } from './stages/link-concepts';
import { writeToDb } from './stages/write-to-db';
import type {
  PipelineConfig,
  PipelineData,
  PipelineStage,
  PipelineStatus,
  ContentOutput,
} from './types';

const log = createLogger('Pipeline');

const STAGE_ORDER: PipelineStage[] = [
  'resolve',
  'segment',
  'content',
  'video_map',
  'concepts',
  'write_db',
];

/**
 * Update pipeline job status in DB.
 */
async function updateJob(
  jobId: string,
  update: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from(TABLES.pipelineJobs)
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    log.error(`Failed to update job ${jobId}: ${error.message}`);
  }
}

/**
 * Start a new pipeline job. Creates the job record and launches execution.
 * Returns the job ID immediately (fire-and-forget execution).
 */
export async function startPipeline(config: PipelineConfig): Promise<string> {
  const supabase = createAdminClient();

  // Create job record
  const { data: job, error } = await supabase
    .from(TABLES.pipelineJobs)
    .insert({
      id: config.jobId,
      user_id: config.userId,
      url: config.url,
      title: config.title || null,
      language: config.targetLanguage,
      status: 'queued',
      total_stages: PIPELINE_TOTAL_STAGES,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create pipeline job: ${error.message}`);
  }

  // Fire-and-forget: execute pipeline asynchronously
  executePipeline(job.id, config).catch((err) => {
    log.error(`Pipeline ${job.id} failed unexpectedly:`, (err as Error).message);
  });

  return job.id;
}

/**
 * Get current pipeline status.
 */
export async function getPipelineStatus(
  jobId: string,
  userId: string,
): Promise<PipelineStatus | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(TABLES.pipelineJobs)
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    jobId: data.id,
    status: data.status,
    currentStage: data.current_stage,
    stagesCompleted: data.stages_completed,
    totalStages: data.total_stages,
    resourceId: data.resource_id,
    error: data.error,
    failedStage: data.failed_stage,
  };
}

/**
 * Generate quizzes and write them directly to inline_quizzes.
 * Runs as fire-and-forget after the pipeline marks completed.
 */
async function generateAndWriteQuizzes(
  jobId: string,
  content: ContentOutput,
  resourceId: string,
  targetLanguage: string,
  userId: string,
): Promise<void> {
  const supabase = createAdminClient();

  try {
    log.info(`[${jobId}] Background: Generating quizzes...`);
    const { output: quizzes, tokensUsed } = await generateQuizzes(content, targetLanguage);

    // Fetch section title → ID mapping from DB
    const { data: sections, error: sectionsErr } = await supabase
      .from(TABLES.resourceSections)
      .select('id, section_title')
      .eq('resource_id', resourceId);

    if (sectionsErr || !sections) {
      log.error(`[${jobId}] Background: Failed to fetch sections: ${sectionsErr?.message}`);
      return;
    }

    const sectionIdMap = new Map(sections.map((s) => [s.section_title, s.id]));

    // Insert quizzes
    let quizzesCreated = 0;
    for (const sectionQuizzes of quizzes.quizzesBySection) {
      const sectionId = sectionIdMap.get(sectionQuizzes.sectionTitle);
      if (!sectionId) {
        log.warn(`[${jobId}] Background: No section ID for quizzes: "${sectionQuizzes.sectionTitle}"`);
        continue;
      }

      for (const quiz of sectionQuizzes.quizzes) {
        const { error } = await supabase.from(TABLES.inlineQuizzes).insert({
          section_id: sectionId,
          position_after_heading: quiz.positionAfterHeading,
          sort_order: quiz.sortOrder,
          format: quiz.format,
          question_text: quiz.questionText,
          options: quiz.options,
          correct_answer: quiz.correctAnswer,
          explanation: quiz.explanation,
          justification_hint: quiz.justificationHint || null,
        });

        if (error) {
          log.warn(`[${jobId}] Background: Failed to insert quiz: ${error.message}`);
        } else {
          quizzesCreated++;
        }
      }
    }

    // Update stage_outputs with quizzes (for resume idempotency)
    const { data: jobData } = await supabase
      .from(TABLES.pipelineJobs)
      .select('stage_outputs')
      .eq('id', jobId)
      .single();

    const outputs = (jobData?.stage_outputs || {}) as Record<string, unknown>;
    await updateJob(jobId, {
      stage_outputs: { ...outputs, quizzes },
      tokens_used: (outputs as Record<string, number>).tokens_used ?? 0,
    });

    // Log token usage (fire-and-forget)
    logTokenUsage({
      userId,
      category: 'pipeline-quizzes',
      tokens: tokensUsed,
    }).catch(() => {});

    log.info(`[${jobId}] Background: ${quizzesCreated} quizzes created for ${resourceId}`);
  } catch (error) {
    log.error(`[${jobId}] Background quiz generation failed: ${(error as Error).message}`);
  }
}

/**
 * Execute the full pipeline.
 * Stages 4-5 (video_map + concepts) run in parallel.
 * After write_db marks completed, quizzes generate in background.
 */
async function executePipeline(
  jobId: string,
  config: PipelineConfig,
): Promise<void> {
  const supabase = createAdminClient();

  // Load existing state for resume
  const { data: jobData } = await supabase
    .from(TABLES.pipelineJobs)
    .select('stage_outputs, stages_completed')
    .eq('id', jobId)
    .single();

  const savedOutputs = (jobData?.stage_outputs || {}) as Record<string, unknown>;
  const data: PipelineData = {};
  let totalTokens = 0;
  let stagesCompleted = jobData?.stages_completed || 0;

  // Restore previously completed stages
  if (savedOutputs.resolve) data.resolve = savedOutputs.resolve as PipelineData['resolve'];
  if (savedOutputs.segment) data.segment = savedOutputs.segment as PipelineData['segment'];
  if (savedOutputs.content) data.content = savedOutputs.content as PipelineData['content'];
  if (savedOutputs.videoMap) data.videoMap = savedOutputs.videoMap as PipelineData['videoMap'];
  if (savedOutputs.concepts) data.concepts = savedOutputs.concepts as PipelineData['concepts'];

  await updateJob(jobId, { status: 'processing' });

  try {
    // Stage 1: Resolve YouTube
    if (!data.resolve) {
      await updateJob(jobId, { current_stage: 'resolve' });
      log.info(`[${jobId}] Stage 1/${PIPELINE_TOTAL_STAGES}: Resolving YouTube...`);

      data.resolve = await resolveYouTube(config.url);
      stagesCompleted++;

      await updateJob(jobId, {
        stages_completed: stagesCompleted,
        video_id: data.resolve.videoId,
        title: config.title || data.resolve.title,
        language: data.resolve.language,
        stage_outputs: { resolve: data.resolve },
      });
    }

    // Stage 2: Segment
    if (!data.segment) {
      await updateJob(jobId, { current_stage: 'segment' });
      log.info(`[${jobId}] Stage 2/${PIPELINE_TOTAL_STAGES}: Segmenting content...`);

      const { output, tokensUsed } = await segmentContent(data.resolve);
      data.segment = output;
      totalTokens += tokensUsed;
      stagesCompleted++;

      await updateJob(jobId, {
        stages_completed: stagesCompleted,
        tokens_used: totalTokens,
        stage_outputs: { ...savedOutputs, resolve: data.resolve, segment: data.segment },
      });
    }

    // Stage 3: Generate Content + Translation
    if (!data.content) {
      await updateJob(jobId, { current_stage: 'content' });
      log.info(`[${jobId}] Stage 3/${PIPELINE_TOTAL_STAGES}: Generating section content...`);

      const videoTitle = config.title || data.resolve.title;
      const targetLang = config.targetLanguage;

      // Generate content in the video's language first
      const { output: rawContent, tokensUsed: contentTokens } = await generateSections(
        data.segment,
        videoTitle,
        data.resolve.language,
      );
      totalTokens += contentTokens;

      // Translate if needed
      const { output: finalContent, tokensUsed: translateTokens } = await translateContent(
        rawContent,
        data.resolve.language,
        targetLang,
      );
      totalTokens += translateTokens;

      data.content = finalContent;
      stagesCompleted++;

      await updateJob(jobId, {
        stages_completed: stagesCompleted,
        tokens_used: totalTokens,
        stage_outputs: {
          ...savedOutputs,
          resolve: data.resolve,
          segment: data.segment,
          content: data.content,
        },
      });
    }

    // Stages 4+5: Video Map + Concepts (parallel)
    const needsVideoMap = !data.videoMap;
    const needsConcepts = !data.concepts;

    if (needsVideoMap || needsConcepts) {
      log.info(`[${jobId}] Stages 4-5/${PIPELINE_TOTAL_STAGES}: [videoMap=${needsVideoMap}, concepts=${needsConcepts}]`);

      const [videoMapResult, conceptsResult] = await Promise.all([
        needsVideoMap
          ? (async () => {
              await updateJob(jobId, { current_stage: 'video_map' });
              return { output: mapVideoSegments(data.content!, data.resolve!), tokensUsed: 0 };
            })()
          : null,
        needsConcepts
          ? (async () => {
              await updateJob(jobId, { current_stage: 'concepts' });
              return linkConceptsStage({
                contentOutput: data.content!,
                videoTitle: config.title || data.resolve!.title,
                userId: config.userId,
                language: config.targetLanguage,
                supabase,
              });
            })()
          : null,
      ]);

      if (videoMapResult) {
        data.videoMap = videoMapResult.output;
        stagesCompleted++;
      }
      if (conceptsResult) {
        data.concepts = conceptsResult.output;
        totalTokens += conceptsResult.tokensUsed;
        stagesCompleted++;
      }

      await updateJob(jobId, {
        stages_completed: stagesCompleted,
        tokens_used: totalTokens,
        stage_outputs: {
          ...savedOutputs,
          resolve: data.resolve,
          segment: data.segment,
          content: data.content,
          videoMap: data.videoMap,
          concepts: data.concepts,
        },
      });
    }

    // Stage 6: Write to DB (without quizzes)
    if (!data.write) {
      await updateJob(jobId, { current_stage: 'write_db' });
      log.info(`[${jobId}] Stage 6/${PIPELINE_TOTAL_STAGES}: Writing to database...`);

      data.write = await writeToDb({
        resolve: data.resolve!,
        content: data.content!,
        videoMap: data.videoMap!,
        concepts: data.concepts!,
        userId: config.userId,
        title: config.title,
      });
      stagesCompleted++;

      await updateJob(jobId, {
        status: 'completed',
        stages_completed: stagesCompleted,
        current_stage: null,
        resource_id: data.write.resourceId,
        tokens_used: totalTokens,
      });
    }

    // Log token usage (fire-and-forget)
    logTokenUsage({
      userId: config.userId,
      category: 'pipeline',
      tokens: totalTokens,
    }).catch(() => {});

    log.info(
      `[${jobId}] Pipeline completed! Resource: ${data.write!.resourceId}, Tokens: ${totalTokens}`,
    );

    // Fire-and-forget: generate quizzes in background
    // Resume: if quizzes already exist in stage_outputs, skip
    const hasQuizzes = !!(savedOutputs.quizzes);
    if (!hasQuizzes) {
      generateAndWriteQuizzes(
        jobId,
        data.content!,
        data.write!.resourceId,
        config.targetLanguage,
        config.userId,
      ).catch((err) => {
        log.error(`[${jobId}] Background quiz generation crashed: ${(err as Error).message}`);
      });
    }
  } catch (error) {
    const errMsg = (error as Error).message;
    log.error(`[${jobId}] Pipeline failed at stage: ${errMsg}`);

    await updateJob(jobId, {
      status: 'failed',
      error: errMsg.slice(0, 1000),
      failed_stage: STAGE_ORDER[stagesCompleted] || 'unknown',
      tokens_used: totalTokens,
    });
  }
}

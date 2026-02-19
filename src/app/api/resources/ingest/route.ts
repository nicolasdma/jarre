/**
 * POST /api/resources/ingest
 *
 * Ingests an external resource: creates the record, resolves content,
 * extracts concepts via DeepSeek, links to curriculum, and saves edges.
 *
 * Body: { title: string, url?: string, type: string, userNotes?: string }
 * Response: IngestResult
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { resolveContent } from '@/lib/ingest/content-resolver';
import { extractConcepts } from '@/lib/ingest/extract-concepts';
import { linkToCurriculum } from '@/lib/ingest/link-to-curriculum';
import { getUserLanguage } from '@/lib/db/queries/user';
import { createLogger } from '@/lib/logger';
import { generateMasteryCatalystInsights, saveInsightSuggestions } from '@/lib/insights/generate-insights';
import type { IngestResult } from '@/lib/ingest/types';

const log = createLogger('Ingest');

const VALID_TYPES = ['youtube', 'article', 'paper', 'book', 'podcast', 'other'];

export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);

  if (!body?.title || typeof body.title !== 'string') {
    throw badRequest('title is required');
  }

  const title = body.title.trim();
  const url = body.url?.trim() || null;
  const type = VALID_TYPES.includes(body.type) ? body.type : 'other';
  const userNotes = body.userNotes?.trim() || null;

  if (!url && !userNotes) {
    throw badRequest('Either url or userNotes is required');
  }

  const language = await getUserLanguage(supabase, user.id);

  // 1. Create resource record with status 'processing'
  const { data: resource, error: insertError } = await supabase
    .from(TABLES.userResources)
    .insert({
      user_id: user.id,
      title,
      url,
      type,
      user_notes: userNotes,
      status: 'processing',
    })
    .select('id')
    .single();

  if (insertError || !resource) {
    log.error('Failed to create resource:', insertError?.message);
    throw new Error('Failed to create resource');
  }

  const resourceId = resource.id;
  log.info(`Created resource ${resourceId}: "${title}" (${type})`);

  try {
    // 2. Resolve content
    const resolved = await resolveContent({ url, type, userNotes });

    if (!resolved.rawContent) {
      // Update status to failed
      await supabase
        .from(TABLES.userResources)
        .update({ status: 'failed' })
        .eq('id', resourceId);

      throw badRequest('Could not resolve any content. Provide notes or a valid YouTube URL.');
    }

    // Save raw content
    await supabase
      .from(TABLES.userResources)
      .update({ raw_content: resolved.rawContent })
      .eq('id', resourceId);

    // 3. Extract concepts
    const extraction = await extractConcepts({
      title,
      content: resolved.rawContent,
      type,
      userId: user.id,
      language,
    });

    // 4. Link to curriculum
    const linking = await linkToCurriculum({
      extractedConcepts: extraction.concepts,
      resourceTitle: title,
      resourceSummary: extraction.summary,
      supabase,
      userId: user.id,
      language,
    });

    // 5. Save results to resource
    await supabase
      .from(TABLES.userResources)
      .update({
        summary: extraction.summary,
        extracted_concepts: extraction.concepts,
        coverage_score: linking.coverageScore,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId);

    // 6. Save concept links (edges)
    if (linking.links.length > 0) {
      const edges = linking.links.map((link) => ({
        user_resource_id: resourceId,
        concept_id: link.curriculumConceptId,
        relationship: link.relationship,
        relevance_score: link.relevanceScore,
        extracted_concept_name: link.extractedConceptName,
        explanation: link.explanation,
        source: 'ingestion',
      }));

      const { error: edgeError } = await supabase
        .from(TABLES.userResourceConcepts)
        .insert(edges);

      if (edgeError) {
        log.error('Failed to save concept links:', edgeError.message);
      }
    }

    // 7. Log to consumption_log
    const conceptIds = linking.links.map((l) => l.curriculumConceptId);
    await supabase
      .from(TABLES.consumptionLog)
      .insert({
        user_id: user.id,
        user_resource_id: resourceId,
        event_type: 'added',
        concepts_touched: conceptIds,
        metadata: {
          title,
          type,
          linksCount: linking.links.length,
          coverageScore: linking.coverageScore,
        },
      });

    const result: IngestResult = {
      resourceId,
      summary: extraction.summary,
      extractedConcepts: extraction.concepts,
      links: linking.links,
      coverageScore: linking.coverageScore,
      totalTokensUsed: extraction.tokensUsed + linking.tokensUsed,
    };

    log.info(`Ingestion complete for "${title}": ${linking.links.length} links, coverage ${linking.coverageScore}`);

    // 8. Generate mastery catalyst insights (fire-and-forget)
    generateMasteryCatalystInsights(supabase, user.id, resourceId)
      .then((insights) => saveInsightSuggestions(supabase, user.id, insights))
      .catch((err) => log.error('Insight generation failed:', err));

    return jsonOk(result);
  } catch (err) {
    // Update status to failed if pipeline errors out
    try {
      await supabase
        .from(TABLES.userResources)
        .update({ status: 'failed' })
        .eq('id', resourceId);
    } catch {
      // Ignore failure to update status
    }

    throw err;
  }
});

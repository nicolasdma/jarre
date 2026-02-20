/**
 * GET /api/voice/session/context?sectionId=xxx[&conceptIds=id1,id2,...]
 * GET /api/voice/session/context?userResourceId=xxx[&conceptIds=id1,id2,...]
 *
 * Returns cached conversation summary + learner concept memory
 * for the voice tutor. Memory provides misconceptions/strengths
 * to personalize the session.
 *
 * For exploration sessions: returns user resource data + concept links instead.
 *
 * Response: { summary?: string, learnerMemory?: LearnerConceptMemory[] }
 *        or { resource, links, learnerMemory? }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getLearnerConceptMemory, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceContext');

export const GET = withAuth(async (request, { supabase, user }) => {
  const url = new URL(request.url);
  const sectionId = url.searchParams.get('sectionId');
  const conceptIdsParam = url.searchParams.get('conceptIds');

  const userResourceId = url.searchParams.get('userResourceId');

  if (sectionId === null && !userResourceId) {
    throw badRequest('sectionId or userResourceId query param is required');
  }

  // For exploration sessions: fetch user resource data
  if (userResourceId) {
    const [resourceResult, linksResult, memoryResult] = await Promise.all([
      supabase
        .from(TABLES.userResources)
        .select('title, type, summary, user_notes')
        .eq('id', userResourceId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from(TABLES.userResourceConcepts)
        .select('extracted_concept_name, relationship, relevance_score, explanation, concept_id')
        .eq('user_resource_id', userResourceId),
      conceptIdsParam
        ? getLearnerConceptMemory(supabase, user.id, conceptIdsParam.split(',').filter(Boolean))
        : Promise.resolve([]),
    ]);

    const resource = resourceResult.data;
    const links = linksResult.data || [];

    // Fetch concept names + definitions for links
    const linkConceptIds = links.map((l: any) => l.concept_id);
    let conceptDetails: Record<string, { name: string; definition: string }> = {};
    if (linkConceptIds.length > 0) {
      const { data: concepts } = await supabase
        .from(TABLES.concepts)
        .select('id, name, definition')
        .in('id', linkConceptIds);
      conceptDetails = (concepts || []).reduce((acc: any, c: any) => {
        acc[c.id] = { name: c.name, definition: c.definition };
        return acc;
      }, {});
    }

    // Fetch concept progress
    let progressMap: Record<string, number> = {};
    if (linkConceptIds.length > 0) {
      const { data: progress } = await supabase
        .from(TABLES.conceptProgress)
        .select('concept_id, level')
        .eq('user_id', user.id)
        .in('concept_id', linkConceptIds);
      progressMap = (progress || []).reduce((acc: any, p: any) => {
        acc[p.concept_id] = parseInt(p.level);
        return acc;
      }, {});
    }

    return jsonOk({
      resource,
      links: links.map((l: any) => ({
        ...l,
        conceptName: conceptDetails[l.concept_id]?.name || 'Unknown',
        conceptDefinition: conceptDetails[l.concept_id]?.definition || '',
        masteryLevel: progressMap[l.concept_id] || 0,
      })),
      ...(memoryResult.length > 0 ? { learnerMemory: memoryResult } : {}),
    });
  }

  // Fetch conversation summary and learner memory in parallel
  const summaryPromise = supabase
    .from(TABLES.voiceSessions)
    .select('cached_summary')
    .eq('user_id', user.id)
    .eq('section_id', sectionId)
    .not('ended_at', 'is', null)
    .not('cached_summary', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  let memoryPromise: Promise<LearnerConceptMemory[]> = Promise.resolve([]);
  if (conceptIdsParam) {
    const conceptIds = conceptIdsParam.split(',').filter(Boolean);
    if (conceptIds.length > 0) {
      memoryPromise = getLearnerConceptMemory(supabase, user.id, conceptIds);
    }
  }

  const [summaryResult, learnerMemory] = await Promise.all([
    summaryPromise,
    memoryPromise,
  ]);

  const summary = summaryResult.data?.cached_summary || null;

  if (summary) {
    log.info(`Cached summary found for section ${sectionId} (${summary.length} chars)`);
  } else {
    log.info(`No cached summary for section ${sectionId}`);
  }

  if (learnerMemory.length > 0) {
    log.info(`Learner memory found for ${learnerMemory.length} concepts`);
  }

  return jsonOk({
    ...(summary ? { summary } : {}),
    ...(learnerMemory.length > 0 ? { learnerMemory } : {}),
  });
});

/**
 * GET /api/voice/session/context?sectionId=xxx[&resourceId=lesson][&conceptIds=id1,id2,...]
 * GET /api/voice/session/context?userResourceId=xxx[&conceptIds=id1,id2,...]
 *
 * Returns cached conversation summary + learner concept memory
 * for the voice tutor. Memory provides misconceptions/strengths
 * to personalize the session.
 *
 * For exploration sessions: returns user resource data + concept links instead.
 *
 * Response: { summary?: string, learnerMemory?: LearnerConceptMemory[], practicesEnglish?: true,
 *   lessonMemory?: { evidence, preferences } (with resourceId: the learner's evidence for the lesson) }
 * (`practicesEnglish`: the section's lesson has English drills, so the
 * learning tutor works each idea in Spanish and then in English.)
 *        or { resource, links, learnerMemory? }
 */

import { after } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { createAdminClient } from '@/lib/supabase/server';
import { recoverUserSessions, runSessionDigest } from '@/lib/voice/session-digest';
import '@/lib/voice/digest-steps';
import { isMissingSchema } from '@/lib/voice/transcript-store';
import type { EvidenceRow } from '@/lib/tutor/evidence';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getLearnerConceptMemory, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceContext');

/** Recovery digests run after the response, inside this function's lifetime. */
export const maxDuration = 60;

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
    const linkConceptIds = links.map((l: { concept_id: string }) => l.concept_id);
    let conceptDetails: Record<string, { name: string; definition: string }> = {};
    if (linkConceptIds.length > 0) {
      const { data: concepts } = await supabase
        .from(TABLES.concepts)
        .select('id, name, definition')
        .in('id', linkConceptIds);
      conceptDetails = (concepts || []).reduce((acc: Record<string, { name: string; definition: string }>, c: { id: string; name: string; definition: string }) => {
        acc[c.id] = { name: c.name, definition: c.definition };
        return acc;
      }, {} as Record<string, { name: string; definition: string }>);
    }

    // Fetch concept progress
    let progressMap: Record<string, number> = {};
    if (linkConceptIds.length > 0) {
      const { data: progress } = await supabase
        .from(TABLES.conceptProgress)
        .select('concept_id, level')
        .eq('user_id', user.id)
        .in('concept_id', linkConceptIds);
      progressMap = (progress || []).reduce((acc: Record<string, number>, p: { concept_id: string; level: string }) => {
        acc[p.concept_id] = parseInt(p.level);
        return acc;
      }, {} as Record<string, number>);
    }

    return jsonOk({
      resource,
      links: links.map((l: { concept_id: string; [key: string]: unknown }) => ({
        ...l,
        conceptName: conceptDetails[l.concept_id]?.name || 'Unknown',
        conceptDefinition: conceptDetails[l.concept_id]?.definition || '',
        masteryLevel: progressMap[l.concept_id] || 0,
      })),
      ...(memoryResult.length > 0 ? { learnerMemory: memoryResult } : {}),
    });
  }

  // Sessions the client never ended, and digests that did not finish, are
  // closed and re-run after this response (src/lib/voice/session-digest.ts).
  after(async () => {
    const admin = createAdminClient();
    for (const d of await recoverUserSessions(admin, user.id)) {
      await runSessionDigest(admin, d.sessionId, user.id, { durable: d.durable });
    }
  });

  // The memory is per lesson, not per section: with `resourceId`, the last
  // summary of any section of the lesson, and the learner's evidence.
  const resourceId = url.searchParams.get('resourceId');
  let lessonSectionIds: string[] | null = null;
  if (resourceId) {
    const { data: rows } = await supabase.from(TABLES.resourceSections).select('id').eq('resource_id', resourceId);
    lessonSectionIds = (rows ?? []).map((r: { id: string }) => r.id);
    if (sectionId && !lessonSectionIds.includes(sectionId)) lessonSectionIds = null;
  }

  // Fetch conversation summary and learner memory in parallel
  let summaryQuery = supabase
    .from(TABLES.voiceSessions)
    .select('cached_summary')
    .eq('user_id', user.id)
    .not('ended_at', 'is', null)
    .not('cached_summary', 'is', null);
  summaryQuery = lessonSectionIds?.length ? summaryQuery.in('section_id', lessonSectionIds) : summaryQuery.eq('section_id', sectionId);
  const summaryPromise = summaryQuery.order('started_at', { ascending: false }).limit(1).maybeSingle();

  let memoryPromise: Promise<LearnerConceptMemory[]> = Promise.resolve([]);
  if (conceptIdsParam) {
    const conceptIds = conceptIdsParam.split(',').filter(Boolean);
    if (conceptIds.length > 0) {
      memoryPromise = getLearnerConceptMemory(supabase, user.id, conceptIds);
    }
  }

  const [summaryResult, learnerMemory, practicesEnglish, lessonMemory] = await Promise.all([
    summaryPromise,
    memoryPromise,
    sectionPracticesEnglish(supabase, sectionId),
    lessonSectionIds ? readLessonMemory(supabase, user.id, resourceId!) : Promise.resolve(null),
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
    ...(practicesEnglish ? { practicesEnglish: true } : {}),
    ...(lessonMemory ? { lessonMemory } : {}),
  });
});

const EVIDENCE_COLUMNS = 'session_id, section_id, concept_id, kind, verdict, resolved, statement, quote, at';
const MAX_LESSON_EVIDENCE = 150;
const MAX_PREFERENCES = 10;

type EvidenceDbRow = {
  session_id: string | null;
  section_id: string | null;
  concept_id: string | null;
  kind: EvidenceRow['kind'];
  verdict: EvidenceRow['verdict'];
  resolved: boolean | null;
  statement: string;
  quote: string | null;
  at: string;
};

const toEvidence = (r: EvidenceDbRow): EvidenceRow => ({
  sessionId: r.session_id,
  sectionId: r.section_id,
  conceptId: r.concept_id,
  kind: r.kind,
  verdict: r.verdict,
  resolved: r.resolved,
  statement: r.statement,
  quote: r.quote,
  at: r.at,
});

/**
 * The learner's evidence for this lesson (the brief the tutor opens with is
 * built from it in the browser, src/lib/tutor/learner-brief.ts) and the
 * preferences stated anywhere. RLS: the user's own rows only. Null when
 * learner_evidence is not migrated: the tutor uses the prose summary.
 */
async function readLessonMemory(
  supabase: Parameters<Parameters<typeof withAuth>[0]>[1]['supabase'],
  userId: string,
  resourceId: string,
): Promise<{ evidence: EvidenceRow[]; preferences: EvidenceRow[] } | null> {
  const [lesson, prefs] = await Promise.all([
    supabase
      .from('learner_evidence')
      .select(EVIDENCE_COLUMNS)
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .order('at', { ascending: false })
      .limit(MAX_LESSON_EVIDENCE),
    supabase
      .from('learner_evidence')
      .select(EVIDENCE_COLUMNS)
      .eq('user_id', userId)
      .eq('kind', 'preference')
      .order('at', { ascending: false })
      .limit(MAX_PREFERENCES),
  ]);
  if (lesson.error) {
    if (!isMissingSchema(lesson.error)) log.error('Failed to read learner evidence:', lesson.error.message);
    return null;
  }
  return {
    evidence: ((lesson.data ?? []) as EvidenceDbRow[]).map(toEvidence),
    preferences: ((prefs.data ?? []) as EvidenceDbRow[]).map(toEvidence),
  };
}

/** Whether the section belongs to a lesson with English drills (hand-written lessons). */
async function sectionPracticesEnglish(
  supabase: Parameters<Parameters<typeof withAuth>[0]>[1]['supabase'],
  sectionId: string | null,
): Promise<boolean> {
  if (!sectionId) return false;
  const { data: section } = await supabase
    .from(TABLES.resourceSections)
    .select('resource_id')
    .eq('id', sectionId)
    .maybeSingle();
  if (!section?.resource_id) return false;
  const { count } = await supabase
    .from(TABLES.lessonDrills)
    .select('slug', { count: 'exact', head: true })
    .eq('resource_id', section.resource_id);
  return (count ?? 0) > 0;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Pipeline:SyncUserResource');

type ResourceRow = {
  id: string;
  title: string;
  url: string | null;
  activate_data: { summary?: string } | null;
};

type ResourceConceptRow = {
  concept_id: string;
  concepts: { name?: string } | Array<{ name?: string }> | null;
};

function extractConceptName(
  concepts: ResourceConceptRow['concepts'],
  fallback: string,
): string {
  if (Array.isArray(concepts)) {
    return concepts[0]?.name || fallback;
  }
  return concepts?.name || fallback;
}

export async function syncPipelineResourceToUserKnowledge(params: {
  supabase: SupabaseClient;
  userId: string;
  resourceId: string;
}): Promise<{ userResourceId: string | null; linksCount: number }> {
  const { supabase, userId, resourceId } = params;

  const { data: resource, error: resourceErr } = await supabase
    .from(TABLES.resources)
    .select('id, title, url, activate_data')
    .eq('id', resourceId)
    .maybeSingle();

  if (resourceErr) {
    throw new Error(`Failed to load pipeline resource: ${resourceErr.message}`);
  }
  if (!resource) {
    return { userResourceId: null, linksCount: 0 };
  }

  const typedResource = resource as ResourceRow;
  const summary = typedResource.activate_data?.summary ?? null;

  const existingLookup = supabase
    .from(TABLES.userResources)
    .select('id, user_notes')
    .eq('user_id', userId)
    .eq('type', 'youtube')
    .order('created_at', { ascending: false })
    .limit(1);

  const existingQuery = typedResource.url
    ? existingLookup.eq('url', typedResource.url)
    : existingLookup.eq('title', typedResource.title);

  const { data: existingRows, error: existingErr } = await existingQuery;
  if (existingErr) {
    throw new Error(`Failed to check existing user resource: ${existingErr.message}`);
  }

  const existing = existingRows?.[0];
  const canReuse = existing && !existing.user_notes;

  let userResourceId: string;

  if (canReuse) {
    const { error: updateErr } = await supabase
      .from(TABLES.userResources)
      .update({
        title: typedResource.title,
        url: typedResource.url,
        type: 'youtube',
        summary,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateErr) {
      throw new Error(`Failed to update user resource mirror: ${updateErr.message}`);
    }

    userResourceId = existing.id;
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from(TABLES.userResources)
      .insert({
        user_id: userId,
        title: typedResource.title,
        url: typedResource.url,
        type: 'youtube',
        summary,
        status: 'completed',
      })
      .select('id')
      .single();

    if (insertErr || !inserted) {
      throw new Error(`Failed to create user resource mirror: ${insertErr?.message || 'unknown'}`);
    }

    userResourceId = inserted.id;
  }

  const { data: conceptLinks, error: conceptErr } = await supabase
    .from(TABLES.resourceConcepts)
    .select('concept_id, concepts(name)')
    .eq('resource_id', resourceId);

  if (conceptErr) {
    throw new Error(`Failed to load concept links for mirror: ${conceptErr.message}`);
  }

  const normalizedLinks = (conceptLinks || []) as ResourceConceptRow[];

  if (normalizedLinks.length > 0) {
    const { error: deleteErr } = await supabase
      .from(TABLES.userResourceConcepts)
      .delete()
      .eq('user_resource_id', userResourceId)
      .eq('source', 'ingestion');

    if (deleteErr) {
      log.warn(`Failed to clear previous concept links for ${userResourceId}: ${deleteErr.message}`);
    }

    const rows = normalizedLinks.map((link) => ({
      user_resource_id: userResourceId,
      concept_id: link.concept_id,
      relationship: 'relates' as const,
      relevance_score: 0.8,
      extracted_concept_name: extractConceptName(link.concepts, link.concept_id),
      explanation: 'Linked automatically from a YouTube course generated in Jarre.',
      source: 'ingestion' as const,
    }));

    const { error: insertLinkErr } = await supabase
      .from(TABLES.userResourceConcepts)
      .insert(rows);

    if (insertLinkErr) {
      throw new Error(`Failed to insert concept links mirror: ${insertLinkErr.message}`);
    }
  }

  const { data: existingLogRows, error: logCheckErr } = await supabase
    .from(TABLES.consumptionLog)
    .select('id')
    .eq('user_id', userId)
    .eq('user_resource_id', userResourceId)
    .eq('event_type', 'added')
    .limit(1);

  if (logCheckErr) {
    log.warn(`Failed to check consumption log for ${userResourceId}: ${logCheckErr.message}`);
  } else if (!existingLogRows || existingLogRows.length === 0) {
    const conceptIds = normalizedLinks.map((link) => link.concept_id);
    const { error: insertLogErr } = await supabase
      .from(TABLES.consumptionLog)
      .insert({
        user_id: userId,
        user_resource_id: userResourceId,
        event_type: 'added',
        concepts_touched: conceptIds,
        metadata: {
          source: 'youtube_pipeline',
          resourceId,
          linksCount: conceptIds.length,
        },
      });

    if (insertLogErr) {
      log.warn(`Failed to write consumption log for ${userResourceId}: ${insertLogErr.message}`);
    }
  }

  return { userResourceId, linksCount: normalizedLinks.length };
}

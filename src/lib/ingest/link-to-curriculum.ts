/**
 * Jarre - Curriculum Linking
 *
 * Step 2 of ingestion: DeepSeek matches extracted concepts against
 * the full curriculum concept list (~150 concepts, ~3K tokens).
 * No embeddings needed at this scale — LLM linking > cosine similarity.
 */

import { z } from 'zod';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createLogger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import { TOKEN_BUDGETS, DEFINITION_TRUNCATION_CHARS } from '@/lib/constants';
import type { ConceptLink, ExtractedConceptRaw } from './types';

const log = createLogger('LinkToCurriculum');

const VALID_RELATIONSHIPS = ['extends', 'applies', 'contrasts', 'exemplifies', 'relates'] as const;

const LinkingResponseSchema = z.object({
  links: z.array(z.object({
    extractedConceptName: z.string().min(1),
    curriculumConceptId: z.string().min(1),
    curriculumConceptName: z.string().min(1),
    relationship: z.string().transform((val) => {
      const lower = val.toLowerCase().trim();
      if ((VALID_RELATIONSHIPS as readonly string[]).includes(lower)) {
        return lower as typeof VALID_RELATIONSHIPS[number];
      }
      return 'relates' as const;
    }),
    relevanceScore: z.number().min(0).max(1),
    explanation: z.string().min(5),
  })),
  coverageScore: z.number().min(0).max(1),
});

type LinkingResponse = z.infer<typeof LinkingResponseSchema>;

/**
 * Get phases relevant to the user's current phase (±2 range).
 * E.g., phase '3' → ['1','2','3','4','5']
 */
function getRelevantPhases(currentPhase: string): string[] {
  const phaseNum = parseInt(currentPhase, 10);
  if (isNaN(phaseNum)) return [];

  const phases: string[] = [];
  for (let i = Math.max(1, phaseNum - 2); i <= Math.min(11, phaseNum + 2); i++) {
    phases.push(String(i));
  }
  return phases;
}

/**
 * Fetch curriculum concepts filtered by phases.
 * Falls back to all concepts if no phases provided.
 */
async function fetchCurriculumConcepts(
  supabase: SupabaseClient,
  phases?: string[],
): Promise<Array<{
  id: string;
  name: string;
  canonical_definition: string;
}>> {
  let query = supabase
    .from(TABLES.concepts)
    .select('id, name, canonical_definition')
    .order('name');

  if (phases && phases.length > 0) {
    query = query.in('phase', phases);
  }

  const { data, error } = await query;

  if (error) {
    log.error('Failed to fetch curriculum concepts:', error.message);
    throw new Error('Failed to fetch curriculum concepts');
  }

  return data || [];
}

/**
 * Link extracted concepts to curriculum concepts using DeepSeek.
 */
export async function linkToCurriculum(params: {
  extractedConcepts: ExtractedConceptRaw[];
  resourceTitle: string;
  resourceSummary: string;
  supabase: SupabaseClient;
  userId: string;
  language?: string;
  userPhase?: string;
}): Promise<{ links: ConceptLink[]; coverageScore: number; tokensUsed: number }> {
  const { extractedConcepts, resourceTitle, resourceSummary, supabase, userId, language = 'en', userPhase } = params;

  if (extractedConcepts.length === 0) {
    return { links: [], coverageScore: 0, tokensUsed: 0 };
  }

  const phases = userPhase ? getRelevantPhases(userPhase) : undefined;
  const curriculumConcepts = await fetchCurriculumConcepts(supabase, phases);

  if (phases) {
    log.info(`Filtered to ${curriculumConcepts.length} concepts for phases [${phases.join(',')}]`);
  }

  if (curriculumConcepts.length === 0) {
    log.warn('No curriculum concepts found in database');
    return { links: [], coverageScore: 0, tokensUsed: 0 };
  }

  // Build curriculum reference for the prompt (truncate definitions to save tokens)
  const curriculumList = curriculumConcepts
    .map((c) => {
      const def = c.canonical_definition
        ? c.canonical_definition.slice(0, DEFINITION_TRUNCATION_CHARS)
        : 'No definition';
      return `- ${c.id} | ${c.name} | ${def}`;
    })
    .join('\n');

  const extractedList = extractedConcepts
    .map((c) => `- "${c.name}": ${c.description}`)
    .join('\n');

  const { content: responseText, tokensUsed } = await callDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You are a curriculum mapping specialist. Given a list of concepts extracted from an external resource and the full curriculum concept catalog, find meaningful connections.

For each extracted concept, find 0-3 curriculum concepts it relates to. Only create links where there's a genuine conceptual connection, not superficial keyword overlap.

Relationship types:
- "extends": the external resource adds depth or new perspective to the curriculum concept
- "applies": the external resource shows a practical application of the curriculum concept
- "contrasts": the external resource presents an alternative or opposing view
- "exemplifies": the external resource provides a concrete example of the curriculum concept
- "relates": general topical relationship

Also compute a coverageScore (0-1): what fraction of the extracted concepts map to curriculum concepts. Higher = more curriculum-aligned.

You MUST respond with valid JSON using EXACTLY this schema:
{
  "links": [
    {
      "extractedConceptName": "name from extracted list",
      "curriculumConceptId": "exact id from curriculum list",
      "curriculumConceptName": "name from curriculum list",
      "relationship": "extends|applies|contrasts|exemplifies|relates",
      "relevanceScore": 0.8,
      "explanation": "why this connection exists"
    }
  ],
  "coverageScore": 0.5
}

The root keys MUST be "links" and "coverageScore". Use the exact concept IDs from the curriculum list.
If no meaningful links exist, return { "links": [], "coverageScore": 0 }.
${language === 'es' ? 'Write all explanation fields in Spanish.' : 'Write all explanation fields in English.'}`,
      },
      {
        role: 'user',
        content: `Resource: "${resourceTitle}"
Summary: ${resourceSummary}

Extracted concepts:
${extractedList}

Curriculum concepts (format: id | name | definition):
${curriculumList}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.INGEST_LINK,
    responseFormat: 'json',
    timeoutMs: 90_000,
    retryOnTimeout: true,
  });

  const parsed: LinkingResponse = parseJsonResponse(responseText, LinkingResponseSchema);

  // Validate that all curriculum concept IDs actually exist
  const validIds = new Set(curriculumConcepts.map((c) => c.id));
  const validLinks = parsed.links.filter((link) => {
    if (!validIds.has(link.curriculumConceptId)) {
      log.warn(`Invalid curriculum concept ID in link: ${link.curriculumConceptId}`);
      return false;
    }
    return true;
  });

  // Log token usage
  logTokenUsage({ userId, category: 'ingest_link', tokens: tokensUsed }).catch(() => {});

  log.info(`Linked ${validLinks.length} concepts for "${resourceTitle}" (coverage: ${parsed.coverageScore}, ${tokensUsed} tokens)`);

  return {
    links: validLinks,
    coverageScore: parsed.coverageScore,
    tokensUsed,
  };
}

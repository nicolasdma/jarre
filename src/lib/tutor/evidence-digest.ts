/**
 * Jarre - The digest step that turns a voice session into learner evidence (server)
 *
 * Runs after the prose summary, inside the durable session digest
 * (src/lib/voice/session-digest.ts): the transcript and the lesson map go to
 * DeepSeek, which returns JSON validated by DigestOutputSchema; the rows
 * replace that session's earlier rows (idempotent re-runs), and the state of
 * every concept it touched is recomputed by rules (mastery.ts) into
 * learner_concept_memory.
 *
 * Without supabase/migrations/20261119020000_learner_memory.sql the step does
 * nothing: the tutor keeps working with the prose summary.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { logTokenUsage } from '@/lib/db/token-usage';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { isMissingSchema } from '@/lib/voice/transcript-store';
import type { DigestContext } from '@/lib/voice/session-digest';
import { DIGEST_VERSION, DigestOutputSchema, clip, type DigestOutput, type EvidenceRow } from './evidence';
import { masteryOf } from './mastery';

const log = createLogger('EvidenceDigest');

const MAX_TRANSCRIPT_CHARS = 24_000;
const DIGEST_MAX_TOKENS = 2500;

export interface DigestSection {
  n: number;
  id: string;
  conceptId: string | null;
  title: string;
}

export const DIGEST_SYSTEM = `You read the transcript of a voice tutoring session about one lesson and extract what the LEARNER showed, for the tutor's memory. Return JSON {"items": [...]}, at most 40 items, each:
{"kind": "explained"|"misconception"|"gap"|"asked_help"|"tutor_question"|"preference"|"english",
 "section": <number of the lesson section it is about, from the map; null if it is about the whole lesson>,
 "verdict": "correct"|"partial"|"wrong"|"unknown"|null,
 "resolved": true|false|null,
 "statement": "<the fact in one short sentence, in Spanish, max 300 chars>",
 "quote": "<the learner's own words, verbatim from a LEARNER line, max 200 chars; null if none>",
 "seq": <the [n] of the transcript line it comes from>}
Kinds:
- explained: the learner explained or answered something right or partly right (verdict correct or partial). Only things that show understanding, not "sí" or "dale".
- misconception: the learner said something wrong (verdict wrong). resolved = true only if the tutor corrected it AND the learner then said the right version himself; a correction he only heard is resolved = false. statement = what is wrong and the right version.
- gap: the learner did not know or did not remember something ("no sé", "me olvidé").
- asked_help: the learner asked to be taught or for an explanation; statement = what he asked to have explained.
- tutor_question: every distinct question the TUTOR asked about the content; statement = the question, normalized and short; quote = the learner's answer if he answered it (null if not); verdict = how right that answer was.
- preference: how the learner wants to work, if he said it ("explicame paso a paso", "no quiero practicar inglés ahora", "qué pesado con la entrevista", "vamos de a poco"). statement = the preference as a rule for the tutor.
- english: the learner spoke English and got a correction; statement = "dijo X, mejor Y".
Never invent: every quote is copied from a LEARNER line. Do not list what only the tutor said, except tutor_question.`;

export function digestUserPrompt(sections: DigestSection[], focusN: number | null, transcript: DigestContext['transcripts']): string {
  const map = sections.map((s) => `${s.n}. ${s.title}`).join('\n');
  let lines = transcript.map((t) => `[${t.seq}] ${t.role === 'user' ? 'LEARNER' : 'TUTOR'}: ${t.text}`).join('\n');
  if (lines.length > MAX_TRANSCRIPT_CHARS) lines = lines.slice(lines.length - MAX_TRANSCRIPT_CHARS);
  return `LESSON MAP:\n${map}\n\nSECTION BEING STUDIED: ${focusN ?? 'unknown'}\n\nTRANSCRIPT:\n${lines}`;
}

/** Validated digest items → evidence rows (section numbers resolved to ids). */
export function digestToRows(
  out: DigestOutput,
  ctx: { userId: string; resourceId: string; sessionId: string; sections: DigestSection[]; focusN: number | null; transcript: DigestContext['transcripts'] },
): Record<string, unknown>[] {
  const atOf = new Map(ctx.transcript.map((t) => [t.seq, t.timestamp]));
  const fallbackAt = ctx.transcript[ctx.transcript.length - 1]?.timestamp ?? new Date().toISOString();
  const learnerText = ctx.transcript.filter((t) => t.role === 'user').map((t) => t.text.toLowerCase()).join('\n');
  return out.items
    .map((item) => {
      const sectionN = item.section ?? (item.kind === 'preference' ? null : ctx.focusN);
      const section = sectionN ? ctx.sections.find((s) => s.n === sectionN) : undefined;
      const statement = clip(item.statement, 300);
      if (!statement) return null;
      // A quote must be the learner's own words; a paraphrase is dropped, the fact kept.
      const quote = clip(item.quote, 200);
      const quoteOk = quote && learnerText.includes(quote.replace(/…$/, '').toLowerCase().slice(0, 40));
      return {
        user_id: ctx.userId,
        resource_id: ctx.resourceId,
        section_id: section?.id ?? null,
        concept_id: section?.conceptId ?? null,
        session_id: ctx.sessionId,
        transcript_seq: item.seq ?? null,
        source: 'voice',
        kind: item.kind,
        verdict: item.verdict ?? null,
        resolved: item.kind === 'misconception' ? item.resolved ?? false : item.resolved ?? null,
        statement,
        quote: quoteOk ? quote : null,
        at: (item.seq && atOf.get(item.seq)) || fallbackAt,
        digest_version: DIGEST_VERSION,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
}

/** The step registered in the session digest (src/lib/voice/digest-steps.ts). */
export async function evidenceDigestStep(ctx: DigestContext): Promise<void> {
  if (ctx.sessionType !== 'teaching' || !ctx.resourceId || ctx.transcripts.length === 0) return;
  if (!ctx.transcripts.some((t) => t.role === 'user')) return;
  const { admin, userId, sessionId, resourceId } = ctx;

  // Without the table there is nothing to write: stop before paying for the call.
  const probe = await admin.from('learner_evidence').select('id', { head: true, count: 'exact' }).eq('session_id', sessionId);
  if (probe.error && isMissingSchema(probe.error)) {
    log.info('learner_evidence not migrated: evidence step skipped');
    return;
  }

  const { data: rows } = await admin
    .from(TABLES.resourceSections)
    .select('id, concept_id, section_title, sort_order')
    .eq('resource_id', resourceId)
    .order('sort_order');
  const sections: DigestSection[] = (rows ?? []).map((r, i) => ({ n: i + 1, id: r.id, conceptId: r.concept_id ?? null, title: r.section_title }));
  const focusN = sections.find((s) => s.id === ctx.sectionId)?.n ?? null;

  const { content, tokensUsed } = await callDeepSeek({
    messages: [
      { role: 'system', content: DIGEST_SYSTEM },
      { role: 'user', content: digestUserPrompt(sections, focusN, ctx.transcripts) },
    ],
    temperature: 0,
    maxTokens: DIGEST_MAX_TOKENS,
    responseFormat: 'json',
    timeoutMs: 40_000,
  });
  logTokenUsage({ userId, category: 'voice_memory', tokens: tokensUsed });
  const parsed = DigestOutputSchema.safeParse(JSON.parse(content));
  if (!parsed.success) throw new Error(`digest output invalid: ${parsed.error.message.slice(0, 200)}`);
  const evidence = digestToRows(parsed.data, { userId, resourceId, sessionId, sections, focusN, transcript: ctx.transcripts });

  // Idempotent: a re-run replaces this session's rows.
  const { error: delError } = await admin.from('learner_evidence').delete().eq('session_id', sessionId).eq('user_id', userId);
  if (delError) throw new Error(delError.message);
  if (evidence.length) {
    const { error: insError } = await admin.from('learner_evidence').insert(evidence);
    if (insError) throw new Error(insError.message);
  }
  log.info(`Evidence for session ${sessionId}: ${evidence.length} rows`);

  await updateConceptStates(admin, userId, [...new Set(evidence.map((e) => e.concept_id as string | null).filter((c): c is string => !!c))]);
}

/** Recomputes mastery, last seen and the questions already asked, per concept touched. */
async function updateConceptStates(admin: SupabaseClient, userId: string, conceptIds: string[]): Promise<void> {
  for (const conceptId of conceptIds) {
    const { data } = await admin
      .from('learner_evidence')
      .select('session_id, kind, verdict, resolved, statement, at')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .order('at', { ascending: false })
      .limit(200);
    const rows = (data ?? []).map((r) => ({ ...r, sessionId: r.session_id })) as unknown as (EvidenceRow & { session_id: string })[];
    const asked = rows.filter((r) => r.kind === 'tutor_question').slice(0, 10).map((r) => r.statement);
    const { error } = await admin.from(TABLES.learnerConceptMemory).upsert(
      {
        user_id: userId,
        concept_id: conceptId,
        mastery: masteryOf(rows),
        last_seen_at: rows[0]?.at ?? new Date().toISOString(),
        asked_questions: asked,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,concept_id' },
    );
    if (error && !isMissingSchema(error)) log.warn(`concept state ${conceptId}: ${error.message}`);
  }
}

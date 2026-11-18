/**
 * Jarre - Learner evidence: what the learner showed, line by line
 *
 * One row per thing the learner showed in a voice session, extracted after the
 * session by the digest (evidence-digest.ts) into `learner_evidence`
 * (supabase/migrations/20261119020000_learner_memory.sql). The state per
 * concept (mastery.ts) and the brief the tutor opens with (learner-brief.ts)
 * are computed from these rows by rules, never by the LLM
 * (docs/tutor/01-estado-del-arte.md §4.7, arXiv 2512.23036).
 */

import { z } from 'zod';

export const EVIDENCE_KINDS = ['explained', 'misconception', 'gap', 'asked_help', 'tutor_question', 'preference', 'english'] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type Verdict = 'correct' | 'partial' | 'wrong' | 'unknown';

/** Bump when the digest prompt or schema changes: a re-run rewrites the session's rows. */
export const DIGEST_VERSION = 1;

/** A row as the tutor reads it (the context route returns these). */
export interface EvidenceRow {
  sessionId: string | null;
  sectionId: string | null;
  conceptId: string | null;
  kind: EvidenceKind;
  verdict: Verdict | null;
  resolved: boolean | null;
  statement: string;
  quote: string | null;
  at: string;
}

/** What the digest model returns, validated before anything is stored. */
export const DigestOutputSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(EVIDENCE_KINDS),
        /** 1-based section number from the lesson map; null when it is about the whole lesson. */
        section: z.number().int().min(1).nullable().optional(),
        verdict: z.enum(['correct', 'partial', 'wrong', 'unknown']).nullable().optional(),
        resolved: z.boolean().nullable().optional(),
        statement: z.string().min(1),
        quote: z.string().nullable().optional(),
        /** The transcript line it comes from. */
        seq: z.number().int().nullable().optional(),
      }),
    )
    .max(40),
});
export type DigestOutput = z.infer<typeof DigestOutputSchema>;

/** The stored row, for a digest output item (the caller maps section numbers to ids). */
export function clip(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return t.length > max ? `${t.slice(0, max - 1).trim()}…` : t;
}

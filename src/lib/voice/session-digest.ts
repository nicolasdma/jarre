/**
 * Jarre - Voice session close and digest (server only)
 *
 * Every session with conversation must end up closed and digested, also when
 * the tab was killed or the serverless function died after responding
 * (docs/tutor/02-arquitectura.md §3.4, §4.2). On 2026-11-18: 7 of 49 sessions
 * never closed (3 with conversation, invisible to the memory, which only reads
 * closed sessions), and `ac028b04` closed without its summary because the
 * summary ran as a floating promise after the response.
 *
 * - `finalizeSession` closes one session (idempotent: the first `ended_at`
 *   wins) and marks its digest `pending`.
 * - `runSessionDigest` claims a pending digest (`running`, one more attempt),
 *   runs it and marks it `done`; a failure goes back to `pending`, and to
 *   `failed` after MAX_DIGEST_ATTEMPTS. Callers run it with `after()`.
 * - `recoverUserSessions`, called when the tutor asks for context, closes the
 *   user's sessions with no activity for STALE_SESSION_MS and returns the
 *   digests still pending, for the caller to run with `after()`.
 *
 * Without 20261119010000_voice_reliability.sql (no digest columns) the digest
 * runs once, as before, and nothing is retried.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { generateConversationSummary } from '@/lib/voice/memory';
import { isMissingSchema } from '@/lib/voice/transcript-store';
import type { ClientDiag } from '@/lib/voice/session-diag';

const log = createLogger('VoiceDigest');

export const MAX_DIGEST_ATTEMPTS = 3;
/** A session with nothing new for this long is over (the tab was closed or crashed). */
export const STALE_SESSION_MS = 15 * 60 * 1000;
/** A pending digest younger than this belongs to the `end` that just set it. */
const PENDING_GRACE_MS = 30 * 1000;
/** A digest `running` for this long died with its function. */
const RUNNING_STALE_MS = 5 * 60 * 1000;

/** Extra digest steps (the learner evidence, phase 2) plug in here. */
export type DigestStep = (ctx: DigestContext) => Promise<void>;

export interface DigestContext {
  admin: SupabaseClient;
  sessionId: string;
  userId: string;
  sectionId: string | null;
  resourceId: string | null;
  sessionType: string;
  startedAt: string;
  transcripts: { role: 'user' | 'model'; text: string; timestamp: string; seq: number }[];
}

const extraSteps: DigestStep[] = [];
export function registerDigestStep(step: DigestStep): void {
  if (!extraSteps.includes(step)) extraSteps.push(step);
}

interface FinalizeParams {
  sessionId: string;
  userId: string;
  /** When it ended; now by default. A stale session ends at its last activity. */
  endedAt?: string;
  diag?: ClientDiag | null;
}

export interface FinalizeResult {
  /** It has conversation worth digesting. */
  digest: boolean;
  /** The digest columns exist: the digest can be claimed and retried. */
  durable: boolean;
}

/** Closes a session. Idempotent: an `ended_at` already set is kept. */
export async function finalizeSession(admin: SupabaseClient, p: FinalizeParams): Promise<FinalizeResult> {
  const { data: session, error } = await admin
    .from(TABLES.voiceSessions)
    .select('started_at, ended_at, session_type')
    .eq('id', p.sessionId)
    .eq('user_id', p.userId)
    .single();
  if (error || !session) throw new Error(`session not found: ${p.sessionId}`);

  const { count } = await admin
    .from(TABLES.voiceTranscripts)
    .select('id', { count: 'exact', head: true })
    .eq('session_id', p.sessionId);

  const endedAt = session.ended_at ?? p.endedAt ?? new Date().toISOString();
  const base = {
    ended_at: endedAt,
    duration_seconds: Math.max(0, Math.floor((Date.parse(endedAt) - Date.parse(session.started_at)) / 1000)),
    turn_count: count ?? 0,
  };
  const digest = (count ?? 0) > 0 && session.session_type !== 'exploration';
  const durableFields: Record<string, unknown> = {
    ...(p.diag ? { client_diag: p.diag } : {}),
    ...(digest ? { digest_status: 'pending', digest_updated_at: new Date().toISOString() } : {}),
  };

  // Never re-open a digest that is already done or running: `end` can arrive twice.
  let query = admin.from(TABLES.voiceSessions).update({ ...base, ...durableFields }).eq('id', p.sessionId).eq('user_id', p.userId);
  if (digest) query = query.in('digest_status', ['none', 'pending', 'failed']);
  const { data: updated, error: updateError } = await query.select('id');
  if (updateError && isMissingSchema(updateError)) {
    const { error: legacyError } = await admin.from(TABLES.voiceSessions).update(base).eq('id', p.sessionId).eq('user_id', p.userId);
    if (legacyError) throw new Error(legacyError.message);
    return { digest, durable: false };
  }
  if (updateError) throw new Error(updateError.message);
  if (digest && (updated?.length ?? 0) === 0) {
    // Digest already running or done: still store the close and the diag.
    const { error: closeError } = await admin
      .from(TABLES.voiceSessions)
      .update({ ...base, ...(p.diag ? { client_diag: p.diag } : {}) })
      .eq('id', p.sessionId)
      .eq('user_id', p.userId);
    if (closeError) throw new Error(closeError.message);
    return { digest: false, durable: true };
  }
  return { digest, durable: true };
}

/**
 * Runs the digest of one session: the prose summary (cached_summary) and the
 * registered steps. With `durable`, it first claims the pending digest so two
 * runners never do it twice.
 */
export async function runSessionDigest(
  admin: SupabaseClient,
  sessionId: string,
  userId: string,
  { durable }: { durable: boolean },
): Promise<'done' | 'skipped' | 'retry' | 'failed'> {
  let attempts = 1;
  if (durable) {
    const { data: row } = await admin
      .from(TABLES.voiceSessions)
      .select('digest_attempts')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    attempts = (row?.digest_attempts ?? 0) + 1;
    const { data: claimed, error } = await admin
      .from(TABLES.voiceSessions)
      .update({ digest_status: 'running', digest_attempts: attempts, digest_updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('digest_status', 'pending')
      .select('id');
    if (error) throw new Error(error.message);
    if (!claimed?.length) return 'skipped';
  }

  try {
    await digestOnce(admin, sessionId, userId);
    if (durable) await setDigestStatus(admin, sessionId, userId, 'done');
    log.info(`Digest done for session ${sessionId} (attempt ${attempts})`);
    return 'done';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const final = attempts >= MAX_DIGEST_ATTEMPTS;
    log.error(`Digest failed for session ${sessionId} (attempt ${attempts}${final ? ', giving up' : ''}): ${message}`);
    if (durable) await setDigestStatus(admin, sessionId, userId, final ? 'failed' : 'pending');
    return final ? 'failed' : 'retry';
  }
}

async function setDigestStatus(admin: SupabaseClient, sessionId: string, userId: string, status: string) {
  await admin
    .from(TABLES.voiceSessions)
    .update({ digest_status: status, digest_updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', userId);
}

async function digestOnce(admin: SupabaseClient, sessionId: string, userId: string): Promise<void> {
  const { data: session, error: sessionError } = await admin
    .from(TABLES.voiceSessions)
    .select('section_id, resource_id, session_type, started_at')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();
  if (sessionError || !session) throw new Error(`session not found: ${sessionId}`);

  const { data: rows, error: txError } = await admin
    .from(TABLES.voiceTranscripts)
    .select('role, text, timestamp, client_seq')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });
  if (txError) throw new Error(txError.message);
  const transcripts = (rows ?? []).map((t, i) => ({
    role: t.role as 'user' | 'model',
    text: t.text as string,
    timestamp: t.timestamp as string,
    seq: typeof t.client_seq === 'number' ? t.client_seq : i + 1,
  }));
  if (transcripts.length === 0) return;

  let sectionTitle = 'Unknown section';
  let resourceId: string | null = session.resource_id ?? null;
  if (session.section_id) {
    const { data: section } = await admin
      .from(TABLES.resourceSections)
      .select('section_title, resource_id')
      .eq('id', session.section_id)
      .single();
    sectionTitle = section?.section_title ?? sectionTitle;
    resourceId = resourceId ?? section?.resource_id ?? null;
  }

  const summary = await generateConversationSummary(transcripts, sectionTitle, userId);
  if (!summary) throw new Error('summary generation returned nothing');
  const { error: cacheError } = await admin
    .from(TABLES.voiceSessions)
    .update({ cached_summary: summary })
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (cacheError) throw new Error(cacheError.message);

  for (const step of extraSteps) {
    await step({
      admin,
      sessionId,
      userId,
      sectionId: session.section_id ?? null,
      resourceId,
      sessionType: session.session_type,
      startedAt: session.started_at,
      transcripts,
    });
  }
}

/**
 * Closes the user's sessions that went quiet without an `end`, and returns the
 * digests to run now (pending past the grace, or `running` long enough to be
 * dead). Never throws: the tutor must open even if this fails.
 */
export async function recoverUserSessions(
  admin: SupabaseClient,
  userId: string,
  now = Date.now(),
): Promise<{ sessionId: string; durable: boolean }[]> {
  const toDigest: { sessionId: string; durable: boolean }[] = [];
  try {
    let durable = true;
    let open: { id: string; started_at: string; last_activity_at?: string | null }[] = [];
    const withActivity = await admin
      .from(TABLES.voiceSessions)
      .select('id, started_at, last_activity_at')
      .eq('user_id', userId)
      .is('ended_at', null)
      .limit(20);
    if (withActivity.error && isMissingSchema(withActivity.error)) {
      durable = false;
      const legacy = await admin
        .from(TABLES.voiceSessions)
        .select('id, started_at')
        .eq('user_id', userId)
        .is('ended_at', null)
        .limit(20);
      open = legacy.data ?? [];
    } else {
      open = withActivity.data ?? [];
    }

    for (const s of open) {
      const { data: last } = await admin
        .from(TABLES.voiceTranscripts)
        .select('timestamp')
        .eq('session_id', s.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastAt = Math.max(
        Date.parse(s.started_at),
        s.last_activity_at ? Date.parse(s.last_activity_at) : 0,
        last?.timestamp ? Date.parse(last.timestamp) : 0,
      );
      if (now - lastAt < STALE_SESSION_MS) continue;
      const result = await finalizeSession(admin, {
        sessionId: s.id,
        userId,
        endedAt: new Date(lastAt).toISOString(),
        diag: null,
      });
      log.info(`Closed stale session ${s.id} (quiet since ${new Date(lastAt).toISOString()})`);
      if (result.digest) toDigest.push({ sessionId: s.id, durable: result.durable });
    }

    if (durable) {
      const { data: pending } = await admin
        .from(TABLES.voiceSessions)
        .select('id, digest_status, digest_updated_at')
        .eq('user_id', userId)
        .in('digest_status', ['pending', 'running'])
        .limit(10);
      for (const p of pending ?? []) {
        const age = now - (p.digest_updated_at ? Date.parse(p.digest_updated_at) : 0);
        if (p.digest_status === 'pending' && age < PENDING_GRACE_MS) continue;
        if (p.digest_status === 'running') {
          if (age < RUNNING_STALE_MS) continue;
          // Its function died mid-run: give it back.
          await admin
            .from(TABLES.voiceSessions)
            .update({ digest_status: 'pending', digest_updated_at: new Date(now).toISOString() })
            .eq('id', p.id)
            .eq('user_id', userId)
            .eq('digest_status', 'running');
        }
        if (!toDigest.some((d) => d.sessionId === p.id)) toDigest.push({ sessionId: p.id, durable: true });
      }
    }
  } catch (err) {
    log.error('Session recovery failed:', err instanceof Error ? err.message : err);
  }
  return toDigest;
}

/**
 * POST /api/voice/session/transcript
 *
 * Durable transcript ingestion endpoint with idempotent turn IDs.
 * Supports:
 * - Legacy single event body
 * - Batched events body
 *
 * Auth model:
 * - Requires per-session write token issued by /api/voice/session/start
 * - Uses admin client to avoid per-chunk auth overhead in the hot path
 */

import { NextResponse } from 'next/server';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { verifyVoiceSessionWriteToken } from '@/lib/voice/session-write-token';

const log = createLogger('VoiceTranscriptIngest');

const MAX_EVENTS_PER_REQUEST = 100;

interface IncomingTranscriptEvent {
  turnId?: string;
  seq?: number;
  role?: 'user' | 'model';
  text?: string;
  timestamp?: string;
}

function parseTimestamp(raw?: string): string {
  if (!raw) return new Date().toISOString();
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

function normalizeIncomingEvents(body: Record<string, unknown>): IncomingTranscriptEvent[] {
  if (Array.isArray(body.events)) {
    return body.events as IncomingTranscriptEvent[];
  }

  // Backward-compatible legacy shape:
  // { sessionId, role, text }
  return [
    {
      turnId: typeof body.turnId === 'string' ? body.turnId : undefined,
      seq: typeof body.seq === 'number' ? body.seq : undefined,
      role:
        body.role === 'user' || body.role === 'model'
          ? (body.role as 'user' | 'model')
          : undefined,
      text: typeof body.text === 'string' ? body.text : undefined,
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : undefined,
    },
  ];
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      throw badRequest('Invalid JSON body');
    }

    const sessionIdFromBody =
      typeof body.sessionId === 'string' && body.sessionId.length > 0
        ? body.sessionId
        : null;

    const writeToken =
      (typeof body.writeToken === 'string' ? body.writeToken : null) ||
      request.headers.get('x-voice-session-token');
    if (!writeToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenPayload = verifyVoiceSessionWriteToken(writeToken);
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionIdFromBody && sessionIdFromBody !== tokenPayload.sid) {
      throw badRequest('sessionId does not match write token');
    }

    const sessionId = sessionIdFromBody ?? tokenPayload.sid;
    const events = normalizeIncomingEvents(body);

    if (events.length === 0) {
      throw badRequest('At least one transcript event is required');
    }
    if (events.length > MAX_EVENTS_PER_REQUEST) {
      throw badRequest(`Too many events (max ${MAX_EVENTS_PER_REQUEST})`);
    }

    const rows = events.map((event, index) => {
      if (!event || typeof event !== 'object') {
        throw badRequest(`Invalid event at index ${index}`);
      }
      if (event.role !== 'user' && event.role !== 'model') {
        throw badRequest(`Invalid role at index ${index}`);
      }
      if (!event.text || typeof event.text !== 'string') {
        throw badRequest(`Invalid text at index ${index}`);
      }

      const turnId =
        typeof event.turnId === 'string' && event.turnId.length > 0
          ? event.turnId
          : `legacy-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`;

      return {
        session_id: sessionId,
        role: event.role,
        text: event.text,
        timestamp: parseTimestamp(event.timestamp),
        client_turn_id: turnId,
        client_seq: Number.isFinite(event.seq) ? Number(event.seq) : null,
      };
    });

    const admin = createAdminClient();
    const { error: upsertError } = await admin
      .from(TABLES.voiceTranscripts)
      .upsert(rows, {
        onConflict: 'session_id,client_turn_id',
        ignoreDuplicates: true,
      });

    // Fallback for environments where the unique index isn't migrated yet.
    if (upsertError?.message?.includes('there is no unique or exclusion constraint')) {
      const legacyRows = rows.map((row) => ({
        session_id: row.session_id,
        role: row.role,
        text: row.text,
        timestamp: row.timestamp,
      }));

      const { error: insertError } = await admin
        .from(TABLES.voiceTranscripts)
        .insert(legacyRows);
      if (insertError) {
        log.error(
          `Failed transcript insert fallback sid=${sessionId}: ${insertError.message}`,
        );
        throw new Error('Failed to persist transcript events');
      }
    } else if (upsertError) {
      log.error(`Failed transcript upsert sid=${sessionId}: ${upsertError.message}`);
      throw new Error('Failed to persist transcript events');
    }

    return jsonOk({ ok: true, accepted: rows.length });
  } catch (error) {
    return errorResponse(error);
  }
}

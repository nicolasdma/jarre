/**
 * Jarre - Store transcript rows once each (server)
 *
 * Every utterance carries `client_turn_id` = `${sessionId}-${seq}`. The upsert
 * on (session_id, client_turn_id) needs the plain unique index of
 * 20261119010000_voice_reliability.sql. Until that runs, the partial index of
 * 20260303150000 cannot back it ("there is no unique or exclusion
 * constraint"), and the route used to insert the rows *without* their ids: 0
 * rows with client_turn_id on 2026-11-18, and a retried batch was stored twice.
 * The fallback now keeps the ids and skips the ones already stored.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';

export interface TranscriptRow {
  session_id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  client_turn_id: string;
  client_seq: number | null;
}

/** Rows whose turn id is not stored yet, each turn id once (the first wins). */
export function newRowsOnly(rows: TranscriptRow[], storedTurnIds: Iterable<string>): TranscriptRow[] {
  const seen = new Set(storedTurnIds);
  const out: TranscriptRow[] = [];
  for (const row of rows) {
    if (seen.has(row.client_turn_id)) continue;
    seen.add(row.client_turn_id);
    out.push(row);
  }
  return out;
}

const NO_CONFLICT_TARGET = 'there is no unique or exclusion constraint';
const UNIQUE_VIOLATION = '23505';

/** Stores the batch idempotently. Returns how many rows were new (fallback path) or sent (upsert). */
export async function storeTranscriptRows(admin: SupabaseClient, rows: TranscriptRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const unique = newRowsOnly(rows, []);
  const { error } = await admin
    .from(TABLES.voiceTranscripts)
    .upsert(unique, { onConflict: 'session_id,client_turn_id', ignoreDuplicates: true });
  if (!error) return unique.length;
  if (!error.message?.includes(NO_CONFLICT_TARGET)) throw new Error(error.message);

  // The plain unique index is not there yet: read what this session already has.
  const sessionId = unique[0].session_id;
  const { data: stored, error: readError } = await admin
    .from(TABLES.voiceTranscripts)
    .select('client_turn_id')
    .eq('session_id', sessionId)
    .in('client_turn_id', unique.map((r) => r.client_turn_id));
  if (readError) throw new Error(readError.message);
  const fresh = newRowsOnly(unique, (stored ?? []).map((r: { client_turn_id: string | null }) => r.client_turn_id ?? ''));
  if (fresh.length === 0) return 0;

  const { error: insertError } = await admin.from(TABLES.voiceTranscripts).insert(fresh);
  if (!insertError) return fresh.length;
  // Two requests raced past the read: the partial index stopped the duplicate. Row by row.
  if (insertError.code !== UNIQUE_VIOLATION) throw new Error(insertError.message);
  let inserted = 0;
  for (const row of fresh) {
    const { error: rowError } = await admin.from(TABLES.voiceTranscripts).insert(row);
    if (!rowError) inserted++;
    else if (rowError.code !== UNIQUE_VIOLATION) throw new Error(rowError.message);
  }
  return inserted;
}

/** Postgres/PostgREST errors that mean "this column or table is not migrated yet". */
export function isMissingSchema(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '42703' || // undefined_column
    error.code === '42P01' || // undefined_table
    error.code === 'PGRST204' || // column not in the schema cache
    error.code === 'PGRST205' || // table not in the schema cache
    /column .* does not exist|could not find the .* (column|table)/i.test(error.message ?? '')
  );
}

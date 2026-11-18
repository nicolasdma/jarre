/**
 * Jarre - client diagnostics a voice session sends with /api/voice/session/end.
 */

/**
 * What the client saw (transcription fragments, mic chunks sent, utterances
 * queued, last error), logged next to the stored turn count so a session that
 * lost its turns can be traced: 2026-11-18, d14a09c0 lasted 110 s with one
 * stored line and nothing told whether the learner was ever heard.
 */
export function formatClientDiag(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const d = raw as Record<string, unknown>;
  const num = (k: string) => (typeof d[k] === 'number' && Number.isFinite(d[k]) ? Math.floor(d[k] as number) : '?');
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string).replace(/[^\w .:=/-]/g, '').slice(0, 120) : '');
  return ` client{end=${str('endReason') || '?'} userFragments=${num('userFragments')} modelFragments=${num('modelFragments')} audioChunks=${num('audioChunksSent')} queued=${num('stored')}${str('lastError') ? ` lastError="${str('lastError')}"` : ''}}`;
}

const MAX_DIAG_EVENTS = 150;
const MAX_DIAG_KEYS = 40;

function cleanString(v: string, max = 120): string {
  return v.replace(/[^\w .:=/,()-]/g, '').slice(0, max);
}

/** Numbers and short codes only, never conversation text. */
function cleanFlat(raw: unknown, maxKeys = MAX_DIAG_KEYS): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, maxKeys)) {
    const key = cleanString(k, 40);
    if (!key) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = Math.round(v * 1000) / 1000;
    else if (typeof v === 'boolean') out[key] = v;
    else if (typeof v === 'string') out[key] = cleanString(v);
  }
  return out;
}

export interface ClientDiag {
  counters: Record<string, number | string | boolean>;
  /** Timeline: `k` what happened, `t` ms since the mic click, plus numbers. */
  events: Record<string, number | string | boolean>[];
  usage: Record<string, number | string | boolean>;
}

/**
 * What /api/voice/session/end stores in voice_sessions.client_diag: the
 * counters, the timeline (mic_click, setup_complete, first_audio, tool calls,
 * socket closes...) and the summed usageMetadata. Shapes it defensively: the
 * body comes from the browser.
 */
export function sanitizeClientDiag(raw: unknown): ClientDiag | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  const { events, usage, ...counters } = d;
  return {
    counters: cleanFlat(counters),
    events: Array.isArray(events) ? events.slice(0, MAX_DIAG_EVENTS).map((e) => cleanFlat(e, 12)).filter((e) => typeof e.k === 'string') : [],
    usage: cleanFlat(usage),
  };
}

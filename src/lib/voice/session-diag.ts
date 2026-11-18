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

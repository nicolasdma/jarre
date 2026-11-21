/**
 * Jarre - A voice session's diagnostics, kept across the page.
 *
 * The timeline (session-timeline.ts) goes to the server with
 * /api/voice/session/end. A reload or a closed tab with an utterance still
 * unsent never gets to send it: the next page load closes the session
 * ("resent") and, until 2026-11-20, closed it with nothing, so the three
 * sessions of that evening the owner reloaded out of (1b65bd70, d572f502,
 * 56a3b178) left no trace of what their microphone and socket did. The
 * session now writes its diagnostics here as it goes, and whoever closes it
 * later sends what was written.
 */

const PREFIX = 'jarre.voice.diag.v1.';
/** The write token lasts 8 h (session-write-token.ts): older checkpoints belong to sessions nobody can close. */
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

type KeyValue = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export function saveDiagCheckpoint(storage: KeyValue, sessionId: string, diag: Record<string, unknown>, now: number = Date.now()): void {
  try {
    storage.setItem(PREFIX + sessionId, JSON.stringify({ savedAt: now, diag }));
  } catch {
    // Storage full or blocked: the live session still sends its own.
  }
}

/** The checkpoint of a session, removed as it is read. */
export function takeDiagCheckpoint(storage: KeyValue, sessionId: string): Record<string, unknown> | null {
  try {
    const raw = storage.getItem(PREFIX + sessionId);
    if (!raw) return null;
    storage.removeItem(PREFIX + sessionId);
    const parsed = JSON.parse(raw) as { diag?: unknown };
    return parsed.diag && typeof parsed.diag === 'object' ? (parsed.diag as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clearDiagCheckpoint(storage: KeyValue, sessionId: string): void {
  try {
    storage.removeItem(PREFIX + sessionId);
  } catch {
    // Storage blocked.
  }
}

/** Drops checkpoints too old to be sent. */
export function pruneDiagCheckpoints(storage: KeyValue, now: number = Date.now()): void {
  try {
    const stale: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      let savedAt = 0;
      try {
        savedAt = Number((JSON.parse(storage.getItem(key) ?? '') as { savedAt?: number }).savedAt) || 0;
      } catch {
        savedAt = 0;
      }
      if (now - savedAt > MAX_AGE_MS) stale.push(key);
    }
    for (const key of stale) storage.removeItem(key);
  } catch {
    // Storage blocked.
  }
}

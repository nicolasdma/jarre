/**
 * Jarre - Voice transcript outbox (one per voice session)
 *
 * Holds the utterances of one session until /api/voice/session/transcript has
 * them. It owns its session id and write token, so a session that ended (or a
 * new one that started) can never strand its events.
 *
 * Why it exists (2026-11-18, session d14a09c0): the hook kept one shared queue
 * and read the session from refs. Its final flush returned at once if another
 * flush was in flight, and the follow-up it scheduled read the session refs
 * after disconnect had nulled them, so whatever was queued then was never sent;
 * the next connect() also emptied the shared queue under a pending retry. And
 * nothing flushed when the tab closed. Here a flush joins the one in flight, the
 * final drain waits for it and retries, and every send carries its own session.
 */

export interface TranscriptEvent {
  turnId: string;
  seq: number;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface TranscriptOutboxTarget {
  sessionId: string;
  writeToken: string;
}

/** Sends one batch; throws (or rejects) when the server did not accept it. */
export type SendTranscriptBatch = (
  events: TranscriptEvent[],
  target: TranscriptOutboxTarget,
  opts: { keepalive: boolean },
) => Promise<void>;

export interface TranscriptOutboxOptions {
  target: TranscriptOutboxTarget;
  send: SendTranscriptBatch;
  batchSize?: number;
  flushIntervalMs?: number;
  maxRetryDelayMs?: number;
  /** Waits between the final drain's attempts after a failure. */
  drainBackoffMs?: number[];
  onError?: (err: unknown, pending: number) => void;
  /**
   * Where what is still unsent survives the page: a crash or a killed tab
   * loses the in-memory queue, and the next page load resends it
   * (`resendStoredOutboxes`).
   */
  store?: OutboxStore;
}

/** Keeps a session's unsent events across page loads. */
export interface OutboxStore {
  save(target: TranscriptOutboxTarget, events: TranscriptEvent[]): void;
  clear(sessionId: string): void;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class TranscriptOutbox {
  readonly target: TranscriptOutboxTarget;
  private readonly send: SendTranscriptBatch;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private readonly maxRetryDelayMs: number;
  private readonly drainBackoffMs: number[];
  private readonly onError?: (err: unknown, pending: number) => void;

  private queue: TranscriptEvent[] = [];
  private inFlight: Promise<boolean> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryDelayMs = 250;
  private closed = false;
  private readonly store?: OutboxStore;

  constructor(opts: TranscriptOutboxOptions) {
    this.target = opts.target;
    this.send = opts.send;
    this.batchSize = opts.batchSize ?? 40;
    this.flushIntervalMs = opts.flushIntervalMs ?? 500;
    this.maxRetryDelayMs = opts.maxRetryDelayMs ?? 4000;
    this.drainBackoffMs = opts.drainBackoffMs ?? [250, 1000, 2000];
    this.onError = opts.onError;
    this.store = opts.store;
  }

  private persist(): void {
    if (!this.store) return;
    try {
      if (this.queue.length) this.store.save(this.target, this.queue);
      else this.store.clear(this.target.sessionId);
    } catch {
      // Storage full or blocked: the in-memory queue still works.
    }
  }

  get pending(): number {
    return this.queue.length;
  }

  push(event: TranscriptEvent): void {
    this.queue.push(event);
    this.persist();
    if (this.closed) {
      // A late event after the drain started: send it on its own.
      if (!this.inFlight) void this.flush({ keepalive: true });
      return;
    }
    if (this.queue.length >= this.batchSize) void this.flush();
    else this.schedule(this.flushIntervalMs);
  }

  /**
   * Sends everything queued. Joins a flush already in flight (which keeps
   * sending until the queue is empty). Resolves true when the queue is empty.
   */
  flush(opts: { keepalive?: boolean } = {}): Promise<boolean> {
    if (this.inFlight) return this.inFlight;
    if (this.queue.length === 0) return Promise.resolve(true);
    this.clearTimer();
    const run = this.pump(!!opts.keepalive).finally(() => {
      this.inFlight = null;
    });
    this.inFlight = run;
    return run;
  }

  /**
   * The session is over: stop scheduling, wait for any flush in flight, then
   * send what is left, retrying a few times. Resolves true when nothing is left.
   */
  async drain(opts: { keepalive?: boolean } = {}): Promise<boolean> {
    this.closed = true;
    this.clearTimer();
    for (let attempt = 0; attempt <= this.drainBackoffMs.length; attempt++) {
      if (this.inFlight) await this.inFlight;
      if (this.queue.length === 0) return true;
      if (await this.flush(opts)) return true;
      if (attempt < this.drainBackoffMs.length) await sleep(this.drainBackoffMs[attempt]);
    }
    return this.queue.length === 0;
  }

  private async pump(keepalive: boolean): Promise<boolean> {
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.slice(0, this.batchSize);
        await this.send(batch, this.target, { keepalive });
        this.queue.splice(0, batch.length);
        this.retryDelayMs = 250;
        this.persist();
      }
      return true;
    } catch (err) {
      this.onError?.(err, this.queue.length);
      if (!this.closed) {
        const delay = this.retryDelayMs;
        this.retryDelayMs = Math.min(this.maxRetryDelayMs, delay * 2);
        this.schedule(delay);
      }
      return false;
    }
  }

  private schedule(delayMs: number): void {
    if (this.timer || this.closed) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delayMs);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/** Keepalive bodies share a 64 KB budget per page; bigger ones go as normal requests. */
const KEEPALIVE_BODY_LIMIT = 60_000;

/** The production sender: POST /api/voice/session/transcript. */
export const postTranscriptBatch: SendTranscriptBatch = async (events, target, { keepalive }) => {
  const body = JSON.stringify({
    sessionId: target.sessionId,
    writeToken: target.writeToken,
    events,
  });
  const res = await fetch('/api/voice/session/transcript', {
    method: 'POST',
    keepalive: keepalive && body.length < KEEPALIVE_BODY_LIMIT,
    headers: {
      'Content-Type': 'application/json',
      'X-Voice-Session-Token': target.writeToken,
    },
    body,
  });
  if (!res.ok) throw new Error(`Transcript flush failed with ${res.status}`);
};

// ---------------------------------------------------------------------------
// Surviving the page (localStorage)
// ---------------------------------------------------------------------------

const STORE_PREFIX = 'jarre.voice.outbox.v1.';
/** The write token lasts 8 h (session-write-token.ts): older leftovers cannot be sent. */
const STORED_MAX_AGE_MS = 7.5 * 60 * 60 * 1000;

interface StoredOutbox {
  target: TranscriptOutboxTarget;
  events: TranscriptEvent[];
  savedAt: number;
}

/** A store over Web Storage (localStorage in the app, a fake in tests). */
export function webStorageOutboxStore(storage: Storage, now: () => number = Date.now): OutboxStore {
  return {
    save(target, events) {
      const value: StoredOutbox = { target, events, savedAt: now() };
      storage.setItem(STORE_PREFIX + target.sessionId, JSON.stringify(value));
    },
    clear(sessionId) {
      storage.removeItem(STORE_PREFIX + sessionId);
    },
  };
}

/**
 * Sends what earlier pages left unsent (a crash, a killed tab), then closes
 * those sessions. `skipSessionId` is a session live in this page. Returns the
 * sessions resent.
 */
export async function resendStoredOutboxes(
  storage: Storage,
  send: SendTranscriptBatch,
  end: (target: TranscriptOutboxTarget) => Promise<void>,
  opts: { now?: number; skipSessionId?: string | null } = {},
): Promise<string[]> {
  const now = opts.now ?? Date.now();
  const found: StoredOutbox[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(STORE_PREFIX)) continue;
    try {
      found.push(JSON.parse(storage.getItem(key) ?? '') as StoredOutbox);
    } catch {
      storage.removeItem(key);
    }
  }
  const resent: string[] = [];
  for (const item of found) {
    const sid = item?.target?.sessionId;
    if (!sid || sid === opts.skipSessionId) continue;
    if (!Array.isArray(item.events) || now - (item.savedAt ?? 0) > STORED_MAX_AGE_MS) {
      storage.removeItem(STORE_PREFIX + sid);
      continue;
    }
    const store = webStorageOutboxStore(storage);
    const outbox = new TranscriptOutbox({ target: item.target, send, store, drainBackoffMs: [500] });
    for (const event of item.events) outbox.push(event);
    if (await outbox.drain()) {
      store.clear(sid);
      await end(item.target).catch(() => {});
      resent.push(sid);
    }
  }
  return resent;
}

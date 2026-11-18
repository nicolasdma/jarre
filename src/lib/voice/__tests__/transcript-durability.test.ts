import { describe, expect, it, vi } from 'vitest';
import {
  TranscriptOutbox,
  resendStoredOutboxes,
  webStorageOutboxStore,
  type TranscriptEvent,
} from '../transcript-outbox';
import { newRowsOnly, isMissingSchema, type TranscriptRow } from '../transcript-store';
import { sanitizeClientDiag } from '../session-diag';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

const ev = (sid: string, seq: number): TranscriptEvent => ({
  turnId: `${sid}-${seq}`, seq, role: seq % 2 ? 'model' : 'user', text: `line ${seq}`, timestamp: new Date(0).toISOString(),
});

describe('transcript rows are stored once', () => {
  const row = (id: string): TranscriptRow => ({ session_id: 's', role: 'user', text: id, timestamp: '', client_turn_id: id, client_seq: null });

  it('skips turn ids already stored and duplicates inside the batch (a retried flush)', () => {
    const out = newRowsOnly([row('s-1'), row('s-2'), row('s-2'), row('s-3')], ['s-1']);
    expect(out.map((r) => r.client_turn_id)).toEqual(['s-2', 's-3']);
  });

  it('recognizes a column or table that is not migrated yet', () => {
    expect(isMissingSchema({ code: '42703', message: 'column "digest_status" does not exist' })).toBe(true);
    expect(isMissingSchema({ code: 'PGRST204', message: "Could not find the 'client_diag' column" })).toBe(true);
    expect(isMissingSchema({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(isMissingSchema(null)).toBe(false);
  });
});

describe('the outbox survives the page', () => {
  it('keeps unsent events in storage and clears them once sent', async () => {
    const storage = new MemoryStorage();
    let fail = true;
    const send = vi.fn(async () => { if (fail) throw new Error('offline'); });
    const outbox = new TranscriptOutbox({
      target: { sessionId: 'a', writeToken: 't' }, send, store: webStorageOutboxStore(storage), flushIntervalMs: 10_000,
    });
    outbox.push(ev('a', 1));
    outbox.push(ev('a', 2));
    expect(JSON.parse(storage.getItem('jarre.voice.outbox.v1.a')!).events).toHaveLength(2);
    await outbox.flush();
    expect(storage.getItem('jarre.voice.outbox.v1.a')).not.toBeNull();
    fail = false;
    await outbox.drain();
    expect(storage.getItem('jarre.voice.outbox.v1.a')).toBeNull();
  });

  it('the next page resends what a killed tab left, ends that session, and skips the live one', async () => {
    const storage = new MemoryStorage();
    const now = 1_000_000;
    const store = webStorageOutboxStore(storage, () => now);
    store.save({ sessionId: 'old', writeToken: 't1' }, [ev('old', 1), ev('old', 2)]);
    store.save({ sessionId: 'live', writeToken: 't2' }, [ev('live', 1)]);
    store.save({ sessionId: 'expired', writeToken: 't3' }, [ev('expired', 1)]);
    // The expired one was saved 8 h before.
    storage.setItem('jarre.voice.outbox.v1.expired', JSON.stringify({ target: { sessionId: 'expired', writeToken: 't3' }, events: [ev('expired', 1)], savedAt: now - 8 * 3600_000 }));

    const sent: string[] = [];
    const ended: string[] = [];
    const resent = await resendStoredOutboxes(
      storage,
      async (events, target) => { sent.push(...events.map((e) => `${target.sessionId}:${e.seq}`)); },
      async (target) => { ended.push(target.sessionId); },
      { now, skipSessionId: 'live' },
    );
    expect(resent).toEqual(['old']);
    expect(sent).toEqual(['old:1', 'old:2']);
    expect(ended).toEqual(['old']);
    expect(storage.getItem('jarre.voice.outbox.v1.old')).toBeNull();
    expect(storage.getItem('jarre.voice.outbox.v1.expired')).toBeNull();
    expect(storage.getItem('jarre.voice.outbox.v1.live')).not.toBeNull();
  });
});

describe('client diagnostics stored with the session', () => {
  it('keeps counters, the timeline and usage, and drops anything that could be conversation text', () => {
    const diag = sanitizeClientDiag({
      endReason: 'disconnect',
      userFragments: 12,
      lastError: 'live: code=1011 reason=<b>x</b>',
      transcript: { text: 'hola' },
      events: [{ k: 'mic_click', t: 0 }, { k: 'first_audio', t: 2310.4567, turn: 0 }, { t: 5 }],
      usage: { promptTokens: 7400, nested: { a: 1 } },
    });
    expect(diag?.counters).toEqual({ endReason: 'disconnect', userFragments: 12, lastError: 'live: code=1011 reason=bx/b' });
    expect(diag?.events).toEqual([{ k: 'mic_click', t: 0 }, { k: 'first_audio', t: 2310.457, turn: 0 }]);
    expect(diag?.usage).toEqual({ promptTokens: 7400 });
  });
});

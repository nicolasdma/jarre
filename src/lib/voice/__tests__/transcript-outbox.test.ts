import { afterEach, describe, expect, it, vi } from 'vitest';
import { TranscriptOutbox, type TranscriptEvent, type TranscriptOutboxTarget } from '../transcript-outbox';

const target: TranscriptOutboxTarget = { sessionId: 'sid-1', writeToken: 'tok-1' };

function ev(seq: number, role: 'user' | 'model' = 'user', text = `line ${seq}`): TranscriptEvent {
  return { turnId: `sid-1-${seq}`, seq, role, text, timestamp: new Date(0).toISOString() };
}

/** A sender whose calls resolve only when the test says so. */
function controlledSender() {
  const calls: { events: TranscriptEvent[]; target: TranscriptOutboxTarget; keepalive: boolean; resolve: () => void; reject: (e: Error) => void }[] = [];
  const stored: TranscriptEvent[] = [];
  const send = vi.fn((events: TranscriptEvent[], t: TranscriptOutboxTarget, opts: { keepalive: boolean }) =>
    new Promise<void>((resolve, reject) => {
      calls.push({
        events: [...events],
        target: t,
        keepalive: opts.keepalive,
        resolve: () => {
          stored.push(...events);
          resolve();
        },
        reject,
      });
    }));
  return { send, calls, stored };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  vi.useRealTimers();
});

describe('TranscriptOutbox', () => {
  it('sends the learner line committed at disconnect even while a flush is in flight (d14a09c0)', async () => {
    const { send, calls, stored } = controlledSender();
    const outbox = new TranscriptOutbox({ target, send, flushIntervalMs: 10_000, drainBackoffMs: [0] });

    outbox.push(ev(1, 'model', 'Si estamos recorriendo el array…'));
    const first = outbox.flush();
    expect(calls).toHaveLength(1);

    // Disconnect: the learner's open utterance is committed, then the final drain runs,
    // while the first flush is still on the wire. The old hook returned at once here and
    // its follow-up read nulled session refs, so this line was never sent.
    outbox.push(ev(2, 'user', 'Para no emparejar un número consigo mismo'));
    const drained = outbox.drain();

    calls[0].resolve();
    await tick();
    expect(calls).toHaveLength(2);
    expect(calls[1].events.map((e) => e.seq)).toEqual([2]);
    calls[1].resolve();
    await expect(first).resolves.toBe(true);
    await expect(drained).resolves.toBe(true);
    expect(stored.map((e) => e.role)).toEqual(['model', 'user']);
    expect(outbox.pending).toBe(0);
  });

  it('retries the final drain after a failed send instead of dropping the events', async () => {
    let fail = 1;
    const stored: TranscriptEvent[] = [];
    const send = vi.fn(async (events: TranscriptEvent[]) => {
      if (fail-- > 0) throw new Error('Transcript flush failed with 503');
      stored.push(...events);
    });
    const onError = vi.fn();
    const outbox = new TranscriptOutbox({ target, send, flushIntervalMs: 10_000, drainBackoffMs: [0, 0], onError });

    outbox.push(ev(1));
    outbox.push(ev(2));
    await expect(outbox.drain()).resolves.toBe(true);
    expect(stored.map((e) => e.seq)).toEqual([1, 2]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('every send carries its own session, so a new session cannot steal or clear the old one', async () => {
    const a = controlledSender();
    const old = new TranscriptOutbox({ target, send: a.send, flushIntervalMs: 10_000, drainBackoffMs: [0] });
    old.push(ev(1));
    const drained = old.drain();

    // A new session starts before the old one finished draining.
    const b = controlledSender();
    const next = new TranscriptOutbox({ target: { sessionId: 'sid-2', writeToken: 'tok-2' }, send: b.send, flushIntervalMs: 10_000 });
    next.push(ev(1));
    void next.flush();

    expect(a.calls[0].target).toEqual(target);
    expect(b.calls[0].target).toEqual({ sessionId: 'sid-2', writeToken: 'tok-2' });
    a.calls[0].resolve();
    await expect(drained).resolves.toBe(true);
    expect(a.stored).toHaveLength(1);
  });

  it('flushes on a timer, by batch size, and keeps order', async () => {
    vi.useFakeTimers();
    const stored: number[][] = [];
    const send = vi.fn(async (events: TranscriptEvent[]) => {
      stored.push(events.map((e) => e.seq));
    });
    const outbox = new TranscriptOutbox({ target, send, batchSize: 2, flushIntervalMs: 500 });

    outbox.push(ev(1));
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    expect(stored).toEqual([[1]]);

    outbox.push(ev(2));
    outbox.push(ev(3)); // batch full: sends now
    await vi.advanceTimersByTimeAsync(0);
    expect(stored).toEqual([[1], [2, 3]]);
  });

  it('retries a failed scheduled flush with backoff while the session is open', async () => {
    vi.useFakeTimers();
    let fail = 2;
    const stored: number[] = [];
    const send = vi.fn(async (events: TranscriptEvent[]) => {
      if (fail-- > 0) throw new Error('Transcript flush failed with 500');
      stored.push(...events.map((e) => e.seq));
    });
    const outbox = new TranscriptOutbox({ target, send, flushIntervalMs: 100 });
    outbox.push(ev(1));
    await vi.advanceTimersByTimeAsync(100); // fails, retry in 250
    await vi.advanceTimersByTimeAsync(250); // fails, retry in 500
    expect(stored).toEqual([]);
    await vi.advanceTimersByTimeAsync(500);
    expect(stored).toEqual([1]);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it('passes keepalive through for the page-hide flush', async () => {
    const { send, calls } = controlledSender();
    const outbox = new TranscriptOutbox({ target, send, flushIntervalMs: 10_000 });
    outbox.push(ev(1));
    void outbox.flush({ keepalive: true });
    // The request starts synchronously, inside the pagehide handler.
    expect(calls).toHaveLength(1);
    expect(calls[0].keepalive).toBe(true);
  });
});

describe('formatClientDiag', () => {
  it('logs the client counters and strips anything odd', async () => {
    const { formatClientDiag } = await import('../session-diag');
    expect(formatClientDiag(undefined)).toBe('');
    const line = formatClientDiag({
      endReason: 'unmount',
      userFragments: 0,
      modelFragments: 14,
      audioChunksSent: 1093,
      stored: 1,
      lastError: 'live: Disconnected: code=1011 reason=<x>\n',
    });
    expect(line).toBe(
      ' client{end=unmount userFragments=0 modelFragments=14 audioChunks=1093 queued=1 lastError="live: Disconnected: code=1011 reason=x"}',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { canReplaceDeafSession, micStatusLine, watchMicCapture, type MicWatchEvent } from '../mic-watch';

class FakeTarget {
  private listeners = new Map<string, Set<() => void>>();
  addEventListener(type: string, listener: () => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }
  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  emit(type: string): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener();
  }
  get listening(): number {
    return [...this.listeners.values()].reduce((n, set) => n + set.size, 0);
  }
}
class FakeTrack extends FakeTarget {
  readyState = 'live';
  muted = false;
}
class FakeContext extends FakeTarget {
  state = 'running';
  resumed = 0;
  resume(): Promise<void> {
    this.resumed += 1;
    this.state = 'running';
    return Promise.resolve();
  }
}

function watch(track = new FakeTrack(), context = new FakeContext()) {
  const events: { kind: MicWatchEvent; data: Record<string, string | boolean> }[] = [];
  let lost = 0;
  const stop = watchMicCapture(track, context, { onEvent: (kind, data) => events.push({ kind, data }), onLost: () => (lost += 1) });
  return { track, context, events, lost: () => lost, stop };
}

describe('watchMicCapture', () => {
  it('a healthy capture reports nothing', () => {
    const w = watch();
    expect(w.events).toEqual([]);
    expect(w.lost()).toBe(0);
  });

  it('hands back a track the browser ended, once', () => {
    const w = watch();
    w.track.readyState = 'ended';
    w.track.emit('ended');
    w.track.emit('ended');
    expect(w.events.map((e) => e.kind)).toEqual(['mic_ended']);
    expect(w.lost()).toBe(1);
  });

  it('hands back a track that had already ended when the watch began', () => {
    const track = new FakeTrack();
    track.readyState = 'ended';
    const w = watch(track);
    expect(w.lost()).toBe(1);
  });

  it('writes down a mute and its end without giving the capture up', () => {
    const w = watch();
    w.track.emit('mute');
    w.track.emit('unmute');
    expect(w.events.map((e) => e.kind)).toEqual(['mic_muted', 'mic_unmuted']);
    expect(w.lost()).toBe(0);
  });

  it('resumes a capture context the browser suspended, and says so', () => {
    const w = watch();
    w.context.state = 'suspended';
    w.context.emit('statechange');
    expect(w.events).toEqual([{ kind: 'mic_context', data: { state: 'suspended' } }]);
    expect(w.context.resumed).toBe(1);
  });

  it('resumes a context that starts suspended (a microphone opened again with no click)', () => {
    const context = new FakeContext();
    context.state = 'suspended';
    const w = watch(new FakeTrack(), context);
    expect(w.context.resumed).toBe(1);
  });

  it('does not try to resume a closed context', () => {
    const w = watch();
    w.context.state = 'closed';
    w.context.emit('statechange');
    expect(w.context.resumed).toBe(0);
  });

  it('after stop, the session closing its own track is not a lost microphone', () => {
    const w = watch();
    w.stop();
    expect(w.track.listening + w.context.listening).toBe(0);
    w.track.emit('ended');
    expect(w.lost()).toBe(0);
    expect(w.events).toEqual([]);
  });
});

describe('canReplaceDeafSession', () => {
  const ok = { busy: false, count: 0, max: 3, connected: true, current: true, ending: false };

  it('replaces a connected session that does not hear', () => {
    expect(canReplaceDeafSession(ok)).toBe(true);
  });

  it('never while a socket is already being replaced: two reconnections would race', () => {
    expect(canReplaceDeafSession({ ...ok, connected: false })).toBe(false);
    expect(canReplaceDeafSession({ ...ok, busy: true })).toBe(false);
  });

  it('stops after its allowance, for a client that is no longer the session, and at the end', () => {
    expect(canReplaceDeafSession({ ...ok, count: 3 })).toBe(false);
    expect(canReplaceDeafSession({ ...ok, current: false })).toBe(false);
    expect(canReplaceDeafSession({ ...ok, ending: true })).toBe(false);
  });
});

describe('micStatusLine', () => {
  const base = { track: 'live', context: 'running', socket: 'connected', socketDrops: 0, lastCloseCode: null, deafRestarts: 0, micRestarts: 0, heardAgoMs: 12_400 } as const;

  it('a healthy session reads in one short line', () => {
    expect(micStatusLine(base)).toBe('mic abierto · conectado · te transcribió hace 12 s');
  });

  it('names each thing that went wrong, with the close code', () => {
    const line = micStatusLine({ ...base, track: 'ended', context: 'suspended', socket: 'reconnecting', socketDrops: 2, lastCloseCode: 1011, deafRestarts: 1, micRestarts: 1, heardAgoMs: null });
    expect(line).toBe('mic cortado · captura suspended · reconectando · sin transcripción todavía · cortes de conexión: 2 (1011) · sesión reemplazada por no oír: 1 · mic reabierto: 1');
  });
});

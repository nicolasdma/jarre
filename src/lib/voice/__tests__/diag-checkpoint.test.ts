import { describe, expect, it } from 'vitest';
import { clearDiagCheckpoint, pruneDiagCheckpoints, saveDiagCheckpoint, takeDiagCheckpoint } from '../diag-checkpoint';
import { SessionTimeline } from '../session-timeline';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('diag checkpoint', () => {
  it('what a page wrote before it died is what the next page sends, once', () => {
    const storage = fakeStorage();
    const timeline = new SessionTimeline(0);
    timeline.mark('socket_close', { code: 1011 }, 60_000);
    saveDiagCheckpoint(storage, 's1', timeline.toDiag('pagehide'));
    const kept = takeDiagCheckpoint(storage, 's1');
    expect(kept?.endReason).toBe('pagehide');
    expect(kept?.events).toEqual([{ k: 'socket_close', t: 60_000, code: 1011 }]);
    expect(takeDiagCheckpoint(storage, 's1')).toBeNull();
  });

  it('a session that sent its own diagnostics leaves nothing behind', () => {
    const storage = fakeStorage();
    saveDiagCheckpoint(storage, 's1', { endReason: 'lost' });
    clearDiagCheckpoint(storage, 's1');
    expect(storage.map.size).toBe(0);
  });

  it('drops only checkpoints too old to be sent, and never other keys', () => {
    const storage = fakeStorage();
    const now = 100 * 60 * 60 * 1000;
    saveDiagCheckpoint(storage, 'old', { endReason: 'lost' }, now - 9 * 60 * 60 * 1000);
    saveDiagCheckpoint(storage, 'fresh', { endReason: 'lost' }, now - 60_000);
    storage.setItem('jarre.voice.outbox.v1.old', '{}');
    pruneDiagCheckpoints(storage, now);
    expect([...storage.map.keys()].sort()).toEqual(['jarre.voice.diag.v1.fresh', 'jarre.voice.outbox.v1.old']);
  });

  it('a broken checkpoint is nothing, not an error', () => {
    const storage = fakeStorage();
    storage.setItem('jarre.voice.diag.v1.s1', '{not json');
    expect(takeDiagCheckpoint(storage, 's1')).toBeNull();
  });
});

describe('SessionTimeline when it is full', () => {
  it('a long session keeps the socket that closed at the end: routine turns make room', () => {
    const timeline = new SessionTimeline(0);
    timeline.mark('mic_click', {}, 0);
    for (let i = 0; i < 500; i++) timeline.mark('turn_complete', {}, 1000 + i);
    timeline.mark('socket_close', { code: 1011 }, 900_000);
    timeline.mark('reconnected', { how: 'layer2_reconnect' }, 903_000);
    const diag = timeline.toDiag('disconnect') as { events: { k: string }[]; eventsDropped?: number };
    const kinds = diag.events.map((e) => e.k);
    expect(kinds[0]).toBe('mic_click');
    expect(kinds.slice(-2)).toEqual(['socket_close', 'reconnected']);
    expect(diag.events.length).toBeLessThanOrEqual(300);
    expect(diag.eventsDropped).toBeGreaterThan(0);
  });
});

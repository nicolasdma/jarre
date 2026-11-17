import { describe, expect, it } from 'vitest';
import {
  APPROVAL_PERCENT,
  drillModes,
  drillProgress,
  isModeApproved,
  LISTEN_BINS,
  listenedThrough,
  newListenTrack,
  trackListen,
  type ListenTrack,
} from '../drill-progress';
import type { DrillBest } from '@/components/practice/best-scores';

const at = '2026-11-17T00:00:00.000Z';
const recall = (last: 'got' | 'partial' | 'missed', got: number) =>
  ({ last, at, due: at, tries: Math.max(1, got), got, card: {} }) as unknown as NonNullable<DrillBest['recall']>;
const ALL = drillModes(true);

describe('approval per mode', () => {
  it('uses the agreed bars', () => {
    expect(APPROVAL_PERCENT).toEqual({ copy: 90, repeat: 80, sentences: 80 });
  });

  it('copy at 90, repeat at 80, sentences at 80: one below adds nothing', () => {
    expect(isModeApproved({ copy: { score: 90, at } }, 'copy')).toBe(true);
    expect(isModeApproved({ copy: { score: 89, at } }, 'copy')).toBe(false);
    expect(isModeApproved({ repeat: { score: 80, at } }, 'repeat')).toBe(true);
    expect(isModeApproved({ repeat: { score: 79, at } }, 'repeat')).toBe(false);
    expect(isModeApproved({ sentences: { score: 80, at } }, 'sentences')).toBe(true);
    expect(isModeApproved({ sentences: { score: 75, at } }, 'sentences')).toBe(false);
  });

  it('Frase por frase without recognition never approves', () => {
    expect(isModeApproved({ shadowed: 4 }, 'sentences')).toBe(false);
  });

  it('Pregunta → respuesta approves with one "La tenía", even if a later try was worse', () => {
    expect(isModeApproved({ recall: recall('missed', 1) }, 'recall')).toBe(true);
    expect(isModeApproved({ recall: recall('partial', 0) }, 'recall')).toBe(false);
  });

  it('Escuchar approves only once heard to the end', () => {
    expect(isModeApproved({ listened: at }, 'listen')).toBe(true);
    expect(isModeApproved({ copy: { score: 100, at } }, 'listen')).toBe(false);
  });
});

describe('drillProgress', () => {
  it('a drill never tried is pending', () => {
    expect(drillProgress(undefined, ALL)).toEqual({ approved: [], done: 0, total: 5, complete: false, started: false });
  });

  it('the old 5/5 case: copy 100 and repeat 98 is 2/5, not complete', () => {
    const p = drillProgress({ copy: { score: 100, at }, repeat: { score: 98, at } }, ALL);
    expect(p).toMatchObject({ approved: ['copy', 'repeat'], done: 2, total: 5, complete: false, started: true });
  });

  it('a try below the bar is started but adds nothing', () => {
    expect(drillProgress({ repeat: { score: 60, at } }, ALL)).toMatchObject({ done: 0, started: true });
  });

  it('counts approved modes in tab order, and complete with all of them', () => {
    const all: DrillBest = {
      listened: at,
      copy: { score: 95, at },
      repeat: { score: 82, at },
      sentences: { score: 86, at },
      recall: recall('got', 1),
    };
    expect(drillProgress(all, ALL)).toMatchObject({ approved: ['listen', 'copy', 'repeat', 'sentences', 'recall'], done: 5, complete: true });
    expect(drillProgress({ ...all, sentences: { score: 50, at } }, ALL)).toMatchObject({ done: 4, total: 5, complete: false });
  });

  it('a drill without audio has three modes: 3/3 is complete', () => {
    const modes = drillModes(false);
    expect(modes).toEqual(['copy', 'repeat', 'recall']);
    const p = drillProgress({ listened: at, copy: { score: 90, at }, repeat: { score: 80, at }, recall: recall('got', 2) }, modes);
    expect(p).toMatchObject({ done: 3, total: 3, complete: true });
  });
});

describe('Escuchar heard to the end', () => {
  const play = (track: ListenTrack, from: number, to: number, duration: number, step = 1 / 60) => {
    let t = track;
    for (let x = from; x < to; x += step) t = trackListen(t, x, duration);
    return trackListen(t, to, duration);
  };

  it('played start to end at frame rate', () => {
    expect(listenedThrough(play(newListenTrack(), 0, 30, 30))).toBe(true);
  });

  it('stopped before the end is not through', () => {
    expect(listenedThrough(play(newListenTrack(), 0, 28, 30))).toBe(false);
  });

  it('a jump over more than a small piece does not count', () => {
    let t = play(newListenTrack(), 0, 10, 30);
    t = trackListen(t, 20, 30); // seek forward 10 s: nothing in between
    t = play(t, 20, 30, 30);
    expect(listenedThrough(t)).toBe(false);
  });

  it('started late (the last bit only) is not through, a restart afterwards can complete it', () => {
    let t = play(newListenTrack(), 25, 30, 30);
    expect(listenedThrough(t)).toBe(false);
    t = trackListen(t, 0, 30); // Desde el principio: a jump back plays nothing
    t = play(t, 0, 30, 30);
    expect(listenedThrough(t)).toBe(true);
  });

  it('paused and resumed is still one listen', () => {
    let t = play(newListenTrack(), 0, 12, 30);
    t = trackListen(t, 12, 30);
    t = play(t, 12, 30, 30);
    expect(listenedThrough(t)).toBe(true);
  });

  it('the browser voice moves word by word (under a second) and still counts', () => {
    expect(listenedThrough(play(newListenTrack(), 0, 20, 20, 0.6))).toBe(true);
  });

  it('allows a small piece missed: under 10 % of the bins', () => {
    const duration = LISTEN_BINS; // one second per bin
    let t = play(newListenTrack(), 0, 20, duration, 0.5);
    t = trackListen(t, 24, duration); // skip 4 bins
    t = play(t, 24, duration, duration, 0.5);
    expect(t.bins.filter(Boolean).length).toBeGreaterThanOrEqual(45);
    expect(listenedThrough(t)).toBe(true);
  });

  it('no duration yet changes nothing', () => {
    const t = newListenTrack();
    expect(trackListen(t, 3, 0)).toBe(t);
  });
});

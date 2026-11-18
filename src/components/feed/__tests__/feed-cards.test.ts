import { describe, expect, it } from 'vitest';
import { AVATAR_PALETTE, FEED_PALETTES, contrastRatio } from '../feed-palette';
import { PALETTE_COUNT, type FeedPost } from '@/lib/feed/feed-post';
import { lessonHrefFor, participationHint } from '@/lib/feed/feed-links';
import { tokenizeLine } from '../code-tokens';
import { waveformBars } from '../waveform';
import { savedId } from '../feed-saved';

describe('feed palettes: varied and readable', () => {
  it('has one distinct palette per generator slot', () => {
    expect(FEED_PALETTES).toHaveLength(PALETTE_COUNT);
    expect(new Set(FEED_PALETTES.map((p) => p.bg)).size).toBe(PALETTE_COUNT);
  });

  it('mixes light and dark media so the stream is not one tone', () => {
    const dark = FEED_PALETTES.filter((p) => p.dark).length;
    expect(dark).toBeGreaterThanOrEqual(2);
    expect(PALETTE_COUNT - dark).toBeGreaterThanOrEqual(2);
  });

  it('keeps ink ≥ 7:1, soft ≥ 4.5:1 and the accent label ≥ 4.5:1 on every media', () => {
    for (const p of FEED_PALETTES) {
      expect(contrastRatio(p.ink, p.bg), p.name).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(p.soft, p.bg), p.name).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.onAccent, p.accent), p.name).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gives avatars readable icons', () => {
    for (const a of AVATAR_PALETTE) expect(contrastRatio(a.ink, a.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('code image tokenizer', () => {
  it('colors keywords, calls and comments, and loses no text', () => {
    const line = "const seen = new Map(); // value -> index 'x' 42";
    const toks = tokenizeLine(line);
    expect(toks.map((t) => t.t).join('')).toBe(line);
    expect(toks.find((t) => t.t === 'const')?.k).toBe('kw');
    expect(toks.find((t) => t.t === 'Map')?.k).toBe('fn');
    expect(toks.find((t) => t.t.startsWith('//'))?.k).toBe('com');
  });

  it('colors strings and numbers outside comments', () => {
    const toks = tokenizeLine("if (s === 'a') return 10;");
    expect(toks.find((t) => t.t === "'a'")?.k).toBe('str');
    expect(toks.find((t) => t.t === '10')?.k).toBe('num');
  });
});

describe('voice-note waveform', () => {
  it('is deterministic and bounded', () => {
    const a = waveformBars('two-sum', 30);
    expect(a).toEqual(waveformBars('two-sum', 30));
    expect(a).toHaveLength(30);
    expect(Math.min(...a)).toBeGreaterThanOrEqual(0.2);
    expect(Math.max(...a)).toBeLessThanOrEqual(1);
    expect(waveformBars('other', 30)).not.toEqual(a);
  });
});

const post = (over: Partial<FeedPost>): FeedPost => ({
  key: 'k',
  kind: 'nugget',
  conceptId: 'c',
  profile: { participation: 'passive', energy: 'calm', visual: 'plain', density: 'light', novelty: 'new' },
  paletteIndex: 0,
  pass: 0,
  ...over,
});

describe('card chrome: real actions only', () => {
  it('saves what a post shows, not when it showed up', () => {
    expect(savedId(post({ key: '3-tap-quiz-c-0', kind: 'tap-quiz', quizId: 'q1' }))).toBe(
      savedId(post({ key: '40-tap-quiz-c-2', kind: 'tap-quiz', quizId: 'q1', pass: 2 })),
    );
    expect(savedId(post({ kind: 'tap-quiz', quizId: 'q1' }))).not.toBe(savedId(post({ kind: 'tap-quiz', quizId: 'q2' })));
  });

  it('opens the lesson where the post lives', () => {
    expect(lessonHrefFor('r1', post({ drillSlug: 'd 1' }))).toBe('/learn/r1?step=practice&drill=d%201&mode=listen');
    expect(lessonHrefFor('r1', post({ kind: 'code', codeId: 'two-sum' }))).toBe('/learn/r1?step=coding');
    expect(lessonHrefFor('r1', post({ kind: 'tap-quiz', quizId: 'q' }))).toBe('/learn/r1?step=learn');
  });

  it('labels participation honestly and leaves passive posts unlabeled', () => {
    expect(participationHint(post({}))).toBeUndefined();
    expect(participationHint(post({ profile: { participation: 'optional-tap', energy: 'calm', visual: 'plain', density: 'loose', novelty: 'resurface' } }))).toBe('tocá si querés');
  });
});

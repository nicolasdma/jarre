import { describe, expect, it } from 'vitest';
import type { FeedConceptAssets, FeedGraph } from '../feed-graph';
import { createFeedGenerator, generateFeed, type LearnerState } from '../feed-generator';
import { PALETTE_COUNT, isActiveBeat, type FeedPost, type Participation } from '../feed-post';

// A synthetic lesson graph with varied asset coverage per concept, so the
// generator has to fall back where a concept lacks an asset kind.
function concept(id: string, i: number, extra: Partial<FeedConceptAssets> = {}): FeedConceptAssets {
  return {
    id,
    name: `Concept ${id}`,
    definition: `Definition of ${id}`,
    sortOrder: i,
    sectionMarkdown: `# ${id}`,
    drillSlugs: [],
    sayItSlugs: [],
    quizIds: [],
    cardIds: [],
    complexityIds: [],
    codeIds: [],
    ...extra,
  };
}

function makeGraph(): FeedGraph {
  const concepts: FeedConceptAssets[] = [
    concept('c0', 0, { drillSlugs: ['c0-d1'], sayItSlugs: ['c0-d1'], quizIds: ['c0-q1', 'c0-q2'], cardIds: ['c0-k1', 'c0-k2'] }),
    concept('c1', 1, { drillSlugs: ['c1-d1'], quizIds: ['c1-q1'], cardIds: ['c1-k1'] }),
    concept('c2', 2, { complexityIds: ['c2-x1', 'c2-x2'], cardIds: ['c2-k1'] }),
    concept('c3', 3, { codeIds: ['c3-code1'], cardIds: ['c3-k1'] }),
    concept('c4', 4, { drillSlugs: ['c4-d1'], sayItSlugs: ['c4-d1'], cardIds: ['c4-k1', 'c4-k2', 'c4-k3'] }),
    concept('c5', 5, {}), // definition only: passive re-view / tap-flip only
    concept('c6', 6, { quizIds: ['c6-q1'], cardIds: ['c6-k1'] }),
  ];
  const graph: FeedGraph = {
    resourceId: 'lesson-x',
    concepts,
    drills: {}, quizzes: {}, cards: {}, complexity: {}, code: {}, asks: {},
  };
  for (const c of concepts) {
    for (const s of c.drillSlugs) graph.drills[s] = { slug: s, title: s, textEn: 'en', textEs: 'es', audioUrl: null, segments: null, conceptId: c.id };
    for (const s of c.sayItSlugs) graph.asks[s] = `Ask ${s}?`;
    for (const q of c.quizIds) graph.quizzes[q] = { id: q, conceptId: c.id, format: 'mc', question: 'Q?', options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }], correctAnswer: 'A', explanation: 'because' };
    for (const k of c.cardIds) graph.cards[k] = { id: k, conceptId: c.id, prompt: 'P', answer: 'A' };
    for (const x of c.complexityIds) graph.complexity[x] = { id: x, conceptId: c.id, title: x, code: 'code', timeAnswer: 'O(n)', timeOptions: ['O(1)', 'O(n)'], timeWhy: 'why', spaceAnswer: 'O(1)', spaceWhy: 'why', say: 'say' };
    for (const z of c.codeIds) graph.code[z] = { id: z, conceptId: c.id, title: z, pattern: 'pattern', statement: 'stmt', code: 'function f(){}', time: 'O(n)', space: 'O(1)', brute: 'O(n²)' };
  }
  return graph;
}

const SEED = { resourceId: 'lesson-x', day: '2026-11-18' };
const g = makeGraph();
const learner: LearnerState = {};

describe('feed generator: deterministic', () => {
  it('produces the same stream for the same seed', () => {
    const a = generateFeed(g, learner, SEED, 80);
    const b = generateFeed(g, learner, SEED, 80);
    expect(a).toEqual(b);
  });

  it('is a stable prefix: the first N equal the first N of a longer run', () => {
    const short = generateFeed(g, learner, SEED, 40);
    const long = generateFeed(g, learner, SEED, 120);
    expect(long.slice(0, 40)).toEqual(short);
  });

  it('changes with the seed (a new day is a fresh feed)', () => {
    const today = generateFeed(g, learner, SEED, 40);
    const tomorrow = generateFeed(g, learner, { ...SEED, day: '2026-11-19' }, 40);
    expect(tomorrow).not.toEqual(today);
  });
});

describe('feed generator: infinite', () => {
  it('never ends: 1000 posts, every one valid and uniquely keyed', () => {
    const gen = createFeedGenerator(g, learner, SEED);
    const posts = gen.take(1000);
    expect(posts).toHaveLength(1000);
    expect(new Set(posts.map((p) => p.key)).size).toBe(1000);
    for (const p of posts) {
      expect(p.kind).toBeTruthy();
      expect(['passive', 'optional-tap', 'active-optional']).toContain(p.profile.participation);
      expect(['calm', 'lively', 'stimulating']).toContain(p.profile.energy);
      expect(['polished', 'plain', 'raw']).toContain(p.profile.visual);
      expect(['dense', 'loose', 'light']).toContain(p.profile.density);
      expect(['new', 'resurface']).toContain(p.profile.novelty);
      expect(p.paletteIndex).toBeGreaterThanOrEqual(0);
      expect(p.paletteIndex).toBeLessThan(PALETTE_COUNT);
    }
  });

  it('keeps flowing long after the new material is exhausted (all re-surface)', () => {
    const posts = generateFeed(g, learner, SEED, 500);
    const tail = posts.slice(200);
    expect(tail.length).toBe(300);
    // No 'new' introductions remain in the far tail.
    expect(tail.every((p) => p.profile.novelty === 'resurface')).toBe(true);
  });
});

describe('feed generator: coverage of new material', () => {
  it('introduces every concept as a new nugget early', () => {
    const posts = generateFeed(g, learner, SEED, g.concepts.length * 3 + 10);
    const introduced = new Set(
      posts.filter((p) => p.kind === 'nugget' && p.profile.novelty === 'new').map((p) => p.conceptId),
    );
    for (const c of g.concepts) expect(introduced.has(c.id)).toBe(true);
  });

  it('never introduces the same concept as new twice', () => {
    const posts = generateFeed(g, learner, SEED, 500);
    const news = posts.filter((p) => p.profile.novelty === 'new').map((p) => p.conceptId);
    expect(new Set(news).size).toBe(news.length);
  });
});

describe('feed generator: the matrix is weighted to passive, active is a minority', () => {
  const posts = generateFeed(g, learner, SEED, 300);
  const share = (p: Participation) => posts.filter((x) => x.profile.participation === p).length / posts.length;

  it('passive is the plurality', () => {
    expect(share('passive')).toBeGreaterThan(share('optional-tap'));
    expect(share('passive')).toBeGreaterThan(share('active-optional'));
    expect(share('passive')).toBeGreaterThanOrEqual(0.4);
  });

  it('active beats are a sprinkled minority, not a floor', () => {
    expect(share('active-optional')).toBeLessThanOrEqual(0.3);
    // Active beats are never two closer than the spacing (never clustered).
    const activeIdx = posts.map((p, i) => (isActiveBeat(p) ? i : -1)).filter((i) => i >= 0);
    for (let i = 1; i < activeIdx.length; i++) {
      expect(activeIdx[i] - activeIdx[i - 1]).toBeGreaterThanOrEqual(3);
    }
    // There are long passive-leaning runs with no active beat (you can just scroll).
    let maxRun = 0;
    let run = 0;
    for (const p of posts) {
      if (isActiveBeat(p)) run = 0;
      else maxRun = Math.max(maxRun, ++run);
    }
    expect(maxRun).toBeGreaterThanOrEqual(4);
  });

  it('varies the energy and visual vibe (not one note)', () => {
    expect(new Set(posts.map((p) => p.profile.energy)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(posts.map((p) => p.profile.visual)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(posts.map((p) => p.kind)).size).toBeGreaterThanOrEqual(4);
  });
});

describe('feed generator: two consecutive posts never look alike', () => {
  const posts = generateFeed(g, learner, SEED, 500);

  it('never repeats the palette back to back', () => {
    for (let i = 1; i < posts.length; i++) expect(posts[i].paletteIndex).not.toBe(posts[i - 1].paletteIndex);
  });

  it('never repeats the same kind in the same visual vibe back to back', () => {
    for (let i = 1; i < posts.length; i++) {
      const a = posts[i - 1];
      const b = posts[i];
      expect(`${b.kind}:${b.profile.visual}`).not.toBe(`${a.kind}:${a.profile.visual}`);
    }
  });

  it('never shows the same quiz, card, Big-O, code or say-it again within 10 posts', () => {
    const last = new Map<string, number>();
    posts.forEach((p, i) => {
      const asset = p.quizId ?? p.cardId ?? p.complexityId ?? p.codeId ?? (p.kind === 'say-it' ? p.drillSlug : undefined);
      if (!asset) return;
      if (last.has(asset)) expect(i - last.get(asset)!).toBeGreaterThan(10);
      last.set(asset, i);
    });
  });

  it('uses every palette', () => {
    expect(new Set(posts.map((p) => p.paletteIndex)).size).toBe(PALETTE_COUNT);
  });
});

describe('feed generator: spaced re-surfacing with variation', () => {
  const posts = generateFeed(g, learner, SEED, 400);

  it('brings concepts back as re-surfaces (pass grows)', () => {
    const resurfaced = posts.filter((p) => p.profile.novelty === 'resurface' && p.conceptId);
    expect(resurfaced.length).toBeGreaterThan(50);
    expect(resurfaced.some((p) => p.pass >= 1)).toBe(true);
    expect(resurfaced.some((p) => p.pass >= 3)).toBe(true);
  });

  it('never re-surfaces a concept that was not introduced first', () => {
    const introducedAt = new Map<string, number>();
    posts.forEach((p, i) => {
      if (p.profile.novelty === 'new' && p.conceptId && !introducedAt.has(p.conceptId)) introducedAt.set(p.conceptId, i);
    });
    posts.forEach((p, i) => {
      if (p.profile.novelty === 'resurface' && p.conceptId) {
        expect(introducedAt.has(p.conceptId)).toBe(true);
        expect(introducedAt.get(p.conceptId)!).toBeLessThan(i);
      }
    });
  });

  it('spaces the returns of a concept (not back-to-back) and grows the first gaps', () => {
    const appearances = new Map<string, number[]>();
    posts.forEach((p, i) => {
      if (!p.conceptId) return;
      const arr = appearances.get(p.conceptId) ?? [];
      arr.push(i);
      appearances.set(p.conceptId, arr);
    });
    // Take a concept seen many times.
    const [, idxs] = [...appearances.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    for (let i = 1; i < idxs.length; i++) expect(idxs[i] - idxs[i - 1]).toBeGreaterThanOrEqual(2);
    // The early gaps grow (spaced, not fixed): the 2nd gap is wider than an immediate return.
    const gaps = idxs.slice(1).map((v, i) => v - idxs[i]);
    expect(Math.max(...gaps)).toBeGreaterThan(Math.min(...gaps));
  });

  it('varies palette/kind when a concept returns (encoding variety)', () => {
    const byConcept = new Map<string, FeedPost[]>();
    for (const p of posts) {
      if (!p.conceptId) continue;
      const arr = byConcept.get(p.conceptId) ?? [];
      arr.push(p);
      byConcept.set(p.conceptId, arr);
    }
    // At least one concept shows more than one palette and more than one kind across returns.
    let variedPalette = false;
    let variedKind = false;
    for (const arr of byConcept.values()) {
      if (new Set(arr.map((p) => p.paletteIndex)).size > 1) variedPalette = true;
      if (new Set(arr.map((p) => p.kind)).size > 1) variedKind = true;
    }
    expect(variedPalette).toBe(true);
    expect(variedKind).toBe(true);
  });
});

describe('feed generator: every id points at real lesson data (projection only)', () => {
  it('resolves every referenced asset in the graph', () => {
    const posts = generateFeed(g, learner, SEED, 500);
    for (const p of posts) {
      if (p.quizId) expect(g.quizzes[p.quizId]).toBeTruthy();
      if (p.cardId) expect(g.cards[p.cardId]).toBeTruthy();
      if (p.complexityId) expect(g.complexity[p.complexityId]).toBeTruthy();
      if (p.codeId) expect(g.code[p.codeId]).toBeTruthy();
      if (p.drillSlug) expect(g.drills[p.drillSlug]).toBeTruthy();
    }
  });
});

describe('feed generator: weak concepts surface sooner', () => {
  it('a weak concept re-surfaces more than a strong one', () => {
    const weighted: LearnerState = {
      conceptStrength: { c0: 0.05, c1: 0.95, c2: 0.95, c3: 0.95, c4: 0.95, c6: 0.95 },
    };
    const posts = generateFeed(g, weighted, SEED, 300);
    const count = (id: string) => posts.filter((p) => p.conceptId === id && p.profile.novelty === 'resurface').length;
    expect(count('c0')).toBeGreaterThan(count('c1'));
  });
});

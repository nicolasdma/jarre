import { describe, expect, it } from 'vitest';
import type { FeedConceptAssets, FeedGraph } from '../feed-graph';
import { bigOParts, feedAccounts, firstSentence, hashtags, leadLine, nameParts, phrasesOf, sharedIdPrefix } from '../feed-identity';

function concept(id: string, name: string, extra: Partial<FeedConceptAssets> = {}): FeedConceptAssets {
  return {
    id,
    name,
    definition: `${name}: does a thing. And more.`,
    sortOrder: 0,
    sectionMarkdown: null,
    drillSlugs: [],
    sayItSlugs: [],
    quizIds: [],
    cardIds: [],
    complexityIds: [],
    codeIds: [],
    ...extra,
  };
}

function graph(): FeedGraph {
  return {
    resourceId: 'lesson',
    concepts: [
      concept('3yt-v2-two-sum', 'Two Sum: hash map de complementos', { codeIds: ['two-sum'] }),
      concept('3yt-v2-big-o', 'Big-O desde cero: cuánto cuesta tu código'),
      concept('3yt-v2-metodo', 'La ronda de 30 minutos estilo LeetCode, a nivel senior'),
      concept('3yt-v2-longest-substring', 'Longest Substring: ventana deslizante', { codeIds: ['longest'] }),
    ],
    drills: {},
    quizzes: {},
    cards: {},
    complexity: {},
    code: {
      'two-sum': { id: 'two-sum', conceptId: '3yt-v2-two-sum', title: 'Two Sum', pattern: 'Hash map', statement: 's', code: 'c', time: 'O(n)', space: 'O(n)', brute: 'O(n²)' },
      longest: { id: 'longest', conceptId: '3yt-v2-longest-substring', title: 'L', pattern: 'Sliding window', statement: 's', code: 'c', time: null, space: null, brute: null },
    },
    asks: {},
  };
}

describe('feed identity: one honest account per topic', () => {
  it('strips the shared id prefix at a separator, never mid-word', () => {
    expect(sharedIdPrefix(['3yt-v2-two-sum', '3yt-v2-big-o'])).toBe('3yt-v2-');
    expect(sharedIdPrefix(['two-sum', 'two-pointers'])).toBe('two-');
    expect(sharedIdPrefix(['alpha', 'beta'])).toBe('');
    expect(sharedIdPrefix(['solo'])).toBe('');
  });

  it('gives each concept a short handle, a family and an icon', () => {
    const a = feedAccounts(graph());
    expect(a['3yt-v2-two-sum']).toMatchObject({ handle: 'two-sum', family: 'hash map', icon: 'hash', title: 'Two Sum', subtitle: 'hash map de complementos' });
    expect(a['3yt-v2-big-o']).toMatchObject({ handle: 'big-o', family: 'complejidad', icon: 'curve' });
    expect(a['3yt-v2-metodo']).toMatchObject({ handle: 'metodo', family: 'método', icon: 'clock', subtitle: null });
    // What the feed shows: a name in words, never the slug.
    expect(a['3yt-v2-two-sum'].name).toBe('Two Sum');
    expect(a['3yt-v2-metodo'].name).toBe('Método');
    expect(a['3yt-v2-longest-substring']).toMatchObject({ family: 'sliding window', icon: 'window' });
  });

  it('keeps avatars stable and distinct across neighbouring accounts', () => {
    const a = feedAccounts(graph());
    const slots = Object.values(a).map((x) => x.avatarIndex);
    expect(new Set(slots).size).toBe(slots.length);
    expect(feedAccounts(graph())).toEqual(a);
  });
});

describe('feed identity: big type comes from existing text', () => {
  it('splits a name at its colon', () => {
    expect(nameParts('Two Sum: hash map')).toEqual({ title: 'Two Sum', subtitle: 'hash map' });
    expect(nameParts('No colon here')).toEqual({ title: 'No colon here', subtitle: null });
  });

  it('takes the lead line of a definition without its label', () => {
    expect(leadLine('Two Sum: one pass with a map. Then more.', 'Two Sum')).toBe('One pass with a map.');
    expect(leadLine('Big-O says how cost grows. More.', 'Big-O desde cero')).toBe('Big-O says how cost grows.');
  });

  it('cuts the first sentence without breaking on decimals or ids', () => {
    expect(firstSentence('It is O(n). Then.')).toBe('It is O(n).');
    expect(firstSentence('v2.1 is out')).toBe('v2.1 is out');
  });

  it('pulls the leading Big-O out of a longer complexity text', () => {
    expect(bigOParts('O(1) average per get and put')).toEqual({ big: 'O(1)', rest: 'average per get and put' });
    expect(bigOParts('O(n · k log k)')).toEqual({ big: 'O(n · k log k)', rest: '' });
    expect(bigOParts('linear')).toEqual({ big: 'linear', rest: '' });
  });

  it('makes hashtags from content words only', () => {
    expect(hashtags('ordenar por inicio y fusionar en una pasada')).toEqual(['ordenar', 'inicio', 'fusionar']);
    expect(hashtags('pila de aperturas (calentamiento)')).toEqual(['pila', 'aperturas', 'calentamiento']);
    expect(hashtags('BFS en una grilla, sin recursión', 2)).toEqual(['grilla', 'recursión']);
  });

  it('splits spoken text on its phrase marks', () => {
    expect(phrasesOf("Here's what. / It grows / as input grows.")).toEqual(["Here's what.", 'It grows', 'as input grows.']);
  });
});

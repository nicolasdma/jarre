import { describe, expect, it } from 'vitest';
import {
  bruteForceTime,
  buildFeedGraph,
  codeFromInterview,
  complexityFromInterview,
  type BuildFeedGraphInput,
} from '../feed-graph';
import type { PracticeDrill } from '@/components/practice/types';
import { LessonSchema } from '@/lib/lessons/lesson-format';
import { lessonFileGraphInput } from '../lesson-file-graph';

const interview = {
  questions: [
    { id: 'q1', drill: 'd-sayit', ask: 'Walk me through two sum.', key_points: ['hash map'] },
    { id: 'q2', drill: 'd-nope', ask: '   ', key_points: [] }, // blank ask: skipped
  ],
  coding: {
    complexity_drill: {
      concept: 'big-o',
      title: 'Say the Big-O',
      items: [
        { id: 'x1', title: 'A loop', code: 'for (...)', time: { answer: 'O(n)', options: ['O(1)', 'O(n)'], why: 'one loop' }, space: { answer: 'O(1)', why: 'one var' }, say: "It's O of n." },
        { id: 'bad', title: 'missing answer', code: 'x', time: {}, space: {}, say: '' }, // malformed: skipped
      ],
    },
    problems: [
      { id: 'two-sum', title: 'Two Sum', pattern: 'Hash map', concept: 'two-sum', statement: 'Return indices.', solution: { approach: 'hash map', code: 'function twoSum(){}' } },
      { id: 'no-code', title: 'No code', pattern: 'x', concept: 'c', statement: 's' }, // no solution.code and no starter: skipped
    ],
  },
};

function drill(slug: string, conceptId: string | null): PracticeDrill {
  return { slug, title: slug, priority: 1, textEn: 'en', textEs: 'es', audioUrl: null, conceptId, segments: null };
}

const input: BuildFeedGraphInput = {
  resourceId: 'lesson-x',
  concepts: [
    { id: 'big-o', name: 'Big-O · notation', definition: 'how cost grows', sortOrder: 1, sectionMarkdown: '# Big-O' },
    { id: 'two-sum', name: 'Two Sum', definition: 'pairs', sortOrder: 0, sectionMarkdown: null },
  ],
  quizzes: [
    { id: 'quiz-1', conceptId: 'two-sum', format: 'mc', question: 'Q?', options: [{ label: 'A', text: 'a' }], correctAnswer: 'A', explanation: 'e' },
  ],
  cards: [
    { id: 'card-1', conceptId: 'two-sum', prompt: 'P', answer: 'A' },
    { id: 'card-2', conceptId: 'big-o', prompt: 'P2', answer: 'A2' },
  ],
  drills: [drill('d-sayit', 'two-sum'), drill('d-plain', 'big-o'), drill('d-orphan', null)],
  interview,
};

describe('feed graph: defensive interview extraction', () => {
  it('reads Big-O items, skipping malformed ones', () => {
    const items = complexityFromInterview(interview);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'x1', conceptId: 'big-o', timeAnswer: 'O(n)', spaceAnswer: 'O(1)' });
    expect(items[0].timeOptions).toEqual(['O(1)', 'O(n)']);
  });

  it('reads code problems, preferring the solution code, skipping those without code', () => {
    const code = codeFromInterview(interview);
    expect(code).toHaveLength(1);
    expect(code[0]).toMatchObject({ id: 'two-sum', conceptId: 'two-sum', pattern: 'Hash map', code: 'function twoSum(){}' });
  });

  it('returns nothing for an absent or malformed block', () => {
    expect(complexityFromInterview(null)).toEqual([]);
    expect(codeFromInterview({})).toEqual([]);
    expect(complexityFromInterview({ coding: { complexity_drill: {} } })).toEqual([]);
  });
});

describe('feed graph: build', () => {
  const graph = buildFeedGraph(input);

  it('orders concepts by sort order', () => {
    expect(graph.concepts.map((c) => c.id)).toEqual(['two-sum', 'big-o']);
  });

  it('attaches each concept its own assets', () => {
    const twoSum = graph.concepts.find((c) => c.id === 'two-sum')!;
    expect(twoSum.quizIds).toEqual(['quiz-1']);
    expect(twoSum.cardIds).toEqual(['card-1']);
    expect(twoSum.drillSlugs).toEqual(['d-sayit']);
    expect(twoSum.sayItSlugs).toEqual(['d-sayit']); // has an interview ask
    expect(twoSum.codeIds).toEqual(['two-sum']);

    const bigO = graph.concepts.find((c) => c.id === 'big-o')!;
    expect(bigO.complexityIds).toEqual(['x1']);
    expect(bigO.drillSlugs).toEqual(['d-plain']);
    expect(bigO.sayItSlugs).toEqual([]); // drill has no ask
  });

  it('indexes resolvable content and the asks', () => {
    expect(graph.quizzes['quiz-1']).toBeTruthy();
    expect(graph.cards['card-2'].conceptId).toBe('big-o');
    expect(graph.complexity['x1'].say).toBe("It's O of n.");
    expect(graph.code['two-sum'].title).toBe('Two Sum');
    expect(graph.asks['d-sayit']).toBe('Walk me through two sum.');
    expect(graph.asks['d-nope']).toBeUndefined();
  });

  it('ignores drills with no concept', () => {
    const all = graph.concepts.flatMap((c) => c.drillSlugs);
    expect(all).not.toContain('d-orphan');
    // but it stays resolvable as content if ever referenced
    expect(graph.drills['d-orphan']).toBeTruthy();
  });
});

describe('feed graph: the cost contrast of a code problem', () => {
  it('reads the brute force Big-O from its own sentence only', () => {
    expect(bruteForceTime('Brute force: check every pair, O(n²) time, O(1) space. Optimal: O(n).')).toBe('O(n²)');
    expect(bruteForceTime('Brute force: try every coin, exponential. Better: O(n · k).')).toBeNull();
    expect(bruteForceTime('No slow version worth coding.')).toBeNull();
    expect(bruteForceTime(null)).toBeNull();
  });

  it('carries the optimal time/space and the brute force into the code post', () => {
    const [two] = codeFromInterview({
      coding: {
        problems: [
          {
            id: 'two-sum', title: 'Two Sum', pattern: 'Hash map', concept: 'two-sum', statement: 's',
            solution: { approach: 'Brute force: every pair, O(n²) time. Optimal: a map.', code: 'f', time: 'O(n)', space: 'O(n)' },
            complexity: { time: { answer: 'O(n)' }, space: { answer: 'O(n)' } },
          },
        ],
      },
    });
    expect(two).toMatchObject({ time: 'O(n)', space: 'O(n)', brute: 'O(n²)' });
  });
});

describe('feed graph: a lesson file, without a database', () => {
  it('maps a lesson JSON the way the seed maps it to the tables', () => {
    const lesson = LessonSchema.parse({
      id: 'demo-lesson',
      track: 'ai',
      title: 'Demo',
      description: 'd',
      concepts: [
        {
          id: 'two-sum',
          name: 'Two Sum: hash map',
          definition: 'Two Sum: one pass.',
          section: { title: 'Two Sum', markdown: '## Idea\ntext' },
          quizzes: [{ format: 'mc', question: 'Q?', options: ['a', 'b'], correct: 1, explanation: 'e' }],
          cards: [{ type: 'recall', front: 'P', back: 'A' }],
        },
      ],
      drills: [{ id: 'd1', title: 'Drill', priority: 1, text_en: 'Say / it', concept: 'two-sum' }],
    });
    const input = lessonFileGraphInput(lesson, (id) => ({ url: id === 'd1' ? '/a/d1' : null, segments: null }));
    const graph = buildFeedGraph(input);
    expect(graph.resourceId).toBe('demo-lesson');
    expect(Object.values(graph.quizzes)[0]).toMatchObject({
      conceptId: 'two-sum',
      correctAnswer: 'B',
      options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }],
    });
    expect(Object.values(graph.cards)[0]).toMatchObject({ prompt: 'P', answer: 'A' });
    expect(graph.drills.d1).toMatchObject({ audioUrl: '/a/d1', conceptId: 'two-sum' });
    expect(graph.concepts[0].drillSlugs).toEqual(['d1']);
  });
});

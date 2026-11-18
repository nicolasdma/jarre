import { describe, expect, it } from 'vitest';
import {
  classifyVideo,
  normalizeText,
  parseChapters,
  parseIsoDuration,
  toLessonEntry,
  topicsNamedIn,
  videoLanguage,
  type RawVideo,
} from '../video-classifier';
import { LESSON_VIDEO_TOPICS, TOPIC_BY_ID } from '../video-topics';

function raw(over: Partial<RawVideo>): RawVideo {
  return {
    id: 'vid00000001',
    title: 'Two Sum - Leetcode 1 - HashMap - Python',
    description: 'Solving two sum, a classic coding interview problem.',
    tags: ['leetcode', 'coding interview'],
    channelId: 'UCchan',
    channelTitle: 'Some Channel',
    durationSec: 600,
    views: 250_000,
    likes: 8_000,
    embeddable: true,
    madeForKids: false,
    live: 'none',
    privacy: 'public',
    lang: 'en',
    width: 1280,
    height: 720,
    ...over,
  };
}

const ids = (title: string) => topicsNamedIn(normalizeText(title)).map((t) => t.id);
const OPTS = { fetchedAt: '2026-11-18' };

describe('text helpers', () => {
  it('parses ISO durations', () => {
    expect(parseIsoDuration('PT59S')).toBe(59);
    expect(parseIsoDuration('PT12M3S')).toBe(723);
    expect(parseIsoDuration('PT1H2M')).toBe(3720);
    expect(parseIsoDuration('garbage')).toBe(0);
  });

  it('reads YouTube chapters only when they are real chapters', () => {
    const ok = parseChapters('Intro text\n0:00 - Read the problem\n1:30 - Drawing Explanation\n8:40 Coding Explanation\nthanks');
    expect(ok).toEqual([
      { start: 0, title: 'Read the problem' },
      { start: 90, title: 'Drawing Explanation' },
      { start: 520, title: 'Coding Explanation' },
    ]);
    expect(parseChapters('1:00 a\n2:00 b\n3:00 c')).toEqual([]); // no 0:00
    expect(parseChapters('0:00 a\n2:00 b')).toEqual([]); // fewer than three
  });

  it('strips accents and case', () => {
    expect(normalizeText('Búsqueda  BINARIA')).toBe('busqueda binaria');
  });
});

describe('topic naming (strict)', () => {
  it('tells sibling problems apart', () => {
    expect(ids('Two Sum - Leetcode 1 - HashMap')).toEqual(['two-sum']);
    expect(ids('Two Sum II - Input Array Is Sorted - Leetcode 167')).toEqual(['two-sum-sorted']);
    expect(ids('L5. Two Sum | 2 Sum Problem')).toEqual(['two-sum']);
    expect(ids('3Sum - Leetcode 15')).toEqual(['three-sum']);
    expect(ids('LeetCode 3Sum Closest Explained - Java')).toEqual([]);
    expect(ids('Coin Change 2 - Dynamic Programming')).toEqual(['dynamic-programming']);
    expect(ids('Number of Islands II')).toEqual([]);
  });

  it('a problem named wins over the ideas in the same title', () => {
    expect(ids('Longest Substring Without Repeating Characters - Sliding Window')).toEqual(['longest-substring']);
  });

  it('names an idea by its words, in English or Spanish', () => {
    expect(ids('Big O Notation in 100 Seconds')).toEqual(['big-o']);
    expect(ids('Búsqueda binaria explicada')).toEqual(['binary-search-idea']);
    expect(ids('the advantage of a Binary Search Tree')).toEqual([]);
  });

  it('matches LeetCode numbers without eating longer numbers or words', () => {
    expect(ids('LeetCode 200 explained')).toEqual(['number-of-islands']);
    expect(ids('LeetCode 2000 explained')).toEqual([]);
  });

  it('every lesson mapping points at a known topic', () => {
    for (const map of Object.values(LESSON_VIDEO_TOPICS)) {
      for (const topic of Object.keys(map)) expect(TOPIC_BY_ID[topic], topic).toBeDefined();
    }
  });
});

describe('classifyVideo', () => {
  it('accepts an on-topic long video and keeps only its explanation chapter', () => {
    const r = classifyVideo(
      raw({ description: '0:00 - Read the problem\n1:30 - Drawing Explanation\n8:40 - Coding Explanation\n', durationSec: 900 }),
      OPTS,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]).toMatchObject({ topicIds: ['two-sum'], kind: 'long', start: 90, end: 520, chapter: 'Drawing Explanation', lang: 'en' });
  });

  it('accepts a vertical short by its title', () => {
    const r = classifyVideo(raw({ title: 'Valid Parentheses in 60 seconds #shorts', durationSec: 58, width: 405, height: 720 }), OPTS);
    expect(r.ok && r.entries[0].kind).toBe('short');
  });

  it('accepts a short with a hook title when tags AND description both name the topic', () => {
    const hook = raw({
      title: 'This trick blew my mind 🤯 #shorts',
      description: 'Group Anagrams with a sorted key, leetcode 49',
      tags: ['group anagrams', 'leetcode'],
      durationSec: 45,
      width: 405,
      height: 720,
    });
    expect(classifyVideo(hook, OPTS)).toMatchObject({ ok: true, entries: [{ topicIds: ['group-anagrams'] }] });
    expect(classifyVideo({ ...hook, tags: ['coding'] }, OPTS)).toEqual({ ok: false, reason: 'off-topic' });
  });

  it('rejects junk, other languages, kids and non-embeddable videos', () => {
    expect(classifyVideo(raw({ title: 'My reaction to Two Sum - Leetcode 1' }), OPTS)).toEqual({ ok: false, reason: 'junk' });
    expect(classifyVideo(raw({ tags: ['minecraft'] }), OPTS)).toEqual({ ok: false, reason: 'junk' });
    expect(classifyVideo(raw({ title: 'Two Sum in Hindi - Leetcode 1' }), OPTS)).toEqual({ ok: false, reason: 'language' });
    expect(classifyVideo(raw({ lang: 'pt-BR' }), OPTS)).toEqual({ ok: false, reason: 'language' });
    expect(classifyVideo(raw({ madeForKids: true }), OPTS)).toEqual({ ok: false, reason: 'not-playable' });
    expect(classifyVideo(raw({ embeddable: false }), OPTS)).toEqual({ ok: false, reason: 'not-playable' });
    expect(classifyVideo(raw({ live: 'live' }), OPTS)).toEqual({ ok: false, reason: 'not-playable' });
    expect(classifyVideo(raw({ durationSec: 12 }), OPTS)).toEqual({ ok: false, reason: 'too-short' });
  });

  it('rejects off-domain and off-topic titles', () => {
    expect(classifyVideo(raw({ title: 'Two Sum of my grocery bill', description: 'vlog', tags: [] }), OPTS)).toEqual({ ok: false, reason: 'off-domain' });
    expect(classifyVideo(raw({ title: 'Word Search - Leetcode 79' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
  });

  it('an idea in a title about another problem is that problem, not the idea', () => {
    expect(classifyVideo(raw({ title: 'First Bad Version - Leetcode 278 - Binary Search' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
    expect(classifyVideo(raw({ title: 'Job Sequencing Problem | Greedy Algorithms' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
  });

  it('needs popularity, with a lower bar for boosted channels', () => {
    const small = raw({ views: 900, likes: 40 });
    expect(classifyVideo(small, OPTS)).toEqual({ ok: false, reason: 'unpopular' });
    expect(classifyVideo(small, { ...OPTS, tier: 'core' }).ok).toBe(true);
    expect(classifyVideo(raw({ views: 100_000, likes: 50 }), OPTS)).toEqual({ ok: false, reason: 'unpopular' });
  });

  it('a long compilation becomes one segment per on-topic chapter', () => {
    const r = classifyVideo(
      raw({
        title: 'Blind 75 - every problem explained',
        durationSec: 7200,
        description: '0:00 Intro\n2:00 Two Sum\n12:00 Valid Parentheses\n25:00 Word Search\n40:00 Outro',
      }),
      OPTS,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.entries.map((e) => [e.id, e.topicIds[0], e.start, e.end, e.flavor])).toEqual([
      ['vid00000001@120', 'two-sum', 120, 720, 'oddball'],
      ['vid00000001@720', 'valid-parentheses', 720, 1440, 'oddball'],
    ]);
  });

  it('a whole video over 25 minutes without on-topic chapters is too long', () => {
    expect(classifyVideo(raw({ durationSec: 3600 }), OPTS)).toEqual({ ok: false, reason: 'too-long' });
  });

  it('marks Spanish and boosts the core channels', () => {
    expect(videoLanguage({ lang: null, title: 'Búsqueda binaria explicada para entrevistas', tags: [] })).toBe('es');
    const es = classifyVideo(raw({ lang: 'es-419', title: 'Notación Big O en 3 minutos', views: 9000, likes: 400 }), OPTS);
    expect(es.ok && es.entries[0]).toMatchObject({ lang: 'es', flavor: 'oddball' });
    const core = classifyVideo(raw({}), { ...OPTS, tier: 'core' });
    const plain = classifyVideo(raw({}), OPTS);
    expect(core.ok && plain.ok && core.entries[0].quality > plain.entries[0].quality).toBe(true);
    expect(core.ok && core.entries[0].flavor).toBe('core');
  });
});

describe('toLessonEntry', () => {
  it('maps topics to the lesson concepts, or drops the video', () => {
    const r = classifyVideo(raw({}), OPTS);
    if (!r.ok) throw new Error('expected ok');
    expect(toLessonEntry(r.entries[0], '3y-health-tecnica-v2')?.conceptIds).toEqual(['3yt-v2-two-sum']);
    expect(toLessonEntry(r.entries[0], '3y-health-tecnica-repaso')).toBeNull(); // the repaso has Two Sum II, not Two Sum
    expect(toLessonEntry(r.entries[0], 'unknown-lesson')).toBeNull();
  });
});

describe('sibling problems and instruments', () => {
  it('a LeetCode number that is not the topic\'s means a sibling problem', () => {
    expect(ids('Find the Length of the Longest Common Prefix - Leetcode 3043')).toEqual([]);
    expect(ids('Longest Common Prefix - Leetcode 14')).toEqual(['longest-common-prefix']);
  });

  it('an idea used as a tool in another problem is not the idea', () => {
    expect(classifyVideo(raw({ title: 'All Nodes Distance K - Bidirectional Search Using A Hashtable' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
    expect(classifyVideo(raw({ title: 'How Facebook Scaled a Distributed Priority Queue' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
  });
});

describe('an idea title names the idea up front', () => {
  it('rejects a problem video that only tags the idea after a separator', () => {
    expect(classifyVideo(raw({ title: 'BS-14. Find the Smallest Divisor Given a Threshold | Binary Search' }), OPTS)).toEqual({ ok: false, reason: 'off-topic' });
  });

  it('keeps an idea title, also behind a one-word label', () => {
    expect(classifyVideo(raw({ title: 'Binary Search Algorithm in 100 Seconds' }), OPTS).ok).toBe(true);
    expect(classifyVideo(raw({ title: 'Explained | Priority Queue Functions #shorts', durationSec: 50, width: 405, height: 720 }), OPTS).ok).toBe(true);
  });
});

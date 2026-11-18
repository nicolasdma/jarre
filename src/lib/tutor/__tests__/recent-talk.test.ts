import { beforeEach, describe, expect, it } from 'vitest';
import { RECENT_MAX_CHARS, clearRecentTalk, recentTalkBlock, rememberTalk } from '../recent-talk';

beforeEach(() => clearRecentTalk());

describe('the talk that just ended', () => {
  const lines = Array.from({ length: 40 }, (_, i) => ({ role: (i % 2 ? 'user' : 'model') as 'user' | 'model', text: `línea ${i} `.repeat(8) }));

  it('reaches the next session in the same lesson, the newest lines first kept, under its cap', () => {
    rememberTalk('3y', { sessionId: 's1', sectionLabel: 'section 3 (Two Sum)', lines }, 1000);
    const block = recentTalkBlock('3y', new Set(), 1000 + 5 * 60_000)!;
    expect(block).toContain('section 3 (Two Sum)');
    expect(block).toContain('línea 39');
    expect(block).not.toContain('línea 0 ');
    expect(block.length).toBeLessThan(RECENT_MAX_CHARS + 200);
  });

  it('is dropped once its digest is in, after 15 minutes, or for another lesson', () => {
    rememberTalk('3y', { sessionId: 's1', sectionLabel: 'x', lines }, 0);
    expect(recentTalkBlock('3y', new Set(['s1']), 1000)).toBeNull();
    expect(recentTalkBlock('3y', new Set(), 16 * 60_000)).toBeNull();
    expect(recentTalkBlock('other', new Set(), 1000)).toBeNull();
  });

  it('keeps nothing from a session where the learner never spoke', () => {
    rememberTalk('3y', { sessionId: 's2', sectionLabel: 'x', lines: [{ role: 'model', text: '¿Por qué…?' }] }, 0);
    expect(recentTalkBlock('3y', new Set(), 1000)).toBeNull();
  });
});

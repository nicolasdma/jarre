import { beforeEach, describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { clearSignedAudioCache, signLessonAudio } from '../drills';

function fakeStorage() {
  const calls: string[][] = [];
  let n = 0;
  const client = {
    storage: {
      from: () => ({
        createSignedUrls: async (paths: string[]) => {
          calls.push(paths);
          return { data: paths.map((path) => ({ path, signedUrl: `https://s/${path}?token=${++n}` })), error: null };
        },
      }),
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe('signLessonAudio', () => {
  beforeEach(() => clearSignedAudioCache());

  it('hands out the same URL on the next visit instead of re-signing', async () => {
    const { client, calls } = fakeStorage();
    const t0 = Date.UTC(2026, 10, 18);
    const first = await signLessonAudio(client, ['a.m4a', 'b.m4a'], t0);
    const again = await signLessonAudio(client, ['a.m4a', 'b.m4a', 'c.m4a'], t0 + 60 * 60 * 1000);
    expect(again.get('a.m4a')).toBe(first.get('a.m4a'));
    expect(again.get('b.m4a')).toBe(first.get('b.m4a'));
    expect(calls).toEqual([['a.m4a', 'b.m4a'], ['c.m4a']]);
  });

  it('re-signs once a URL has less than 12 h left', async () => {
    const { client, calls } = fakeStorage();
    const t0 = Date.UTC(2026, 10, 18);
    const first = await signLessonAudio(client, ['a.m4a'], t0);
    const later = await signLessonAudio(client, ['a.m4a'], t0 + (72 - 11) * 60 * 60 * 1000);
    expect(later.get('a.m4a')).not.toBe(first.get('a.m4a'));
    expect(calls.length).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import { HEADING_GAP, createScrollMemory, offsetFrom, scrollTopFor, sectionKey, stepKey } from '../scroll-memory';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('scrollTopFor', () => {
  it('puts a section heading just under the sticky header the first time', () => {
    expect(scrollTopFor({ anchorTop: 900, headerHeight: 60, maxScroll: 5000 })).toBe(900 - 60 - HEADING_GAP);
  });
  it('adds the remembered offset', () => {
    expect(scrollTopFor({ anchorTop: 900, headerHeight: 60, offset: 1200, maxScroll: 5000 })).toBe(900 - 60 - HEADING_GAP + 1200);
  });
  it('never scrolls above the page or past its end', () => {
    expect(scrollTopFor({ anchorTop: 20, headerHeight: 60, maxScroll: 5000 })).toBe(0);
    expect(scrollTopFor({ anchorTop: 900, headerHeight: 60, offset: 9000, maxScroll: 3000 })).toBe(3000);
    expect(scrollTopFor({ anchorTop: 900, headerHeight: 60, maxScroll: -10 })).toBe(0);
  });
});

describe('offsetFrom', () => {
  it('is the inverse of scrollTopFor inside the section', () => {
    const at = { anchorTop: 1500, headerHeight: 72 };
    const top = scrollTopFor({ ...at, offset: 640, maxScroll: 10_000 });
    expect(offsetFrom({ ...at, scrollTop: top })).toBe(640);
  });
  it('is 0 when the learner is above the section heading', () => {
    expect(offsetFrom({ anchorTop: 1500, headerHeight: 72, scrollTop: 200 })).toBe(0);
  });
});

describe('createScrollMemory', () => {
  it('remembers per key and writes on flush only', () => {
    const storage = fakeStorage();
    const memory = createScrollMemory('lesson-a', storage);
    expect(memory.get(sectionKey('s1'))).toBeUndefined();
    memory.set(sectionKey('s1'), 420);
    memory.set(stepKey('apply'), 90);
    expect(memory.get(sectionKey('s1'))).toBe(420);
    expect(storage.data.size).toBe(0);
    memory.flush();
    expect(JSON.parse(storage.data.get('jarre.scroll.lesson-a')!)).toEqual({ 'section:s1': 420, 'step:apply': 90 });
  });
  it('reads what an earlier page of the same visit saved, per lesson', () => {
    const storage = fakeStorage({ 'jarre.scroll.lesson-a': JSON.stringify({ 'section:s2': 300, bad: 'x' }) });
    expect(createScrollMemory('lesson-a', storage).get(sectionKey('s2'))).toBe(300);
    expect(createScrollMemory('lesson-a', storage).get('bad')).toBeUndefined();
    expect(createScrollMemory('lesson-b', storage).get(sectionKey('s2'))).toBeUndefined();
  });
  it('survives broken or missing storage', () => {
    expect(createScrollMemory('x', fakeStorage({ 'jarre.scroll.x': '{nope' })).get('a')).toBeUndefined();
    const memory = createScrollMemory('x', null);
    memory.set('a', 1);
    memory.flush();
    expect(memory.get('a')).toBe(1);
    const throwing = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    const m2 = createScrollMemory('x', throwing);
    m2.set('a', 2);
    expect(() => m2.flush()).not.toThrow();
  });
});

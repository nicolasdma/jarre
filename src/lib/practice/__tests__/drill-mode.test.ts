import { describe, expect, it } from 'vitest';
import { firstMode, modeOf, type DrillModeState } from '../drill-mode';

describe('firstMode', () => {
  it('is Escuchar when the drill can be heard', () => {
    expect(firstMode(true)).toBe('listen');
  });
  it('is Copiar with nothing to listen to', () => {
    expect(firstMode(false)).toBe('copy');
  });
});

describe('modeOf', () => {
  const state: DrillModeState = { slug: 'tt-06b-longest-substring-optimizar', mode: 'recall' };
  it('keeps the mode of the drill being practiced', () => {
    expect(modeOf(state, 'tt-06b-longest-substring-optimizar', 'listen')).toBe('recall');
  });
  it('opens any other drill in the first mode (the owner case: next after Pregunta → respuesta)', () => {
    expect(modeOf(state, 'tt-06c-longest-substring-complejidad', 'listen')).toBe('listen');
  });
  it('coming back to a drill after another one starts it over in the first mode', () => {
    const after: DrillModeState = { slug: 'other', mode: 'copy' };
    expect(modeOf(after, 'tt-06b-longest-substring-optimizar', 'listen')).toBe('listen');
  });
  it('no drill: the first mode', () => {
    expect(modeOf(state, null, 'listen')).toBe('listen');
    expect(modeOf({ slug: null, mode: 'repeat' }, 'x', 'listen')).toBe('listen');
  });
});

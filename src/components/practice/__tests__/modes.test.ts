import { describe, expect, it } from 'vitest';
import { DRILL_MODES, drillModeFromParam } from '../types';

describe('drill modes', () => {
  it('has no dictation, Frase por frase instead of free shadowing, and recall last', () => {
    expect(DRILL_MODES.map((m) => m.id)).toEqual(['listen', 'copy', 'repeat', 'sentences', 'recall']);
  });

  it('keeps old links working', () => {
    expect(drillModeFromParam('shadow')).toBe('sentences');
    expect(drillModeFromParam('dictation')).toBe('listen');
    expect(drillModeFromParam('repeat')).toBe('repeat');
    expect(drillModeFromParam('recall')).toBe('recall');
    expect(drillModeFromParam('nope')).toBeNull();
    expect(drillModeFromParam(null)).toBeNull();
  });
});

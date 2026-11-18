import { describe, expect, it } from 'vitest';
import { activateSummaryOf } from '../activate-summary';

describe('activateSummaryOf', () => {
  it('reads the summary and the parts a lesson brings', () => {
    const raw = {
      summary: 'Mañana presentas en inglés.',
      sections: [{ number: 1, title: 'Qué es', description: 'La definición.' }],
      keyConcepts: ['ALCOA+'],
      insight: 'Lo que importa.',
    };
    expect(activateSummaryOf(raw)).toEqual({
      summary: 'Mañana presentas en inglés.',
      sections: [{ number: 1, title: 'Qué es', description: 'La definición.' }],
    });
  });

  it('is null without a summary or with another shape', () => {
    expect(activateSummaryOf(null)).toBeNull();
    expect(activateSummaryOf({})).toBeNull();
    expect(activateSummaryOf({ summary: '   ' })).toBeNull();
    expect(activateSummaryOf('texto')).toBeNull();
  });
});

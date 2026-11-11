import { describe, expect, it } from 'vitest';
import { groupDrills, MEMORY_GROUP_ID } from '../drill-groups';

const sections = [
  { conceptId: 'rls', title: 'RLS' },
  { conceptId: 'links', title: 'Links' },
  { conceptId: 'call', title: 'La llamada' },
];

describe('groupDrills', () => {
  it('puts drills under their section, in section order, and the rest last as "De memoria"', () => {
    const groups = groupDrills(
      [
        { slug: 'plan', conceptId: null },
        { slug: 'intro', conceptId: 'call' },
        { slug: '120s', conceptId: 'links' },
        { slug: 'orphan', conceptId: 'gone' },
      ],
      sections,
    );
    expect(groups.map((g) => g.id)).toEqual(['links', 'call', MEMORY_GROUP_ID]);
    expect(groups[2].title).toBe('De memoria');
    expect(groups[2].drills.map((d) => d.slug)).toEqual(['plan', 'orphan']);
  });

  it('without concept data every drill is "De memoria"', () => {
    const groups = groupDrills([{ slug: 'a', conceptId: null }, { slug: 'b', conceptId: null }], sections);
    expect(groups).toHaveLength(1);
    expect(groups[0].drills).toHaveLength(2);
  });
});

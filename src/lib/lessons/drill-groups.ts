/**
 * How a lesson's drills sit in the learn view: under the section of the
 * concept they practice, in section order, and the rest (the plan by heart,
 * useful phrases, anything whose concept the lesson does not have) in a last
 * group, "De memoria".
 */

export const MEMORY_GROUP_ID = 'memory';

export interface DrillGroupSection {
  conceptId: string;
  title: string;
}

export interface DrillGroup<D> {
  /** The concept id, or MEMORY_GROUP_ID. */
  id: string;
  title: string;
  drills: D[];
}

export function groupDrills<D extends { conceptId: string | null }>(
  drills: D[],
  sections: DrillGroupSection[],
  memoryTitle = 'De memoria',
): DrillGroup<D>[] {
  const known = new Set(sections.map((s) => s.conceptId));
  const groups: DrillGroup<D>[] = sections
    .map((s) => ({ id: s.conceptId, title: s.title, drills: drills.filter((d) => d.conceptId === s.conceptId) }))
    .filter((g) => g.drills.length > 0);
  const memory = drills.filter((d) => !d.conceptId || !known.has(d.conceptId));
  if (memory.length) groups.push({ id: MEMORY_GROUP_ID, title: memoryTitle, drills: memory });
  return groups;
}

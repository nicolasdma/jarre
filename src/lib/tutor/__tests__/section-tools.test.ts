import { describe, expect, it } from 'vitest';
import { Behavior, Type } from '@google/genai';
import { LessonOnDemand, MAX_CALLS_PER_TURN, MAX_INJECTED_PER_CONNECTION, SECTION_TOOLS } from '../section-tools';
import { buildLessonMap } from '../lesson-map';
import { syntheticLesson } from './fixtures';
import type { EvidenceRow } from '../evidence';

const lesson = syntheticLesson();
const map = buildLessonMap(lesson.sections);
const contents = lesson.sections.map((s) => s.content);
const history: EvidenceRow[] = [
  { sessionId: 's1', sectionId: lesson.sections[1].id, conceptId: 'concept-2', kind: 'misconception', verdict: 'wrong', resolved: false, statement: 'Dos for anidados son n².', quote: 'o n log n porque tenés dos for', at: '2026-11-18T21:00:00Z' },
];
const make = () => new LessonOnDemand(map, contents, 2, () => history);
const call = (name: string, args: Record<string, unknown>, id = name) => ({ id, name, args });

describe('the lesson tools', () => {
  it('declare the SDK enum values (the SDK is not in the page bundle)', () => {
    const decls = SECTION_TOOLS[0].functionDeclarations!;
    expect(decls.map((d) => d.name)).toEqual(['get_section', 'get_my_history', 'go_to_section']);
    expect(decls[0].behavior).toBe(Behavior.BLOCKING);
    expect(decls[2].behavior).toBe(Behavior.NON_BLOCKING);
    expect(decls[0].parameters?.type).toBe(Type.OBJECT);
    expect(decls[0].parameters?.properties?.n.type).toBe(Type.INTEGER);
  });

  it('get_section returns the notes once per connection, and nothing for the focus or a wrong number', () => {
    const s = make();
    const first = s.answer([call('get_section', { n: 15 })]);
    expect(String(first.responses[0].response?.notes)).toContain('NOTES OF SECTION 15');
    expect(String(first.responses[0].response?.notes)).toContain(contents[14].slice(0, 100));
    s.takePendingNotes(); // the turn ends
    expect(s.answer([call('get_section', { n: 15 })]).responses[0].response).toMatchObject({ already_in_context: true });
    expect(s.answer([call('get_section', { n: 3 })]).responses[0].response).toMatchObject({ already_in_context: true });
    s.takePendingNotes();
    expect(s.answer([call('get_section', { n: 40 })]).responses[0].response).toEqual({ error: 'no such section', sections: 15 });
  });

  it('caps the calls in one reply: the third gets "answer now"', () => {
    const s = make();
    const out = s.answer([call('get_section', { n: 1 }, 'a'), call('get_section', { n: 2 }, 'b'), call('get_section', { n: 4 }, 'c')]);
    expect(MAX_CALLS_PER_TURN).toBe(2);
    expect(out.responses[2].response).toMatchObject({ error: 'answer now' });
    expect(out.injected).toEqual([1, 2]);
  });

  it('a section the learner names goes in when the tutor turn ends, once, up to the cap per connection', () => {
    const s = make();
    s.learnerNamed([15]);
    const notes = s.takePendingNotes();
    expect(notes.map((x) => x.n)).toEqual([15]);
    s.learnerNamed([15]);
    expect(s.takePendingNotes()).toEqual([]);
    s.learnerNamed([1, 2, 4, 5]);
    expect(s.takePendingNotes().length).toBe(MAX_INJECTED_PER_CONNECTION - 1);
  });

  it('get_my_history answers from the evidence already loaded, and says when there is none', () => {
    const s = make();
    const big = s.answer([call('get_my_history', { n: 2 })]).responses[0].response as { earlier_sessions: { said: string; corrected: boolean }[] };
    expect(big.earlier_sessions[0]).toMatchObject({ said: 'o n log n porque tenés dos for', corrected: false });
    expect(s.answer([call('get_my_history', { n: 7 })]).responses[0].response).toMatchObject({ earlier_sessions: [], note: expect.stringContaining('do not invent') });
  });

  it('go_to_section shows a chip and never moves the screen by itself', () => {
    const out = make().answer([call('go_to_section', { n: 2, reason: 'review' })]);
    expect(out.chip).toEqual({ n: 2, short: 'Big-O desde cero', reason: 'review' });
    expect(out.responses[0].response).toMatchObject({ ok: true });
  });
});

import { describe, expect, it } from 'vitest';
import { DigestOutputSchema, type EvidenceRow } from '../evidence';
import { DIGEST_SYSTEM, digestToRows, digestUserPrompt, type DigestSection } from '../evidence-digest';
import { masteryOf } from '../mastery';
import { BRIEF_MAX_CHARS, buildLearnerBrief } from '../learner-brief';
import { buildLessonMap } from '../lesson-map';
import { syntheticLesson } from './fixtures';
import { A94_DIGEST, A94_TRANSCRIPT } from './fixtures/a94efc5c';

const lesson = syntheticLesson();
const sections: DigestSection[] = lesson.sections.map((s, i) => ({ n: i + 1, id: s.id, conceptId: s.conceptId, title: s.title }));
const map = buildLessonMap(lesson.sections);

function a94Rows(): EvidenceRow[] {
  const rows = digestToRows(DigestOutputSchema.parse(A94_DIGEST), {
    userId: 'u1', resourceId: '3y', sessionId: 'a94efc5c', sections, focusN: 3, transcript: A94_TRANSCRIPT,
  });
  return rows.map((r) => ({
    sessionId: r.session_id as string, sectionId: r.section_id as string | null, conceptId: r.concept_id as string | null,
    kind: r.kind as EvidenceRow['kind'], verdict: r.verdict as EvidenceRow['verdict'], resolved: r.resolved as boolean | null,
    statement: r.statement as string, quote: r.quote as string | null, at: r.at as string,
  }));
}

describe('the session digest (a94efc5c, recorded answer)', () => {
  it('asks for the learner lines numbered, with the lesson map', () => {
    const prompt = digestUserPrompt(sections, 3, A94_TRANSCRIPT);
    expect(prompt).toContain('3. Two Sum (calentamiento, fácil) · núcleo');
    expect(prompt).toContain('[36] LEARNER: No, no, pero para');
    expect(DIGEST_SYSTEM).toContain('Never invent');
  });

  it('keeps the key/value swap as an uncorrected error and the "check before insert" question as already asked', () => {
    const rows = a94Rows();
    const swap = rows.find((r) => r.quote?.includes('La clave es el índice'));
    expect(swap).toMatchObject({ kind: 'misconception', resolved: false, sectionId: sections[2].id, conceptId: 'concept-3' });
    const asked = rows.find((r) => r.kind === 'tutor_question' && r.statement.includes('antes de insertar'));
    expect(asked?.quote).toContain('número desactualizado');
    // Big-O errors land in section 2, wherever the talk happened.
    expect(rows.find((r) => r.quote?.includes('n log n'))?.sectionId).toBe(sections[1].id);
    // Each row is dated by its transcript line.
    expect(swap?.at).toBe(A94_TRANSCRIPT.find((t) => t.seq === 36)?.timestamp);
  });

  it('drops a quote that is not the learner\'s own words, and keeps the fact', () => {
    const rows = digestToRows(
      { items: [{ kind: 'misconception', section: 3, verdict: 'wrong', resolved: false, statement: 'Confunde clave y valor.', quote: 'el mapa guarda índices como claves siempre', seq: 36 }] },
      { userId: 'u1', resourceId: '3y', sessionId: 's', sections, focusN: 3, transcript: A94_TRANSCRIPT },
    );
    expect(rows[0].quote).toBeNull();
    expect(rows[0].statement).toBe('Confunde clave y valor.');
  });

  it('rejects output outside the schema', () => {
    expect(DigestOutputSchema.safeParse({ items: [{ kind: 'opinion', statement: 'x' }] }).success).toBe(false);
  });
});

describe('mastery by rules', () => {
  const day = 86_400_000;
  const now = Date.parse('2026-11-20T12:00:00Z');
  const at = (daysAgo: number) => new Date(now - daysAgo * day).toISOString();
  const ev = (kind: EvidenceRow['kind'], daysAgo: number, sessionId: string, extra: Partial<EvidenceRow> = {}) =>
    ({ kind, verdict: kind === 'explained' ? 'correct' : 'wrong', resolved: null, at: at(daysAgo), sessionId, ...extra }) as EvidenceRow;

  it('is "not seen" without evidence and "weak" with only errors', () => {
    expect(masteryOf([], now)).toBe(0);
    expect(masteryOf([ev('misconception', 1, 's1')], now)).toBe(1);
  });
  it('an unresolved error in the last 14 days caps it at weak', () => {
    expect(masteryOf([ev('explained', 5, 's1'), ev('explained', 3, 's2'), ev('misconception', 1, 's3', { resolved: false })], now)).toBe(1);
  });
  it('right in two different sessions is solid; in three, mastered', () => {
    expect(masteryOf([ev('explained', 3, 's1'), ev('explained', 3, 's1')], now)).toBe(2);
    expect(masteryOf([ev('explained', 3, 's1'), ev('explained', 2, 's2')], now)).toBe(3);
    expect(masteryOf([ev('explained', 3, 's1'), ev('explained', 2, 's2'), ev('explained', 1, 's3')], now)).toBe(4);
  });
  it('a corrected error does not hold it back; 30 quiet days take a level', () => {
    expect(masteryOf([ev('misconception', 20, 's0', { resolved: true }), ev('explained', 3, 's1'), ev('explained', 2, 's2')], now)).toBe(3);
    expect(masteryOf([ev('explained', 45, 's1'), ev('explained', 40, 's2')], now)).toBe(2);
  });
});

describe('the learner brief', () => {
  const now = Date.parse('2026-11-18T21:07:00Z');

  it('opens Two Sum seven minutes later knowing what d14a09c0 did not', () => {
    const brief = buildLearnerBrief({ map, focusIndex: 2, evidence: a94Rows(), now })!;
    expect(brief).toContain('Already asked in section 3 (do NOT ask these again)');
    expect(brief).toContain('antes de insertar');
    expect(brief).toContain('"La clave es el índice y el valor es el número"');
    expect(brief).toContain('ya sabes a dónde están todos los números');
    expect(brief).toContain('qué pesado con la entrevista');
    expect(brief).toContain('2 Big-O desde cero');
    // Unresolved errors come before what he was asked and what he did well.
    expect(brief.indexOf('Still wrong')).toBeLessThan(brief.indexOf('Already asked'));
    expect(brief.length).toBeLessThanOrEqual(BRIEF_MAX_CHARS);
  });

  it('in another section, carries the errors and preferences but not the Two Sum questions', () => {
    const brief = buildLearnerBrief({ map, focusIndex: 5, evidence: a94Rows(), now })!;
    expect(brief).not.toContain('Already asked');
    expect(brief).toContain('La clave es el índice');
    expect(brief).toContain('vamos de a poco');
  });

  it('stays under its cap with many rows, and is empty without any', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ ...a94Rows()[12], statement: `Error número ${i} `.repeat(10), at: new Date(now - i * 1000).toISOString() }));
    expect(buildLearnerBrief({ map, focusIndex: 2, evidence: many, now })!.length).toBeLessThanOrEqual(BRIEF_MAX_CHARS);
    expect(buildLearnerBrief({ map, focusIndex: 2, evidence: [], now })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { buildCodingReportMessages, hasCandidateSpeech, parseCodingReport, type CodingSessionFacts } from '../report';
import { buildCodingMockSession } from '../mock-session';
import { CodingConfigSchema, parseCodingConfig } from '../format';
import { SUM_PROBLEM } from './fixture';

const facts: CodingSessionFacts = {
  minutes: 30,
  elapsedSeconds: 1500,
  firstEditSeconds: 240,
  runs: 3,
  exampleRuns: 1,
  finalTests: { passed: 2, total: 3, failing: ['empty: expected 0, got 1'] },
  hintsGiven: 1,
  checkIns: 0,
};

const known = { drills: new Set(['tt-f5-probar']), problems: new Set(['sum']) };

describe('parseCodingReport', () => {
  it('keeps one entry per dimension in order and drops unknown drills and problems', () => {
    const report = parseCodingReport(
      {
        summary: 'Bien',
        verdict: 'lean_yes',
        rubric: [
          { dimension: 'testing', score: '2', note: 'no probó', evidence: [{ quote: "I think it's done", note: 'sin probar' }] },
          { dimension: 'communication', score: 3 },
        ],
        next: [
          { drill: 'tt-f5-probar', what: 'Probar' },
          { drill: 'invented', what: 'x' },
          { problem: 'sum', what: 'Repetir' },
          { problem: 'nope', what: 'y' },
        ],
      },
      known,
    );
    expect(report.rubric.map((r) => r.dimension)).toEqual(['communication', 'testing']);
    expect(report.rubric[1].score).toBe(2);
    expect(report.next.map((n) => n.drill ?? n.problem)).toEqual(['tt-f5-probar', 'sum']);
  });

  it('falls back to lean_no on an unknown verdict and rejects scores out of range', () => {
    expect(parseCodingReport({ verdict: 'maybe' }, known).verdict).toBe('lean_no');
    expect(() => parseCodingReport({ rubric: [{ dimension: 'code', score: 7 }] }, known)).toThrow();
  });
});

describe('buildCodingReportMessages', () => {
  it('carries the measured facts, the final code and the transcript', () => {
    const { system, user } = buildCodingReportMessages({
      problem: SUM_PROBLEM,
      interviewerName: 'Sam',
      transcript: [
        { role: 'model', text: 'Sum the numbers.' },
        { role: 'user', text: 'Can the array be empty?' },
      ],
      finalCode: 'export function sum() {}',
      facts,
      drills: [{ slug: 'tt-f5-probar', title: 'Probar' }],
      problems: [{ id: 'sum', title: 'Sum' }],
    });
    expect(system).toContain('senior_judgment');
    expect(user).toContain('FINAL TESTS (examples + hidden edge cases, on the final code): 2/3 pass');
    expect(user).toContain('CANDIDATE: Can the array be empty?');
    expect(user).toContain('SAM: Sum the numbers.');
    expect(user).toContain('export function sum() {}');
  });

  it('needs the candidate to have said something', () => {
    expect(hasCandidateSpeech([{ role: 'model', text: 'Hello there, ready?' }])).toBe(false);
    expect(hasCandidateSpeech([{ role: 'user', text: 'I would use a map' }])).toBe(true);
  });
});

describe('the interviewer prompt', () => {
  const config = CodingConfigSchema.parse({
    context: 'A 30-minute LeetCode-style round.',
    interviewer: { name: 'Sam', role: 'a senior engineer', tone: 'calm' },
    problems: [SUM_PROBLEM],
  });

  it('carries the problem, the hidden facts and the follow-ups, but never the hint ladder', () => {
    const { instruction, opener } = buildCodingMockSession({ config, problem: SUM_PROBLEM, minutes: 30 });
    expect(instruction).toContain('Return the sum of the numbers.');
    expect(instruction).toContain('empty: Return 0.');
    expect(instruction).toContain('What if the numbers overflow?');
    expect(instruction).toContain('interview complete');
    for (const hint of SUM_PROBLEM.hints) expect(instruction).not.toContain(hint);
    expect(opener).toBe("Hi, I'm ready.");
  });

  it('reads the coding round from a stored interview block, and ignores an invalid one', () => {
    expect(parseCodingConfig({ coding: config })?.problems[0].id).toBe('sum');
    expect(parseCodingConfig({ coding: { problems: [] } })).toBeNull();
    expect(parseCodingConfig(null)).toBeNull();
  });
});

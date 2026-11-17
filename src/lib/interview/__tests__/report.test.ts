import { describe, expect, it } from 'vitest';
import { resolveInterviewSetup } from '../personas';
import { buildInterviewReportMessages, hasAnswers, parseInterviewReport } from '../report';

const config = {
  questions: [
    { id: 'plan', kind: 'must_know', ask: 'The six weeks?', tests: 'playbook', key_points: ['week 1', 'week 2'], drill: '00-plan' },
  ],
};
const drills = [
  { slug: '00-plan', title: 'Los 6 hitos', text_en: 'Week one is the schema. Week two is the links.' },
  { slug: '03-links', title: 'Links', text_en: 'Each link lives 120 seconds.' },
];

describe('interview report', () => {
  it('gives the reporter the answer key with the canonical must-know answer and only real drill slugs', () => {
    const { system, user } = buildInterviewReportMessages({
      setup: resolveInterviewSetup(config),
      drills,
      sections: [{ title: 'Links', content: 'Signed for 120 s.' }],
      transcript: [
        { role: 'model', text: 'Walk me through the six weeks.' },
        { role: 'user', text: 'Week one is the schema and then I am not sure.' },
      ],
    });
    expect(system).toContain('Never invent a slug');
    expect(user).toContain('Canonical answer: Week one is the schema. Week two is the links.');
    expect(user).toContain('- 03-links: Links');
    expect(user).toContain('CANDIDATE: Week one is the schema');
  });

  it('keeps at most three practice drills, only ones the lesson has, without repeats', () => {
    const report = parseInterviewReport(
      {
        summary: 'Bien.',
        questions: [{ question: 'Six weeks?', score: '1', good: 'La semana uno.' }],
        practice: [
          { drill: '00-plan', why: 'a' },
          { drill: 'made-up', why: 'b' },
          { drill: '00-plan', why: 'c' },
          { drill: '03-links', why: 'd' },
        ],
      },
      new Set(drills.map((d) => d.slug)),
    );
    expect(report.questions[0].score).toBe(1);
    expect(report.questions[0].good).toBe('La semana uno.');
    expect(report.questions[0].missing).toEqual([]);
    expect(report.questions[0].better).toBe('');
    expect(report.practice.map((p) => p.drill)).toEqual(['00-plan', '03-links']);
    expect(report.misconceptions).toEqual([]);
  });

  it('asks per question for what was right, what was missing and how to say it better, and checks the key terms', () => {
    const { system, user } = buildInterviewReportMessages({
      setup: resolveInterviewSetup({ ...config, key_terms: ['Valley of Guardians'] }),
      drills,
      sections: [],
      transcript: [
        { role: 'model', text: 'Walk me through the six weeks.' },
        { role: 'user', text: 'Week one is the schema and then I am not sure.' },
      ],
    });
    expect(system).toContain('"good":');
    expect(system).toContain('"missing":');
    expect(system).toContain('"better": "how to say it better');
    expect(system).toContain('The interviewer gave no feedback during the call');
    expect(user).toContain('KEY TERMS (check under "terms"): Valley of Guardians');
  });

  it('needs at least one real answer', () => {
    expect(hasAnswers([{ role: 'model', text: 'Hi!' }, { role: 'user', text: 'ok' }])).toBe(false);
    expect(hasAnswers([{ role: 'user', text: 'I start with the schema' }])).toBe(true);
  });
});

describe('presentation report', () => {
  it('judges the talk as the first entry and writes the summary in neutral Spanish', () => {
    const setup = resolveInterviewSetup({ ...config, mode: 'presentation' });
    const { system } = buildInterviewReportMessages({ setup, drills, sections: [], transcript: [{ role: 'user', text: 'Data integrity means the data can be trusted.' }] });
    expect(system).toContain('rehearsal of a short work presentation');
    expect(system).toContain('neutral Latin American Spanish (tú, never vos)');
    expect(system).not.toContain('rioplatense');
    const interview = buildInterviewReportMessages({ setup: resolveInterviewSetup(config), drills, sections: [], transcript: [] });
    expect(interview.system).toContain('rioplatense Spanish (vos)');
  });
});

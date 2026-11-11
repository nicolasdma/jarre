import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CURVEBALLS,
  DEFAULT_INTERVIEW_PERSONAS,
  interviewPersonas,
  parseInterviewConfig,
  pickCurveballs,
  resolveInterviewSetup,
} from '../personas';

const lessonConfig = {
  context: 'A call with a founder.',
  default_persona: 'nathalie',
  personas: [
    {
      id: 'nathalie', name: 'Nathalie', label: 'Nathalie', blurb: 'Founder.', role: 'the founder',
      tone: 'relaxed', focus: 'the product', pushback: 'vague answers', technical: 'medium',
    },
    {
      id: 'expert', name: 'Ada', label: 'Ada', blurb: 'Lesson expert.', role: 'a lesson-specific expert',
      tone: 'calm', focus: 'edge cases', pushback: 'hand-waving', technical: 'high',
    },
  ],
};

describe('interview personas', () => {
  it('gives any lesson the default interviewers, one of them tough', () => {
    const setup = resolveInterviewSetup(null);
    expect(setup.personas.map((p) => p.id)).toEqual(['recruiter', 'tech-lead', 'expert', 'worried-client', 'skeptical-client', 'relaxed-founder']);
    expect(setup.personas.find((p) => p.id === 'skeptical-client')?.toughness).toBe('tough');
    expect(setup.persona.toughness).toBe('standard');
    expect(setup.persona.id).toBe('recruiter');
    expect(setup.depth).toBe(2);
    expect(setup.context).toBeNull();
  });

  it('puts lesson personas first, overrides a default by id, and honors default_persona', () => {
    const setup = resolveInterviewSetup(lessonConfig);
    expect(setup.persona.id).toBe('nathalie');
    expect(setup.personas[0].id).toBe('nathalie');
    expect(setup.personas.filter((p) => p.id === 'expert')).toHaveLength(1);
    expect(setup.personas.find((p) => p.id === 'expert')?.name).toBe('Ada');
    expect(setup.personas).toHaveLength(DEFAULT_INTERVIEW_PERSONAS.length + 1);
  });

  it('takes the chosen persona and depth, and ignores unknown ones', () => {
    expect(resolveInterviewSetup(lessonConfig, { personaId: 'worried-client', depth: 3 }).persona.id).toBe('worried-client');
    const fallback = resolveInterviewSetup(lessonConfig, { personaId: 'nobody', depth: 7 });
    expect(fallback.persona.id).toBe('nathalie');
    expect(fallback.depth).toBe(2);
  });

  it('falls back to defaults when the stored config is invalid', () => {
    expect(parseInterviewConfig({ personas: [{ id: 'Bad Id' }] }).personas).toEqual([]);
    expect(interviewPersonas(parseInterviewConfig('garbage'))).toEqual(DEFAULT_INTERVIEW_PERSONAS);
  });

  it('keeps the lesson question bank apart from its curveballs, and lets a lesson override a default curveball', () => {
    const setup = resolveInterviewSetup({
      ...lessonConfig,
      key_terms: ['row-level security'],
      questions: [
        { id: 'links', kind: 'core', ask: 'How long do links live?', tests: 'signed-urls', key_points: ['120 seconds per link'] },
        { id: 'plan', kind: 'must_know', ask: 'The six weeks?', tests: 'playbook', key_points: ['week 1', 'week 2'], drill: '00-plan' },
        { id: 'cb-rate', kind: 'curveball', ask: 'Why that price?', tests: 'deal', key_points: ['the posted price'] },
        { id: 'cb-refund', kind: 'curveball', ask: 'Refunds?', tests: 'ledger', key_points: ['reversing entries'] },
      ],
    });
    expect(setup.questions.map((q) => q.id)).toEqual(['links', 'plan']);
    expect(setup.questions[0].misconceptions).toEqual([]);
    expect(setup.keyTerms).toEqual(['row-level security']);
    expect(setup.curveballs.filter((q) => q.id === 'cb-rate')).toHaveLength(1);
    expect(setup.curveballs.find((q) => q.id === 'cb-rate')?.ask).toBe('Why that price?');
    expect(setup.curveballs).toHaveLength(DEFAULT_CURVEBALLS.length + 1);
  });

  it('throws more curveballs at higher depth and with a tough persona', () => {
    expect(resolveInterviewSetup(lessonConfig, { depth: 1 }).curveballCount).toBe(1);
    expect(resolveInterviewSetup(lessonConfig, { depth: 2 }).curveballCount).toBe(2);
    expect(resolveInterviewSetup(lessonConfig, { depth: 3 }).curveballCount).toBe(4);
    expect(resolveInterviewSetup(null, { personaId: 'skeptical-client', depth: 3 }).curveballCount).toBe(5);
  });

  it('draws different curveballs from a different random source, never more than asked', () => {
    const seq = (xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };
    const one = pickCurveballs(DEFAULT_CURVEBALLS, 3, new Set(), seq([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])).map((q) => q.id);
    const two = pickCurveballs(DEFAULT_CURVEBALLS, 3, new Set(), seq([0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1])).map((q) => q.id);
    expect(one).toHaveLength(3);
    expect(new Set(one).size).toBe(3);
    expect(one).not.toEqual(two);
    expect(pickCurveballs(DEFAULT_CURVEBALLS, 0, new Set())).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_INTERVIEW_PERSONAS, interviewPersonas, parseInterviewConfig, resolveInterviewSetup } from '../personas';

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
  it('gives any lesson the five default interviewers', () => {
    const setup = resolveInterviewSetup(null);
    expect(setup.personas.map((p) => p.id)).toEqual(['recruiter', 'tech-lead', 'expert', 'worried-client', 'relaxed-founder']);
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
});

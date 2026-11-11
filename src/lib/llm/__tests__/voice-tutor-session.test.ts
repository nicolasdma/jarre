import { describe, expect, it } from 'vitest';
import { buildInterviewSession, buildLearningSession, lessonForPrompt } from '../voice-tutor-session';
import { resolveInterviewSetup } from '../../interview/personas';

const lesson = {
  title: 'Brivel call',
  sections: [
    { title: 'RLS', content: 'RLS is evaluated on every query.' },
    { title: 'Signed URLs', content: 'Links expire after 120 seconds.' },
    { title: 'Payments', content: 'The postback is the source of truth.' },
  ],
  drills: [{ title: '¿Usaste Centrobill?', text_en: 'Not Centrobill specifically.' }],
};

describe('learning session', () => {
  it('carries the whole lesson with the studied section marked, and the language anchor last', () => {
    const { instruction, opener, language } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 1 });
    for (const s of lesson.sections) expect(instruction).toContain(s.content);
    expect(instruction).toContain('Signed URLs (THE SECTION BEING STUDIED NOW)');
    expect(instruction.trim().endsWith('as an Argentine developer says them.')).toBe(true);
    expect(language).toBe('es');
    expect(opener).toMatch(/lección/);
  });

  it('never asks for silent reasoning or revoicing, and forbids echoing the learner', () => {
    const { instruction } = buildLearningSession({ language: 'en', lesson, focusSectionIndex: 0 });
    expect(instruction).not.toMatch(/INTERNAL REASONING|REVOICING/i);
    expect(instruction).toContain('DO NOT repeat or paraphrase what the learner just said');
    expect(instruction).toContain('session complete');
  });

  it('cuts other sections, never the studied one, when the lesson is long', () => {
    const big = { title: 'Big', sections: Array.from({ length: 6 }, (_, i) => ({ title: `S${i}`, content: `${i}`.repeat(20_000) })) };
    const text = lessonForPrompt(big, 2);
    expect(text).toContain('2'.repeat(20_000));
    expect(text.length).toBeLessThan(60_000);
    expect(text).toContain('[…]');
  });
});

describe('interview session', () => {
  it('plays the chosen persona at the chosen depth, with the prepared answers as reference', () => {
    const setup = resolveInterviewSetup(null, { personaId: 'worried-client', depth: 3 });
    const { instruction, language } = buildInterviewSession({ lesson, setup });
    expect(language).toBe('en');
    expect(instruction).toContain(`you play ${setup.persona.name}`);
    expect(instruction).toContain(setup.persona.pushback);
    expect(instruction).toContain('up to two follow-ups');
    expect(instruction).toContain('Not Centrobill specifically.');
    expect(instruction).toContain('interview complete');
    expect(instruction).toContain('Feedback:');
  });
});

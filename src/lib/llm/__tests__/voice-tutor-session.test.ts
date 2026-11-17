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
  drills: [
    { slug: '07-centrobill', title: '¿Usaste Centrobill?', text_en: 'Not Centrobill specifically.' },
    { slug: '00-plan', title: 'Los 6 hitos', text_en: 'Week one is the schema. Week two is the signed links.' },
  ],
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
    expect(instruction).toContain(`You play ${setup.persona.name}`);
    expect(instruction).toContain(setup.persona.pushback);
    expect(instruction).toContain('up to two follow-ups');
    expect(instruction).toContain('Not Centrobill specifically.');
    expect(instruction).toContain('interview complete');
  });

  const bank = {
    key_terms: ['Valley of Guardians', 'row-level security'],
    personas: [
      { id: 'tough', name: 'Nat', label: 'Nat', blurb: 'b', role: 'the founder', tone: 'brisk', focus: 'f', pushback: 'p', technical: 'medium', toughness: 'tough' },
    ],
    questions: [
      {
        id: 'links', kind: 'core', ask: 'How long does a link live?', tests: 'signed-urls',
        key_points: ['each link expires 120 seconds after it is signed'],
        misconceptions: ['links expire every two minutes as a global timer'],
      },
      { id: 'plan', kind: 'must_know', ask: 'The six weeks?', tests: 'playbook', key_points: ['week 1 schema', 'week 2 links'], drill: '00-plan' },
      { id: 'cb-refund', kind: 'curveball', ask: 'Refunds and chargebacks?', tests: 'ledger', key_points: ['reversing ledger entries'] },
    ],
  };

  it('judges silently against the answer key: key points, misconceptions and the canonical must-know answer', () => {
    const setup = resolveInterviewSetup(bank, { personaId: 'tough', depth: 2 });
    const { instruction } = buildInterviewSession({ lesson, setup, random: () => 0 });
    expect(instruction).toContain('each link expires 120 seconds after it is signed');
    expect(instruction).toContain('Catch these misconceptions: links expire every two minutes as a global timer');
    expect(instruction).toContain('MUST KNOW BY HEART');
    expect(instruction).toContain('The canonical answer, item by item: Week one is the schema.');
    expect(instruction).toContain('in silence: it decides your next question, and you never say the result');
  });

  it('only interviews, like a real call: no feedback, corrections or praise between questions, nor at the end', () => {
    // The owner (2026-11-16): feedback in the middle of each question, no; at the end, in writing.
    for (const depth of [1, 2, 3] as const) {
      for (const personaId of ['tough', 'recruiter', 'expert']) {
        const { instruction } = buildInterviewSession({ lesson, setup: resolveInterviewSetup(bank, { personaId, depth }), random: () => 0 });
        expect(instruction).toContain('You never coach, correct or evaluate out loud');
        expect(instruction).toContain('No feedback, no summary of how they did, no advice');
        expect(instruction).toContain('the full feedback comes in writing at the end');
        expect(instruction).not.toMatch(/starting with "Feedback:"|You didn't say \.\.\."|"you said \.\.\., say \.\.\."|Say X clearly|give the feedback|step out of character/);
        const asksForFeedback = instruction
          .split(/(?<=[.:])\s/)
          .filter((s) => /feedback/i.test(s))
          .filter((s) => !/no feedback|no "Feedback:"|feedback in writing|feedback comes in writing|asks for feedback/i.test(s));
        expect(asksForFeedback).toEqual([]);
      }
    }
  });

  it('follows up on the candidate own words without revealing the answer', () => {
    const setup = resolveInterviewSetup(bank, { personaId: 'tough', depth: 2 });
    const { instruction } = buildInterviewSession({ lesson, setup, random: () => 0 });
    expect(instruction).toContain('Decide in this order');
    expect(instruction).toContain("built on the candidate's OWN words");
    expect(instruction).toContain('never as a correction');
    expect(instruction).toContain('At most a short neutral acknowledgment');
    expect(instruction).toContain('Sorry, be specific');
  });

  it('throws the drawn curveballs, more for a tough persona at depth 3', () => {
    const tough = buildInterviewSession({ lesson, setup: resolveInterviewSetup(bank, { personaId: 'tough', depth: 3 }), random: () => 0.5 });
    expect(tough.instruction).toContain('Throw these 5');
    expect(tough.instruction).toContain('Refunds and chargebacks?');
    const calm = buildInterviewSession({ lesson, setup: resolveInterviewSetup(null, { personaId: 'recruiter', depth: 1 }), random: () => 0.5 });
    expect(calm.instruction).toContain('Throw these 1,');
    expect(calm.instruction).not.toContain('Sorry, be specific');
  });
});

describe('learning session: who ends it, and Spanish then English', () => {
  it('asks before ending and says the end phrase only after the learner agrees', () => {
    const { instruction } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 0 });
    expect(instruction).toContain('You never end it on your own judgment');
    expect(instruction).toContain('ASK whether they want to keep going');
    expect(instruction).toContain('only right after the learner explicitly says to finish');
    expect(instruction).not.toContain('Spanish first, then English');
  });

  it('works each idea in Spanish and then in English when the lesson practices English', () => {
    const { instruction } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 0, bilingual: true });
    const es = instruction.indexOf('Work it in Spanish');
    const en = instruction.indexOf('say that same idea in English');
    expect(es).toBeGreaterThan(0);
    expect(en).toBeGreaterThan(es);
    expect(instruction).toContain('"you said ..., say ..."');
    expect(instruction.trim().endsWith('as an Argentine developer says them.')).toBe(true);
    expect(instruction).toContain('except the English words you quote in a correction');
  });

  it('ignores the bilingual flag for an English session', () => {
    const { instruction } = buildLearningSession({ language: 'en', lesson, focusSectionIndex: 0, bilingual: true });
    expect(instruction).not.toContain('Spanish first, then English');
  });
});

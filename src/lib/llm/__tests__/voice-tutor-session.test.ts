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
  it('carries the map of the lesson, the studied section in full, and the language anchor last', () => {
    const { instruction, opener, language } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 1 });
    for (const s of lesson.sections) expect(instruction).toContain(s.title);
    expect(instruction).toContain(lesson.sections[1].content);
    expect(instruction).toContain('2. Signed URLs  ← THE SECTION BEING STUDIED NOW');
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

  it('opens with a realistic arc (greeting + framing + ease-in), never a cold hard question', () => {
    // The owner (2026-11-17): the mock cold-opened with "Walk me through how you
    // would solve Two Sum, and the complexity" — not how a real call starts.
    for (const personaId of ['recruiter', 'tech-lead', 'expert', 'relaxed-founder', 'skeptical-client']) {
      const { instruction } = buildInterviewSession({ lesson, setup: resolveInterviewSetup(null, { personaId, depth: 2 }) });
      expect(instruction).toContain('How the interview opens');
      // arc: greet, then frame the call, then ease into (not cold-dump) a question.
      expect(instruction).toContain('Greet them as');
      expect(instruction).toContain('One line that frames the call');
      expect(instruction).toContain('Never open by dumping a hard problem');
      expect(instruction).toContain('Do not cold-open with a hard question or a problem to solve');
      // the old cold first-turn line is gone.
      expect(instruction).not.toContain('one sentence of greeting as');
    }
  });

  it('each persona opens and paces differently from the same lesson', () => {
    const warm = buildInterviewSession({ lesson, setup: resolveInterviewSetup(null, { personaId: 'recruiter', depth: 1 }) }).instruction;
    const relaxed = buildInterviewSession({ lesson, setup: resolveInterviewSetup(null, { personaId: 'relaxed-founder', depth: 2 }) }).instruction;
    const hard = buildInterviewSession({ lesson, setup: resolveInterviewSetup(null, { personaId: 'skeptical-client', depth: 3 }) }).instruction;
    // Warm, non-technical recruiter builds rapport and eases in.
    expect(warm).toContain('warm, a word of rapport');
    expect(warm).toContain('ease into an opening question');
    expect(warm).not.toContain('go straight to a direct first question');
    // Relaxed founder makes small talk first, still eases in.
    expect(relaxed).toContain('a touch of small talk');
    expect(relaxed).toContain('ease into an opening question');
    // Skeptical (tough) client skips small talk and goes straight in.
    expect(hard).toContain('short and dry, no small talk');
    expect(hard).toContain('go straight to a direct first question');
    expect(hard).not.toContain('warm, a word of rapport');
    expect(hard).toContain('Sorry, be specific'); // still cuts vague answers
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
    const es = instruction.indexOf('Work the idea in Spanish');
    const en = instruction.indexOf('Ask for English only after their OWN answers in Spanish showed they understood');
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

// The owner's three sessions of 2026-11-18 (~/Desktop/_revisar/jarre-tutor/2026-11-18-charlas.md).
describe('learning session: teaches on request, corrects every wrong claim, English only when earned', () => {
  const es = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 0, bilingual: true }).instruction;
  const en = buildLearningSession({ language: 'en', lesson, focusSectionIndex: 0 }).instruction;

  it('teaches when asked, step by step with a concrete example, then one light check (ac028b04: "Acá no explicamos")', () => {
    for (const instruction of [es, en]) {
      expect(instruction).toContain('When they ask you to explain (this always wins over quizzing)');
      expect(instruction).toContain('"explicame", "no entiendo"');
      expect(instruction).toContain('"empecemos desde el principio"');
      expect(instruction).toContain('Never refuse, never say the session is only for practice');
      expect(instruction).toContain('ONE small concrete example with real values');
      expect(instruction).toContain('Only then check understanding with ONE light question');
      // The quiz-only framing that produced the refusal is gone.
      expect(instruction).not.toMatch(/never lecture/i);
      expect(instruction).not.toContain('directly and briefly');
    }
    // The explanation comes before the turn rules, so it overrides "ask ONE question".
    expect(es.indexOf('When they ask you to explain')).toBeLessThan(es.indexOf('# How every turn works'));
  });

  it('asks for English only after understanding, once per idea, never after an explanation, and stops after push-back', () => {
    expect(es).toContain('never right after they asked you to explain or said they don\'t understand');
    expect(es).toContain('Never ask for English in the same turn as an explanation');
    expect(es).toContain('At most once per key idea');
    expect(es).toContain('"qué pesado con la entrevista"');
    expect(es).toContain('stop asking for English for the rest of the session');
    // The old "for every key idea" cadence is gone.
    expect(es).not.toContain('(for every key idea)');
    expect(es).toContain('No English request in this turn.');
  });

  it('corrects every wrong or partly wrong claim before moving on (a94efc5c: the "stale number" reason passed)', () => {
    for (const instruction of [es, en]) {
      expect(instruction).toContain('Every wrong or partly wrong claim gets corrected explicitly before anything else');
      expect(instruction).toContain('also when the same turn asks you something or asks you to explain');
      expect(instruction).toContain('A reason that sounds plausible but is not the lesson\'s reason is wrong');
      expect(instruction).toContain('never let it pass in silence');
      expect(instruction).toContain('That ban is on praise, not on corrections');
    }
  });

  it('corrects first what last time left uncorrected, instead of re-quizzing it cold (d14a09c0)', () => {
    const { instruction } = buildLearningSession({
      language: 'es',
      lesson,
      focusSectionIndex: 0,
      previousSummary: '- Said the map is checked first to avoid a stale number; not corrected.',
    });
    expect(instruction).toContain('correct it first, plainly, with the right version; do not quiz them on it cold again');
  });

  it('keeps repeating simpler on request', () => {
    expect(es).toContain('They ask you to repeat: repeat the question in fewer, simpler words.');
  });
});

describe('presentation session (interview mode "presentation")', () => {
  const talk = {
    mode: 'presentation',
    context: 'A 5-minute talk with 2 slides at a CRO team meeting.',
    personas: [
      { id: 'manager', name: 'Laura', label: 'Tu jefa', blurb: 'b', role: 'the clinical operations manager', tone: 'calm', focus: 'f', pushback: 'p', technical: 'high', toughness: 'standard' },
    ],
    questions: [
      { id: 'talk', kind: 'core', ask: 'Please go ahead with your presentation.', tests: 'talk', key_points: ['defines data integrity', 'the nine ALCOA+ attributes'] },
      { id: 'cb-alcoa-plus-plus', kind: 'curveball', ask: 'What is ALCOA++?', tests: 'alcoa', key_points: ['adds Traceable'] },
    ],
  };

  it('uses only the lesson personas and curveballs: no freelance-call defaults', () => {
    const setup = resolveInterviewSetup(talk, { depth: 3 });
    expect(setup.mode).toBe('presentation');
    expect(setup.personas.map((p) => p.id)).toEqual(['manager']);
    expect(setup.curveballs.map((q) => q.id)).toEqual(['cb-alcoa-plus-plus']);
    expect(setup.curveballCount).toBe(1);
  });

  it('lets the presenter give the whole talk first, then asks a few questions without feedback', () => {
    const { instruction, opener, language } = buildInterviewSession({ lesson, setup: resolveInterviewSetup(talk, { depth: 1 }), random: () => 0 });
    expect(language).toBe('en');
    expect(opener).toMatch(/present/);
    expect(instruction).toContain('You play Laura, the clinical operations manager');
    expect(instruction).toContain('Never interrupt the talk');
    expect(instruction).toContain('After about 3 questions after the talk');
    expect(instruction).toContain('What is ALCOA++?');
    expect(instruction).toContain('You never coach, correct or evaluate out loud');
    expect(instruction).toContain('interview complete');
    expect(instruction).not.toMatch(/Upwork|job interview|developer/);
  });

  it('keeps the interview mock unchanged without the mode', () => {
    const setup = resolveInterviewSetup(null);
    expect(setup.mode).toBe('interview');
    expect(buildInterviewSession({ lesson, setup }).instruction).toContain('mock job interview');
  });
});

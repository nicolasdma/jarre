import { describe, expect, it, vi } from 'vitest';
import {
  buildRecallEvalMessages,
  drillQuestionFromInterview,
  evaluateRecallAnswer,
  isJudgeable,
  parseRecallEvaluation,
  requestRecallJudgement,
  settleRating,
  type RecallEvalInput,
  type RecallEvalModel,
} from '../recall-eval';

/** A real drill shape: one question, a reference with three rules, phrases split by " / ". */
const QUESTION = 'Tell me one rule in your agent instructions that exists because an agent got something wrong.';
const REFERENCE =
  'One rule says: verify on the commit, not on the working tree. / An agent reported green while the main branch did not compile, / because it had tested files that were never committed. / ' +
  'Another says: one heavy job at a time. / Several agents ran browsers at once and the machine stopped responding. / ' +
  'And a third: every number is quoted with the command that produced it.';

const base: Omit<RecallEvalInput, 'transcript'> = { question: QUESTION, reference: REFERENCE };

/** Hand-made transcripts, as a recognizer writes them: no punctuation, some noise. */
const TRANSCRIPTS = {
  goodOtherWords:
    'yeah so one of them is always check against what is actually committed because once an agent told me everything passed but main was broken it tested files that never got committed and another one is only one heavy task at the same time because many browsers froze my computer',
  mainIdeaOnly: 'I have a rule that says you verify on the commit because an agent said green and main did not compile',
  rambling: 'well I like working with agents a lot I think they are the future and I use them every day for many things in my projects and it is really fun',
  empty: '',
};

/** A model that answers with a fixed JSON and records what it was sent. */
function fakeModel(reply: unknown): RecallEvalModel & { calls: { system: string; user: string }[] } {
  const calls: { system: string; user: string }[] = [];
  const model = (async (messages: { system: string; user: string }) => {
    calls.push(messages);
    return { content: typeof reply === 'string' ? reply : JSON.stringify(reply), tokensUsed: 700 };
  }) as RecallEvalModel & { calls: typeof calls };
  model.calls = calls;
  return model;
}

const IDEAS = {
  commit: 'Verificar sobre el commit, no sobre el árbol de trabajo: un agente reportó verde con main sin compilar',
  heavy: 'Un solo trabajo pesado a la vez: varios navegadores colgaron la máquina',
  numbers: 'Cada número se cita con el comando que lo produjo',
};

describe('the prompt', () => {
  it('sends the question, the reference as prose and the transcript, and asks for a lenient reading', () => {
    const { system, user } = buildRecallEvalMessages({ ...base, transcript: TRANSCRIPTS.goodOtherWords });
    expect(user).toContain(`QUESTION: ${QUESTION}`);
    expect(user).toContain('verify on the commit, not on the working tree. An agent reported green');
    expect(user).not.toContain(' / ');
    expect(user).toContain('always check against what is actually committed');
    expect(system).toContain('NOT strict');
    expect(system).toContain('judge only its 2 to 4 main ideas');
    expect(system).toContain('one of them told with its concrete detail is a complete answer');
    expect(system).toContain('rioplatense');
  });

  it('adds the key points when the lesson has them and says when the timer cut the answer', () => {
    const { user } = buildRecallEvalMessages({ ...base, transcript: 'a b c', keyPoints: ['a real incident', ' '], cutOff: true });
    expect(user).toContain('WHAT A COMPLETE ANSWER SAYS:\n- a real incident\n');
    expect(user).toContain('cut off by the timer');
    expect(buildRecallEvalMessages({ ...base, transcript: 'a b c' }).user).not.toContain('WHAT A COMPLETE ANSWER SAYS');
  });

  it('caps a runaway transcript', () => {
    const { user } = buildRecallEvalMessages({ ...base, transcript: 'word '.repeat(5000) });
    expect(user.length).toBeLessThan(REFERENCE.length + 4600);
  });
});

describe('the four answers', () => {
  it('a good answer in other words: got, with what was said and the one idea left out', async () => {
    const model = fakeModel({
      answered: true,
      ideas: [
        { idea: IDEAS.commit, said: true },
        { idea: IDEAS.heavy, said: true },
        { idea: IDEAS.numbers, said: false },
      ],
      rating: 'got',
      tip: 'Sumá la tercera regla si te sobra tiempo.',
    });
    const out = await evaluateRecallAnswer({ ...base, transcript: TRANSCRIPTS.goodOtherWords }, model);
    expect(model.calls).toHaveLength(1);
    expect(out).toEqual({
      kind: 'evaluated',
      tokensUsed: 700,
      evaluation: { rating: 'got', said: [IDEAS.commit, IDEAS.heavy], missing: [IDEAS.numbers], tip: 'Sumá la tercera regla si te sobra tiempo.', answered: true },
    });
  });

  it('only the main idea, short: the grade the judge gives stands, and it is never pushed down to missed', async () => {
    const ideas = [
      { idea: IDEAS.commit, said: true },
      { idea: IDEAS.heavy, said: false },
      { idea: IDEAS.numbers, said: false },
    ];
    const lenient = await evaluateRecallAnswer({ ...base, transcript: TRANSCRIPTS.mainIdeaOnly }, fakeModel({ answered: true, ideas, rating: 'got', tip: '' }));
    expect(lenient.kind === 'evaluated' && lenient.evaluation.rating).toBe('got');
    expect(lenient.kind === 'evaluated' && lenient.evaluation.missing).toEqual([IDEAS.heavy, IDEAS.numbers]);

    // With two ideas and one said, a judge that says "missed" is contradicting its own list.
    const harsh = await evaluateRecallAnswer(
      { ...base, transcript: TRANSCRIPTS.mainIdeaOnly },
      fakeModel({ answered: true, ideas: ideas.slice(0, 2), rating: 'missed', tip: '' }),
    );
    expect(harsh.kind === 'evaluated' && harsh.evaluation.rating).toBe('partial');
  });

  it('an answer that wanders off: missed, even if the judge is generous', async () => {
    const out = await evaluateRecallAnswer(
      { ...base, transcript: TRANSCRIPTS.rambling },
      fakeModel({
        answered: false,
        ideas: [
          { idea: IDEAS.commit, said: false },
          { idea: IDEAS.heavy, said: false },
        ],
        rating: 'partial',
        tip: 'Nombrá una regla concreta y el error que la originó.',
      }),
    );
    expect(out.kind === 'evaluated' && out.evaluation).toMatchObject({ rating: 'missed', said: [], answered: false });
    expect(out.kind === 'evaluated' && out.evaluation.tip).toContain('regla concreta');
  });

  it('an empty answer: no model call at all', async () => {
    const model = fakeModel({ rating: 'got' });
    expect(await evaluateRecallAnswer({ ...base, transcript: TRANSCRIPTS.empty }, model)).toEqual({ kind: 'empty' });
    expect(await evaluateRecallAnswer({ ...base, transcript: '  um  yeah ' }, model)).toEqual({ kind: 'empty' });
    expect(model.calls).toHaveLength(0);
    expect(isJudgeable('I verify commits')).toBe(true);
  });
});

describe('the grade that stands', () => {
  it('follows the judge unless it contradicts its own list, always toward the learner', () => {
    expect(settleRating('partial', true, 3, 3)).toBe('got');
    expect(settleRating('got', true, 1, 3)).toBe('got');
    expect(settleRating('partial', true, 1, 3)).toBe('partial');
    expect(settleRating('missed', true, 1, 3)).toBe('missed');
    expect(settleRating('missed', true, 2, 3)).toBe('partial');
    expect(settleRating('got', true, 0, 3)).toBe('partial');
    expect(settleRating('got', false, 0, 3)).toBe('missed');
    expect(settleRating('got', false, 1, 3)).toBe('partial');
    expect(settleRating('got', true, 0, 0)).toBe('got');
  });
});

describe('the reply', () => {
  it('reads fenced JSON, trims, and keeps at most four ideas', () => {
    const e = parseRecallEvaluation(
      '```json\n' +
        JSON.stringify({
          rating: 'partial',
          tip: '  Decí el número.  ',
          ideas: ['a', 'b', 'c', 'd', 'e'].map((idea, i) => ({ idea: ` ${idea} `, said: i === 0 })),
        }) +
        '\n```',
    );
    expect(e).toEqual({ rating: 'partial', said: ['a'], missing: ['b', 'c', 'd'], tip: 'Decí el número.', answered: true });
  });

  it('throws on a reply that is not the contract, so the caller falls back', async () => {
    expect(() => parseRecallEvaluation('not json')).toThrow();
    expect(() => parseRecallEvaluation(JSON.stringify({ rating: 'excellent' }))).toThrow();
    await expect(evaluateRecallAnswer({ ...base, transcript: TRANSCRIPTS.mainIdeaOnly }, fakeModel('Sure! Here is my review'))).rejects.toThrow();
    const down: RecallEvalModel = async () => {
      throw new Error('DeepSeek API error (503)');
    };
    await expect(evaluateRecallAnswer({ ...base, transcript: TRANSCRIPTS.mainIdeaOnly }, down)).rejects.toThrow('503');
  });
});

describe("the drill's question in the interview block", () => {
  it('finds the ask and key points linked to the drill, and survives anything malformed', () => {
    const interview = {
      questions: [
        null,
        { drill: '02-rules', ask: '  ' },
        { drill: '02-rules', ask: ` ${QUESTION} `, key_points: ['a real incident', 3, ''] },
        { drill: '02-rules', ask: 'A later one' },
      ],
    };
    expect(drillQuestionFromInterview(interview, '02-rules')).toEqual({ ask: QUESTION, keyPoints: ['a real incident'] });
    expect(drillQuestionFromInterview(interview, 'other')).toBeNull();
    expect(drillQuestionFromInterview(null, '02-rules')).toBeNull();
    expect(drillQuestionFromInterview({ questions: 'x' }, '02-rules')).toBeNull();
  });
});

describe('what the mode gets (the client)', () => {
  const body = { resourceId: 'r1', drill: '02-rules', transcript: TRANSCRIPTS.mainIdeaOnly };
  const evaluation = { rating: 'partial', said: ['a'], missing: ['b'], tip: 'Decí el caso.', answered: true };
  const reply = (status: number, json: unknown) => vi.fn(async () => new Response(JSON.stringify(json), { status })) as unknown as typeof fetch;

  it('one request with the transcript, and the evaluation back', async () => {
    const fetcher = reply(200, { evaluation });
    expect(await requestRecallJudgement({ ...body, cutOff: true }, fetcher)).toEqual({ kind: 'evaluated', evaluation });
    const mock = fetcher as unknown as ReturnType<typeof vi.fn>;
    expect(mock).toHaveBeenCalledTimes(1);
    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/practice/recall-eval');
    expect(JSON.parse(init.body as string)).toEqual({ ...body, cutOff: true });
  });

  it('nothing heard: no request, the learner rates', async () => {
    const fetcher = reply(200, { evaluation });
    expect(await requestRecallJudgement({ ...body, transcript: '' }, fetcher)).toEqual({ kind: 'unheard' });
    expect(fetcher as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled();
    expect(await requestRecallJudgement(body, reply(200, { empty: true }))).toEqual({ kind: 'unheard' });
  });

  it('no network, an error, a limit or a broken reply: unavailable, never a throw', async () => {
    const offline = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    expect(await requestRecallJudgement(body, offline)).toEqual({ kind: 'unavailable' });
    expect(await requestRecallJudgement(body, reply(500, { error: 'Error interno del servidor' }))).toEqual({ kind: 'unavailable' });
    expect(await requestRecallJudgement(body, reply(429, { error: 'Monthly token limit exceeded' }))).toEqual({ kind: 'unavailable' });
    expect(await requestRecallJudgement(body, reply(200, { evaluation: { rating: 'great' } }))).toEqual({ kind: 'unavailable' });
    expect(await requestRecallJudgement(body, reply(200, {}))).toEqual({ kind: 'unavailable' });
  });
});

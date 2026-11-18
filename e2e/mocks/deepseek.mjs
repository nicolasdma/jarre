/**
 * Canned DeepSeek answers for the e2e harness (served by e2e/server/net-guard.mjs).
 *
 * A rule matches the request's messages (system + user, joined) and returns
 * the assistant `content` the route will parse. Rules are tried in order; the
 * first match wins. When nothing matches the reply is `{}`, and the route's
 * own validation decides what the learner sees: the report lists those calls
 * (net-guard log, decision "mock", rule "default") so the next round can add
 * a fixture.
 */
export const DEEPSEEK_RULES = [
  {
    // src/lib/practice/recall-eval.ts (Pregunta → respuesta, /api/practice/recall-eval)
    name: 'recall-eval',
    match: /friendly outside listener checking a spoken practice answer/i,
    reply: {
      answered: true,
      ideas: [
        { idea: 'La idea principal de la respuesta', said: true },
        { idea: 'El ejemplo concreto con su número', said: false },
      ],
      rating: 'partial',
      tip: 'Sumá el ejemplo concreto con su número.',
    },
  },
  {
    // src/lib/llm/prompts.ts buildGenerateQuestionsPrompt (/api/evaluate/generate)
    name: 'evaluate-generate',
    match: /(Generate \d+ evaluation questions|Gener[aá] \d+ preguntas de evaluaci[oó]n)/i,
    reply: {
      questions: [
        { type: 'explanation', conceptName: 'Big-O', question: '¿Qué mide la notación Big-O y por qué importa en una entrevista?' },
        { type: 'scenario', conceptName: 'Two Sum', question: 'Te piden Two Sum con un millón de elementos: ¿qué estructura usás y por qué?' },
        { type: 'tradeoff', conceptName: 'Hash map', question: '¿Qué cambiás en tiempo y en espacio al usar un hash map en vez de dos bucles?' },
      ],
    },
  },
  {
    // src/lib/llm/prompts.ts buildEvaluateAnswersPrompt (/api/evaluate/submit)
    name: 'evaluate-submit',
    match: /(Evaluate the following answers|Evalu[aá] (las )?(siguientes )?respuestas)/i,
    reply: {
      responses: [{ questionIndex: 0, isCorrect: true, score: 70, feedback: 'Bien encaminado; falta el caso borde.' }],
      overallScore: 70,
      summary: 'Respuesta de prueba del harness e2e.',
    },
  },
];

export function deepseekReply(messages) {
  const text = messages.map((m) => String(m?.content ?? '')).join('\n\n');
  for (const rule of DEEPSEEK_RULES) {
    if (rule.match.test(text)) return { rule: rule.name, content: typeof rule.reply === 'function' ? rule.reply(text) : rule.reply };
  }
  return { rule: 'default', content: {} };
}

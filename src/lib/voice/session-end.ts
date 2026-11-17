/**
 * When a voice session ends on its own, from what the tutor says.
 *
 * The tutor ends a session by saying an end phrase ("session complete"); the
 * hook listens for it in the model transcript. Who may trigger that depends on
 * the mode:
 * - default (eval, practice, debate…): the end phrase after 15 s, or a
 *   farewell ("chau", "bye") after 30 s.
 * - interview: only the end phrase; the interviewer closes the call in
 *   character (a goodbye) before saying it, so a farewell is not the end.
 * - learning: the learner decides, never the model. The owner (2026-11-11):
 *   the tutor cut him off mid-session with "Sesión completada": the model
 *   judged the ideas covered and said "session complete", and a passing
 *   "nos vemos" would have done the same. Now the end phrase counts only right
 *   after the learner agreed to finish or asked to stop, or after a generous
 *   10 minutes (when the agreement was said in words the regex does not know).
 *   Farewells never end it. The learner can always end with the button.
 */

export type SessionEndPolicy = 'default' | 'interview' | 'learning';

export const SESSION_END_STRONG_SIGNAL =
  /\b(session complete|interview complete|sesi[oó]n completa|entrevista completa|session completed|session ended|sesion terminada|sesión terminada|hemos terminado|con esto terminamos|terminamos aca|terminamos acá|that'?s all for today|we are done)\b/i;

export const SESSION_END_SOFT_SIGNAL =
  /\b(chau|chao|ciao|adios|adiós|hasta luego|hasta la proxima|hasta la próxima|nos vemos|bye|goodbye|see you|take care)\b/i;

const MIN_ELAPSED_FOR_STRONG_END_S = 15;
const MIN_ELAPSED_FOR_SOFT_END_S = 30;
/** Learning: without a recognized agreement, the end phrase counts only after this. */
export const LEARNING_MIN_UNCONFIRMED_END_S = 600;

/**
 * The learner agreed to finish or asked to stop (es/en), in their last
 * utterance. Plain "sí" counts: it is the answer to the tutor's "¿seguimos o
 * pasamos al quiz?", and the tutor only says the end phrase after that.
 */
const LEARNER_AGREES_TO_END =
  /\b(s[ií]|dale|listo|ok|okay|vamos|pasemos|terminemos|terminamos|termin[aá]|cortemos|cortamos|paremos|basta|suficiente|al quiz|quiero (terminar|parar|cortar)|yes|yeah|sure|let'?s (go|stop|finish|end)|stop|finish|end it|that'?s enough|go to the quiz)\b/i;

export function learnerAgreedToEnd(lastLearnerText: string | null | undefined): boolean {
  return !!lastLearnerText && LEARNER_AGREES_TO_END.test(lastLearnerText);
}

export interface SessionEndInput {
  policy: SessionEndPolicy;
  /** The last few hundred characters the model said. */
  modelWindow: string;
  elapsedS: number;
  /** What the learner said last, before this model turn. */
  lastLearnerText?: string | null;
}

export interface SessionEndDecision {
  end: boolean;
  /** The kind of phrase heard, even when it does not end the session. */
  signal: 'strong' | 'soft' | null;
  reason: string;
}

export function decideSessionEnd({ policy, modelWindow, elapsedS, lastLearnerText }: SessionEndInput): SessionEndDecision {
  const strong = SESSION_END_STRONG_SIGNAL.test(modelWindow);
  const soft = !strong && SESSION_END_SOFT_SIGNAL.test(modelWindow);
  if (!strong && !soft) return { end: false, signal: null, reason: 'no end phrase' };
  const signal = strong ? 'strong' : 'soft';

  if (policy === 'learning') {
    if (!strong) return { end: false, signal, reason: 'a farewell never ends a learning session' };
    if (learnerAgreedToEnd(lastLearnerText)) return { end: true, signal, reason: 'the learner agreed to finish' };
    if (elapsedS >= LEARNING_MIN_UNCONFIRMED_END_S) return { end: true, signal, reason: `end phrase after ${LEARNING_MIN_UNCONFIRMED_END_S}s` };
    return { end: false, signal, reason: 'end phrase without the learner agreeing' };
  }
  if (policy === 'interview' && !strong) return { end: false, signal, reason: 'a farewell is not the end of an interview' };
  const min = strong ? MIN_ELAPSED_FOR_STRONG_END_S : MIN_ELAPSED_FOR_SOFT_END_S;
  return elapsedS >= min
    ? { end: true, signal, reason: `${signal} end phrase after ${elapsedS}s` }
    : { end: false, signal, reason: `too early (${elapsedS}s < ${min}s)` };
}

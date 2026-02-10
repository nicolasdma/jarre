/**
 * Jarre - Review Evaluation Prompts
 *
 * v1: Simple score 0-100 prompt (~200 tokens).
 * v2: Rubric-based multi-dimensional evaluation (~630 tokens).
 *
 * Used by /api/review/submit to score user answers against expected answers.
 */

import type { SupportedLanguage } from './prompts';
import type { Rubric } from './rubrics';

export const REVIEW_PROMPT_VERSION = 'review-v2.0.0';

/**
 * Build the prompt for evaluating a single review answer.
 * Designed to be cheap: short prompt, short response.
 */
export function buildReviewEvaluationPrompt(params: {
  questionText: string;
  expectedAnswer: string;
  userAnswer: string;
  language?: SupportedLanguage;
}): string {
  const { questionText, expectedAnswer, userAnswer, language = 'es' } = params;

  if (language === 'en') {
    return `Compare my answer with the expected answer for this question.

Question: "${questionText}"
Expected answer: "${expectedAnswer}"
My answer: "${userAnswer}"

Score 0-100 based on accuracy and completeness. Address me directly using "you/your" in the feedback (1 sentence).

Respond in JSON:
{"score": 0-100, "feedback": "brief feedback addressing the user directly", "isCorrect": true|false}`;
  }

  return `Compará mi respuesta con la respuesta esperada para esta pregunta.

Pregunta: "${questionText}"
Respuesta esperada: "${expectedAnswer}"
Mi respuesta: "${userAnswer}"

Puntuá de 0-100 según precisión y completitud. Dirigite a mí directamente usando "tu/vos" en el feedback (1 oración).

Respondé en JSON:
{"score": 0-100, "feedback": "feedback breve dirigido al usuario con vos/tu", "isCorrect": true|false}`;
}

/**
 * System prompt for review evaluation (minimal, focused).
 */
export function getReviewSystemPrompt(language: SupportedLanguage = 'es'): string {
  if (language === 'en') {
    return `You are a technical tutor giving process-level feedback. Address the student as "you".
- Focus on the REASONING PROCESS: "Your reasoning about X was correct, but Y needs revision"
- NEVER say "incorrect" or "error" — use "not yet" or "partially"
- Always explain WHY the answer is correct/incorrect
- Connect feedback to the broader concept
- Maximum 3 sentences
- Respond only in JSON.`;
  }
  return `Sos un tutor técnico que da feedback a nivel de proceso. Dirigite al estudiante como "vos".
- Enfocate en el PROCESO DE RAZONAMIENTO: "Tu razonamiento sobre X fue correcto, pero Y necesita revisión"
- NUNCA digas "incorrecto" o "error" — usá "aún no" o "parcialmente"
- Siempre explicá POR QUÉ la respuesta es correcta/incorrecta
- Conectá el feedback con el concepto más amplio
- Máximo 3 oraciones
- Respondé solo en JSON.`;
}

// ============================================================================
// v2: Rubric-based evaluation prompts
// ============================================================================

/** Phase → domain description for system prompt context */
const PHASE_DOMAINS: Record<number, { es: string; en: string }> = {
  1: { es: 'sistemas distribuidos', en: 'distributed systems' },
  2: { es: 'LLMs y razonamiento', en: 'LLMs and reasoning' },
  3: { es: 'RAG, memoria y degradación', en: 'RAG, memory, and degradation' },
  4: { es: 'seguridad y guardrails de IA', en: 'AI safety and guardrails' },
  5: { es: 'inferencia, routing y economía de LLMs', en: 'LLM inference, routing, and economics' },
  6: { es: 'frameworks y arquitectura de agentes', en: 'agent frameworks and architecture' },
};

/**
 * Get the domain description for a concept's study phase.
 * Falls back to a generic description if phase is unknown.
 */
export function getDomainForPhase(phase: number, language: SupportedLanguage = 'es'): string {
  const lang = language === 'en' ? 'en' : 'es';
  return PHASE_DOMAINS[phase]?.[lang]
    || (lang === 'en' ? 'technical computer science topics' : 'temas técnicos de ciencias de la computación');
}

/**
 * System prompt for rubric-based evaluation.
 * Stricter than v1, with explicit anti-leniency instructions.
 * Domain is derived from the concept's study phase.
 */
export function getRubricSystemPrompt(params: {
  language?: SupportedLanguage;
  domain: string;
}): string {
  const { language = 'es', domain } = params;

  if (language === 'en') {
    return `You are a fair technical evaluator helping a student learn about ${domain}.
- Precision measures CORRECTNESS of what was said, NOT completeness. If the student said nothing factually wrong, precision MUST be 2.
- Completeness measures coverage of key points from the reference.
- Depth measures reasoning and understanding of why/how.
- Accept non-standard phrasings, spelling errors, and informal language if the understanding is correct.
- If there is a factual error, that ALWAYS lowers Precision to 0 or 1.
- NEVER say "incorrect" or "wrong" — use "not yet" or "partially"
- Focus on process: "Your reasoning about X was sound because... To go deeper, consider..."
- Feedback format: "Good: [what they got right]. Next step: [what to explore or deepen]." (max 3 sentences)
- Respond only in valid JSON.`;
  }

  return `Sos un evaluador técnico justo que ayuda a un estudiante a aprender sobre ${domain}.
- Precisión mide la CORRECTITUD de lo dicho, NO la completitud. Si el estudiante no dijo nada factualmente incorrecto, precisión DEBE ser 2.
- Completitud mide cobertura de los puntos clave de la referencia.
- Profundidad mide razonamiento y comprensión del por qué/cómo.
- Aceptá formulaciones no estándar, errores de ortografía y lenguaje informal si la comprensión es correcta.
- Si hay un error factual, eso SIEMPRE baja Precisión a 0 o 1.
- NUNCA digas "incorrecto" o "error" — usá "aún no" o "parcialmente"
- Enfocate en el proceso: "Tu razonamiento sobre X fue acertado porque... Para profundizar, considerá..."
- Formato del feedback: "Bien: [qué captó bien]. Siguiente paso: [qué explorar o profundizar]." (máx 3 oraciones)
- Respondé solo en JSON válido.`;
}

/**
 * Build the rubric-based evaluation prompt.
 * Includes the rubric inline so the LLM sees exact dimension definitions.
 */
export function buildRubricReviewPrompt(params: {
  conceptName: string;
  questionText: string;
  expectedAnswer: string;
  userAnswer: string;
  rubric: Rubric;
  language?: SupportedLanguage;
}): string {
  const { conceptName, questionText, expectedAnswer, userAnswer, rubric, language = 'es' } = params;
  const lang = language === 'en' ? 'en' : 'es';

  // Build rubric section
  const rubricLines = rubric.dimensions.map((dim, i) => {
    const l = dim.levels;
    return `${i + 1}. ${dim.name[lang]} (0-2):
   0 = ${l[0][lang]}
   1 = ${l[1][lang]}
   2 = ${l[2][lang]}`;
  }).join('\n');

  // Build expected JSON keys
  const keys = rubric.dimensions.map((d) => `"${d.key}":N`).join(',');

  if (lang === 'en') {
    return `[CONCEPT]: ${conceptName}
[QUESTION]: ${questionText}
[REFERENCE]: ${expectedAnswer}
(Guide, not absolute truth — accept different phrasings if correct.)
[ANSWER]: ${userAnswer}

[RUBRIC]:
${rubricLines}

[INSTRUCTIONS]:
1. Analyze the answer dimension by dimension. Quote specific text.
2. If there are factual errors, identify them explicitly.
3. Score each dimension: 0, 1, or 2.
4. Feedback: what's good + what's missing + how to improve (max 2 sentences).

JSON: {"reasoning":"...","scores":{${keys}},"feedback":"..."}`;
  }

  return `[CONCEPTO]: ${conceptName}
[PREGUNTA]: ${questionText}
[REFERENCIA]: ${expectedAnswer}
(Guía, no verdad absoluta — aceptá formulaciones diferentes si son correctas.)
[RESPUESTA]: ${userAnswer}

[RÚBRICA]:
${rubricLines}

[INSTRUCCIONES]:
1. Analizá la respuesta dimensión por dimensión. Citá texto específico.
2. Si hay errores factuales, identificalos explícitamente.
3. Puntuá cada dimensión: 0, 1 o 2.
4. Feedback: qué bien + qué falta + cómo mejorar (máx 2 oraciones).

JSON: {"reasoning":"...","scores":{${keys}},"feedback":"..."}`;
}

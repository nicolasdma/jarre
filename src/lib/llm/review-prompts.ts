/**
 * Jarre - Review Evaluation Prompts
 *
 * Simple, cheap prompts (~200 tokens) for evaluating review answers.
 * Used by /api/review/submit to score user answers against expected answers.
 */

import type { SupportedLanguage } from './prompts';

export const REVIEW_PROMPT_VERSION = 'review-v1.0.0';

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
    return 'You are a technical tutor giving direct feedback. Address the student as "you". Be fair but rigorous. Accept non-standard phrasing if the understanding is correct. Respond only in JSON.';
  }
  return 'Sos un tutor técnico que da feedback directo. Dirigite al estudiante como "vos". Sé justo pero riguroso. Aceptá frases no estándar si la comprensión es correcta. Respondé solo en JSON.';
}

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
    return `Compare the user's answer with the expected answer for this question.

Question: "${questionText}"
Expected answer: "${expectedAnswer}"
User's answer: "${userAnswer}"

Score 0-100 based on accuracy and completeness. Provide brief feedback (1 sentence).

Respond in JSON:
{"score": 0-100, "feedback": "brief feedback", "isCorrect": true|false}`;
  }

  return `Compará la respuesta del usuario con la respuesta esperada para esta pregunta.

Pregunta: "${questionText}"
Respuesta esperada: "${expectedAnswer}"
Respuesta del usuario: "${userAnswer}"

Puntuá de 0-100 según precisión y completitud. Feedback breve (1 oración).

Respondé en JSON:
{"score": 0-100, "feedback": "feedback breve en español", "isCorrect": true|false}`;
}

/**
 * System prompt for review evaluation (minimal, focused).
 */
export function getReviewSystemPrompt(language: SupportedLanguage = 'es'): string {
  if (language === 'en') {
    return 'You are a technical evaluator. Compare answers precisely. Be fair but rigorous. Accept non-standard phrasing if the understanding is correct. Respond only in JSON.';
  }
  return 'Sos un evaluador técnico. Compará respuestas con precisión. Sé justo pero riguroso. Aceptá frases no estándar si la comprensión es correcta. Respondé solo en JSON.';
}

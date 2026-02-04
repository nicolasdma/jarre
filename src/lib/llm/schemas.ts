/**
 * Jarre - Zod Schemas for LLM Responses
 *
 * All LLM responses are validated against these schemas.
 * This prevents malformed responses from breaking the app.
 */

import { z } from 'zod';

/**
 * Schema for generated evaluation questions.
 */
export const GeneratedQuestionSchema = z.object({
  type: z.enum(['explanation', 'scenario', 'error_detection', 'connection', 'tradeoff']),
  conceptName: z.string().min(1),
  question: z.string().min(10),
  incorrectStatement: z.string().optional(),
  relatedConceptName: z.string().optional(),
});

export const GenerateQuestionsResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1).max(10),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GenerateQuestionsResponse = z.infer<typeof GenerateQuestionsResponseSchema>;

/**
 * Schema for evaluated answers.
 */
export const EvaluatedResponseSchema = z.object({
  questionIndex: z.number().int().min(0),
  isCorrect: z.boolean(),
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
});

export const EvaluateAnswersResponseSchema = z.object({
  responses: z.array(EvaluatedResponseSchema).min(1),
  overallScore: z.number().min(0).max(100),
  summary: z.string().min(1),
});

export type EvaluatedResponse = z.infer<typeof EvaluatedResponseSchema>;
export type EvaluateAnswersResponse = z.infer<typeof EvaluateAnswersResponseSchema>;

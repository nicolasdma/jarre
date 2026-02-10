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

/**
 * Schema for question bank items (internal validation for seed data).
 */
export const BankQuestionSchema = z.object({
  conceptName: z.string().min(1),
  type: z.enum(['definition', 'fact', 'property', 'guarantee', 'complexity', 'comparison', 'scenario', 'limitation', 'error_spot']),
  questionText: z.string().min(10),
  expectedAnswer: z.string().min(10),
  difficulty: z.number().int().min(1).max(3),
  relatedConceptName: z.string().optional(),
});

export type BankQuestion = z.infer<typeof BankQuestionSchema>;

/**
 * Schema for review answer evaluation (DeepSeek response).
 */
export const ReviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
  isCorrect: z.boolean(),
});

export type ReviewEvaluation = z.infer<typeof ReviewEvaluationSchema>;

/**
 * Schema for rubric-based review evaluation (v2).
 * reasoning: CoT analysis before scoring (forces better calibration).
 * scores: dimension_key → 0|1|2 (exactly 3 dimensions per rubric).
 * feedback: structured feed-up/feed-back/feed-forward.
 */
export const RubricEvaluationSchema = z.object({
  reasoning: z.string().min(1),
  scores: z.record(z.string(), z.number().int().min(0).max(2)),
  feedback: z.string().min(1),
});

export type RubricEvaluation = z.infer<typeof RubricEvaluationSchema>;

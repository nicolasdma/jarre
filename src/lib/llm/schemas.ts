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
const GeneratedQuestionSchema = z.object({
  type: z.enum(['explanation', 'scenario', 'error_detection', 'connection', 'tradeoff', 'design']),
  conceptName: z.string().min(1),
  question: z.string().min(10),
  incorrectStatement: z.string().nullable().optional(),
  relatedConceptName: z.string().nullable().optional(),
});

export const GenerateQuestionsResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema).min(1).max(10),
});

/**
 * Schema for evaluated answers.
 */
const EvaluatedResponseSchema = z.object({
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

export type EvaluateAnswersResponse = z.infer<typeof EvaluateAnswersResponseSchema>;

/**
 * Schema for review answer evaluation (DeepSeek response).
 */
export const ReviewEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
  isCorrect: z.boolean(),
});

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

/**
 * Schema for voice evaluation scoring (DeepSeek analysis of transcripts).
 * Same shape as EvaluateAnswersResponseSchema for compatibility with save-results.
 */
export const VoiceEvalScoringResponseSchema = EvaluateAnswersResponseSchema;

/**
 * Schema for voice practice scoring (DeepSeek analysis of guided practice transcripts).
 * Extends eval schema with practice-specific fields: neededHelp and understood.
 * NOT saved to evaluations — only used as a gate to unlock evaluation step.
 */
export const VoicePracticeScoringResponseSchema = z.object({
  responses: z.array(z.object({
    questionIndex: z.number().int().min(0),
    isCorrect: z.boolean(),
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
    neededHelp: z.boolean(),
    understood: z.boolean(),
  })).min(1),
  overallScore: z.number().min(0).max(100),
  summary: z.string().min(1),
});


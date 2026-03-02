/**
 * Jarre - Pipeline Zod Schemas
 *
 * Validates LLM responses for each pipeline stage.
 * All DeepSeek outputs are validated before use.
 */

import { z } from 'zod';

// ============================================================================
// STAGE 2: SEGMENT
// ============================================================================

export const SegmentResponseSchema = z.object({
  sections: z.array(z.object({
    title: z.string().min(3),
    conceptName: z.string().min(2),
    conceptSlug: z.string().min(2),
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0),
  })).min(2).max(8),
});

export type SegmentResponse = z.infer<typeof SegmentResponseSchema>;

// ============================================================================
// STAGE 3: CONTENT GENERATION
// ============================================================================

export const SectionContentResponseSchema = z.object({
  contentMarkdown: z.string().min(100),
});

export type SectionContentResponse = z.infer<typeof SectionContentResponseSchema>;

export const ActivateDataResponseSchema = z.object({
  summary: z.string().min(20),
  sections: z.array(z.object({
    number: z.number().int().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
  })).min(2),
  keyConcepts: z.array(z.string().min(2)).min(2).max(10),
  insight: z.string().min(10),
});

export type ActivateDataResponse = z.infer<typeof ActivateDataResponseSchema>;

// ============================================================================
// STAGE 3b: TRANSLATION
// ============================================================================

export const TranslationResponseSchema = z.object({
  translatedMarkdown: z.string().min(50),
});

export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;

// ============================================================================
// STAGE 4: QUIZ GENERATION
// ============================================================================

const QuizOptionSchema = z.object({
  label: z.string().min(1),
  text: z.string().min(1),
});

const InlineQuizSchema = z.object({
  positionAfterHeading: z.string().min(1),
  format: z.enum(['mc', 'tf', 'mc2']),
  questionText: z.string().min(10),
  options: z.array(QuizOptionSchema).nullable(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(10),
  justificationHint: z.string().optional(),
});

export const QuizGenerationResponseSchema = z.object({
  quizzes: z.array(InlineQuizSchema).min(1).max(8),
});

export type QuizGenerationResponse = z.infer<typeof QuizGenerationResponseSchema>;

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

export const LanguageDetectionResponseSchema = z.object({
  language: z.string().min(2).max(5),
  confidence: z.number().min(0).max(1),
});

export type LanguageDetectionResponse = z.infer<typeof LanguageDetectionResponseSchema>;

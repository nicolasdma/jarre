import type { UnifiedReviewCard } from '@/types';

// ---------------------------------------------------------------------------
// Join-row types matching the Supabase query shapes used by review routes
// ---------------------------------------------------------------------------

export interface QuestionBankJoinRow {
  id: string;
  concept_id: string;
  question_text: string;
  type: string;
  difficulty: number;
  format: string;
  options: { label: string; text: string }[] | null;
  correct_answer: string | null;
  explanation: string | null;
  expected_answer: string | null;
  concepts: { name: string };
}

export interface ConceptCardJoinRow {
  id: string;
  concept_id: string;
  card_type: string;
  front_content: Record<string, unknown>;
  back_content: Record<string, unknown>;
  difficulty: number;
  concepts: { name: string };
}

export interface ScheduleJoinRow {
  id: string;
  streak: number;
  repetition_count: number;
  fsrs_state?: number | null;
}

// ---------------------------------------------------------------------------
// Mappers: join rows -> UnifiedReviewCard
// ---------------------------------------------------------------------------

export function mapQuestionToUnifiedCard(
  schedule: ScheduleJoinRow,
  question: QuestionBankJoinRow,
): UnifiedReviewCard {
  return {
    id: schedule.id,
    source: 'question',
    sourceId: question.id,
    conceptId: question.concept_id,
    conceptName: question.concepts.name,
    cardType: question.type,
    format: question.format || 'open',
    difficulty: question.difficulty as 1 | 2 | 3,
    content: {
      questionText: question.question_text,
      expectedAnswer: question.expected_answer,
    },
    fsrsState: schedule.fsrs_state ?? 0,
    streak: schedule.streak,
    reps: schedule.repetition_count,
    ...(question.options && { options: question.options }),
    ...(question.correct_answer && { correctAnswer: question.correct_answer }),
    ...(question.explanation && { explanation: question.explanation }),
  };
}

export function mapConceptCardToUnifiedCard(
  schedule: ScheduleJoinRow,
  card: ConceptCardJoinRow,
): UnifiedReviewCard {
  const front = card.front_content;
  const back = card.back_content;

  return {
    id: schedule.id,
    source: 'card',
    sourceId: card.id,
    conceptId: card.concept_id,
    conceptName: card.concepts.name,
    cardType: card.card_type,
    format: card.card_type,
    difficulty: card.difficulty as 1 | 2 | 3,
    content: front,
    back: back,
    fsrsState: schedule.fsrs_state ?? 0,
    streak: schedule.streak,
    reps: schedule.repetition_count,
    ...(front.options ? { options: front.options as { label: string; text: string }[] } : {}),
    ...(back.correct ? { correctAnswer: back.correct as string } : {}),
    ...(back.explanation ? { explanation: back.explanation as string } : {}),
  };
}

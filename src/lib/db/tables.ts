/**
 * Jarre - Database Table Names
 *
 * Single source of truth for all Supabase table names.
 * Prevents typos and enables type-safe refactoring.
 */

export const TABLES = {
  // Content (public read)
  concepts: 'concepts',
  resources: 'resources',
  resourceConcepts: 'resource_concepts',
  resourceSections: 'resource_sections',
  questionBank: 'question_bank',
  conceptCards: 'concept_cards',
  inlineQuizzes: 'inline_quizzes',
  projects: 'projects',
  projectConcepts: 'project_concepts',

  // User data (RLS: auth.uid() = user_id)
  userProfiles: 'user_profiles',
  conceptProgress: 'concept_progress',
  masteryHistory: 'mastery_history',
  reviewSchedule: 'review_schedule',
  evaluations: 'evaluations',
  evaluationQuestions: 'evaluation_questions',
  evaluationResponses: 'evaluation_responses',
  learnProgress: 'learn_progress',
  projectProgress: 'project_progress',
  sectionAnnotations: 'section_annotations',
  sectionNotes: 'section_notes',
  resourceNotes: 'resource_notes',
  xpEvents: 'xp_events',
  exerciseResults: 'exercise_results',
  voiceSessions: 'voice_sessions',
  voiceTranscripts: 'voice_transcripts',
  tokenUsage: 'token_usage',
  learnerConceptMemory: 'learner_concept_memory',

  // Reactive Knowledge System
  userResources: 'user_resources',
  userResourceConcepts: 'user_resource_concepts',
  consumptionLog: 'consumption_log',
  insightSuggestions: 'insight_suggestions',
} as const;

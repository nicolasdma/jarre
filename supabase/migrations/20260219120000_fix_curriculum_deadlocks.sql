-- ============================================================================
-- Fix Curriculum Deadlocks: Clean orphan concepts + repair critical ones
-- ============================================================================
-- The curriculum restructure (20260217120000) created deadlocks across phases:
-- concepts that no resource teaches, circular dependencies, and orphaned
-- concepts from deleted resources.
--
-- Strategy:
-- A) REPAIR concepts critical for an LLM Systems Architect:
--    - kv-cache: fix circular dependency (vllm-paper teaches AND requires it)
--    - framework-tradeoffs: remove dead prereqs (langchain/llamaindex-architecture)
--
-- B) CLEAN concepts that are noise, redundant, or out of scope:
--    - feature-stores, experiment-tracking (MLOps detail, covered by ml-data-pipelines)
--    - gpu-memory-management (redundant with gpu-compute-fundamentals)
--    - content-moderation (subsumed by guardrails-libraries + output-validation)
--    - rate-limiting (generic backend concept, not LLM-specific)
--    - self-consistency (prompting technique, paper was deliberately cut)
--    - langchain-architecture, llamaindex-architecture (framework internals, change quarterly)
--    - multimodal-rag, image-generation-arch (out of main curriculum path)
--    - plugin-channel-architecture (too specific to one case study)
-- ============================================================================

-- ============================================================================
-- PART A: REPAIR critical concepts
-- ============================================================================

-- A1: Fix kv-cache circular dependency
-- vllm-paper currently TEACHES kv-cache (is_prerequisite=FALSE) AND REQUIRES it
-- (is_prerequisite=TRUE). Remove the prerequisite requirement — you learn kv-cache
-- BY studying vllm-paper, you don't need to know it beforehand.
DELETE FROM resource_concepts
WHERE resource_id = 'vllm-paper'
  AND concept_id = 'kv-cache'
  AND is_prerequisite = TRUE;

-- A2: Fix framework-tradeoffs dead prerequisites
-- framework-tradeoffs requires langchain-architecture and llamaindex-architecture,
-- but both are being cleaned (no resource teaches them). Remove those prereqs.
-- The concept itself is still taught by rag-from-scratch, rag-without-frameworks,
-- and minimal-agent-loop.
DELETE FROM concept_prerequisites
WHERE concept_id = 'framework-tradeoffs'
  AND prerequisite_id IN ('langchain-architecture', 'llamaindex-architecture');

-- ============================================================================
-- PART B: CLEAN orphan/noise concepts
-- ============================================================================
-- All these tables have ON DELETE CASCADE for concept_id:
--   concept_prerequisites, resource_concepts, concept_progress,
--   question_bank, review_schedule, mastery_history, concept_cards,
--   user_resource_concepts, learner_concept_memory
--
-- But these do NOT cascade and need manual cleanup:
--   resource_sections (concept_id NOT NULL, no CASCADE)
--   evaluation_questions (related_concept_id, no CASCADE)
--   inline_quizzes (concept_id, ON DELETE SET NULL — OK)
--   exercise_results (concept_id, ON DELETE SET NULL — OK)

-- B1: Clean non-cascading FKs first
-- question_bank references resource_sections without CASCADE,
-- so delete question_bank rows first, then resource_sections.
DELETE FROM question_bank
WHERE resource_section_id IN (
  SELECT id FROM resource_sections
  WHERE concept_id IN (
    'feature-stores', 'experiment-tracking', 'gpu-memory-management',
    'content-moderation', 'rate-limiting', 'self-consistency',
    'langchain-architecture', 'llamaindex-architecture',
    'multimodal-rag', 'image-generation-arch', 'plugin-channel-architecture'
  )
);

DELETE FROM resource_sections
WHERE concept_id IN (
  'feature-stores', 'experiment-tracking', 'gpu-memory-management',
  'content-moderation', 'rate-limiting', 'self-consistency',
  'langchain-architecture', 'llamaindex-architecture',
  'multimodal-rag', 'image-generation-arch', 'plugin-channel-architecture'
);

-- evaluation_questions: null out related_concept_id references
UPDATE evaluation_questions
SET related_concept_id = NULL
WHERE related_concept_id IN (
  'feature-stores', 'experiment-tracking', 'gpu-memory-management',
  'content-moderation', 'rate-limiting', 'self-consistency',
  'langchain-architecture', 'llamaindex-architecture',
  'multimodal-rag', 'image-generation-arch', 'plugin-channel-architecture'
);

-- B2: Delete the orphan concepts (cascades handle the rest)
DELETE FROM concepts
WHERE id IN (
  -- Phase 2: MLOps detail / redundant
  'feature-stores',
  'experiment-tracking',
  'gpu-memory-management',

  -- Phase 7: no teaching resource
  'content-moderation',
  'self-consistency',

  -- Phase 8: no teaching resource, generic backend
  'rate-limiting',

  -- Phase 9: framework internals (resources deleted)
  'langchain-architecture',
  'llamaindex-architecture',

  -- Phase 9 (ex-Phase 6): never had a resource, out of scope
  'multimodal-rag',
  'image-generation-arch',

  -- Phase 9: too specific to one case study
  'plugin-channel-architecture'
);

-- ============================================================================
-- DONE
-- Repaired: kv-cache (circular dep removed), framework-tradeoffs (dead prereqs removed)
-- Cleaned: 11 orphan/noise concepts that were deadlocking the DAG
-- ============================================================================

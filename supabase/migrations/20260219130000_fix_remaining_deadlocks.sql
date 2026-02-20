-- ============================================================================
-- Fix Remaining Curriculum Deadlocks
-- ============================================================================
-- DB verification found 3 categories of remaining issues:
--
-- 1. Concepts required as prerequisites but no resource teaches them:
--    - prompt-engineering (P4): required by dspy-paper
--    - structured-output (P4): required by instructor-docs, nemo-guardrails-docs, anthropic-effective-agents
--    - quantization (P8): required by p11-gptq-paper
--
-- 2. Fully orphaned concepts (no resource mapping at all):
--    - multi-head-attention (P3): subsumed by attention-mechanism
--    - power-law-loss (P3): subsumed by scaling-laws
--    - tree-of-thoughts (P4): paper was deliberately cut
--    - llm-evaluation (P7): duplicate of offline-evaluation + online-evaluation
--
-- 3. Cross-phase backward prerequisites:
--    - openclaw-casestudy (P4) requires concepts from P5 and P9
--
-- Strategy:
-- - Map existing resources to teach the 3 unteachable concepts
-- - Delete the 4 orphan concepts (redundant with existing ones)
-- - Remove backward cross-phase prerequisites from openclaw-casestudy
-- ============================================================================

-- ============================================================================
-- FIX 1: prompt-engineering — map to CoT prompting videos (P4)
-- ============================================================================
-- CoT prompting videos teach chain-of-thought, which IS prompt engineering.
-- Also: react-prompting-videos teaches prompt engineering patterns.
-- Both are natural homes for this concept.
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('cot-prompting-videos', 'prompt-engineering', FALSE),
  ('react-prompting-videos', 'prompt-engineering', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIX 2: structured-output — map to instructor-docs (P7)
-- ============================================================================
-- instructor-docs currently REQUIRES structured-output but doesn't teach it.
-- That's backwards: Instructor IS the tool for structured output. It should
-- teach the concept, not require it as a prerequisite.
-- Remove the prerequisite and add as taught concept.
DELETE FROM resource_concepts
WHERE resource_id = 'instructor-docs'
  AND concept_id = 'structured-output'
  AND is_prerequisite = TRUE;

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES ('instructor-docs', 'structured-output', FALSE)
ON CONFLICT DO NOTHING;

-- Also remove structured-output as prereq from nemo-guardrails-docs and
-- anthropic-effective-agents — you learn structured output in the curriculum
-- (Phase 7 via Instructor), not before it.
DELETE FROM resource_concepts
WHERE concept_id = 'structured-output'
  AND is_prerequisite = TRUE
  AND resource_id IN ('nemo-guardrails-docs', 'anthropic-effective-agents');

-- ============================================================================
-- FIX 3: quantization — map to speculative-decoding-paper (P8)
-- ============================================================================
-- Speculative decoding uses a smaller (often quantized) draft model.
-- The paper discusses quantization as part of efficient inference.
-- Also: vllm-paper covers quantization as part of efficient serving.
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('vllm-paper', 'quantization', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIX 4: Delete orphan concepts (redundant, no resource teaches them)
-- ============================================================================

-- Clean non-cascading FKs first
DELETE FROM question_bank
WHERE resource_section_id IN (
  SELECT id FROM resource_sections
  WHERE concept_id IN (
    'multi-head-attention', 'power-law-loss', 'tree-of-thoughts', 'llm-evaluation'
  )
);

DELETE FROM resource_sections
WHERE concept_id IN (
  'multi-head-attention', 'power-law-loss', 'tree-of-thoughts', 'llm-evaluation'
);

UPDATE evaluation_questions
SET related_concept_id = NULL
WHERE related_concept_id IN (
  'multi-head-attention', 'power-law-loss', 'tree-of-thoughts', 'llm-evaluation'
);

-- Now delete the concepts (cascades handle concept_prerequisites,
-- resource_concepts, concept_progress, etc.)
DELETE FROM concepts WHERE id IN (
  'multi-head-attention',   -- subsumed by attention-mechanism (same resource: attention-paper)
  'power-law-loss',         -- subsumed by scaling-laws (same resource: scaling-laws-paper)
  'tree-of-thoughts',       -- paper was deliberately cut in restructure, no resource teaches it
  'llm-evaluation'          -- duplicate of offline-evaluation + online-evaluation (P7)
);

-- ============================================================================
-- FIX 5: Remove backward cross-phase prerequisites from openclaw-casestudy
-- ============================================================================
-- openclaw-casestudy (P4) requires external-memory (P5), system-design-patterns (P9),
-- and production-architectures (P9). A Phase 4 resource can't require Phase 5/9 concepts.
-- These are concepts the case study TOUCHES but shouldn't REQUIRE as prerequisites.
DELETE FROM resource_concepts
WHERE resource_id = 'openclaw-casestudy'
  AND concept_id IN ('external-memory', 'system-design-patterns', 'production-architectures')
  AND is_prerequisite = TRUE;

-- ============================================================================
-- DONE — All phases should now be progressive and coherent:
-- - Every prerequisite concept has at least one resource that teaches it
-- - No orphan concepts without resource mappings
-- - No backward cross-phase prerequisites
-- ============================================================================

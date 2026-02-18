-- ============================================================================
-- Fix: Correct phase assignments after catch-all cascade in previous migration
-- ============================================================================
-- The catch-alls in 20260217120000 re-swept resources that had already been
-- specifically remapped, causing:
--   Transformer resources (intended Phase 3) → ended up in Phase 8
--   Agent resources (intended Phase 4) → ended up in Phase 7
--   RAG resources (intended Phase 5) → ended up in Phase 8
-- This migration corrects all assignments with explicit per-ID updates only.
-- ============================================================================

-- ============================================================================
-- STEP 1: Phase 8 → Phase 3 (Transformer Foundations)
-- ============================================================================
UPDATE resources SET phase = '3' WHERE id IN (
  'attention-paper',
  'scaling-laws-paper',
  'chinchilla-paper',
  'lora-paper',
  'karpathy-nn-zero-to-hero',
  'karpathy-build-gpt',
  'karpathy-intro-llms',
  'karpathy-llm-os',
  'dpo-paper',
  'yarn-paper',
  'gpt3-paper'
);

-- ============================================================================
-- STEP 2: Phase 7 → Phase 4 (Agents & Reasoning)
-- ============================================================================
UPDATE resources SET phase = '4' WHERE id IN (
  'react-paper',
  'reflexion-paper',
  'lilian-weng-agents',
  'stanford-cs25',
  'react-prompting-videos',
  'cot-prompting-videos',
  'openai-o1-blog',
  'deepseek-r1-paper',
  's1-test-time-scaling',
  'agent-sandbox-patterns',
  'autogen-paper',
  'anthropic-effective-agents',
  'minimal-agent-loop',
  'openclaw-casestudy'
);

-- ============================================================================
-- STEP 3: Phase 8 → Phase 5 (RAG, Memory & Context)
-- ============================================================================
UPDATE resources SET phase = '5' WHERE id IN (
  'rag-paper',
  'lost-in-middle-paper',
  'long-context-paper',
  'memgpt-paper',
  'llamaindex-rag-pitfalls',
  'graphrag-paper',
  'ragas-docs',
  'hyde-paper',
  'colbertv2-paper',
  'self-rag-paper',
  'needle-in-haystack',
  'clawvault-agent-memory',
  'rag-from-scratch',
  'rag-without-frameworks'
);

-- ============================================================================
-- STEP 4: Remove duplicate Phase 2 resources
-- ============================================================================
-- The original seed already had these resources. The previous migration
-- inserted p2-* duplicates. Keep originals, remove duplicates.
DELETE FROM resource_concepts WHERE resource_id IN (
  'p2-zero-paper',
  'p2-mixed-precision-paper',
  'p2-hidden-tech-debt-paper'
);
DELETE FROM resources WHERE id IN (
  'p2-zero-paper',
  'p2-mixed-precision-paper',
  'p2-hidden-tech-debt-paper'
);

-- Also remove duplicate megatron-lm-paper (keep p11-megatron-lm which has Phase 11 mappings)
DELETE FROM resource_concepts WHERE resource_id = 'megatron-lm-paper';
DELETE FROM resources WHERE id = 'megatron-lm-paper';

-- ============================================================================
-- DONE
-- ============================================================================

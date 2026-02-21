-- ============================================================================
-- Fix: Add prerequisite chain to existing F3 resources
--
-- "Attention Is All You Need" (attention-paper) was unlocked without
-- prerequisites, breaking the pedagogical chain. It should require
-- understanding of Bahdanau attention and residual connections before reading.
--
-- Similarly, karpathy-build-gpt should require transformer-architecture.
-- ============================================================================

BEGIN;

-- attention-paper requires Bahdanau attention + residual connections
-- (the two key innovations it builds upon)
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('attention-paper', 'attention-bahdanau', true),
  ('attention-paper', 'residual-connections', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- yarn-paper is already correct (requires positional-encoding, attention-mechanism)

-- karpathy-build-gpt should require transformer-architecture
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  ('karpathy-build-gpt', 'transformer-architecture', true),
  ('karpathy-build-gpt', 'backpropagation-training', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

COMMIT;

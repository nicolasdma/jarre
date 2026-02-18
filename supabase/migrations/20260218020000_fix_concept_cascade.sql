-- ============================================================================
-- Fix: Correct concept phase assignments after catch-all cascade
-- ============================================================================
-- Same cascade issue as resources: the catch-alls in 20260217120000 re-swept
-- concepts that had been specifically remapped.
-- ============================================================================

-- ============================================================================
-- STEP 1: → Phase 3 (Transformer + Math concepts)
-- ============================================================================
UPDATE concepts SET phase = '3' WHERE id IN (
  -- Transformer concepts
  'attention-mechanism',
  'transformer-architecture',
  'query-key-value',
  'positional-encoding',
  'scaling-laws',
  'compute-optimal-training',
  'foundation-models',
  'fine-tuning-efficiency',
  'dpo',
  'context-extension',
  'multi-head-attention',
  'power-law-loss',
  -- Math concepts (integrated from Phase 0)
  'linear-algebra-ml',
  'probability-statistics',
  'information-theory',
  'optimization-ml',
  'calculus-backprop',
  'dimensionality-reduction'
);

-- ============================================================================
-- STEP 2: → Phase 4 (Agent & Reasoning concepts)
-- ============================================================================
UPDATE concepts SET phase = '4' WHERE id IN (
  'chain-of-thought',
  'react-pattern',
  'tree-of-thoughts',
  'reflexion',
  'tool-use',
  'plan-and-execute',
  'prompt-engineering',
  'structured-output',
  'test-time-compute',
  'reasoning-models',
  'multi-agent-systems',
  'agent-reliability'
);

-- ============================================================================
-- STEP 3: → Phase 5 (RAG, Memory & Context concepts)
-- ============================================================================
UPDATE concepts SET phase = '5' WHERE id IN (
  'embeddings',
  'vector-search',
  'rag-basics',
  'chunking-strategies',
  'hybrid-search',
  'lost-in-middle',
  'context-window-limits',
  'external-memory',
  'memory-management',
  'reranking',
  'query-decomposition',
  'agentic-rag',
  'graph-rag',
  'rag-evaluation',
  'rag-vs-long-context'
);

-- ============================================================================
-- DONE
-- ============================================================================

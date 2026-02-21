-- ============================================================================
-- Phase 2 Karpathy Restructure
-- Replaces the mixed P2 content (math prerequisites, ML infrastructure,
-- DL books, generic Karpathy) with a focused progression:
-- Karpathy "Neural Networks: Zero to Hero" (8 videos) + 3 canonical papers.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Archive obsolete resources
-- Clean up FK references without ON DELETE CASCADE first, then delete resources.
-- ============================================================================

-- Define the set of resources to archive
-- p0-* (7): math prerequisites (now redundant — concepts remain as prerequisites)
-- p2-nielsen, p2-goodfellow: replaced by Karpathy hands-on
-- p2-google-mlops, p2-zero-paper, p2-mixed-precision-paper,
--   p2-hidden-tech-debt-paper, p2-docker-bentoml-tutorial: ML infra (already in F5, delete)
-- karpathy-nn-zero-to-hero: replaced by 8 individual kz2h-* videos
-- karpathy-intro-llms: out of scope for Phase 2

-- Clean question_bank referencing sections of these resources (no ON DELETE CASCADE)
DELETE FROM question_bank WHERE resource_section_id IN (
  SELECT id FROM resource_sections WHERE resource_id IN (
    'p0-3b1b-linear-algebra', 'p0-3b1b-neural-networks',
    'p0-linear-algebra', 'p0-calculus-optimization', 'p0-probability',
    'p0-cs229-probability', 'p0-statquest',
    'p2-nielsen-nn-dl', 'p2-goodfellow-dl',
    'p2-google-mlops', 'p2-zero-paper', 'p2-mixed-precision-paper',
    'p2-hidden-tech-debt-paper', 'p2-docker-bentoml-tutorial',
    'karpathy-nn-zero-to-hero', 'karpathy-intro-llms'
  )
);

-- Clean resource_sections (no ON DELETE CASCADE)
DELETE FROM resource_sections WHERE resource_id IN (
  'p0-3b1b-linear-algebra', 'p0-3b1b-neural-networks',
  'p0-linear-algebra', 'p0-calculus-optimization', 'p0-probability',
  'p0-cs229-probability', 'p0-statquest',
  'p2-nielsen-nn-dl', 'p2-goodfellow-dl',
  'p2-google-mlops', 'p2-zero-paper', 'p2-mixed-precision-paper',
  'p2-hidden-tech-debt-paper', 'p2-docker-bentoml-tutorial',
  'karpathy-nn-zero-to-hero', 'karpathy-intro-llms'
);

-- Clean voice_sessions (no ON DELETE CASCADE)
UPDATE voice_sessions SET resource_id = NULL WHERE resource_id IN (
  'p0-3b1b-linear-algebra', 'p0-3b1b-neural-networks',
  'p0-linear-algebra', 'p0-calculus-optimization', 'p0-probability',
  'p0-cs229-probability', 'p0-statquest',
  'p2-nielsen-nn-dl', 'p2-goodfellow-dl',
  'p2-google-mlops', 'p2-zero-paper', 'p2-mixed-precision-paper',
  'p2-hidden-tech-debt-paper', 'p2-docker-bentoml-tutorial',
  'karpathy-nn-zero-to-hero', 'karpathy-intro-llms'
);

-- Delete resources (cascades to resource_concepts, evaluations, notes, learn_progress)
DELETE FROM resources WHERE id IN (
  'p0-3b1b-linear-algebra', 'p0-3b1b-neural-networks',
  'p0-linear-algebra', 'p0-calculus-optimization', 'p0-probability',
  'p0-cs229-probability', 'p0-statquest',
  'p2-nielsen-nn-dl', 'p2-goodfellow-dl',
  'p2-google-mlops', 'p2-zero-paper', 'p2-mixed-precision-paper',
  'p2-hidden-tech-debt-paper', 'p2-docker-bentoml-tutorial',
  'karpathy-nn-zero-to-hero', 'karpathy-intro-llms'
);

-- ============================================================================
-- STEP 2: Ensure lilian-weng and horace-he are in Phase 5
-- (They should already be there from curriculum_restructure_v2, but be safe)
-- ============================================================================

UPDATE resources SET phase = '5'
WHERE id IN ('p2-lilian-weng-distributed', 'p2-horace-he-gpu')
  AND phase != '5';

-- ============================================================================
-- STEP 3: Create 4 new concepts for Phase 2
-- ============================================================================

INSERT INTO concepts (id, name, slug, phase, canonical_definition) VALUES
  ('character-level-lm', 'Character-level Language Models', 'character-level-lm', '2',
   'Predicting next character from sequences, bigram/n-gram foundations'),
  ('neural-language-model', 'Neural Probabilistic Language Models', 'neural-language-model', '2',
   'Bengio 2003: learned word representations + neural network for P(w|context)'),
  ('activation-functions-batchnorm', 'Activation Functions & Batch Normalization', 'activation-functions-batchnorm', '2',
   'Sigmoid, tanh, ReLU saturation; BatchNorm for stable deep training'),
  ('deep-architectures', 'Deep Network Architectures', 'deep-architectures', '2',
   'Skip connections, dilated convolutions, depth vs width trade-offs')
ON CONFLICT (id) DO UPDATE SET
  phase = EXCLUDED.phase,
  canonical_definition = EXCLUDED.canonical_definition;

-- ============================================================================
-- STEP 4: Move 4 concepts from Phase 3 → Phase 2
-- (multi-head-attention was already deleted in fix_remaining_deadlocks)
-- ============================================================================

UPDATE concepts SET phase = '2' WHERE id IN (
  'attention-mechanism',
  'transformer-architecture',
  'tokenization-bpe',
  'word-embeddings'
);

-- ============================================================================
-- STEP 5: Insert 8 new kz2h-* resources + p2-bengio-lm-paper
-- ============================================================================

INSERT INTO resources (id, title, type, url, phase, estimated_hours, sort_order) VALUES
  ('kz2h-micrograd', 'Micrograd — Backprop from Scratch', 'video',
   'https://www.youtube.com/watch?v=VMj-3S1tku0', '2', 2.5, 100),
  ('kz2h-makemore-bigram', 'Makemore (Bigram) — Character-level LM', 'video',
   'https://www.youtube.com/watch?v=PaCmpygFfXo', '2', 2, 110),
  ('p2-bengio-lm-paper', 'A Neural Probabilistic Language Model (Bengio 2003)', 'paper',
   'https://www.jmlr.org/papers/volume3/bengio03a/bengio03a.pdf', '2', 3, 120),
  ('kz2h-makemore-mlp', 'Makemore (MLP) — Multi-layer Perceptron', 'video',
   'https://www.youtube.com/watch?v=TCH_1BHY58I', '2', 2, 130),
  ('kz2h-activations-batchnorm', 'Activations & BatchNorm — Internals', 'video',
   'https://www.youtube.com/watch?v=P6sfmUTpUmc', '2', 2, 140),
  ('kz2h-backprop-ninja', 'Backprop Ninja — Manual Gradient Computation', 'video',
   'https://www.youtube.com/watch?v=q8SA3rM6ckI', '2', 2, 150),
  ('kz2h-wavenet', 'WaveNet — Deep Architectures', 'video',
   'https://www.youtube.com/watch?v=t3YJ5hKiMQ0', '2', 2, 170),
  ('kz2h-building-gpt', 'Building GPT — Transformers from Scratch', 'video',
   'https://www.youtube.com/watch?v=kCc8FmEb1nY', '2', 3, 180),
  ('kz2h-tokenizers', 'Tokenizers — Byte Pair Encoding', 'video',
   'https://www.youtube.com/watch?v=zduSFxRajkE', '2', 1.5, 200)
ON CONFLICT (id) DO UPDATE SET
  phase = EXCLUDED.phase,
  sort_order = EXCLUDED.sort_order,
  title = EXCLUDED.title;

-- ============================================================================
-- STEP 6: Move attention-paper to Phase 2, update sort orders
-- ============================================================================

UPDATE resources SET phase = '2', sort_order = 190
WHERE id = 'attention-paper';

UPDATE resources SET sort_order = 160
WHERE id = 'p2-resnet-paper';

-- ============================================================================
-- STEP 7: Resource-concept mappings (teaches + requires)
-- ============================================================================

INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  -- kz2h-micrograd TEACHES
  ('kz2h-micrograd', 'neural-network-fundamentals', false),
  ('kz2h-micrograd', 'backpropagation-training', false),

  -- kz2h-makemore-bigram TEACHES
  ('kz2h-makemore-bigram', 'character-level-lm', false),
  -- kz2h-makemore-bigram REQUIRES
  ('kz2h-makemore-bigram', 'neural-network-fundamentals', true),

  -- p2-bengio-lm-paper TEACHES
  ('p2-bengio-lm-paper', 'neural-language-model', false),
  ('p2-bengio-lm-paper', 'word-embeddings', false),
  -- p2-bengio-lm-paper REQUIRES
  ('p2-bengio-lm-paper', 'neural-network-fundamentals', true),
  ('p2-bengio-lm-paper', 'backpropagation-training', true),

  -- kz2h-makemore-mlp TEACHES
  ('kz2h-makemore-mlp', 'neural-language-model', false),
  ('kz2h-makemore-mlp', 'loss-functions', false),
  -- kz2h-makemore-mlp REQUIRES
  ('kz2h-makemore-mlp', 'character-level-lm', true),
  ('kz2h-makemore-mlp', 'backpropagation-training', true),

  -- kz2h-activations-batchnorm TEACHES
  ('kz2h-activations-batchnorm', 'activation-functions-batchnorm', false),
  ('kz2h-activations-batchnorm', 'regularization-generalization', false),
  -- kz2h-activations-batchnorm REQUIRES
  ('kz2h-activations-batchnorm', 'neural-network-fundamentals', true),
  ('kz2h-activations-batchnorm', 'backpropagation-training', true),

  -- kz2h-backprop-ninja TEACHES
  ('kz2h-backprop-ninja', 'backpropagation-training', false),
  -- kz2h-backprop-ninja REQUIRES
  ('kz2h-backprop-ninja', 'neural-network-fundamentals', true),
  ('kz2h-backprop-ninja', 'loss-functions', true),

  -- kz2h-wavenet TEACHES
  ('kz2h-wavenet', 'deep-architectures', false),
  ('kz2h-wavenet', 'residual-connections', false),
  -- kz2h-wavenet REQUIRES
  ('kz2h-wavenet', 'activation-functions-batchnorm', true),
  ('kz2h-wavenet', 'backpropagation-training', true),

  -- kz2h-building-gpt TEACHES
  ('kz2h-building-gpt', 'transformer-architecture', false),
  ('kz2h-building-gpt', 'attention-mechanism', false),
  -- kz2h-building-gpt REQUIRES
  ('kz2h-building-gpt', 'neural-network-fundamentals', true),
  ('kz2h-building-gpt', 'backpropagation-training', true),
  ('kz2h-building-gpt', 'word-embeddings', true),

  -- kz2h-tokenizers TEACHES
  ('kz2h-tokenizers', 'tokenization-bpe', false),
  -- kz2h-tokenizers REQUIRES
  ('kz2h-tokenizers', 'character-level-lm', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- attention-paper already has mappings:
--   TEACHES: attention-mechanism (from original seed)
--   REQUIRES: attention-bahdanau, residual-connections (from fix_transformer_prerequisites)
-- No changes needed for its concept mappings.

-- p2-resnet-paper already has mappings from curriculum_restructure_v2:
--   TEACHES: residual-connections
--   REQUIRES: neural-network-fundamentals, backpropagation-training
-- No changes needed.

COMMIT;

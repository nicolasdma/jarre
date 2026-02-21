-- ============================================================================
-- Curriculum Restructure v2
-- Fixes pedagogical gaps: adds ML foundations (F2), reorganizes transformer
-- content (F3), creates LLM training phase (F4), cascades remaining phases.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Cascade resources (reverse order to avoid overwrites)
-- ============================================================================

-- F9 partial -> F10 (System Design absorbs integrated content)
UPDATE resources SET phase = '10' WHERE id IN ('dspy-paper','dspy-docs','applied-llms-blog');

-- F8 -> F9
UPDATE resources SET phase = '9' WHERE phase = '8';

-- F7 -> F8
UPDATE resources SET phase = '8' WHERE phase = '7';

-- F5 -> F7
UPDATE resources SET phase = '7' WHERE phase = '5';

-- F4 -> F6
UPDATE resources SET phase = '6' WHERE phase = '4';

-- F2 -> F5
UPDATE resources SET phase = '5' WHERE phase = '2';

-- F3 advanced -> F4 (Scaling Laws, LoRA, DPO leave Transformers)
UPDATE resources SET phase = '4' WHERE id IN (
  'scaling-laws-paper','chinchilla-paper','lora-paper',
  'karpathy-llm-os','dpo-paper','gpt3-paper'
);

-- Math + Karpathy foundational -> F2
UPDATE resources SET phase = '2' WHERE id IN (
  'p0-3b1b-linear-algebra','p0-3b1b-neural-networks',
  'p0-linear-algebra','p0-calculus-optimization','p0-probability',
  'p0-cs229-probability','p0-statquest',
  'karpathy-nn-zero-to-hero','karpathy-intro-llms'
);

-- Enterprise F10 -> F11
UPDATE resources SET phase = '11' WHERE id IN (
  'p10-ai-strategy','p10-ai-discovery','p10-build-vs-buy',
  'p10-ai-governance','p10-enterprise-arch','p10-change-management',
  'p10-ai-economics','p10-ai-consulting','p10-aws-ai-cert'
);

-- ============================================================================
-- STEP 2: Cascade concepts (same reverse order)
-- ============================================================================

-- F9 concepts -> F10
UPDATE concepts SET phase = '10' WHERE id IN (
  'dspy-programming','system-design-patterns','cost-quality-latency',
  'production-architectures','framework-tradeoffs','minimal-implementations',
  'agent-protocol-design','agent-skill-orchestration','agent-memory-persistence',
  'agent-ui-generation','plugin-channel-architecture','langchain-architecture',
  'llamaindex-architecture'
);

-- F8 -> F9
UPDATE concepts SET phase = '9' WHERE phase = '8';

-- F7 -> F8
UPDATE concepts SET phase = '8' WHERE phase = '7';

-- F5 -> F7
UPDATE concepts SET phase = '7' WHERE phase = '5';

-- F4 -> F6
UPDATE concepts SET phase = '6' WHERE phase = '4';

-- F2 -> F5
UPDATE concepts SET phase = '5' WHERE phase = '2';

-- F3 advanced -> F4
UPDATE concepts SET phase = '4' WHERE id IN (
  'scaling-laws','compute-optimal-training','foundation-models',
  'fine-tuning-efficiency','dpo','context-extension','power-law-loss'
);

-- Math concepts -> F2
UPDATE concepts SET phase = '2' WHERE id IN (
  'linear-algebra-ml','probability-statistics','information-theory',
  'optimization-ml','calculus-backprop','dimensionality-reduction'
);

-- Enterprise concepts F10 -> F11
UPDATE concepts SET phase = '11' WHERE id IN (
  'ai-strategy-roi','ai-maturity-models','ai-use-case-discovery',
  'data-readiness-assessment','build-vs-buy-ai','llm-application-patterns',
  'ai-governance-frameworks','ai-security-enterprise','mlops-production',
  'enterprise-ai-integration','ai-change-management','inference-economics',
  'ai-pricing-models','ai-consulting-practice','aws-ai-services'
);

-- ============================================================================
-- STEP 2b: Cascade projects
-- ============================================================================

UPDATE projects SET phase = '9' WHERE phase = '8';
UPDATE projects SET phase = '8' WHERE phase = '7';
UPDATE projects SET phase = '7' WHERE phase = '5';
UPDATE projects SET phase = '6' WHERE phase = '4';

-- ============================================================================
-- STEP 3: New concepts
-- ============================================================================

-- F2: ML & Deep Learning Foundations (5 new)
INSERT INTO concepts (id, name, slug, phase, canonical_definition) VALUES
  ('neural-network-fundamentals', 'Neural Network Fundamentals', 'neural-network-fundamentals', '2',
   'Neurons, layers, activation functions, forward pass'),
  ('backpropagation-training', 'Backpropagation & Training', 'backpropagation-training', '2',
   'Chain rule, gradient computation, vanishing/exploding gradients'),
  ('loss-functions', 'Loss Functions', 'loss-functions', '2',
   'Cross-entropy, MSE, connection to information theory'),
  ('regularization-generalization', 'Regularization & Generalization', 'regularization-generalization', '2',
   'Dropout, weight decay, bias-variance tradeoff'),
  ('residual-connections', 'Residual Connections', 'residual-connections', '2',
   'Skip connections, gradient flow, foundation of transformers')
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, canonical_definition = EXCLUDED.canonical_definition;

-- F3: Sequences, Attention & Transformers (7 new)
INSERT INTO concepts (id, name, slug, phase, canonical_definition) VALUES
  ('word-embeddings', 'Word Embeddings', 'word-embeddings', '3',
   'Word2Vec, GloVe, distributional hypothesis'),
  ('tokenization-bpe', 'Tokenization & BPE', 'tokenization-bpe', '3',
   'Byte Pair Encoding, subword tokenization'),
  ('sequence-to-sequence', 'Sequence-to-Sequence', 'sequence-to-sequence', '3',
   'Encoder-decoder, fixed-length bottleneck'),
  ('attention-bahdanau', 'Bahdanau Attention', 'attention-bahdanau', '3',
   'Additive attention, alignment model'),
  ('encoder-decoder-architecture', 'Encoder-Decoder Architecture', 'encoder-decoder-architecture', '3',
   'Two-part architecture for seq2seq tasks'),
  ('bert-masked-lm', 'BERT & Masked Language Modeling', 'bert-masked-lm', '3',
   'Bidirectional pre-training, encoder-only transformer'),
  ('autoregressive-generation', 'Autoregressive Generation', 'autoregressive-generation', '3',
   'Left-to-right generation, decoder-only, GPT')
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, canonical_definition = EXCLUDED.canonical_definition;

-- F4: LLMs: Training, Alignment & Scaling (5 new)
INSERT INTO concepts (id, name, slug, phase, canonical_definition) VALUES
  ('language-model-pretraining', 'Language Model Pretraining', 'language-model-pretraining', '4',
   'Next-token prediction, foundation models'),
  ('in-context-learning', 'In-Context Learning', 'in-context-learning', '4',
   'Zero/few-shot, emergent at scale'),
  ('rlhf-alignment', 'RLHF & Alignment', 'rlhf-alignment', '4',
   'SFT -> reward model -> PPO pipeline'),
  ('instruction-tuning', 'Instruction Tuning', 'instruction-tuning', '4',
   'SFT on instruction-response pairs'),
  ('scaling-behavior', 'Scaling Behavior', 'scaling-behavior', '4',
   'Emergent abilities, phase transitions')
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, canonical_definition = EXCLUDED.canonical_definition;

-- ============================================================================
-- STEP 4: New resources
-- ============================================================================

-- F2: 3 new resources
INSERT INTO resources (id, title, type, url, phase, estimated_hours, sort_order) VALUES
  ('p2-nielsen-nn-dl', 'Neural Networks and Deep Learning', 'book',
   'http://neuralnetworksanddeeplearning.com/', '2', 15, 200),
  ('p2-goodfellow-dl', 'Deep Learning (Chapters 6 & 8)', 'book',
   'https://www.deeplearningbook.org/', '2', 10, 210),
  ('p2-resnet-paper', 'Deep Residual Learning for Image Recognition', 'paper',
   'https://arxiv.org/abs/1512.03385', '2', 2, 220)
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, title = EXCLUDED.title;

-- F3: 8 new resources
INSERT INTO resources (id, title, type, url, phase, estimated_hours, sort_order) VALUES
  ('p3-word2vec-paper', 'Efficient Estimation of Word Representations in Vector Space', 'paper',
   'https://arxiv.org/abs/1301.3781', '3', 1.5, 100),
  ('p3-seq2seq-paper', 'Sequence to Sequence Learning with Neural Networks', 'paper',
   'https://arxiv.org/abs/1409.3215', '3', 1.5, 110),
  ('p3-bahdanau-attention', 'Neural Machine Translation by Jointly Learning to Align and Translate', 'paper',
   'https://arxiv.org/abs/1409.0473', '3', 2, 120),
  ('p3-luong-attention', 'Effective Approaches to Attention-based NMT', 'paper',
   'https://arxiv.org/abs/1508.04025', '3', 1.5, 130),
  ('p3-bert-paper', 'BERT: Pre-training of Deep Bidirectional Transformers', 'paper',
   'https://arxiv.org/abs/1810.04805', '3', 2, 200),
  ('p3-gpt2-paper', 'Language Models are Unsupervised Multitask Learners', 'paper',
   'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf', '3', 2, 210),
  ('p3-illustrated-transformer', 'The Illustrated Transformer (Jay Alammar)', 'article',
   'https://jalammar.github.io/illustrated-transformer/', '3', 1.5, 140),
  ('p3-illustrated-gpt2', 'The Illustrated GPT-2 (Jay Alammar)', 'article',
   'https://jalammar.github.io/illustrated-gpt2/', '3', 1.5, 220)
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, title = EXCLUDED.title;

-- F4: 7 new resources
INSERT INTO resources (id, title, type, url, phase, estimated_hours, sort_order) VALUES
  ('p4-gpt1-paper', 'Improving Language Understanding by Generative Pre-Training', 'paper',
   'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf', '4', 1.5, 100),
  ('p4-gpt3-paper', 'Language Models are Few-Shot Learners', 'paper',
   'https://arxiv.org/abs/2005.14165', '4', 6, 110),
  ('p4-instructgpt-paper', 'Training language models to follow instructions with human feedback', 'paper',
   'https://arxiv.org/abs/2203.02155', '4', 3, 120),
  ('p4-dpo-paper', 'Direct Preference Optimization', 'paper',
   'https://arxiv.org/abs/2305.18290', '4', 2, 130),
  ('p4-llama-paper', 'LLaMA: Open and Efficient Foundation Language Models', 'paper',
   'https://arxiv.org/abs/2302.13971', '4', 2, 140),
  ('p4-cot-paper', 'Chain-of-Thought Prompting Elicits Reasoning in LLMs', 'paper',
   'https://arxiv.org/abs/2201.11903', '4', 2, 150),
  ('p4-cs224n', 'Stanford CS224n: NLP with Deep Learning', 'course',
   'https://web.stanford.edu/class/cs224n/', '4', 25, 200)
ON CONFLICT (id) DO UPDATE SET phase = EXCLUDED.phase, title = EXCLUDED.title;

-- ============================================================================
-- STEP 5: Resource-concept mappings & concept prerequisites
-- ============================================================================

-- F2 resource mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  -- p2-nielsen-nn-dl TEACHES
  ('p2-nielsen-nn-dl', 'neural-network-fundamentals', false),
  ('p2-nielsen-nn-dl', 'backpropagation-training', false),
  ('p2-nielsen-nn-dl', 'loss-functions', false),
  ('p2-nielsen-nn-dl', 'regularization-generalization', false),
  -- p2-nielsen-nn-dl REQUIRES
  ('p2-nielsen-nn-dl', 'linear-algebra-ml', true),
  ('p2-nielsen-nn-dl', 'calculus-backprop', true),
  -- p2-goodfellow-dl TEACHES
  ('p2-goodfellow-dl', 'neural-network-fundamentals', false),
  ('p2-goodfellow-dl', 'regularization-generalization', false),
  ('p2-goodfellow-dl', 'backpropagation-training', false),
  -- p2-goodfellow-dl REQUIRES
  ('p2-goodfellow-dl', 'linear-algebra-ml', true),
  ('p2-goodfellow-dl', 'probability-statistics', true),
  -- p2-resnet-paper TEACHES
  ('p2-resnet-paper', 'residual-connections', false),
  -- p2-resnet-paper REQUIRES
  ('p2-resnet-paper', 'neural-network-fundamentals', true),
  ('p2-resnet-paper', 'backpropagation-training', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- F3 resource mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  -- p3-word2vec-paper TEACHES
  ('p3-word2vec-paper', 'word-embeddings', false),
  -- p3-word2vec-paper REQUIRES
  ('p3-word2vec-paper', 'neural-network-fundamentals', true),
  -- p3-seq2seq-paper TEACHES
  ('p3-seq2seq-paper', 'sequence-to-sequence', false),
  ('p3-seq2seq-paper', 'encoder-decoder-architecture', false),
  -- p3-seq2seq-paper REQUIRES
  ('p3-seq2seq-paper', 'neural-network-fundamentals', true),
  ('p3-seq2seq-paper', 'word-embeddings', true),
  -- p3-bahdanau-attention TEACHES
  ('p3-bahdanau-attention', 'attention-bahdanau', false),
  -- p3-bahdanau-attention REQUIRES
  ('p3-bahdanau-attention', 'sequence-to-sequence', true),
  ('p3-bahdanau-attention', 'encoder-decoder-architecture', true),
  -- p3-luong-attention TEACHES
  ('p3-luong-attention', 'attention-bahdanau', false),
  -- p3-luong-attention REQUIRES
  ('p3-luong-attention', 'sequence-to-sequence', true),
  -- p3-illustrated-transformer TEACHES
  ('p3-illustrated-transformer', 'attention-mechanism', false),
  ('p3-illustrated-transformer', 'transformer-architecture', false),
  -- p3-illustrated-transformer REQUIRES
  ('p3-illustrated-transformer', 'attention-bahdanau', true),
  ('p3-illustrated-transformer', 'residual-connections', true),
  -- p3-bert-paper TEACHES
  ('p3-bert-paper', 'bert-masked-lm', false),
  ('p3-bert-paper', 'tokenization-bpe', false),
  -- p3-bert-paper REQUIRES
  ('p3-bert-paper', 'transformer-architecture', true),
  ('p3-bert-paper', 'attention-mechanism', true),
  -- p3-gpt2-paper TEACHES
  ('p3-gpt2-paper', 'autoregressive-generation', false),
  -- p3-gpt2-paper REQUIRES
  ('p3-gpt2-paper', 'transformer-architecture', true),
  ('p3-gpt2-paper', 'tokenization-bpe', true),
  -- p3-illustrated-gpt2 TEACHES
  ('p3-illustrated-gpt2', 'autoregressive-generation', false),
  -- p3-illustrated-gpt2 REQUIRES
  ('p3-illustrated-gpt2', 'transformer-architecture', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- F4 resource mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite) VALUES
  -- p4-gpt1-paper TEACHES
  ('p4-gpt1-paper', 'language-model-pretraining', false),
  -- p4-gpt1-paper REQUIRES
  ('p4-gpt1-paper', 'transformer-architecture', true),
  ('p4-gpt1-paper', 'autoregressive-generation', true),
  -- p4-gpt3-paper TEACHES
  ('p4-gpt3-paper', 'in-context-learning', false),
  ('p4-gpt3-paper', 'scaling-behavior', false),
  -- p4-gpt3-paper REQUIRES
  ('p4-gpt3-paper', 'language-model-pretraining', true),
  ('p4-gpt3-paper', 'scaling-laws', true),
  -- p4-instructgpt-paper TEACHES
  ('p4-instructgpt-paper', 'rlhf-alignment', false),
  ('p4-instructgpt-paper', 'instruction-tuning', false),
  -- p4-instructgpt-paper REQUIRES
  ('p4-instructgpt-paper', 'language-model-pretraining', true),
  ('p4-instructgpt-paper', 'in-context-learning', true),
  -- p4-dpo-paper TEACHES
  ('p4-dpo-paper', 'dpo', false),
  -- p4-dpo-paper REQUIRES
  ('p4-dpo-paper', 'rlhf-alignment', true),
  -- p4-llama-paper TEACHES
  ('p4-llama-paper', 'compute-optimal-training', false),
  -- p4-llama-paper REQUIRES
  ('p4-llama-paper', 'scaling-laws', true),
  ('p4-llama-paper', 'language-model-pretraining', true),
  -- p4-cot-paper TEACHES
  ('p4-cot-paper', 'in-context-learning', false),
  -- p4-cot-paper REQUIRES
  ('p4-cot-paper', 'language-model-pretraining', true),
  -- p4-cs224n TEACHES
  ('p4-cs224n', 'language-model-pretraining', false),
  ('p4-cs224n', 'word-embeddings', false),
  ('p4-cs224n', 'attention-mechanism', false),
  -- p4-cs224n REQUIRES
  ('p4-cs224n', 'neural-network-fundamentals', true),
  ('p4-cs224n', 'backpropagation-training', true)
ON CONFLICT (resource_id, concept_id) DO NOTHING;

-- ============================================================================
-- STEP 6: Clean up old duplicate resources
-- ============================================================================

-- Remove old gpt3-paper (replaced by p4-gpt3-paper)
DELETE FROM resource_concepts WHERE resource_id = 'gpt3-paper';
DELETE FROM resources WHERE id = 'gpt3-paper';

-- Remove old dpo-paper (replaced by p4-dpo-paper)
DELETE FROM resource_concepts WHERE resource_id = 'dpo-paper';
DELETE FROM resources WHERE id = 'dpo-paper';

COMMIT;

-- ============================================================================
-- Phase 2 Foundational Resources: Unblock the ML Infrastructure Bridge
-- ============================================================================
-- Problem: Phase 2 has a deadlock. Advanced resources (ZeRO, Mixed Precision,
-- etc.) require foundational concepts (distributed-training, gpu-compute-
-- fundamentals, etc.) that were NEVER created. The resource_concepts and
-- concept_prerequisites inserts in 20260217120000 silently failed due to
-- FK violations on these missing concept IDs.
--
-- This migration:
-- 1. Creates 5 foundational concepts for Phase 2
-- 2. Creates 3 introductory resources that teach those concepts
-- 3. Maps resource_concepts for the new resources
-- 4. Re-inserts prerequisite mappings that failed in the original migration
-- 5. Re-inserts concept_prerequisites that failed
-- 6. Cleans up phantom concept references (slos-slis, monitoring)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the 5 foundational Phase 2 concepts
-- ============================================================================
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('distributed-training', 'Distributed Training', 'distributed-training',
   'Training ML models across multiple GPUs/machines. Encompasses data parallelism, model parallelism, pipeline parallelism, and hybrid approaches. Key challenges: communication overhead, gradient synchronization, fault tolerance.',
   '2'::study_phase),
  ('data-parallelism', 'Data Parallelism', 'data-parallelism',
   'Splitting training data across multiple GPUs, each holding a full model copy. Gradients are synchronized via all-reduce. Foundation for DDP (Distributed Data Parallel) and ZeRO optimizations.',
   '2'::study_phase),
  ('gpu-compute-fundamentals', 'GPU Compute Fundamentals', 'gpu-compute-fundamentals',
   'How GPUs execute deep learning workloads. CUDA cores vs Tensor Cores, memory hierarchy (registers, shared memory, HBM), compute-bound vs memory-bandwidth-bound operations. Foundation for understanding optimization techniques.',
   '2'::study_phase),
  ('ml-data-pipelines', 'ML Data Pipelines', 'ml-data-pipelines',
   'End-to-end data flow for ML systems: extraction, validation, preparation, feature engineering, train/eval splits. MLOps maturity levels (0-2). Prevents train-serve skew and data dependency debt.',
   '2'::study_phase),
  ('model-serving-infra', 'Model Serving Infrastructure', 'model-serving-infra',
   'Patterns for deploying ML models in production: online vs batch inference, containerization, scaling strategies, health checks, model versioning. Bridge between model development and production deployment.',
   '2'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create 3 introductory resources (no prerequisites — entry points)
-- ============================================================================
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p2-lilian-weng-distributed',
   'How to Train Really Large Models on Many GPUs?',
   'article'::resource_type,
   'https://lilianweng.github.io/posts/2021-09-25-train-large/',
   'Lilian Weng',
   '2'::study_phase,
   'Comprehensive overview of distributed training techniques: data parallelism, model parallelism (tensor & pipeline), and hybrid approaches. Covers all-reduce, gradient compression, and communication optimization. Best single-article introduction to the field.',
   3),

  ('p2-horace-he-gpu',
   'Making Deep Learning Go Brrrr From First Principles',
   'article'::resource_type,
   'https://horace.io/brrr_intro.html',
   'Horace He',
   '2'::study_phase,
   'First-principles explanation of GPU performance for deep learning. Covers compute-bound vs memory-bandwidth-bound operations, operator fusion, Tensor Cores, and how to reason about performance bottlenecks. Essential mental model for all optimization work.',
   2),

  ('p2-google-mlops',
   'MLOps: Continuous Delivery and Automation Pipelines in ML',
   'article'::resource_type,
   'https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning',
   'Google Cloud',
   '2'::study_phase,
   'Google''s canonical MLOps guide defining three maturity levels (0-2). Covers ML pipelines, CI/CD for ML, feature stores, model monitoring, and serving patterns. Foundation for understanding production ML infrastructure.',
   3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 3: Map resource_concepts for the 3 new introductory resources
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  -- Lilian Weng article teaches distributed-training and data-parallelism
  ('p2-lilian-weng-distributed', 'distributed-training', FALSE),
  ('p2-lilian-weng-distributed', 'data-parallelism', FALSE),

  -- Horace He article teaches gpu-compute-fundamentals
  ('p2-horace-he-gpu', 'gpu-compute-fundamentals', FALSE),

  -- Google MLOps article teaches ml-data-pipelines and model-serving-infra
  ('p2-google-mlops', 'ml-data-pipelines', FALSE),
  ('p2-google-mlops', 'model-serving-infra', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Re-insert advanced Phase 2 resources that may be missing
-- ============================================================================
-- The original migration (20260217120000) inserted these resources, but
-- Supabase may have aborted subsequent statements after the FK violation,
-- so these resources might not exist. Re-insert defensively.
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p2-zero-paper', 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', 'paper',
   'https://arxiv.org/abs/1910.02054',
   'Rajbhandari et al. (Microsoft)',
   '2'::study_phase,
   'ZeRO (Zero Redundancy Optimizer) partitions optimizer states, gradients, and parameters across data-parallel processes. Three stages of increasing memory savings. Foundation for DeepSpeed and large-scale training.',
   6),
  ('p2-mixed-precision-paper', 'Mixed Precision Training', 'paper',
   'https://arxiv.org/abs/1710.03740',
   'Micikevicius et al. (NVIDIA/Baidu)',
   '2'::study_phase,
   'Training neural networks with FP16 arithmetic while maintaining FP32 master weights. Loss scaling to prevent gradient underflow. 2x memory reduction and faster compute on Tensor Cores. Standard practice for all modern LLM training.',
   4),
  ('p2-hidden-tech-debt-paper', 'Hidden Technical Debt in Machine Learning Systems', 'paper',
   'https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html',
   'Sculley et al. (Google)',
   '2'::study_phase,
   'Seminal paper on ML-specific technical debt: entanglement, hidden feedback loops, undeclared consumers, data dependencies, configuration debt. Only a small fraction of real-world ML systems is the ML code itself.',
   4),
  ('p2-docker-bentoml-tutorial', 'ML Model Serving with Docker & BentoML', 'article',
   'https://docs.bentoml.com/en/latest/',
   'BentoML / Docker',
   '2'::study_phase,
   'Practical guide to containerizing and serving ML models. Docker fundamentals for ML workflows. BentoML for building production-ready model serving endpoints. Bridge between model development and deployment.',
   6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: Re-insert advanced Phase 2 concepts that may be missing
-- ============================================================================
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('zero-optimizer', 'ZeRO Optimizer', 'zero-optimizer',
   'Zero Redundancy Optimizer that partitions optimizer states (stage 1), gradients (stage 2), and parameters (stage 3) across data-parallel GPUs. Each stage reduces memory per GPU while maintaining data parallelism semantics. Foundation for DeepSpeed.',
   '2'::study_phase),
  ('mixed-precision-training', 'Mixed Precision Training', 'mixed-precision-training',
   'Training with FP16 compute and FP32 master weights. Loss scaling prevents gradient underflow in FP16. Tensor Cores provide 2-8x speedup for FP16 matmuls. Standard practice since 2018 for all large model training.',
   '2'::study_phase),
  ('ml-technical-debt', 'ML Technical Debt', 'ml-technical-debt',
   'ML-specific forms of technical debt beyond traditional software: data dependency debt, model entanglement, hidden feedback loops, undeclared consumers, pipeline jungles, dead experimental codepaths. The ML code is often <5% of the total system.',
   '2'::study_phase),
  ('model-containerization', 'Model Containerization & Serving', 'model-containerization',
   'Packaging ML models with their dependencies into containers for reproducible deployment. Tools: Docker, BentoML, Triton. Covers dependency management, GPU passthrough, health checks, and scaling strategies.',
   '2'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Resource-concept mappings for advanced resources (teaches)
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p2-zero-paper', 'zero-optimizer', FALSE),
  ('p2-mixed-precision-paper', 'mixed-precision-training', FALSE),
  ('p2-hidden-tech-debt-paper', 'ml-technical-debt', FALSE),
  ('p2-docker-bentoml-tutorial', 'model-containerization', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: Resource prerequisite mappings (requires)
-- ============================================================================
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  ('p2-zero-paper', 'distributed-training', TRUE),
  ('p2-zero-paper', 'data-parallelism', TRUE),
  ('p2-mixed-precision-paper', 'gpu-compute-fundamentals', TRUE),
  ('p2-hidden-tech-debt-paper', 'ml-data-pipelines', TRUE),
  ('p2-docker-bentoml-tutorial', 'model-serving-infra', TRUE),
  ('p11-megatron-lm', 'distributed-training', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 8: Concept prerequisites
-- ============================================================================
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('zero-optimizer', 'data-parallelism'),
  ('mixed-precision-training', 'gpu-compute-fundamentals'),
  ('ml-technical-debt', 'ml-data-pipelines'),
  ('model-containerization', 'model-serving-infra')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 9: Clean up phantom concept references
-- ============================================================================
-- Remove any resource_concepts rows referencing concepts that were never created
-- (slos-slis, monitoring) — these may have been inserted manually.
DELETE FROM resource_concepts
WHERE concept_id IN ('slos-slis', 'monitoring')
  AND NOT EXISTS (SELECT 1 FROM concepts WHERE id = resource_concepts.concept_id);

-- Also clean concept_prerequisites if any reference these phantoms
DELETE FROM concept_prerequisites
WHERE prerequisite_id IN ('slos-slis', 'monitoring')
  AND NOT EXISTS (SELECT 1 FROM concepts WHERE id = concept_prerequisites.prerequisite_id);

DELETE FROM concept_prerequisites
WHERE concept_id IN ('slos-slis', 'monitoring')
  AND NOT EXISTS (SELECT 1 FROM concepts WHERE id = concept_prerequisites.concept_id);

-- ============================================================================
-- DONE — Phase 2 DAG is now:
--
-- [No prerequisites — Phase 2 entry points]
--   ├── p2-lilian-weng-distributed (3h) → teaches distributed-training, data-parallelism
--   ├── p2-horace-he-gpu (2h) → teaches gpu-compute-fundamentals
--   └── p2-google-mlops (3h) → teaches ml-data-pipelines, model-serving-infra
--         │
--         ▼
--   ├── p2-zero-paper (6h) ← requires distributed-training, data-parallelism
--   ├── p2-mixed-precision-paper (4h) ← requires gpu-compute-fundamentals
--   ├── p2-hidden-tech-debt-paper (4h) ← requires ml-data-pipelines
--   ├── p2-docker-bentoml-tutorial (6h) ← requires model-serving-infra
--   └── p11-megatron-lm (8h) ← requires distributed-training
-- ============================================================================

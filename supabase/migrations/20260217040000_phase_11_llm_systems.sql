-- Phase 11: LLM Systems Engineering
-- Deep-dive into GPU programming, CUDA, distributed training internals,
-- and high-performance serving. Based on CMU 11-868.

-- 1. Concepts (8)
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('cuda-gpu-programming', 'CUDA & GPU Programming',
   'cuda-gpu-programming',
   'CUDA programming model fundamentals: kernels, thread blocks, warps, grid dimensions. Understanding GPU execution model vs CPU: SIMT architecture, warp scheduling, occupancy. Writing basic CUDA kernels for vector operations, matrix multiply, and reductions. Essential foundation for understanding why transformers are fast on GPUs.',
   '11'::study_phase),

  ('gpu-memory-hierarchy', 'GPU Memory Hierarchy',
   'gpu-memory-hierarchy',
   'GPU memory system: global memory (HBM, high bandwidth but high latency), shared memory (on-chip, low latency, bank conflicts), registers, L1/L2 cache. Memory coalescing patterns for optimal throughput. Understanding HBM bandwidth as the bottleneck for large model inference. Memory-bound vs compute-bound operations.',
   '11'::study_phase),

  ('distributed-training-impl', 'Distributed Training Implementation',
   'distributed-training-impl',
   'Implementation details of distributed training beyond the conceptual level: ring-allreduce communication patterns, FSDP (Fully Sharded Data Parallelism) sharding strategies, ZeRO stages (1: optimizer, 2: gradients, 3: parameters), gradient accumulation for effective batch size scaling. NCCL communication primitives.',
   '11'::study_phase),

  ('model-parallelism-impl', 'Model Parallelism Implementation',
   'model-parallelism-impl',
   'Implementation of parallelism strategies for models that don''t fit on a single GPU: tensor parallelism (splitting layers across GPUs), pipeline parallelism (splitting layers sequentially with micro-batching), expert parallelism (MoE routing). Megatron-LM patterns. Communication overhead analysis and optimal configurations.',
   '11'::study_phase),

  ('flash-attention', 'FlashAttention',
   'flash-attention',
   'IO-aware attention algorithm that reduces memory reads/writes from O(N^2) to O(N) by tiling the computation to fit in SRAM. FlashAttention-2 improvements: better work partitioning across warps, reduced non-matmul FLOPs. Understanding why attention is memory-bound (not compute-bound) and how tiling exploits the memory hierarchy. Dao et al.',
   '11'::study_phase),

  ('quantization-impl', 'Quantization Implementation',
   'quantization-impl',
   'Internals of post-training quantization methods: GPTQ (layer-wise quantization with Hessian-based error compensation), AWQ (activation-aware weight quantization preserving salient channels), GGUF format for CPU inference. Calibration dataset selection, quality degradation measurement (perplexity delta, task-specific benchmarks). INT4 vs INT8 vs FP8 trade-offs.',
   '11'::study_phase),

  ('serving-systems', 'LLM Serving Systems',
   'serving-systems',
   'Architecture of high-performance LLM serving: vLLM (PagedAttention for memory management), TGI (Hugging Face), TensorRT-LLM (NVIDIA). Continuous batching vs static batching. Scheduling algorithms: first-come-first-served vs priority queues. Prefill vs decode phase optimization. Speculative decoding for latency reduction.',
   '11'::study_phase),

  ('kernel-optimization', 'Kernel Optimization',
   'kernel-optimization',
   'Advanced GPU kernel optimization: kernel fusion (combining multiple operations to reduce memory traffic), Triton compiler (Python-like DSL for writing GPU kernels), custom CUDA kernels for transformer operations (fused attention, fused LayerNorm+GELU). Profiling with NSight and torch.profiler. Roofline model analysis.',
   '11'::study_phase)

ON CONFLICT (id) DO NOTHING;

-- 2. Concept prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  -- Phase 11 builds on Phase 2 (gpu-compute-fundamentals), Phase 8 (kv-cache, quantization)
  ('cuda-gpu-programming', 'gpu-compute-fundamentals'),
  ('gpu-memory-hierarchy', 'cuda-gpu-programming'),
  ('distributed-training-impl', 'distributed-training'),
  ('model-parallelism-impl', 'distributed-training-impl'),
  ('flash-attention', 'attention-mechanism'),
  ('flash-attention', 'gpu-memory-hierarchy'),
  ('quantization-impl', 'quantization'),
  ('serving-systems', 'kv-cache'),
  ('serving-systems', 'batching-inference'),
  ('kernel-optimization', 'cuda-gpu-programming'),
  ('kernel-optimization', 'flash-attention')
ON CONFLICT DO NOTHING;

-- 3. Resources (5)
INSERT INTO resources (id, title, type, url, author, phase, description, estimated_hours)
VALUES
  ('p11-cmu-11868', 'CMU 11-868: Large Language Model Systems', 'course',
   'https://llmsystem.github.io/llmsystem2025spring/',
   'CMU / Zhihao Jia',
   '11'::study_phase,
   'Graduate course covering the systems side of LLMs: GPU architecture, CUDA programming, distributed training (FSDP, ZeRO), model parallelism (tensor, pipeline, expert), attention optimization (FlashAttention), quantization, and serving systems (vLLM, TGI). The definitive course for LLM systems engineering.',
   40),

  ('p11-flash-attention-paper', 'FlashAttention: Fast and Memory-Efficient Exact Attention', 'paper',
   'https://arxiv.org/abs/2205.14135',
   'Tri Dao et al.',
   '11'::study_phase,
   'Introduces IO-aware attention that tiles computation to exploit GPU memory hierarchy. Reduces attention memory from O(N^2) to O(N) without approximation. Foundation for all modern efficient attention implementations.',
   6),

  ('p11-megatron-lm', 'Efficient Large-Scale Language Model Training on GPU Clusters', 'paper',
   'https://arxiv.org/abs/2104.04473',
   'Narayanan et al. (NVIDIA)',
   '11'::study_phase,
   'Megatron-LM v2: combines tensor, pipeline, and data parallelism for training models with trillions of parameters. Defines the canonical approach to 3D parallelism used by all major LLM training runs.',
   8),

  ('p11-gptq-paper', 'GPTQ: Accurate Post-Training Quantization for Generative Pre-Trained Transformers', 'paper',
   'https://arxiv.org/abs/2210.17323',
   'Frantar et al.',
   '11'::study_phase,
   'Layer-wise quantization using approximate second-order information (Hessian). Achieves INT4 quantization with minimal quality loss. Foundation for GGUF, TheBloke models, and most consumer LLM deployment.',
   4),

  ('p11-vllm-paper', 'Efficient Memory Management for Large Language Model Serving with PagedAttention', 'paper',
   'https://arxiv.org/abs/2309.06180',
   'Kwon et al. (UC Berkeley)',
   '11'::study_phase,
   'Introduces PagedAttention: virtual memory-inspired KV cache management that eliminates fragmentation and enables flexible memory sharing. Powers vLLM, the most widely-used open-source LLM serving engine.',
   4)

ON CONFLICT (id) DO NOTHING;

-- 4. Resource-concept mappings
INSERT INTO resource_concepts (resource_id, concept_id, is_prerequisite)
VALUES
  -- CMU 11-868 teaches all Phase 11 concepts
  ('p11-cmu-11868', 'cuda-gpu-programming', FALSE),
  ('p11-cmu-11868', 'gpu-memory-hierarchy', FALSE),
  ('p11-cmu-11868', 'distributed-training-impl', FALSE),
  ('p11-cmu-11868', 'model-parallelism-impl', FALSE),
  ('p11-cmu-11868', 'flash-attention', FALSE),
  ('p11-cmu-11868', 'quantization-impl', FALSE),
  ('p11-cmu-11868', 'serving-systems', FALSE),
  ('p11-cmu-11868', 'kernel-optimization', FALSE),

  -- FlashAttention paper
  ('p11-flash-attention-paper', 'flash-attention', FALSE),
  ('p11-flash-attention-paper', 'gpu-memory-hierarchy', FALSE),

  -- Megatron-LM paper
  ('p11-megatron-lm', 'distributed-training-impl', FALSE),
  ('p11-megatron-lm', 'model-parallelism-impl', FALSE),

  -- GPTQ paper
  ('p11-gptq-paper', 'quantization-impl', FALSE),

  -- vLLM paper
  ('p11-vllm-paper', 'serving-systems', FALSE),

  -- Prerequisites from earlier phases
  ('p11-cmu-11868', 'gpu-compute-fundamentals', TRUE),
  ('p11-vllm-paper', 'kv-cache', TRUE),
  ('p11-gptq-paper', 'quantization', TRUE)

ON CONFLICT DO NOTHING;

-- 5. Project: High-Performance LLM Serving System
INSERT INTO projects (id, title, phase, description, deliverables)
VALUES (
  'project-llm-serving',
  'High-Performance LLM Serving System',
  '11'::study_phase,
  'Build a high-performance LLM inference server that demonstrates mastery of GPU systems, memory management, quantization, and serving optimization. Implement or integrate key techniques from the course: continuous batching, PagedAttention, quantized inference, and distributed serving. Must include profiling and written analysis.',
  ARRAY[
    'Custom inference server with continuous batching: dynamic request scheduling, no padding waste',
    'PagedAttention implementation or measured integration: KV cache memory utilization > 90%',
    'Quantized model benchmark: INT4/INT8 vs FP16 on 50+ queries with latency, throughput, and quality metrics',
    'Distributed serving with tensor parallelism on 2+ GPUs (or simulated with process-based parallelism)',
    'Profiling report: GPU utilization, memory bandwidth, compute vs memory bound analysis with NSight or torch.profiler',
    'Written analysis: FlashAttention vs standard attention with own measurements on varying sequence lengths'
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO project_concepts (project_id, concept_id)
VALUES
  ('project-llm-serving', 'cuda-gpu-programming'),
  ('project-llm-serving', 'gpu-memory-hierarchy'),
  ('project-llm-serving', 'flash-attention'),
  ('project-llm-serving', 'quantization-impl'),
  ('project-llm-serving', 'serving-systems'),
  ('project-llm-serving', 'kernel-optimization'),
  ('project-llm-serving', 'distributed-training-impl'),
  ('project-llm-serving', 'model-parallelism-impl')
ON CONFLICT DO NOTHING;

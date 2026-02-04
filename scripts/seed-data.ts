/**
 * Jarre - Seed Data
 *
 * Complete study plan for AI/LLM Systems Architect path.
 * Run with: npx tsx scripts/seed-data.ts
 */

import type { ResourceType, StudyPhase } from '../src/types';

// ============================================================================
// TYPES FOR SEED DATA
// ============================================================================

interface SeedResource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  author?: string;
  phase: StudyPhase;
  description?: string;
  estimatedHours?: number;
  concepts: string[]; // concept IDs this resource teaches
  prerequisites?: string[]; // concept IDs needed before
}

interface SeedConcept {
  id: string;
  name: string;
  canonicalDefinition: string;
  phase: StudyPhase;
  prerequisites?: string[]; // other concept IDs
}

// ============================================================================
// CONCEPTS
// ============================================================================

export const concepts: SeedConcept[] = [
  // ---------------------------------------------------------------------------
  // PHASE 1: Distributed Systems Fundamentals
  // ---------------------------------------------------------------------------
  {
    id: 'reliability',
    name: 'Reliability',
    canonicalDefinition: 'The system continues to work correctly even when things go wrong (faults). A reliable system is fault-tolerant, not fault-free.',
    phase: 1,
  },
  {
    id: 'scalability',
    name: 'Scalability',
    canonicalDefinition: 'The ability of a system to handle increased load by adding resources. Measured in terms of load parameters (requests/sec, data volume, etc).',
    phase: 1,
  },
  {
    id: 'maintainability',
    name: 'Maintainability',
    canonicalDefinition: 'How easy it is for engineers to work on the system over time: operability, simplicity, and evolvability.',
    phase: 1,
  },
  {
    id: 'data-models',
    name: 'Data Models',
    canonicalDefinition: 'The way data is structured and related: relational, document, graph, etc. Each model makes certain operations easier and others harder.',
    phase: 1,
  },
  {
    id: 'storage-engines',
    name: 'Storage Engines',
    canonicalDefinition: 'How databases store and retrieve data on disk. Key types: log-structured (LSM trees) vs page-oriented (B-trees). Trade-offs between write and read performance.',
    phase: 1,
    prerequisites: ['data-models'],
  },
  {
    id: 'replication',
    name: 'Replication',
    canonicalDefinition: 'Keeping copies of the same data on multiple machines. Purposes: high availability, fault tolerance, latency reduction. Key models: leader-based, multi-leader, leaderless.',
    phase: 1,
    prerequisites: ['reliability'],
  },
  {
    id: 'partitioning',
    name: 'Partitioning (Sharding)',
    canonicalDefinition: 'Splitting a large dataset across multiple machines. Each partition is a mini-database. Strategies: by key range, by hash. Challenge: rebalancing, hot spots.',
    phase: 1,
    prerequisites: ['scalability', 'replication'],
  },
  {
    id: 'distributed-failures',
    name: 'Distributed System Failures',
    canonicalDefinition: 'What can go wrong in distributed systems: network partitions, node failures, clock skew, Byzantine faults. Partial failures are the norm, not the exception.',
    phase: 1,
    prerequisites: ['replication', 'partitioning'],
  },
  {
    id: 'consistency-models',
    name: 'Consistency Models',
    canonicalDefinition: 'Guarantees about what values readers will see. Spectrum from strong (linearizability) to weak (eventual). CAP theorem: can\'t have consistency, availability, and partition tolerance simultaneously.',
    phase: 1,
    prerequisites: ['distributed-failures'],
  },
  {
    id: 'consensus',
    name: 'Consensus',
    canonicalDefinition: 'Getting multiple nodes to agree on a value. Fundamental algorithms: Paxos, Raft, Zab. Used for leader election, atomic commit, total order broadcast.',
    phase: 1,
    prerequisites: ['consistency-models'],
  },
  {
    id: 'stream-processing',
    name: 'Stream Processing',
    canonicalDefinition: 'Processing data continuously as it arrives, rather than in batches. Key concepts: event time vs processing time, windowing, exactly-once semantics.',
    phase: 1,
    prerequisites: ['partitioning'],
  },
  {
    id: 'slos-slis',
    name: 'SLOs and SLIs',
    canonicalDefinition: 'Service Level Objectives (SLOs) are target values for service reliability. Service Level Indicators (SLIs) are the metrics that measure it. Error budgets allow controlled risk-taking.',
    phase: 1,
  },
  {
    id: 'monitoring',
    name: 'Monitoring Distributed Systems',
    canonicalDefinition: 'Collecting and analyzing metrics, logs, and traces to understand system health. The four golden signals: latency, traffic, errors, saturation.',
    phase: 1,
    prerequisites: ['slos-slis'],
  },
  {
    id: 'embracing-risk',
    name: 'Embracing Risk',
    canonicalDefinition: '100% reliability is impossible and prohibitively expensive. Instead, define acceptable failure rates (error budgets) and invest accordingly.',
    phase: 1,
    prerequisites: ['slos-slis'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: LLM Fundamentals + Reasoning/Agents
  // ---------------------------------------------------------------------------
  {
    id: 'attention-mechanism',
    name: 'Attention Mechanism',
    canonicalDefinition: 'A way for models to focus on relevant parts of the input when producing output. Self-attention allows each position to attend to all positions in the previous layer.',
    phase: 2,
  },
  {
    id: 'transformer-architecture',
    name: 'Transformer Architecture',
    canonicalDefinition: 'Neural network architecture based entirely on attention mechanisms, no recurrence. Key components: multi-head attention, positional encoding, feed-forward layers.',
    phase: 2,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'query-key-value',
    name: 'Query-Key-Value (QKV)',
    canonicalDefinition: 'The three projections in attention. Query: what am I looking for? Key: what do I contain? Value: what do I provide? Attention = softmax(QK^T/√d)V',
    phase: 2,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'positional-encoding',
    name: 'Positional Encoding',
    canonicalDefinition: 'Since attention has no inherent notion of position, we add positional information to embeddings. Original: sinusoidal functions. Modern: learned or rotary (RoPE).',
    phase: 2,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'scaling-laws',
    name: 'Scaling Laws',
    canonicalDefinition: 'Empirical relationships between model size, data, compute, and performance. Loss scales as power law with each factor. Guides efficient allocation of training budget.',
    phase: 2,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'compute-optimal-training',
    name: 'Compute-Optimal Training',
    canonicalDefinition: 'Chinchilla finding: models are often undertrained. Optimal: scale data and parameters equally. 70B model trained on 1.4T tokens beats 280B on 300B tokens.',
    phase: 2,
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'foundation-models',
    name: 'Foundation Models',
    canonicalDefinition: 'Large models trained on broad data that can be adapted to many downstream tasks. Emergent abilities appear at scale. Risks: homogenization, bias amplification.',
    phase: 2,
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'react-pattern',
    name: 'ReAct Pattern',
    canonicalDefinition: 'Interleaving reasoning (chain-of-thought) with acting (tool use). Model thinks step by step, takes action, observes result, repeats. Enables grounded, traceable reasoning.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'chain-of-thought',
    name: 'Chain-of-Thought',
    canonicalDefinition: 'Prompting technique where the model shows intermediate reasoning steps. Improves performance on complex tasks. Can be zero-shot ("think step by step") or few-shot.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'tree-of-thoughts',
    name: 'Tree of Thoughts',
    canonicalDefinition: 'Extension of chain-of-thought where model explores multiple reasoning paths, evaluates them, and can backtrack. Enables deliberate problem-solving.',
    phase: 2,
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'reflexion',
    name: 'Reflexion',
    canonicalDefinition: 'Agent pattern where model reflects on failures and stores verbal feedback in memory. Enables learning from mistakes without weight updates.',
    phase: 2,
    prerequisites: ['react-pattern'],
  },
  {
    id: 'tool-use',
    name: 'Tool Use',
    canonicalDefinition: 'Teaching LLMs to call external APIs, calculators, search engines. Extends capabilities beyond training data. Key challenge: knowing when to use which tool.',
    phase: 2,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'plan-and-execute',
    name: 'Plan-and-Execute Agents',
    canonicalDefinition: 'Two-phase agent pattern: first create a plan (list of steps), then execute each step. Separates planning from execution, enables re-planning on failure.',
    phase: 2,
    prerequisites: ['react-pattern', 'tool-use'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: RAG, Memory, Context
  // ---------------------------------------------------------------------------
  {
    id: 'rag-basics',
    name: 'Retrieval-Augmented Generation',
    canonicalDefinition: 'Augmenting LLM generation with retrieved documents. Reduces hallucination, enables knowledge updates without retraining. Components: retriever, reader, generator.',
    phase: 3,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'embeddings',
    name: 'Embeddings',
    canonicalDefinition: 'Dense vector representations of text. Similar meanings → similar vectors. Enable semantic search. Models: sentence-transformers, OpenAI embeddings, etc.',
    phase: 3,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'vector-search',
    name: 'Vector Search',
    canonicalDefinition: 'Finding similar items by comparing embedding vectors. Algorithms: exact (brute force), approximate (HNSW, IVF). Trade-off: speed vs recall.',
    phase: 3,
    prerequisites: ['embeddings'],
  },
  {
    id: 'chunking-strategies',
    name: 'Chunking Strategies',
    canonicalDefinition: 'How to split documents for embedding. Options: fixed size, sentence-based, semantic, recursive. Trade-off: too small loses context, too large dilutes relevance.',
    phase: 3,
    prerequisites: ['rag-basics', 'embeddings'],
  },
  {
    id: 'lost-in-middle',
    name: 'Lost in the Middle',
    canonicalDefinition: 'LLMs pay less attention to information in the middle of long contexts. Performance is U-shaped: best for info at start or end. Implications for RAG ordering.',
    phase: 3,
    prerequisites: ['rag-basics'],
  },
  {
    id: 'context-window-limits',
    name: 'Context Window Limits',
    canonicalDefinition: 'Maximum tokens a model can process. Attention is O(n²) in context length. Longer context ≠ better understanding. Cost scales with context size.',
    phase: 3,
    prerequisites: ['attention-mechanism'],
  },
  {
    id: 'external-memory',
    name: 'External Memory for LLMs',
    canonicalDefinition: 'Storing information outside the model (vector DBs, key-value stores) and retrieving as needed. Enables unbounded knowledge without context limits.',
    phase: 3,
    prerequisites: ['rag-basics', 'vector-search'],
  },
  {
    id: 'hybrid-search',
    name: 'Hybrid Search',
    canonicalDefinition: 'Combining dense (embedding) and sparse (keyword/BM25) retrieval. Often outperforms either alone. Requires score normalization and fusion strategies.',
    phase: 3,
    prerequisites: ['vector-search'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: Safety, Guardrails, Evaluation
  // ---------------------------------------------------------------------------
  {
    id: 'constitutional-ai',
    name: 'Constitutional AI',
    canonicalDefinition: 'Training AI to follow principles (a "constitution") through self-critique and revision. RLHF alternative that\'s more scalable and transparent.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    canonicalDefinition: 'Sampling multiple reasoning paths and taking majority vote. Improves accuracy on reasoning tasks. Trade-off: cost (multiple generations) vs reliability.',
    phase: 4,
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'llm-evaluation',
    name: 'LLM Evaluation',
    canonicalDefinition: 'Measuring model quality: benchmarks (MMLU, HumanEval), human evaluation, LLM-as-judge. Challenge: metrics don\'t capture real-world usefulness.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },
  {
    id: 'red-teaming',
    name: 'Red Teaming LLMs',
    canonicalDefinition: 'Adversarial testing to find failure modes: jailbreaks, harmful outputs, bias. Manual and automated approaches. Essential before deployment.',
    phase: 4,
    prerequisites: ['llm-evaluation'],
  },
  {
    id: 'output-validation',
    name: 'Output Validation',
    canonicalDefinition: 'Checking LLM outputs before using them: schema validation (JSON), fact-checking, safety filtering. Defense in depth against unreliable generations.',
    phase: 4,
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: Inference, Serving, Economics
  // ---------------------------------------------------------------------------
  {
    id: 'kv-cache',
    name: 'KV Cache',
    canonicalDefinition: 'Caching key-value pairs from previous tokens during generation. Avoids recomputation. Memory scales with batch size × sequence length × layers.',
    phase: 5,
    prerequisites: ['query-key-value', 'transformer-architecture'],
  },
  {
    id: 'batching-inference',
    name: 'Batching for Inference',
    canonicalDefinition: 'Processing multiple requests together to utilize GPU parallelism. Challenge: different sequence lengths. Solutions: continuous batching, iteration-level scheduling.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'paged-attention',
    name: 'PagedAttention',
    canonicalDefinition: 'Memory management technique from vLLM. Stores KV cache in non-contiguous blocks like virtual memory. Enables efficient memory sharing and larger batches.',
    phase: 5,
    prerequisites: ['kv-cache', 'batching-inference'],
  },
  {
    id: 'speculative-decoding',
    name: 'Speculative Decoding',
    canonicalDefinition: 'Using a small draft model to generate candidate tokens, then verifying with the large model in parallel. Speeds up inference without quality loss.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'quantization',
    name: 'Quantization',
    canonicalDefinition: 'Reducing precision of model weights (FP16 → INT8 → INT4). Reduces memory and speeds up inference. Trade-off: potential quality degradation.',
    phase: 5,
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'token-economics',
    name: 'Token Economics',
    canonicalDefinition: 'Understanding LLM costs: input tokens vs output tokens, price per million, context length impact. Output tokens are 3-5x more expensive than input.',
    phase: 5,
    prerequisites: ['kv-cache'],
  },
  {
    id: 'model-routing',
    name: 'Model Routing',
    canonicalDefinition: 'Directing requests to different models based on complexity, cost, latency requirements. Simple queries → small/local models. Complex → large models.',
    phase: 5,
    prerequisites: ['token-economics'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 6: Frameworks (Critical Understanding)
  // ---------------------------------------------------------------------------
  {
    id: 'langchain-architecture',
    name: 'LangChain Architecture',
    canonicalDefinition: 'Framework for building LLM applications. Components: chains, agents, memory, tools. Criticism: too much abstraction, hard to debug, performance overhead.',
    phase: 6,
    prerequisites: ['react-pattern', 'rag-basics'],
  },
  {
    id: 'llamaindex-architecture',
    name: 'LlamaIndex Architecture',
    canonicalDefinition: 'Framework focused on data ingestion and retrieval for LLMs. Indexes, query engines, data connectors. Better for RAG-specific use cases than LangChain.',
    phase: 6,
    prerequisites: ['rag-basics', 'chunking-strategies'],
  },
  {
    id: 'framework-tradeoffs',
    name: 'Framework Trade-offs',
    canonicalDefinition: 'When to use frameworks vs build from scratch. Frameworks: fast prototyping, community. Custom: control, performance, debuggability. Production often needs custom.',
    phase: 6,
    prerequisites: ['langchain-architecture', 'llamaindex-architecture'],
  },
];

// ============================================================================
// RESOURCES
// ============================================================================

export const resources: SeedResource[] = [
  // ---------------------------------------------------------------------------
  // PHASE 1: BOOKS - Distributed Systems
  // ---------------------------------------------------------------------------
  {
    id: 'ddia-ch1',
    title: 'DDIA Chapter 1: Reliable, Scalable, and Maintainable Applications',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Foundation chapter. Defines the three key properties of data systems and why they matter.',
    estimatedHours: 3,
    concepts: ['reliability', 'scalability', 'maintainability'],
  },
  {
    id: 'ddia-ch2',
    title: 'DDIA Chapter 2: Data Models and Query Languages',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Relational vs document vs graph models. How data model choice affects application code.',
    estimatedHours: 4,
    concepts: ['data-models'],
  },
  {
    id: 'ddia-ch3',
    title: 'DDIA Chapter 3: Storage and Retrieval',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'How databases store data on disk. LSM trees vs B-trees. Column-oriented storage.',
    estimatedHours: 5,
    concepts: ['storage-engines'],
    prerequisites: ['data-models'],
  },
  {
    id: 'ddia-ch5',
    title: 'DDIA Chapter 5: Replication',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Leader-based, multi-leader, and leaderless replication. Handling failures and conflicts.',
    estimatedHours: 5,
    concepts: ['replication'],
    prerequisites: ['reliability'],
  },
  {
    id: 'ddia-ch6',
    title: 'DDIA Chapter 6: Partitioning',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Strategies for splitting data across nodes. Rebalancing. Secondary indexes.',
    estimatedHours: 4,
    concepts: ['partitioning'],
    prerequisites: ['scalability', 'replication'],
  },
  {
    id: 'ddia-ch8',
    title: 'DDIA Chapter 8: The Trouble with Distributed Systems',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'What can go wrong: network problems, clocks, process pauses. Why distributed systems are hard.',
    estimatedHours: 4,
    concepts: ['distributed-failures'],
    prerequisites: ['replication', 'partitioning'],
  },
  {
    id: 'ddia-ch9',
    title: 'DDIA Chapter 9: Consistency and Consensus',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Linearizability, ordering guarantees, distributed transactions, consensus algorithms.',
    estimatedHours: 6,
    concepts: ['consistency-models', 'consensus'],
    prerequisites: ['distributed-failures'],
  },
  {
    id: 'ddia-ch11',
    title: 'DDIA Chapter 11: Stream Processing',
    type: 'book',
    author: 'Martin Kleppmann',
    phase: 1,
    description: 'Processing unbounded data. Event time vs processing time. Stream joins and fault tolerance.',
    estimatedHours: 5,
    concepts: ['stream-processing'],
    prerequisites: ['partitioning'],
  },
  {
    id: 'tanenbaum-ch1',
    title: 'Distributed Systems Ch 1: Introduction',
    type: 'book',
    author: 'Tanenbaum & Van Steen',
    phase: 1,
    description: 'Goals and types of distributed systems. Design challenges.',
    estimatedHours: 2,
    concepts: ['reliability', 'scalability'],
  },
  {
    id: 'tanenbaum-ch5',
    title: 'Distributed Systems Ch 5: Replication',
    type: 'book',
    author: 'Tanenbaum & Van Steen',
    phase: 1,
    description: 'Data-centric and client-centric consistency. Replica management.',
    estimatedHours: 4,
    concepts: ['replication', 'consistency-models'],
    prerequisites: ['reliability'],
  },
  {
    id: 'sre-ch3',
    title: 'SRE Book Ch 3: Embracing Risk',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'Why 100% reliability is wrong target. Error budgets. Risk tolerance.',
    estimatedHours: 2,
    concepts: ['embracing-risk', 'slos-slis'],
  },
  {
    id: 'sre-ch4',
    title: 'SRE Book Ch 4: Service Level Objectives',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'Defining and measuring SLOs. Choosing SLIs. Error budgets in practice.',
    estimatedHours: 2,
    concepts: ['slos-slis'],
  },
  {
    id: 'sre-ch6',
    title: 'SRE Book Ch 6: Monitoring Distributed Systems',
    type: 'book',
    author: 'Google',
    phase: 1,
    description: 'The four golden signals. White-box vs black-box monitoring. Alert philosophy.',
    estimatedHours: 2,
    concepts: ['monitoring'],
    prerequisites: ['slos-slis'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 1: COURSES - Distributed Systems
  // ---------------------------------------------------------------------------
  {
    id: 'mit-6824',
    title: 'MIT 6.824: Distributed Systems',
    type: 'course',
    url: 'https://pdos.csail.mit.edu/6.824/',
    phase: 1,
    description: 'Graduate-level course covering fault tolerance, replication, consistency. Includes Raft implementation.',
    estimatedHours: 40,
    concepts: ['replication', 'consensus', 'distributed-failures', 'consistency-models'],
    prerequisites: ['reliability'],
  },
  {
    id: 'stanford-cs244b',
    title: 'Stanford CS244b: Distributed Systems',
    type: 'course',
    url: 'https://www.scs.stanford.edu/20sp-cs244b/',
    phase: 1,
    description: 'Focus on practical distributed systems. Case studies of real systems.',
    estimatedHours: 30,
    concepts: ['replication', 'partitioning', 'consensus'],
    prerequisites: ['reliability', 'scalability'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: PAPERS - LLM Fundamentals
  // ---------------------------------------------------------------------------
  {
    id: 'attention-paper',
    title: 'Attention Is All You Need',
    type: 'paper',
    url: 'https://arxiv.org/abs/1706.03762',
    author: 'Vaswani et al.',
    phase: 2,
    description: 'The original Transformer paper. Introduces self-attention, multi-head attention, positional encoding.',
    estimatedHours: 6,
    concepts: ['attention-mechanism', 'transformer-architecture', 'query-key-value', 'positional-encoding'],
  },
  {
    id: 'scaling-laws-paper',
    title: 'Scaling Laws for Neural Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2001.08361',
    author: 'Kaplan et al. (OpenAI)',
    phase: 2,
    description: 'Empirical study of how loss scales with model size, data, and compute.',
    estimatedHours: 4,
    concepts: ['scaling-laws'],
    prerequisites: ['transformer-architecture'],
  },
  {
    id: 'chinchilla-paper',
    title: 'Training Compute-Optimal Large Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2203.15556',
    author: 'Hoffmann et al. (DeepMind)',
    phase: 2,
    description: 'Chinchilla paper. Shows models are undertrained, optimal scaling requires more data.',
    estimatedHours: 3,
    concepts: ['compute-optimal-training'],
    prerequisites: ['scaling-laws'],
  },
  {
    id: 'foundation-models-paper',
    title: 'On the Opportunities and Risks of Foundation Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2108.07258',
    author: 'Bommasani et al. (Stanford)',
    phase: 2,
    description: 'Comprehensive overview of foundation models: capabilities, risks, societal impact.',
    estimatedHours: 8,
    concepts: ['foundation-models'],
    prerequisites: ['scaling-laws'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: PAPERS - Reasoning & Agents
  // ---------------------------------------------------------------------------
  {
    id: 'react-paper',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2210.03629',
    author: 'Yao et al.',
    phase: 2,
    description: 'Interleaving reasoning traces with actions. Foundation for modern LLM agents.',
    estimatedHours: 4,
    concepts: ['react-pattern', 'chain-of-thought', 'tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'tree-of-thoughts-paper',
    title: 'Tree of Thoughts: Deliberate Problem Solving with Large Language Models',
    type: 'paper',
    url: 'https://arxiv.org/abs/2305.10601',
    author: 'Yao et al.',
    phase: 2,
    description: 'Exploring multiple reasoning paths with evaluation and backtracking.',
    estimatedHours: 3,
    concepts: ['tree-of-thoughts'],
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'reflexion-paper',
    title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
    type: 'paper',
    url: 'https://arxiv.org/abs/2303.11366',
    author: 'Shinn et al.',
    phase: 2,
    description: 'Agents that learn from verbal feedback stored in memory.',
    estimatedHours: 3,
    concepts: ['reflexion'],
    prerequisites: ['react-pattern'],
  },
  {
    id: 'toolformer-paper',
    title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
    type: 'paper',
    url: 'https://arxiv.org/abs/2302.04761',
    author: 'Schick et al. (Meta)',
    phase: 2,
    description: 'Self-supervised approach to teaching LLMs when and how to use tools.',
    estimatedHours: 3,
    concepts: ['tool-use'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 2: VIDEOS - LLM Understanding
  // ---------------------------------------------------------------------------
  {
    id: 'karpathy-intro-llms',
    title: 'Intro to Large Language Models',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'One-hour overview of how LLMs work, from tokens to training to inference.',
    estimatedHours: 2,
    concepts: ['foundation-models', 'scaling-laws'],
  },
  {
    id: 'karpathy-llm-os',
    title: 'LLMs as Operating Systems',
    type: 'video',
    author: 'Andrej Karpathy',
    phase: 2,
    description: 'Conceptualizing LLMs as a new kind of operating system. Memory, tools, scheduling.',
    estimatedHours: 2,
    concepts: ['foundation-models', 'tool-use'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'stanford-cs25',
    title: 'Stanford CS25: Transformers United',
    type: 'course',
    url: 'https://web.stanford.edu/class/cs25/',
    phase: 2,
    description: 'Seminar series on Transformers. Talks from researchers at OpenAI, Google, etc.',
    estimatedHours: 20,
    concepts: ['transformer-architecture', 'attention-mechanism', 'scaling-laws'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: PAPERS - RAG & Memory
  // ---------------------------------------------------------------------------
  {
    id: 'rag-paper',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    type: 'paper',
    url: 'https://arxiv.org/abs/2005.11401',
    author: 'Lewis et al. (Meta)',
    phase: 3,
    description: 'The original RAG paper. Combining retrieval with generation.',
    estimatedHours: 4,
    concepts: ['rag-basics', 'embeddings'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'lost-in-middle-paper',
    title: 'Lost in the Middle: How Language Models Use Long Contexts',
    type: 'paper',
    url: 'https://arxiv.org/abs/2307.03172',
    author: 'Liu et al.',
    phase: 3,
    description: 'LLMs struggle with information in the middle of long contexts. U-shaped attention.',
    estimatedHours: 2,
    concepts: ['lost-in-middle', 'context-window-limits'],
    prerequisites: ['rag-basics'],
  },
  {
    id: 'long-context-paper',
    title: 'Do Long-Context Models Really Understand?',
    type: 'paper',
    phase: 3,
    description: 'Critical examination of whether long context = better understanding.',
    estimatedHours: 2,
    concepts: ['context-window-limits'],
    prerequisites: ['attention-mechanism'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 3: ARTICLES - RAG Practical
  // ---------------------------------------------------------------------------
  {
    id: 'llamaindex-rag-pitfalls',
    title: 'LlamaIndex Blog: RAG Pitfalls',
    type: 'article',
    url: 'https://www.llamaindex.ai/blog',
    phase: 3,
    description: 'Practical lessons on what goes wrong with RAG in production.',
    estimatedHours: 2,
    concepts: ['chunking-strategies', 'hybrid-search'],
    prerequisites: ['rag-basics'],
  },
  {
    id: 'pinecone-rag-production',
    title: 'Pinecone: RAG in Production',
    type: 'video',
    url: 'https://www.youtube.com/c/PineconeIO',
    phase: 3,
    description: 'Engineering talks on running RAG at scale. Failure cases and solutions.',
    estimatedHours: 3,
    concepts: ['vector-search', 'hybrid-search', 'chunking-strategies'],
    prerequisites: ['rag-basics', 'embeddings'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: PAPERS - Safety & Guardrails
  // ---------------------------------------------------------------------------
  {
    id: 'constitutional-ai-paper',
    title: 'Constitutional AI: Harmlessness from AI Feedback',
    type: 'paper',
    url: 'https://arxiv.org/abs/2212.08073',
    author: 'Bai et al. (Anthropic)',
    phase: 4,
    description: 'Training AI to follow principles through self-critique. Alternative to RLHF.',
    estimatedHours: 4,
    concepts: ['constitutional-ai'],
    prerequisites: ['foundation-models'],
  },
  {
    id: 'self-consistency-paper',
    title: 'Self-Consistency Improves Chain of Thought Reasoning',
    type: 'paper',
    url: 'https://arxiv.org/abs/2203.11171',
    author: 'Wang et al. (Google)',
    phase: 4,
    description: 'Sample multiple reasoning paths, take majority vote. Simple but effective.',
    estimatedHours: 2,
    concepts: ['self-consistency'],
    prerequisites: ['chain-of-thought'],
  },
  {
    id: 'red-teaming-paper',
    title: 'Red Teaming Language Models',
    type: 'paper',
    phase: 4,
    description: 'Methods for adversarial testing of LLMs before deployment.',
    estimatedHours: 3,
    concepts: ['red-teaming', 'llm-evaluation'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 4: VIDEOS - Safety
  // ---------------------------------------------------------------------------
  {
    id: 'anthropic-safety-talks',
    title: 'Anthropic Safety Research Talks',
    type: 'video',
    url: 'https://www.youtube.com/@anthropic-ai',
    phase: 4,
    description: 'Research presentations on LLM reliability, evaluation, alignment.',
    estimatedHours: 4,
    concepts: ['constitutional-ai', 'llm-evaluation', 'output-validation'],
    prerequisites: ['foundation-models'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: PAPERS - Inference & Economics
  // ---------------------------------------------------------------------------
  {
    id: 'vllm-paper',
    title: 'vLLM: Easy, Fast, and Cheap LLM Serving with PagedAttention',
    type: 'paper',
    url: 'https://arxiv.org/abs/2309.06180',
    author: 'Kwon et al. (Berkeley)',
    phase: 5,
    description: 'PagedAttention for efficient KV cache management. Enables high-throughput serving.',
    estimatedHours: 3,
    concepts: ['paged-attention', 'kv-cache', 'batching-inference'],
    prerequisites: ['kv-cache'],
  },
  {
    id: 'speculative-decoding-paper',
    title: 'Speculative Decoding',
    type: 'paper',
    phase: 5,
    description: 'Using small models to draft, large models to verify. Speeds up inference.',
    estimatedHours: 2,
    concepts: ['speculative-decoding'],
    prerequisites: ['kv-cache'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 5: ARTICLES - Economics
  // ---------------------------------------------------------------------------
  {
    id: 'openai-pricing-docs',
    title: 'OpenAI API Pricing Documentation',
    type: 'article',
    url: 'https://openai.com/pricing',
    phase: 5,
    description: 'Understanding token costs, rate limits, batching discounts.',
    estimatedHours: 1,
    concepts: ['token-economics'],
  },
  {
    id: 'anthropic-pricing-docs',
    title: 'Anthropic API Pricing Documentation',
    type: 'article',
    url: 'https://www.anthropic.com/pricing',
    phase: 5,
    description: 'Claude pricing tiers, context window costs.',
    estimatedHours: 1,
    concepts: ['token-economics'],
  },

  // ---------------------------------------------------------------------------
  // PHASE 6: DOCUMENTATION - Frameworks
  // ---------------------------------------------------------------------------
  {
    id: 'langchain-docs',
    title: 'LangChain Documentation (Architecture)',
    type: 'article',
    url: 'https://python.langchain.com/docs/',
    phase: 6,
    description: 'Official docs. Focus on architecture sections, not tutorials.',
    estimatedHours: 4,
    concepts: ['langchain-architecture'],
    prerequisites: ['react-pattern', 'rag-basics'],
  },
  {
    id: 'llamaindex-docs',
    title: 'LlamaIndex Documentation (Internals)',
    type: 'article',
    url: 'https://docs.llamaindex.ai/',
    phase: 6,
    description: 'Official docs. Focus on how indexes and query engines work internally.',
    estimatedHours: 4,
    concepts: ['llamaindex-architecture'],
    prerequisites: ['rag-basics', 'chunking-strategies'],
  },
];

// ============================================================================
// PROJECTS (Practical Application)
// ============================================================================

export const projects = [
  {
    id: 'project-kv-store',
    title: 'Distributed Key-Value Store',
    phase: 1 as StudyPhase,
    description: 'Build a simple distributed KV store with replication. Simulate network partitions and observe behavior.',
    deliverables: [
      'Leader-based replication working',
      'Handles leader failure gracefully',
      'Can demonstrate split-brain scenario',
      'Written explanation of consistency trade-offs observed',
    ],
  },
  {
    id: 'project-react-agent',
    title: 'ReAct Agent from Scratch',
    phase: 2 as StudyPhase,
    description: 'Implement a ReAct agent without using LangChain or similar. Must include tool use and reasoning traces.',
    deliverables: [
      'Agent can call at least 3 different tools',
      'Reasoning traces are visible and coherent',
      'Handles tool failures gracefully',
      'Cost tracking per query',
    ],
  },
  {
    id: 'project-rag-system',
    title: 'RAG System with Metrics',
    phase: 3 as StudyPhase,
    description: 'Build a RAG system and measure precision/recall with different chunking strategies.',
    deliverables: [
      'Working RAG pipeline',
      'At least 3 chunking strategies compared',
      'Precision/recall measured on test set',
      'Written analysis of trade-offs',
    ],
  },
  {
    id: 'project-validators',
    title: 'LLM Output Validators',
    phase: 4 as StudyPhase,
    description: 'Build a validation layer for LLM outputs. Include schema validation, fact-checking, and safety filtering.',
    deliverables: [
      'JSON schema validator with error recovery',
      'Simple fact-checking against knowledge base',
      'Safety filter (detect harmful outputs)',
      'Metrics: false positive/negative rates',
    ],
  },
  {
    id: 'project-router',
    title: 'Model Router with Cost Tracking',
    phase: 5 as StudyPhase,
    description: 'Build a router that sends simple queries to a small model and complex queries to a large model. Track costs.',
    deliverables: [
      'Classification of query complexity working',
      'Routing to at least 2 different models',
      'Cost tracking dashboard',
      'Analysis: cost savings vs quality trade-off',
    ],
  },
  {
    id: 'project-framework-critique',
    title: 'Framework Feature Reimplementation',
    phase: 6 as StudyPhase,
    description: 'Pick one LangChain feature (e.g., ConversationBufferMemory). Reimplement it from scratch. Document why you would or wouldn\'t use the framework version.',
    deliverables: [
      'Working reimplementation',
      'Performance comparison (latency, memory)',
      'Code complexity comparison',
      'Written recommendation: when to use framework vs custom',
    ],
  },
];

// ============================================================================
// HELPER: Get all data
// ============================================================================

export function getSeedData() {
  return {
    concepts,
    resources,
    projects,
  };
}

// ============================================================================
// CLI: Print summary
// ============================================================================

if (require.main === module) {
  console.log('=== Jarre Seed Data Summary ===\n');

  console.log(`Concepts: ${concepts.length}`);
  for (let phase = 1; phase <= 6; phase++) {
    const count = concepts.filter(c => c.phase === phase).length;
    console.log(`  Phase ${phase}: ${count} concepts`);
  }

  console.log(`\nResources: ${resources.length}`);
  for (let phase = 1; phase <= 6; phase++) {
    const count = resources.filter(r => r.phase === phase).length;
    console.log(`  Phase ${phase}: ${count} resources`);
  }

  console.log(`\nProjects: ${projects.length}`);

  console.log('\n=== Ready to seed database ===');
}

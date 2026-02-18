/**
 * Seed concept_cards ONLY for the user's currently unlocked concepts.
 *
 * Unlocked concepts (mastery >= 1):
 * scalability, maintainability, reliability, data-models,
 * replication, partitioning, storage-engines, distributed-failures,
 * encoding-evolution, transactions
 *
 * Usage: npx tsx scripts/seed-unlocked-concepts.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ConceptCard {
  concept_id: string;
  card_type: 'recall' | 'fill_blank' | 'true_false' | 'connect' | 'scenario_micro';
  front_content: Record<string, unknown>;
  back_content: Record<string, unknown>;
  difficulty: 1 | 2 | 3;
  related_concept_id?: string;
}

const TARGET_CONCEPTS = [
  'scalability', 'maintainability', 'reliability', 'data-models',
  'replication', 'partitioning', 'storage-engines', 'distributed-failures',
  'encoding-evolution', 'transactions',
];

const cards: ConceptCard[] = [
  // --- scalability ---
  {
    concept_id: 'scalability',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between vertical scaling and horizontal scaling?' },
    back_content: {
      definition: 'Vertical scaling (scale up) adds more power to a single machine. Horizontal scaling (scale out) distributes load across multiple machines.',
      keyPoints: ['Vertical has a hard ceiling (biggest machine available)', 'Horizontal requires dealing with distribution complexity', 'Most real systems use a pragmatic mix of both'],
      whyItMatters: 'Choosing your scaling strategy affects architecture, cost, and operational complexity from day one.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'scalability',
    card_type: 'fill_blank',
    front_content: { template: 'An elastic system automatically adds ___ when load increases, while a manually scaled system requires ___.', blanks: ['computing resources', 'human intervention to reconfigure'] },
    back_content: { blanks: ['computing resources', 'human intervention to reconfigure'], explanation: 'Elasticity is valuable for unpredictable workloads but adds complexity. Manual scaling is simpler and sufficient for predictable load.' },
    difficulty: 1,
  },
  {
    concept_id: 'scalability',
    card_type: 'true_false',
    front_content: { statement: 'Describing a system as "scalable" is meaningful without specifying what load parameters you expect to grow.', isTrue: false },
    back_content: { explanation: 'Scalability is always relative to specific load parameters (requests/sec, data volume, concurrent users). A system scalable for reads may not scale for writes.' },
    difficulty: 1,
  },
  {
    concept_id: 'scalability',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'Twitter had 12k tweets/sec (writes) but 300k home timeline reads/sec. How did they handle this asymmetry?',
      options: [
        { label: 'A', text: 'Query on read: join tweets + follows at read time' },
        { label: 'B', text: 'Fan-out on write: pre-compute timelines into per-user caches' },
        { label: 'C', text: 'Hybrid: fan-out for most users, query on read for celebrities' },
        { label: 'D', text: 'Shard the database by user ID' },
      ],
    },
    back_content: { correct: 'C', explanation: 'Fan-out on write works for most users but celebrities (millions of followers) would create too many writes. The hybrid approach fans out for normal users and queries on read for high-follower accounts.' },
    difficulty: 2,
  },

  // --- reliability ---
  {
    concept_id: 'reliability',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between a fault and a failure? Why do we build fault-tolerant systems, not fault-preventing ones?' },
    back_content: {
      definition: 'A fault is one component deviating from spec. A failure is when the system as a whole stops providing service. Fault-tolerance means the system continues working despite faults.',
      keyPoints: ['Faults are inevitable — hardware, software, humans all fail', 'Goal: prevent faults from becoming failures', 'Deliberately triggering faults (chaos engineering) tests tolerance'],
      whyItMatters: 'Designing for fault-tolerance is the foundation of reliable distributed systems.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'reliability',
    card_type: 'fill_blank',
    front_content: { template: 'The three main sources of faults are ___, ___, and ___. Of these, ___ faults are the leading cause of outages.', blanks: ['hardware faults', 'software errors', 'human errors', 'human'] },
    back_content: { blanks: ['hardware faults', 'software errors', 'human errors', 'human'], explanation: 'Studies show operator error causes most outages. Good UX, testing, rollback mechanisms, and monitoring reduce human error impact.' },
    difficulty: 1,
  },
  {
    concept_id: 'reliability',
    card_type: 'true_false',
    front_content: { statement: 'Hardware faults are typically correlated — when one disk fails, others on the same rack are likely to fail too.', isTrue: false },
    back_content: { explanation: 'Hardware faults are mostly independent and random (MTTF of disks is ~10-50 years). Software bugs are more likely to be correlated (a bug affects all nodes running the same code).' },
    difficulty: 1,
  },

  // --- maintainability ---
  {
    concept_id: 'maintainability',
    card_type: 'recall',
    front_content: { prompt: 'What are the three design principles for maintainability, and what does each optimize for?' },
    back_content: {
      definition: 'Operability (easy for ops teams to keep running), Simplicity (easy for new engineers to understand), Evolvability (easy to make changes and adapt).',
      keyPoints: ['Operability: monitoring, automation, documentation', 'Simplicity: reduce accidental complexity via abstraction', 'Evolvability: anticipate change, loosely coupled modules'],
      whyItMatters: 'Most software cost is in maintenance, not initial development. These principles minimize long-term total cost.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'maintainability',
    card_type: 'fill_blank',
    front_content: { template: 'Accidental complexity is complexity that is not ___ but arises from ___. Good abstractions help ___ accidental complexity.', blanks: ['inherent in the problem', 'the implementation', 'hide/remove'] },
    back_content: { blanks: ['inherent in the problem', 'the implementation', 'hide/remove'], explanation: 'Moseley and Marks distinguish essential complexity (the problem itself) from accidental complexity (our implementation choices). Good engineering minimizes the latter.' },
    difficulty: 1,
  },
  {
    concept_id: 'maintainability',
    card_type: 'connect',
    front_content: { conceptA: 'Simplicity', conceptB: 'Evolvability', prompt: 'Why does simplicity directly enable evolvability?' },
    back_content: { connection: 'Simple systems are easier to understand, which makes them easier to modify safely. Accidental complexity creates hidden dependencies that make changes risky and unpredictable. Simplicity is a prerequisite for evolvability.' },
    difficulty: 1,
    related_concept_id: 'reliability',
  },

  // --- data-models ---
  {
    concept_id: 'data-models',
    card_type: 'recall',
    front_content: { prompt: 'When would you choose a document model over a relational model, and vice versa?' },
    back_content: {
      definition: 'Document model (MongoDB, etc.) stores self-contained JSON documents. Relational model (PostgreSQL, etc.) stores normalized data across tables with joins.',
      keyPoints: ['Document: good for one-to-many, self-contained aggregates, flexible schema', 'Relational: good for many-to-many, joins, strict consistency', 'Document struggles with highly interconnected data'],
      whyItMatters: 'Data model choice is the most fundamental decision — it shapes how you think about the problem and constrains your queries.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'data-models',
    card_type: 'fill_blank',
    front_content: { template: 'The main argument for the document model is schema ___, better ___ due to data locality, and closer mapping to ___.', blanks: ['flexibility', 'performance', 'application data structures'] },
    back_content: { blanks: ['flexibility', 'performance', 'application data structures'], explanation: 'Documents avoid the "impedance mismatch" between objects in code and rows in tables, but sacrifice joins and normalization.' },
    difficulty: 1,
  },
  {
    concept_id: 'data-models',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You\'re building a social network where users, posts, comments, and likes all reference each other. Which data model fits best?',
      options: [
        { label: 'A', text: 'Document model (one document per user with embedded posts)' },
        { label: 'B', text: 'Relational model with normalized tables' },
        { label: 'C', text: 'Graph database' },
        { label: 'D', text: 'Key-value store' },
      ],
    },
    back_content: { correct: 'C', explanation: 'Social networks have highly interconnected data (many-to-many relationships between users, posts, comments). Graph databases natively model these connections. Relational works but requires complex joins; document model struggles with cross-references.' },
    difficulty: 2,
  },

  // --- replication ---
  {
    concept_id: 'replication',
    card_type: 'recall',
    front_content: { prompt: 'Compare single-leader, multi-leader, and leaderless replication. When would you use each?' },
    back_content: {
      definition: 'Single-leader: one node accepts writes, replicates to followers. Multi-leader: multiple nodes accept writes. Leaderless: any node accepts reads/writes with quorum.',
      keyPoints: ['Single-leader: simplest, no write conflicts, but leader is bottleneck', 'Multi-leader: better write latency in multi-DC, but conflict resolution needed', 'Leaderless: high availability, but weaker consistency guarantees'],
      whyItMatters: 'Replication topology determines your consistency, availability, and latency trade-offs.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'replication',
    card_type: 'fill_blank',
    front_content: { template: 'Replication lag causes three main consistency anomalies: ___, ___, and ___.', blanks: ['reading stale data (read-after-write)', 'reading time going backwards (monotonic reads)', 'seeing causal violations (consistent prefix reads)'] },
    back_content: { blanks: ['reading stale data (read-after-write)', 'reading time going backwards (monotonic reads)', 'seeing causal violations (consistent prefix reads)'], explanation: 'Each anomaly has specific solutions: read-your-own-writes, session consistency, and causal ordering respectively.' },
    difficulty: 2,
  },
  {
    concept_id: 'replication',
    card_type: 'true_false',
    front_content: { statement: 'In single-leader replication, if the leader fails, a follower can be automatically promoted without any risk of data loss.', isTrue: false },
    back_content: { explanation: 'Failover can cause data loss if the old leader had unreplicated writes. It can also cause split-brain (two nodes thinking they\'re leader). Automatic failover is convenient but dangerous.' },
    difficulty: 2,
  },
  {
    concept_id: 'replication',
    card_type: 'connect',
    front_content: { conceptA: 'Replication', conceptB: 'Partitioning', prompt: 'How do replication and partitioning complement each other?' },
    back_content: { connection: 'Partitioning splits data across nodes for scalability. Replication copies data across nodes for fault tolerance. They\'re typically combined: each partition is replicated to multiple nodes, so losing a node doesn\'t lose data AND the system can handle more data than one node.' },
    difficulty: 2,
    related_concept_id: 'partitioning',
  },

  // --- partitioning ---
  {
    concept_id: 'partitioning',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between key-range partitioning and hash partitioning? What are the trade-offs?' },
    back_content: {
      definition: 'Key-range: partitions are contiguous ranges of keys (like encyclopedia volumes). Hash: a hash function determines the partition.',
      keyPoints: ['Key-range: efficient range queries, but risk of hot spots', 'Hash: even distribution, but range queries must scatter to all partitions', 'Compromise: compound key (hash first part, range second)'],
      whyItMatters: 'Partitioning strategy determines query performance and load distribution across the cluster.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'partitioning',
    card_type: 'fill_blank',
    front_content: { template: 'A hot spot occurs when ___ receives disproportionate load. Hash partitioning reduces hot spots but doesn\'t eliminate them — e.g., a celebrity\'s user ID always hashes to ___.', blanks: ['one partition', 'the same partition'] },
    back_content: { blanks: ['one partition', 'the same partition'], explanation: 'Even with hash partitioning, if one key is extremely popular, its partition becomes a hot spot. Application-level sharding (appending random suffix) can help.' },
    difficulty: 2,
  },
  {
    concept_id: 'partitioning',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You need to query "all events from user X between Jan 1 and Jan 31". How should you partition?',
      options: [
        { label: 'A', text: 'Hash partition by event timestamp' },
        { label: 'B', text: 'Key-range partition by timestamp' },
        { label: 'C', text: 'Compound key: hash by user_id, range by timestamp within partition' },
        { label: 'D', text: 'Hash partition by user_id' },
      ],
    },
    back_content: { correct: 'C', explanation: 'Compound key gives you the best of both worlds: hash(user_id) ensures even distribution, while range(timestamp) within a partition enables efficient time-range scans for a specific user.' },
    difficulty: 2,
  },

  // --- storage-engines ---
  {
    concept_id: 'storage-engines',
    card_type: 'recall',
    front_content: { prompt: 'Compare B-tree and LSM-tree storage engines. When would you choose each?' },
    back_content: {
      definition: 'B-trees store data in fixed-size pages with in-place updates. LSM-trees write to an in-memory buffer (memtable) then flush sorted files (SSTables) to disk.',
      keyPoints: ['B-trees: faster reads, predictable performance, standard in RDBMS', 'LSM-trees: faster writes, better compression, used in LevelDB/RocksDB/Cassandra', 'LSM-trees can have compaction stalls; B-trees have write amplification from page splits'],
      whyItMatters: 'Storage engine choice fundamentally affects read/write performance ratios and space efficiency.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'storage-engines',
    card_type: 'fill_blank',
    front_content: { template: 'An SSTable stores key-value pairs sorted by ___. This enables efficient ___ and makes it easy to ___ multiple segments.', blanks: ['key', 'range queries', 'merge'] },
    back_content: { blanks: ['key', 'range queries', 'merge'], explanation: 'Sorted order is the key insight of SSTables — merging sorted files is O(n), and a sparse in-memory index suffices to find any key.' },
    difficulty: 1,
  },
  {
    concept_id: 'storage-engines',
    card_type: 'true_false',
    front_content: { statement: 'LSM-trees are always faster than B-trees for all workloads.', isTrue: false },
    back_content: { explanation: 'LSM-trees are faster for writes but can be slower for reads (must check memtable + multiple SSTable levels). B-trees offer more predictable read performance. The best choice depends on your read/write ratio.' },
    difficulty: 1,
  },
  {
    concept_id: 'storage-engines',
    card_type: 'connect',
    front_content: { conceptA: 'Write-Ahead Log (WAL)', conceptB: 'B-trees', prompt: 'Why do B-tree storage engines need a WAL?' },
    back_content: { connection: 'B-trees modify pages in-place. If a crash occurs mid-write (e.g., during a page split), the on-disk structure is corrupted. The WAL records every modification before applying it, enabling crash recovery by replaying the log.' },
    difficulty: 2,
  },

  // --- distributed-failures ---
  {
    concept_id: 'distributed-failures',
    card_type: 'recall',
    front_content: { prompt: 'What are the key differences between partial failures in distributed systems and failures in single-machine computing?' },
    back_content: {
      definition: 'In a single machine, failures are typically total (everything works or everything crashes). In distributed systems, partial failures are the norm — some nodes fail while others work fine.',
      keyPoints: ['Partial failures are nondeterministic — you can\'t even know IF something failed', 'Network makes it impossible to distinguish slow from dead', 'Must design for partial failure from the start, not as afterthought'],
      whyItMatters: 'This nondeterminism is the fundamental challenge of distributed computing. You cannot wish it away.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'distributed-failures',
    card_type: 'fill_blank',
    front_content: { template: 'The Two Generals Problem shows that ___ is impossible over an unreliable channel. This is analogous to the ___ problem in distributed databases.', blanks: ['guaranteed agreement', 'consensus'] },
    back_content: { blanks: ['guaranteed agreement', 'consensus'], explanation: 'Neither general can be sure the other received the message. Similarly, distributed nodes can never be 100% certain of each other\'s state over an unreliable network.' },
    difficulty: 2,
  },
  {
    concept_id: 'distributed-failures',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'Node A sends a request to Node B and gets no response after the timeout. What can Node A conclude?',
      options: [
        { label: 'A', text: 'Node B has crashed' },
        { label: 'B', text: 'The network lost the request' },
        { label: 'C', text: 'Node B processed the request but the response was lost' },
        { label: 'D', text: 'Any of the above — it\'s impossible to distinguish' },
      ],
    },
    back_content: { correct: 'D', explanation: 'This is the fundamental problem of asynchronous networks. All three scenarios are indistinguishable from Node A\'s perspective. This is why idempotency and retry logic are essential.' },
    difficulty: 1,
  },

  // --- encoding-evolution ---
  {
    concept_id: 'encoding-evolution',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between forward compatibility and backward compatibility in data encoding?' },
    back_content: {
      definition: 'Backward compat: new code can read old data. Forward compat: old code can read new data.',
      keyPoints: ['Both needed for rolling upgrades (not all nodes update simultaneously)', 'Backward is easier — new code knows about old format', 'Forward requires old code to gracefully ignore unknown fields'],
      whyItMatters: 'Without both, you can\'t do zero-downtime deployments or maintain multiple API versions.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-evolution',
    card_type: 'fill_blank',
    front_content: { template: 'In a rolling upgrade, ___ and ___ code versions run simultaneously. This requires both forward and backward compatibility of the ___ format.', blanks: ['old', 'new', 'data/encoding'] },
    back_content: { blanks: ['old', 'new', 'data/encoding'], explanation: 'During a rolling upgrade, new nodes write data that old nodes must read (forward compat) and old nodes have data that new nodes must read (backward compat).' },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-evolution',
    card_type: 'true_false',
    front_content: { statement: 'JSON naturally supports forward and backward compatibility because it\'s schema-free.', isTrue: false },
    back_content: { explanation: 'Being schema-free means JSON has no enforcement of compatibility. A new field can break old parsers if they don\'t ignore unknowns. Compatibility is a design choice in your code, not a property of JSON itself.' },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-evolution',
    card_type: 'connect',
    front_content: { conceptA: 'Schema Evolution', conceptB: 'Database Migrations', prompt: 'How do schema evolution in encoding formats and database migrations solve similar problems differently?' },
    back_content: { connection: 'Both handle changing data structures over time. Database migrations change the schema in-place (ALTER TABLE). Encoding evolution (Protobuf/Avro) keeps old data readable by new code without rewriting. The key difference: migrations transform existing data, encoding evolution works with multiple schema versions simultaneously.' },
    difficulty: 2,
  },

  // --- transactions ---
  {
    concept_id: 'transactions',
    card_type: 'recall',
    front_content: { prompt: 'Explain what ACID means and why the "C" is arguably not a database property.' },
    back_content: {
      definition: 'ACID = Atomicity (all-or-nothing), Consistency (invariants hold), Isolation (concurrent txns don\'t interfere), Durability (committed data survives crashes).',
      keyPoints: ['Atomicity is about abort-safety, not concurrency', 'Consistency is an application property — the DB can\'t enforce business rules', 'Isolation prevents race conditions between concurrent transactions'],
      whyItMatters: 'Understanding what ACID actually guarantees prevents false assumptions about transaction safety.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'transactions',
    card_type: 'fill_blank',
    front_content: { template: 'Atomicity in ACID means that if a transaction fails partway, the database ___. This is about ___, not about concurrent operations.', blanks: ['aborts and rolls back all changes', 'abort-safety'] },
    back_content: { blanks: ['aborts and rolls back all changes', 'abort-safety'], explanation: 'A common misconception: atomicity is NOT about concurrency (that\'s isolation). Atomicity means you can safely retry because partial results are impossible.' },
    difficulty: 1,
  },
  {
    concept_id: 'transactions',
    card_type: 'true_false',
    front_content: { statement: 'The "Consistency" in ACID means all replicas have the same data at the same time.', isTrue: false },
    back_content: { explanation: 'ACID Consistency means application invariants are maintained (e.g., credits = debits). Replica consistency is a completely different concept from replication theory.' },
    difficulty: 1,
  },
  {
    concept_id: 'transactions',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You transfer $100 from account A to account B. The debit from A succeeds but the credit to B fails. Under ACID, what happens?',
      options: [
        { label: 'A', text: 'Account A loses $100 permanently' },
        { label: 'B', text: 'The entire transaction is rolled back — both accounts unchanged' },
        { label: 'C', text: 'The system retries the credit to B automatically' },
        { label: 'D', text: 'An error is logged but A stays debited' },
      ],
    },
    back_content: { correct: 'B', explanation: 'Atomicity guarantees all-or-nothing. If any part fails, the entire transaction aborts and all changes are rolled back. The application can then retry the whole transaction.' },
    difficulty: 1,
  },
];

async function seed() {
  console.log(`Seeding ${cards.length} concept cards for unlocked concepts...`);
  console.log(`Target concepts: ${TARGET_CONCEPTS.join(', ')}`);

  // Check that all referenced concepts exist
  const conceptIds = [...new Set(cards.map(c => c.concept_id))];
  const { data: existingConcepts, error: checkError } = await supabase
    .from('concepts')
    .select('id')
    .in('id', conceptIds);

  if (checkError) {
    console.error('Error checking concepts:', checkError);
    process.exit(1);
  }

  const existingIds = new Set((existingConcepts || []).map(c => c.id));
  const missingIds = conceptIds.filter(id => !existingIds.has(id));

  if (missingIds.length > 0) {
    console.error('Missing concepts in DB:', missingIds);
    process.exit(1);
  }

  // Check for existing cards to avoid duplicates
  const { data: existingCards } = await supabase
    .from('concept_cards')
    .select('concept_id')
    .in('concept_id', conceptIds);

  const existingCardConcepts = new Set((existingCards || []).map(c => c.concept_id));
  const newCards = cards.filter(c => !existingCardConcepts.has(c.concept_id));

  if (newCards.length === 0) {
    console.log('All cards already exist! Nothing to insert.');
    return;
  }

  console.log(`Skipping ${cards.length - newCards.length} cards (concepts already have cards)`);
  console.log(`Inserting ${newCards.length} new cards...`);

  // Insert cards in batches
  const batchSize = 20;
  let inserted = 0;

  for (let i = 0; i < newCards.length; i += batchSize) {
    const batch = newCards.slice(i, i + batchSize);
    const { error } = await supabase
      .from('concept_cards')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${newCards.length}`);
  }

  console.log(`Done! Seeded ${inserted} concept cards.`);

  // Summary by concept
  const byConcept = newCards.reduce((acc, c) => {
    acc[c.concept_id] = (acc[c.concept_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('By concept:', byConcept);
}

seed().catch(console.error);

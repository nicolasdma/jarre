/**
 * Seed script for concept_cards table.
 *
 * Generates ~4 cards per concept for DDIA Phase 1 concepts.
 * Content is curated (not LLM-generated) for quality.
 *
 * Usage: npx tsx scripts/seed-concept-cards.ts
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

// ============================================================================
// DDIA Phase 1 Concept Cards (~4 per concept)
// ============================================================================

const cards: ConceptCard[] = [
  // --- encoding-formats ---
  {
    concept_id: 'encoding-formats',
    card_type: 'recall',
    front_content: { prompt: 'What are the main trade-offs between JSON and binary encoding formats?' },
    back_content: {
      definition: 'JSON is human-readable but verbose; binary formats (Thrift, Protobuf, Avro) are compact and fast but require schemas.',
      keyPoints: ['JSON has ambiguous number handling', 'Binary formats use field tags instead of names', 'Schema enables forward/backward compat'],
      whyItMatters: 'Encoding choice affects storage, network bandwidth, and schema evolution strategy.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-formats',
    card_type: 'fill_blank',
    front_content: { template: 'JSON cannot distinguish between ___ and ___, which is problematic for large numbers.', blanks: ['integers', 'floating-point numbers'] },
    back_content: { blanks: ['integers', 'floating-point numbers'], explanation: 'JSON uses the same Number type for both, causing precision loss for integers > 2^53.' },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-formats',
    card_type: 'true_false',
    front_content: { statement: 'CSV is a good choice for data interchange because it has a well-defined schema.', isTrue: false },
    back_content: { explanation: 'CSV has no schema, no standard for escaping, and ambiguous types. It\'s fragile for interchange.' },
    difficulty: 1,
  },
  {
    concept_id: 'encoding-formats',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You need to store millions of events per day with strict schema evolution requirements. Which encoding approach?',
      options: [
        { label: 'A', text: 'JSON with manual validation' },
        { label: 'B', text: 'Avro with a schema registry' },
        { label: 'C', text: 'CSV with header row' },
        { label: 'D', text: 'XML with DTD' },
      ],
    },
    back_content: { correct: 'B', explanation: 'Avro with schema registry provides compact binary encoding, schema evolution with forward/backward compatibility, and efficient storage.' },
    difficulty: 2,
  },

  // --- transaction-concepts ---
  {
    concept_id: 'transaction-concepts',
    card_type: 'recall',
    front_content: { prompt: 'Explain what ACID means and why the "C" is arguably not a database property.' },
    back_content: {
      definition: 'ACID = Atomicity (all-or-nothing), Consistency (invariants hold), Isolation (concurrent txns don\'t interfere), Durability (committed data survives crashes).',
      keyPoints: ['Atomicity is about abort-safety, not concurrency', 'Consistency is an application property, not DB', 'Isolation prevents race conditions'],
      whyItMatters: 'Understanding what ACID actually guarantees prevents false assumptions about transaction safety.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'transaction-concepts',
    card_type: 'fill_blank',
    front_content: { template: 'Atomicity in ACID means that if a transaction fails partway, the database ___. It does NOT mean "several operations appear to happen at the same time."', blanks: ['aborts and rolls back all changes'] },
    back_content: { blanks: ['aborts and rolls back all changes'], explanation: 'Atomicity = abort-ability. The concurrency aspect is Isolation, not Atomicity.' },
    difficulty: 1,
  },
  {
    concept_id: 'transaction-concepts',
    card_type: 'true_false',
    front_content: { statement: 'The "Consistency" in ACID refers to replica consistency (all nodes have the same data).', isTrue: false },
    back_content: { explanation: 'ACID Consistency means application invariants are maintained (e.g., credits = debits). Replica consistency is a different concept entirely.' },
    difficulty: 1,
  },
  {
    concept_id: 'transaction-concepts',
    card_type: 'connect',
    front_content: { conceptA: 'Atomicity', conceptB: 'Durability', prompt: 'How do WAL (Write-Ahead Logging) and these two ACID properties relate?' },
    back_content: { connection: 'WAL ensures both: atomicity (can replay/undo incomplete txns) and durability (committed writes survive crashes by replaying the log).' },
    difficulty: 2,
    related_concept_id: 'encoding-formats',
  },

  // --- weak-isolation ---
  {
    concept_id: 'weak-isolation',
    card_type: 'recall',
    front_content: { prompt: 'What is Snapshot Isolation and how does it differ from Read Committed?' },
    back_content: {
      definition: 'Snapshot Isolation (SI) gives each transaction a consistent snapshot of the database at the start. Read Committed only prevents dirty reads/writes but allows non-repeatable reads.',
      keyPoints: ['SI prevents non-repeatable reads', 'SI is implemented via MVCC', 'Read Committed allows seeing different values on re-read within same txn'],
      whyItMatters: 'Most "Repeatable Read" implementations in real databases are actually Snapshot Isolation.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'weak-isolation',
    card_type: 'fill_blank',
    front_content: { template: 'MVCC works by keeping ___ of each row, tagged with transaction IDs that created and deleted them.', blanks: ['multiple versions'] },
    back_content: { blanks: ['multiple versions'], explanation: 'Multi-Version Concurrency Control maintains old versions so readers see a consistent snapshot without blocking writers.' },
    difficulty: 1,
  },
  {
    concept_id: 'weak-isolation',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'Transaction T1 reads account balance ($500). T2 transfers $200 out and commits. T1 reads balance again. Under Snapshot Isolation, what does T1 see?',
      options: [
        { label: 'A', text: '$500 (original snapshot)' },
        { label: 'B', text: '$300 (T2\'s committed value)' },
        { label: 'C', text: 'Error: conflict detected' },
        { label: 'D', text: 'It depends on the lock order' },
      ],
    },
    back_content: { correct: 'A', explanation: 'Under SI, T1 sees the database as of its start time. T2\'s changes are invisible to T1 regardless of commit order.' },
    difficulty: 2,
  },
  {
    concept_id: 'weak-isolation',
    card_type: 'true_false',
    front_content: { statement: 'Snapshot Isolation prevents all concurrency anomalies, making it equivalent to Serializability.', isTrue: false },
    back_content: { explanation: 'SI prevents dirty reads, dirty writes, and non-repeatable reads, but still allows write skew anomalies. Only Serializability prevents all anomalies.' },
    difficulty: 2,
    related_concept_id: 'write-skew',
  },

  // --- preventing-lost-updates ---
  {
    concept_id: 'preventing-lost-updates',
    card_type: 'recall',
    front_content: { prompt: 'Name three mechanisms to prevent lost updates and explain when each is appropriate.' },
    back_content: {
      definition: 'Lost updates occur when two transactions read-modify-write the same value and one overwrites the other.',
      keyPoints: ['Atomic operations (INCREMENT): best for simple counters', 'Explicit locking (SELECT FOR UPDATE): when you need to read-then-write', 'Compare-and-set: optimistic, works without locks'],
      whyItMatters: 'Choosing the wrong mechanism leads to either data corruption or unnecessary contention.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'preventing-lost-updates',
    card_type: 'fill_blank',
    front_content: { template: 'Compare-and-set prevents lost updates by only allowing a write if the current value ___ since it was last read.', blanks: ['has not changed'] },
    back_content: { blanks: ['has not changed'], explanation: 'If the value changed, the transaction aborts and retries. This is an optimistic concurrency control technique.' },
    difficulty: 1,
  },
  {
    concept_id: 'preventing-lost-updates',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'Two users simultaneously edit a wiki page. User A adds paragraph 1, User B adds paragraph 2. How should you handle this?',
      options: [
        { label: 'A', text: 'Last-write-wins' },
        { label: 'B', text: 'Atomic increment' },
        { label: 'C', text: 'Application-level merge/conflict resolution' },
        { label: 'D', text: 'SELECT FOR UPDATE' },
      ],
    },
    back_content: { correct: 'C', explanation: 'Wiki edits are complex documents — atomic ops and locking are too coarse. Application-level merge (like operational transforms or CRDTs) preserves both edits.' },
    difficulty: 2,
  },

  // --- write-skew ---
  {
    concept_id: 'write-skew',
    card_type: 'recall',
    front_content: { prompt: 'What is write skew and why can\'t Snapshot Isolation prevent it?' },
    back_content: {
      definition: 'Write skew occurs when two transactions read the same data, make decisions based on it, then write to different rows — violating an invariant that depends on both rows.',
      keyPoints: ['Classic example: two doctors on call, both try to go off-call, resulting in zero doctors', 'SI only detects write-write conflicts on the SAME row', 'Requires serializable isolation or explicit locks to prevent'],
      whyItMatters: 'Write skew is subtle and dangerous because it passes all simpler isolation checks.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'write-skew',
    card_type: 'true_false',
    front_content: { statement: 'Write skew can be prevented by using SELECT FOR UPDATE to lock the rows that the transaction reads before making its decision.', isTrue: true },
    back_content: { explanation: 'SELECT FOR UPDATE materializes the read dependency as a lock, preventing the concurrent transaction from proceeding until the first commits.' },
    difficulty: 2,
  },
  {
    concept_id: 'write-skew',
    card_type: 'connect',
    front_content: { conceptA: 'Write Skew', conceptB: 'Phantoms', prompt: 'How are phantoms related to write skew?' },
    back_content: { connection: 'Phantoms are a special case where the write skew involves rows that don\'t exist yet. You can\'t lock rows that haven\'t been inserted, making phantom-based write skew especially hard to prevent without predicate locks or index-range locks.' },
    difficulty: 3,
  },

  // --- serializability ---
  {
    concept_id: 'serializability',
    card_type: 'recall',
    front_content: { prompt: 'Compare the three approaches to implementing serializability: actual serial execution, 2PL, and SSI.' },
    back_content: {
      definition: 'Serializability guarantees that concurrent transactions produce results as if they ran one at a time.',
      keyPoints: [
        'Serial execution: single thread, fast but limits throughput',
        '2PL: readers block writers and vice versa, deadlock-prone',
        'SSI: optimistic, detects conflicts at commit, best for read-heavy workloads',
      ],
      whyItMatters: 'Each approach has different performance characteristics. SSI is the modern default in PostgreSQL.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'serializability',
    card_type: 'fill_blank',
    front_content: { template: 'Two-Phase Locking (2PL) is called "two-phase" because locks are acquired in the ___ phase and released in the ___ phase.', blanks: ['growing (expanding)', 'shrinking'] },
    back_content: { blanks: ['growing (expanding)', 'shrinking'], explanation: 'No lock can be acquired after any lock is released. This ensures serializability but reduces concurrency.' },
    difficulty: 2,
  },
  {
    concept_id: 'serializability',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'Your application is 95% reads with rare writes. Which serializability approach would you choose?',
      options: [
        { label: 'A', text: 'Actual serial execution' },
        { label: 'B', text: 'Two-Phase Locking (2PL)' },
        { label: 'C', text: 'Serializable Snapshot Isolation (SSI)' },
        { label: 'D', text: 'No isolation needed for mostly reads' },
      ],
    },
    back_content: { correct: 'C', explanation: 'SSI is optimistic — readers never block writers. For read-heavy workloads, conflicts are rare so the optimistic approach has minimal overhead.' },
    difficulty: 2,
  },

  // --- unreliable-networks ---
  {
    concept_id: 'unreliable-networks',
    card_type: 'recall',
    front_content: { prompt: 'Why can\'t you distinguish between a crashed node and a slow network in an asynchronous network?' },
    back_content: {
      definition: 'In an asynchronous network, there\'s no upper bound on message delivery time. A timeout can\'t distinguish a dead node from a delayed message.',
      keyPoints: ['No message delivery guarantee', 'Timeouts are a heuristic, not definitive', 'The only option is to wait or retry'],
      whyItMatters: 'This fundamental limitation shapes all distributed system design — you must handle both cases.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'unreliable-networks',
    card_type: 'true_false',
    front_content: { statement: 'TCP guarantees that messages arrive in order and are not lost, so network unreliability is solved at the transport layer.', isTrue: false },
    back_content: { explanation: 'TCP handles packet-level reliability but can\'t prevent connection drops, timeouts, or node crashes. Application-level retry and error handling is still needed.' },
    difficulty: 1,
  },
  {
    concept_id: 'unreliable-networks',
    card_type: 'fill_blank',
    front_content: { template: 'When a network request times out, the sender doesn\'t know if the request was ___, ___, or ___.', blanks: ['delivered and processed', 'delivered but not processed', 'lost in transit'] },
    back_content: { blanks: ['delivered and processed', 'delivered but not processed', 'lost in transit'], explanation: 'This three-way ambiguity is why idempotent operations and unique request IDs are crucial in distributed systems.' },
    difficulty: 2,
  },

  // --- unreliable-clocks ---
  {
    concept_id: 'unreliable-clocks',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between time-of-day clocks and monotonic clocks?' },
    back_content: {
      definition: 'Time-of-day clocks return wall-clock time (can jump forward/backward due to NTP sync). Monotonic clocks always move forward and are suitable for measuring durations.',
      keyPoints: ['Time-of-day: System.currentTimeMillis(), can go backwards', 'Monotonic: System.nanoTime(), always increments', 'Never use time-of-day clocks for ordering events'],
      whyItMatters: 'Using the wrong clock type leads to subtle ordering bugs in distributed systems.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'unreliable-clocks',
    card_type: 'true_false',
    front_content: { statement: 'NTP can synchronize clocks to within a few milliseconds, making timestamps reliable for ordering events across nodes.', isTrue: false },
    back_content: { explanation: 'Even with NTP, clock skew of tens of milliseconds is common. For events happening close in time, timestamps can produce incorrect ordering. Use logical clocks (Lamport/vector) instead.' },
    difficulty: 2,
    related_concept_id: 'ordering',
  },
  {
    concept_id: 'unreliable-clocks',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You use timestamps for last-write-wins conflict resolution. Node A writes at T=100, Node B writes at T=99 (clock skew). Which write survives?',
      options: [
        { label: 'A', text: 'Node A\'s write (higher timestamp)' },
        { label: 'B', text: 'Node B\'s write (it was actually later)' },
        { label: 'C', text: 'Both are kept as conflicts' },
        { label: 'D', text: 'It depends on the replication protocol' },
      ],
    },
    back_content: { correct: 'A', explanation: 'LWW uses timestamps blindly — Node A "wins" even though B wrote later in real time. This is why LWW can silently drop writes. Google Spanner solves this with confidence intervals.' },
    difficulty: 2,
  },

  // --- knowledge-truth ---
  {
    concept_id: 'knowledge-truth',
    card_type: 'recall',
    front_content: { prompt: 'What is a fencing token and what problem does it solve?' },
    back_content: {
      definition: 'A fencing token is a monotonically increasing number issued with each lock grant. The storage system rejects writes with older tokens, preventing stale lock holders from corrupting data.',
      keyPoints: ['Prevents "zombie" lock holders from writing after their lease expires', 'Requires the storage system to check the token', 'Solves the problem of process pauses (GC, etc.)'],
      whyItMatters: 'Without fencing, a lock is only advisory — a paused process can wake up and still write.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'knowledge-truth',
    card_type: 'fill_blank',
    front_content: { template: 'A quorum requires agreement from ___ out of N nodes, ensuring that any two quorums ___.', blanks: ['a majority (>N/2)', 'overlap in at least one node'] },
    back_content: { blanks: ['a majority (>N/2)', 'overlap in at least one node'], explanation: 'The overlap guarantees that at least one node in any read quorum has seen the latest write.' },
    difficulty: 2,
  },
  {
    concept_id: 'knowledge-truth',
    card_type: 'true_false',
    front_content: { statement: 'Byzantine fault tolerance is required for most internal distributed systems within a single datacenter.', isTrue: false },
    back_content: { explanation: 'Byzantine faults assume nodes can lie. Within a datacenter, crash faults are the norm. BFT is mainly needed for blockchain/multi-organization systems where trust is absent.' },
    difficulty: 2,
  },

  // --- ordering ---
  {
    concept_id: 'ordering',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between causal ordering and total ordering?' },
    back_content: {
      definition: 'Causal ordering preserves happened-before relationships (if A caused B, everyone sees A before B). Total ordering assigns a single sequence number to every event.',
      keyPoints: ['Causal is weaker but more available (no single bottleneck)', 'Total ordering requires consensus (Paxos/Raft)', 'Lamport timestamps capture causal order'],
      whyItMatters: 'Many systems only need causal consistency, which is achievable without the cost of total ordering.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'ordering',
    card_type: 'fill_blank',
    front_content: { template: 'A Lamport timestamp is a pair of (counter, ___). It provides ___ ordering but not total ordering of concurrent events.', blanks: ['node ID', 'causal'] },
    back_content: { blanks: ['node ID', 'causal'], explanation: 'Lamport timestamps guarantee: if A happened-before B, then timestamp(A) < timestamp(B). But equal timestamps for concurrent events have arbitrary order.' },
    difficulty: 2,
  },
  {
    concept_id: 'ordering',
    card_type: 'connect',
    front_content: { conceptA: 'Total Order Broadcast', conceptB: 'Consensus', prompt: 'Why are these two problems equivalent?' },
    back_content: { connection: 'Total order broadcast (all nodes deliver messages in the same order) is equivalent to consensus: if you can solve one, you can solve the other. Both require agreement on a single sequence of events.' },
    difficulty: 3,
  },

  // --- schema-evolution ---
  {
    concept_id: 'schema-evolution',
    card_type: 'recall',
    front_content: { prompt: 'What is the difference between forward compatibility and backward compatibility?' },
    back_content: {
      definition: 'Backward compat: new code can read old data. Forward compat: old code can read new data.',
      keyPoints: ['Backward is easier — new code knows about old format', 'Forward requires old code to ignore unknown fields', 'Both needed for rolling upgrades'],
      whyItMatters: 'Without both, you can\'t do zero-downtime deployments or maintain multiple service versions.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'schema-evolution',
    card_type: 'true_false',
    front_content: { statement: 'Adding a new required field to a Protobuf message is backward compatible.', isTrue: false },
    back_content: { explanation: 'Adding a required field breaks backward compatibility: old data doesn\'t have the field, so new code can\'t parse it. Only optional/repeated fields can be added safely.' },
    difficulty: 1,
  },
  {
    concept_id: 'schema-evolution',
    card_type: 'fill_blank',
    front_content: { template: 'In Protobuf, each field has a ___ that identifies it in the binary encoding. Field names can change freely because the encoding uses ___ instead.', blanks: ['field tag (number)', 'numbers'] },
    back_content: { blanks: ['field tag (number)', 'numbers'], explanation: 'This is why Protobuf achieves schema evolution — the binary format never references field names, only their numeric tags.' },
    difficulty: 1,
  },

  // --- thrift-protobuf ---
  {
    concept_id: 'thrift-protobuf',
    card_type: 'recall',
    front_content: { prompt: 'How does Thrift differ from Protocol Buffers in its encoding approach?' },
    back_content: {
      definition: 'Both use field tags + type annotations in binary. Thrift has two formats: BinaryProtocol (simple) and CompactProtocol (packs field tag + type into one byte). Protobuf is similar to CompactProtocol.',
      keyPoints: ['Both are more compact than JSON', 'Both use schemas for encoding/decoding', 'Thrift offers multiple serialization strategies'],
      whyItMatters: 'Understanding the binary format helps debug serialization issues and make informed encoding choices.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'thrift-protobuf',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You\'re designing a microservice that needs to evolve its API over years with many optional fields. Which encoding?',
      options: [
        { label: 'A', text: 'JSON with runtime validation' },
        { label: 'B', text: 'Protocol Buffers with .proto schema' },
        { label: 'C', text: 'MessagePack' },
        { label: 'D', text: 'XML with XSD' },
      ],
    },
    back_content: { correct: 'B', explanation: 'Protobuf\'s field tags enable safe schema evolution. Optional fields added in new versions are safely ignored by old consumers. It\'s the industry standard for gRPC services.' },
    difficulty: 1,
  },

  // --- avro ---
  {
    concept_id: 'avro',
    card_type: 'recall',
    front_content: { prompt: 'How does Avro achieve schema evolution without field tags in the data?' },
    back_content: {
      definition: 'Avro uses a writer\'s schema (at write time) and reader\'s schema (at read time). The reader resolves differences by matching field names between schemas.',
      keyPoints: ['No field tags in binary data — more compact', 'Writer and reader schemas must be compatible, not identical', 'Schema registry stores all versions'],
      whyItMatters: 'Avro\'s approach is uniquely suited for Hadoop/data lake scenarios where schemas evolve over many years of stored data.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'avro',
    card_type: 'true_false',
    front_content: { statement: 'In Avro, the reader must use the exact same schema version that the writer used to encode the data.', isTrue: false },
    back_content: { explanation: 'Avro explicitly supports different reader and writer schemas. The reader\'s schema resolves differences (default values for new fields, ignoring removed fields).' },
    difficulty: 1,
  },

  // --- dataflow-modes ---
  {
    concept_id: 'dataflow-modes',
    card_type: 'recall',
    front_content: { prompt: 'What are the three main modes of dataflow between processes?' },
    back_content: {
      definition: 'Via databases (one process writes, another reads later), via service calls (REST/RPC, synchronous), via async message passing (message brokers).',
      keyPoints: ['DB: implicit dataflow, schema evolution via migration', 'Services: explicit API contract, client-server', 'Messages: decoupled, buffered, can be replayed'],
      whyItMatters: 'Each mode has different implications for compatibility, coupling, and error handling.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'dataflow-modes',
    card_type: 'connect',
    front_content: { conceptA: 'REST/RPC', conceptB: 'Message Brokers', prompt: 'When would you choose message brokers over direct REST calls?' },
    back_content: { connection: 'Message brokers decouple sender and receiver in time (async), handle backpressure via buffering, and enable fan-out. Choose brokers when: the receiver may be temporarily unavailable, you need guaranteed delivery, or one event triggers multiple consumers.' },
    difficulty: 2,
  },

  // --- databases-streams ---
  {
    concept_id: 'databases-streams',
    card_type: 'recall',
    front_content: { prompt: 'What is Change Data Capture (CDC) and why is it useful?' },
    back_content: {
      definition: 'CDC captures all changes to a database (inserts, updates, deletes) as a stream of events, typically from the write-ahead log.',
      keyPoints: ['Enables derived data systems to stay in sync', 'Source DB is the system of record, stream is derived', 'Log compaction keeps the stream manageable'],
      whyItMatters: 'CDC is the foundation for real-time derived views, search index updates, and event-driven architectures.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'databases-streams',
    card_type: 'fill_blank',
    front_content: { template: 'In event sourcing, instead of storing the current state, the system stores a log of ___. The current state is derived by ___ the event log.', blanks: ['immutable events', 'replaying'] },
    back_content: { blanks: ['immutable events', 'replaying'], explanation: 'Event sourcing provides a complete audit trail and enables temporal queries ("what was the state at time T?").' },
    difficulty: 2,
  },
  {
    concept_id: 'databases-streams',
    card_type: 'true_false',
    front_content: { statement: 'CDC requires the application to explicitly publish change events alongside database writes.', isTrue: false },
    back_content: { explanation: 'CDC reads from the database\'s internal write-ahead log (WAL), requiring no application changes. Tools like Debezium do this transparently.' },
    difficulty: 2,
  },

  // --- processing-streams ---
  {
    concept_id: 'processing-streams',
    card_type: 'recall',
    front_content: { prompt: 'What are the main types of windows in stream processing and when is each appropriate?' },
    back_content: {
      definition: 'Tumbling (fixed, non-overlapping), Hopping (fixed, overlapping), Sliding (event-driven, overlap), Session (activity-based, variable length).',
      keyPoints: ['Tumbling: simple aggregation (events per minute)', 'Hopping: smoothed averages (5-min window every 1 min)', 'Session: user activity grouping with gap timeout'],
      whyItMatters: 'Window type determines accuracy, latency, and resource usage of stream aggregations.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'processing-streams',
    card_type: 'scenario_micro',
    front_content: {
      scenario: 'You need to count unique visitors per hour, updated every minute. Which window type?',
      options: [
        { label: 'A', text: 'Tumbling window (1 hour)' },
        { label: 'B', text: 'Hopping window (1 hour, 1 min hop)' },
        { label: 'C', text: 'Session window' },
        { label: 'D', text: 'Sliding window' },
      ],
    },
    back_content: { correct: 'B', explanation: 'A hopping window of 1 hour with 1-minute hops gives you hourly counts updated every minute, providing both the time range and update frequency needed.' },
    difficulty: 2,
  },

  // --- hedged-requests ---
  {
    concept_id: 'hedged-requests',
    card_type: 'recall',
    front_content: { prompt: 'What are hedged requests and what problem do they solve?' },
    back_content: {
      definition: 'Hedged requests send the same request to multiple replicas simultaneously (or after a short delay). The first response is used, others are cancelled.',
      keyPoints: ['Reduces tail latency (p99)', 'Trade-off: increases load on backend', 'Often sent after a delay (e.g., after p95 timeout)'],
      whyItMatters: 'Tail latency matters at scale — one slow request in a fan-out of 100 makes the whole response slow.',
    },
    difficulty: 1,
  },
  {
    concept_id: 'hedged-requests',
    card_type: 'true_false',
    front_content: { statement: 'Hedged requests always double the load on backend services because every request is sent twice.', isTrue: false },
    back_content: { explanation: 'Smart implementations only hedge after a delay (e.g., if no response within p95 time). This limits the extra load to ~5% of requests while still cutting tail latency.' },
    difficulty: 1,
  },

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

  // --- fan-out-latency ---
  {
    concept_id: 'fan-out-latency',
    card_type: 'recall',
    front_content: { prompt: 'Explain tail latency amplification in fan-out architectures.' },
    back_content: {
      definition: 'When a request fans out to N backend services, the overall latency is determined by the slowest response. Even if each service has 99th percentile latency of 100ms, with 100 services, the probability of hitting at least one slow response is very high.',
      keyPoints: ['p99 of one service becomes much worse at fan-out', 'With 100 parallel calls at p99=100ms, ~63% of requests hit a slow call', 'Mitigations: hedging, timeouts, async patterns'],
      whyItMatters: 'Understanding this is crucial for designing systems that make multiple concurrent backend calls.',
    },
    difficulty: 2,
  },
  {
    concept_id: 'fan-out-latency',
    card_type: 'connect',
    front_content: { conceptA: 'Fan-out Latency', conceptB: 'Hedged Requests', prompt: 'How do hedged requests specifically address the fan-out latency problem?' },
    back_content: { connection: 'In a fan-out, the slowest backend determines overall latency. By hedging requests to the slowest backends, you replace the p99 latency of individual services with something closer to p50, dramatically improving the overall fan-out response time.' },
    difficulty: 2,
    related_concept_id: 'hedged-requests',
  },
];

// ============================================================================
// Seed Execution
// ============================================================================

async function seed() {
  console.log(`Seeding ${cards.length} concept cards...`);

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

  // Insert cards in batches
  const batchSize = 20;
  let inserted = 0;

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const { error } = await supabase
      .from('concept_cards')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${cards.length}`);
  }

  console.log(`Done! Seeded ${inserted} concept cards across ${conceptIds.length} concepts.`);

  // Summary by type
  const byType = cards.reduce((acc, c) => {
    acc[c.card_type] = (acc[c.card_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('By type:', byType);
}

seed().catch(console.error);

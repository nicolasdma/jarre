-- Add missing DDIA concept IDs needed for Ch8, Ch9, Ch11 sections

INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('unreliable-networks', 'Unreliable Networks', 'unreliable-networks',
   'In distributed systems, the network is fundamentally unreliable. Packets can be lost, delayed, duplicated, or reordered. There is no way to distinguish a crashed node from a slow network.', '1'::study_phase),
  ('unreliable-clocks', 'Unreliable Clocks', 'unreliable-clocks',
   'Clocks in distributed systems cannot be fully trusted. Time-of-day clocks can jump. Monotonic clocks only measure elapsed time on one node. Clock skew between nodes can cause ordering anomalies.', '1'::study_phase),
  ('knowledge-truth', 'Knowledge, Truth and Lies', 'knowledge-truth',
   'In distributed systems, a node cannot trust its own judgment alone. Truth is defined by a quorum. Fencing tokens prevent split-brain. Byzantine faults require special protocols.', '1'::study_phase),
  ('ordering', 'Ordering Guarantees', 'ordering',
   'Ordering of events matters for consistency. Causal ordering is weaker than total ordering. Lamport timestamps provide total ordering but are not sufficient for all problems. Total order broadcast is equivalent to consensus.', '1'::study_phase),
  ('databases-streams', 'Databases and Streams', 'databases-streams',
   'Change Data Capture (CDC) turns database changes into a stream of events. Event sourcing stores all changes as immutable events. Log compaction enables rebuilding state. Dual writes are problematic.', '1'::study_phase),
  ('processing-streams', 'Processing Streams', 'processing-streams',
   'Stream processing handles unbounded datasets. Key challenges: event time vs processing time, windowing, stream joins (stream-stream, stream-table, table-table), and fault tolerance with microbatching or checkpointing.', '1'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('unreliable-networks', 'distributed-failures'),
  ('unreliable-clocks', 'distributed-failures'),
  ('knowledge-truth', 'distributed-failures'),
  ('ordering', 'consistency-models'),
  ('databases-streams', 'stream-processing'),
  ('processing-streams', 'stream-processing')
ON CONFLICT DO NOTHING;

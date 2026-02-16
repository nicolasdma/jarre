-- DDIA Chapter 4: Encoding and Evolution — concepts
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('encoding-formats', 'Encoding Formats', 'encoding-formats',
   'Methods of translating in-memory data structures to byte sequences for storage or transmission, including JSON, XML, CSV, and binary encodings.', '1'::study_phase),
  ('thrift-protobuf', 'Thrift & Protocol Buffers', 'thrift-protobuf',
   'Binary encoding libraries that use schemas with field tags to achieve compact encoding and support forward/backward compatible schema evolution.', '1'::study_phase),
  ('avro', 'Apache Avro', 'avro',
   'A binary encoding format that uses a writer schema and reader schema resolved together, enabling schema evolution without field tags in the encoded data.', '1'::study_phase),
  ('schema-evolution', 'Schema Evolution', 'schema-evolution',
   'The ability to change a schema over time while maintaining forward compatibility (old code reads new data) and backward compatibility (new code reads old data).', '1'::study_phase),
  ('dataflow-modes', 'Modes of Dataflow', 'dataflow-modes',
   'The three main ways data flows between processes: through databases, through service calls (REST/RPC), and through asynchronous message passing.', '1'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- DDIA Chapter 7: Transactions — concepts
INSERT INTO concepts (id, name, slug, canonical_definition, phase)
VALUES
  ('transaction-concepts', 'Transaction Concepts & ACID', 'transaction-concepts',
   'The fundamental guarantees of database transactions: Atomicity (all-or-nothing), Consistency (invariants preserved), Isolation (concurrent transactions dont interfere), and Durability (committed data persists).', '1'::study_phase),
  ('weak-isolation', 'Weak Isolation Levels', 'weak-isolation',
   'Isolation levels weaker than serializability that trade correctness for performance: Read Committed prevents dirty reads/writes, Snapshot Isolation provides consistent point-in-time views using MVCC.', '1'::study_phase),
  ('preventing-lost-updates', 'Preventing Lost Updates', 'preventing-lost-updates',
   'Techniques to prevent the lost update anomaly in read-modify-write cycles: atomic operations, explicit locking, compare-and-set, and conflict resolution.', '1'::study_phase),
  ('write-skew', 'Write Skew & Phantoms', 'write-skew',
   'A concurrency anomaly where two transactions read the same data, make decisions based on it, and write different records, violating an invariant that neither transaction alone would violate.', '1'::study_phase),
  ('serializability', 'Serializability', 'serializability',
   'The strongest isolation level guaranteeing that concurrent transactions behave as if executed serially, achievable via actual serial execution, two-phase locking (2PL), or serializable snapshot isolation (SSI).', '1'::study_phase)
ON CONFLICT (id) DO NOTHING;

-- Prerequisites
INSERT INTO concept_prerequisites (concept_id, prerequisite_id)
VALUES
  ('thrift-protobuf', 'encoding-formats'),
  ('avro', 'encoding-formats'),
  ('schema-evolution', 'thrift-protobuf'),
  ('schema-evolution', 'avro'),
  ('dataflow-modes', 'schema-evolution'),
  ('weak-isolation', 'transaction-concepts'),
  ('preventing-lost-updates', 'weak-isolation'),
  ('write-skew', 'weak-isolation'),
  ('serializability', 'write-skew')
ON CONFLICT DO NOTHING;

-- Ensure resources exist
INSERT INTO resources (id, title, type, phase)
VALUES
  ('ddia-ch4', 'Encoding and Evolution', 'book', '1'::study_phase),
  ('ddia-ch7', 'Transactions', 'book', '1'::study_phase)
ON CONFLICT (id) DO NOTHING;

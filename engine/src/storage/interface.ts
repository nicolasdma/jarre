/**
 * StorageBackend interface — the contract every backend must implement.
 *
 * Each backend represents a different data structure from DDIA Ch3:
 * - AppendLog: naive append-only, O(1) write, O(n) read
 * - HashIndex: in-memory hashmap over append log (Session 2)
 * - LSMTree: memtable + SSTables + compaction (Sessions 4-5)
 * - BTree: page-based balanced tree (Session 6)
 */

/** Internal state exposed for visualization in the web UI */
export interface BackendState {
  name: string;
  keyCount: number;
  /** Backend-specific metadata for visualization */
  details: Record<string, unknown>;
}

export interface StorageBackend {
  /** Human-readable backend name */
  readonly name: string;

  /** Store a key-value pair */
  set(key: string, value: string): Promise<void>;

  /** Retrieve a value by key. Returns null if not found. */
  get(key: string): Promise<string | null>;

  /** Delete a key. Returns true if key existed. */
  delete(key: string): Promise<boolean>;

  /** Number of live keys (excluding deleted) */
  size(): Promise<number>;

  /** Flush any in-memory state to disk */
  flush(): Promise<void>;

  /** Clean up resources (file handles, etc.) */
  close(): Promise<void>;

  /** Return internal state for visualization / debugging */
  inspect(): Promise<BackendState>;

  /** Delete all data — used for resetting or switching backends */
  clear(): Promise<void>;

  /** Checkpoint WAL if the backend uses one (optional) */
  walCheckpoint?(): void;
}

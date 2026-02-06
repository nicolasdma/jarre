import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StorageBackend, BackendState } from './interface.js';
import { Memtable, DEFAULT_FLUSH_THRESHOLD } from './memtable.js';
import { writeSSTable, SSTableReader, type SSTableMeta } from './sstable.js';
import { WriteAheadLog } from './wal.js';
import { ensureDir, fileSize } from '../utils/file-io.js';

/**
 * LSM-Tree Storage Backend (DDIA Ch3 — Log-Structured Merge Tree)
 *
 * How it works — three layers:
 *
 * ┌──────────────────────────────────────────────┐
 * │ Layer 1: MEMTABLE (RAM)                      │
 * │ Sorted array in memory. All writes go here.  │
 * │ Protected by WAL for crash safety.           │
 * ├──────────────────────────────────────────────┤
 * │ Layer 2: WAL (Disk — append-only)            │
 * │ Every write goes to WAL BEFORE memtable.     │
 * │ If process crashes, replay WAL to recover.   │
 * ├──────────────────────────────────────────────┤
 * │ Layer 3: SSTables (Disk — sorted, immutable) │
 * │ When memtable fills up, flush to new SSTable. │
 * │ Read path: memtable → newest SSTable → ...   │
 * └──────────────────────────────────────────────┘
 *
 * Write path:
 * 1. WAL.append(key, value)      ← crash safety
 * 2. Memtable.set(key, value)    ← fast, in RAM
 * 3. If memtable full → flush()  ← write SSTable to disk
 *
 * Read path:
 * 1. Check memtable              ← newest data, O(log n)
 * 2. Check SSTables newest→oldest ← binary search each
 * 3. Return first match found    ← or null if not found
 *
 * Flush:
 * 1. Write memtable → new SSTable file (sorted)
 * 2. Add SSTable to the list
 * 3. Clear memtable
 * 4. Checkpoint WAL (entries are safe in SSTable now)
 *
 * Trade-offs (DDIA):
 * ✅ Very fast writes — always sequential (WAL + memtable)
 * ✅ Sorted data on disk — enables range queries and merging
 * ✅ Crash safe via WAL
 * ❌ Reads may check multiple SSTables (read amplification)
 * ❌ SSTables accumulate without compaction (Session 5)
 * ❌ Space amplification — same key in multiple SSTables
 */

export class LSMTree implements StorageBackend {
  readonly name = 'lsm-tree';
  private readonly dataDir: string;
  private readonly sstDir: string;
  private memtable: Memtable;
  private readonly wal: WriteAheadLog;
  private sstables: SSTableReader[] = [];
  private readonly flushThreshold: number;
  private flushCount: number = 0;
  private lastWalRecoveryCount: number = 0;

  constructor(dataDir: string, flushThreshold = DEFAULT_FLUSH_THRESHOLD) {
    this.dataDir = dataDir;
    this.sstDir = path.join(dataDir, 'sst');
    ensureDir(dataDir);
    ensureDir(this.sstDir);

    this.flushThreshold = flushThreshold;
    this.memtable = new Memtable();
    this.wal = new WriteAheadLog(dataDir, 'lsm-tree.wal');

    this.recover();
  }

  // ── Write path ───────────────────────────────────────────

  async set(key: string, value: string): Promise<void> {
    // Step 1: WAL (crash safety)
    this.wal.appendSet(key, value);

    // Step 2: Memtable (fast, in RAM)
    this.memtable.set(key, value);

    // Step 3: Check if memtable needs flushing
    if (this.memtable.size() >= this.flushThreshold) {
      await this.flushMemtable();
    }
  }

  async delete(key: string): Promise<boolean> {
    // Write tombstone to WAL + memtable
    this.wal.appendDelete(key);
    this.memtable.delete(key);

    if (this.memtable.size() >= this.flushThreshold) {
      await this.flushMemtable();
    }

    return true;
  }

  // ── Read path ────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    // Step 1: Check memtable (newest data)
    const memEntry = this.memtable.get(key);
    if (memEntry !== undefined) {
      return memEntry.deleted ? null : memEntry.value;
    }

    // Step 2: Check SSTables from newest to oldest
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const result = this.sstables[i].get(key);
      if (result !== undefined) {
        return result.deleted ? null : result.value;
      }
    }

    // Step 3: Not found anywhere
    return null;
  }

  // ── Flush ────────────────────────────────────────────────

  /**
   * Flush memtable to a new SSTable on disk.
   *
   * This is the key operation of an LSM-Tree:
   * 1. Take the sorted memtable entries
   * 2. Write them as a new SSTable file
   * 3. Clear the memtable (it's safely on disk now)
   * 4. Checkpoint the WAL (entries are in the SSTable now)
   */
  private async flushMemtable(): Promise<void> {
    if (this.memtable.size() === 0) return;

    this.flushCount++;
    const sstPath = path.join(this.sstDir, `sst_${this.flushCount}_${Date.now()}.sst`);

    console.log(`[lsm-tree] Flushing memtable (${this.memtable.size()} entries) → ${path.basename(sstPath)}`);

    // Write sorted entries to SSTable
    const entries = this.memtable.entries();
    writeSSTable(sstPath, entries);

    // Load the new SSTable for reads
    const reader = new SSTableReader(sstPath);
    this.sstables.push(reader);

    // Clear memtable and WAL
    this.memtable.clear();
    this.wal.checkpoint();

    console.log(`[lsm-tree] Flush complete. ${this.sstables.length} SSTable(s) on disk.`);
  }

  // ── Other interface methods ──────────────────────────────

  async size(): Promise<number> {
    // Count unique live keys across memtable + all SSTables
    // This is expensive but accurate
    const keys = new Map<string, boolean>(); // key → isDeleted

    // SSTables oldest to newest
    for (const sst of this.sstables) {
      // We need to scan the SSTable for this... for simplicity,
      // we'll estimate from memtable + SSTable record counts
    }

    // For now, approximate: memtable live count + SSTable records
    // Accurate count would require scanning all SSTables
    let count = 0;
    const seen = new Set<string>();

    // Memtable first (newest)
    for (const entry of this.memtable.entries()) {
      seen.add(entry.key);
      if (!entry.deleted) count++;
    }

    // TODO: For accurate count, would need to scan SSTables
    // For now, use SSTable record counts as approximation
    for (const sst of this.sstables) {
      count += sst.meta.numRecords;
    }

    // Subtract memtable size to avoid double-counting rough estimate
    return this.memtable.liveCount() + this.sstables.reduce((sum, s) => sum + s.meta.numRecords, 0);
  }

  async flush(): Promise<void> {
    await this.flushMemtable();
  }

  async close(): Promise<void> {
    // Flush remaining memtable entries
    if (this.memtable.size() > 0) {
      await this.flushMemtable();
    }
    this.wal.checkpoint();
  }

  async clear(): Promise<void> {
    this.memtable.clear();
    this.wal.checkpoint();

    // Delete all SSTable files
    for (const sst of this.sstables) {
      try { fs.unlinkSync(sst.meta.filePath); } catch { /* ignore */ }
    }
    this.sstables = [];
    this.flushCount = 0;
  }

  walCheckpoint(): void {
    this.wal.checkpoint();
  }

  // ── Inspection (for visualization) ───────────────────────

  async inspect(): Promise<BackendState> {
    const memEntries = this.memtable.entries().map(e => ({
      key: e.key,
      value: e.value,
      deleted: e.deleted,
    }));

    const sstMetas: SSTableMeta[] = this.sstables.map(s => s.meta);

    return {
      name: this.name,
      keyCount: this.memtable.liveCount(),
      details: {
        memtable: {
          entries: memEntries,
          size: this.memtable.size(),
          liveCount: this.memtable.liveCount(),
          sizeBytes: this.memtable.sizeBytes(),
          flushThreshold: this.flushThreshold,
        },
        sstables: sstMetas,
        sstableCount: this.sstables.length,
        flushCount: this.flushCount,
        wal: this.wal.inspect(),
        lastWalRecoveryCount: this.lastWalRecoveryCount,
      },
    };
  }

  // ── Recovery ─────────────────────────────────────────────

  /**
   * Crash recovery sequence:
   * 1. Load existing SSTable files from disk (sorted by name/time)
   * 2. Replay WAL entries into a fresh memtable
   * 3. Checkpoint WAL (entries are now in memtable, safe)
   */
  private recover(): void {
    // Phase 1: Load existing SSTables
    this.loadSSTables();

    // Phase 2: Replay WAL into memtable
    const { entries, corruptedCount } = this.wal.recover();
    this.lastWalRecoveryCount = entries.length;

    if (entries.length > 0) {
      console.log(`[lsm-tree] Replaying ${entries.length} WAL entries into memtable...`);
      for (const entry of entries) {
        if (entry.type === 'SET') {
          this.memtable.set(entry.key, entry.value);
        } else if (entry.type === 'DEL') {
          this.memtable.delete(entry.key);
        }
      }
      console.log(`[lsm-tree] WAL replay complete.`);
    }

    if (corruptedCount > 0) {
      console.warn(`[lsm-tree] ${corruptedCount} corrupted WAL entries skipped.`);
    }

    // Phase 3: Checkpoint (WAL entries are in memtable now)
    if (entries.length > 0 || corruptedCount > 0) {
      this.wal.checkpoint();
    }

    console.log(`[lsm-tree] Ready: ${this.memtable.size()} keys in memtable, ${this.sstables.length} SSTables on disk.`);
  }

  /** Scan SSTable directory and load all .sst files */
  private loadSSTables(): void {
    if (!fs.existsSync(this.sstDir)) return;

    const files = fs.readdirSync(this.sstDir)
      .filter(f => f.endsWith('.sst'))
      .sort(); // Sort by name (which includes sequence number)

    for (const file of files) {
      const fullPath = path.join(this.sstDir, file);
      try {
        const reader = new SSTableReader(fullPath);
        this.sstables.push(reader);
        this.flushCount++;
      } catch (err) {
        console.error(`[lsm-tree] Failed to load SSTable ${file}:`, err);
      }
    }

    if (this.sstables.length > 0) {
      console.log(`[lsm-tree] Loaded ${this.sstables.length} SSTable(s) from disk.`);
    }
  }
}

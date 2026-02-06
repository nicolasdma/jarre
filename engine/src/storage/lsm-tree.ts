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
 * │ Read path: memtable → bloom → SSTables       │
 * └──────────────────────────────────────────────┘
 *
 * Write path:
 * 1. WAL.append(key, value)      ← crash safety
 * 2. Memtable.set(key, value)    ← fast, in RAM
 * 3. If memtable full → flush()  ← write SSTable to disk
 * 4. If too many SSTables → compact() ← merge SSTables
 *
 * Read path:
 * 1. Check memtable              ← newest data, O(log n)
 * 2. For each SSTable (newest→oldest):
 *    a. Bloom filter check       ← "definitely not here?" skip!
 *    b. Binary search index      ← find the right chunk
 *    c. Scan chunk on disk       ← find exact key
 * 3. Return first match found    ← or null if not found
 *
 * Compaction (size-tiered):
 * When too many SSTables accumulate, merge them into one.
 * During merge: keep newest version of each key, drop tombstones.
 * This reclaims space and reduces read amplification.
 *
 * Trade-offs (DDIA):
 * ✅ Very fast writes — always sequential (WAL + memtable)
 * ✅ Sorted data on disk — enables range queries and merging
 * ✅ Crash safe via WAL
 * ✅ Bloom filters reduce unnecessary disk reads
 * ❌ Write amplification — data gets rewritten during compaction
 * ❌ Space amplification — same key in multiple SSTables until compaction
 */

/** When this many SSTables exist, trigger compaction */
const COMPACTION_THRESHOLD = 4;

export class LSMTree implements StorageBackend {
  readonly name = 'lsm-tree';
  private readonly dataDir: string;
  private readonly sstDir: string;
  private memtable: Memtable;
  private readonly wal: WriteAheadLog;
  private sstables: SSTableReader[] = [];
  private readonly flushThreshold: number;
  private flushCount: number = 0;
  private compactionCount: number = 0;
  private lastWalRecoveryCount: number = 0;
  /** Total bloom filter "definitely not" results (across all GETs) */
  private totalBloomNegatives: number = 0;
  /** Total bloom filter "maybe" results (across all GETs) */
  private totalBloomPositives: number = 0;

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
    // Bloom filter check happens inside SSTableReader.get()
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const result = this.sstables[i].get(key);
      if (result !== undefined) {
        // Accumulate bloom stats
        this.syncBloomStats();
        return result.deleted ? null : result.value;
      }
    }

    // Accumulate bloom stats even on miss
    this.syncBloomStats();

    // Step 3: Not found anywhere
    return null;
  }

  // ── Flush ────────────────────────────────────────────────

  /**
   * Flush memtable to a new SSTable on disk.
   */
  private async flushMemtable(): Promise<void> {
    if (this.memtable.size() === 0) return;

    this.flushCount++;
    const sstPath = path.join(this.sstDir, `sst_${this.flushCount}_${Date.now()}.sst`);

    console.log(`[lsm-tree] Flushing memtable (${this.memtable.size()} entries) → ${path.basename(sstPath)}`);

    // Write sorted entries to SSTable (now includes bloom filter)
    const entries = this.memtable.entries();
    writeSSTable(sstPath, entries);

    // Load the new SSTable for reads
    const reader = new SSTableReader(sstPath);
    this.sstables.push(reader);

    // Clear memtable and WAL
    this.memtable.clear();
    this.wal.checkpoint();

    console.log(`[lsm-tree] Flush complete. ${this.sstables.length} SSTable(s) on disk.`);

    // Check if compaction is needed
    if (this.sstables.length >= COMPACTION_THRESHOLD) {
      await this.compact();
    }
  }

  // ── Compaction ──────────────────────────────────────────

  /**
   * Compact all SSTables into one.
   *
   * Compaction is the "cleanup" phase of an LSM-Tree:
   * 1. Read all entries from all SSTables (they're all sorted)
   * 2. Merge them like merge sort — for duplicate keys, keep the newest
   * 3. Drop tombstones (deleted keys) — they're no longer needed
   * 4. Write one new SSTable
   * 5. Delete old SSTables
   *
   * Why? Without compaction:
   * - Reads get slower (check more SSTables)
   * - Disk space grows (same key stored multiple times)
   *
   * Trade-off: compaction = WRITE AMPLIFICATION
   * Data that was already on disk gets rewritten. This is the cost
   * of fast writes in LSM-Trees.
   */
  async compact(): Promise<void> {
    if (this.sstables.length < 2) return;

    const oldCount = this.sstables.length;
    const oldTotalBytes = this.sstables.reduce((s, t) => s + t.meta.fileSizeBytes, 0);
    console.log(`[lsm-tree] Compacting ${oldCount} SSTables (${oldTotalBytes} bytes)...`);

    // K-way merge: collect iterators from all SSTables (oldest first)
    const merged = this.kWayMerge(this.sstables);

    // Write merged entries to new SSTable
    this.compactionCount++;
    const newPath = path.join(this.sstDir, `sst_c${this.compactionCount}_${Date.now()}.sst`);
    writeSSTable(newPath, merged, 1);

    // Remember old file paths for deletion
    const oldPaths = this.sstables.map(s => s.meta.filePath);

    // Replace old SSTables with the new compacted one
    const newReader = new SSTableReader(newPath, 1);
    this.sstables = [newReader];

    // Delete old SSTable files
    for (const oldPath of oldPaths) {
      try { fs.unlinkSync(oldPath); } catch { /* ignore */ }
    }

    const newBytes = newReader.meta.fileSizeBytes;
    const saved = oldTotalBytes - newBytes;
    console.log(
      `[lsm-tree] Compaction complete: ${oldCount} → 1 SSTable, ` +
      `${newBytes} bytes (saved ${saved} bytes, ${Math.round(saved / oldTotalBytes * 100)}%)`
    );
  }

  /**
   * K-way merge of sorted SSTables.
   *
   * Since each SSTable is sorted, merging is like merge sort:
   * - Take the smallest key from all iterators
   * - If multiple SSTables have the same key, keep the NEWEST (last one wins)
   * - Skip tombstones (they've served their purpose)
   *
   * SSTables are ordered oldest→newest, so later entries override earlier ones.
   */
  private kWayMerge(sstables: SSTableReader[]): { key: string; value: string; deleted: boolean }[] {
    // Collect all entries from all SSTables into per-SSTable arrays
    // (SSTables are ordered oldest → newest)
    const allEntries: Array<{ key: string; value: string; deleted: boolean; sstIdx: number }> = [];

    for (let i = 0; i < sstables.length; i++) {
      for (const entry of sstables[i].entries()) {
        allEntries.push({ ...entry, sstIdx: i });
      }
    }

    // Sort by key, then by SSTable index (higher = newer = wins on tie)
    allEntries.sort((a, b) => {
      const cmp = a.key.localeCompare(b.key);
      if (cmp !== 0) return cmp;
      return a.sstIdx - b.sstIdx; // older first, newer overwrites
    });

    // Deduplicate: for each key, keep only the last occurrence (newest)
    const result: { key: string; value: string; deleted: boolean }[] = [];
    for (let i = 0; i < allEntries.length; i++) {
      const isLast = i === allEntries.length - 1 || allEntries[i + 1].key !== allEntries[i].key;
      if (isLast) {
        // Skip tombstones during compaction — the key is truly gone
        if (!allEntries[i].deleted) {
          result.push({
            key: allEntries[i].key,
            value: allEntries[i].value,
            deleted: false,
          });
        }
      }
    }

    return result;
  }

  // ── Other interface methods ──────────────────────────────

  async size(): Promise<number> {
    return this.memtable.liveCount() + this.sstables.reduce((sum, s) => sum + s.meta.numRecords, 0);
  }

  async flush(): Promise<void> {
    await this.flushMemtable();
  }

  async close(): Promise<void> {
    if (this.memtable.size() > 0) {
      await this.flushMemtable();
    }
    this.wal.checkpoint();
  }

  async clear(): Promise<void> {
    this.memtable.clear();
    this.wal.checkpoint();

    for (const sst of this.sstables) {
      try { fs.unlinkSync(sst.meta.filePath); } catch { /* ignore */ }
    }
    this.sstables = [];
    this.flushCount = 0;
    this.compactionCount = 0;
    this.totalBloomNegatives = 0;
    this.totalBloomPositives = 0;
  }

  walCheckpoint(): void {
    this.wal.checkpoint();
  }

  // ── Inspection (for visualization) ───────────────────────

  async inspect(): Promise<BackendState> {
    this.syncBloomStats();

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
        compactionCount: this.compactionCount,
        compactionThreshold: COMPACTION_THRESHOLD,
        wal: this.wal.inspect(),
        lastWalRecoveryCount: this.lastWalRecoveryCount,
        bloom: {
          totalNegatives: this.totalBloomNegatives,
          totalPositives: this.totalBloomPositives,
        },
      },
    };
  }

  /** Sync bloom stats from individual SSTable readers */
  private syncBloomStats(): void {
    let neg = 0;
    let pos = 0;
    for (const sst of this.sstables) {
      neg += sst.meta.bloomNegatives;
      pos += sst.meta.bloomPositives;
    }
    this.totalBloomNegatives = neg;
    this.totalBloomPositives = pos;
  }

  // ── Recovery ─────────────────────────────────────────────

  private recover(): void {
    this.loadSSTables();

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

    if (entries.length > 0 || corruptedCount > 0) {
      this.wal.checkpoint();
    }

    console.log(`[lsm-tree] Ready: ${this.memtable.size()} keys in memtable, ${this.sstables.length} SSTables on disk.`);
  }

  private loadSSTables(): void {
    if (!fs.existsSync(this.sstDir)) return;

    const files = fs.readdirSync(this.sstDir)
      .filter(f => f.endsWith('.sst'))
      .sort();

    for (const file of files) {
      const fullPath = path.join(this.sstDir, file);
      try {
        // Compacted SSTables (start with "sst_c") are level 1+
        const level = file.startsWith('sst_c') ? 1 : 0;
        const reader = new SSTableReader(fullPath, level);
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

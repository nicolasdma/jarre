import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StorageBackend, BackendState } from './interface.js';
import { appendToFile, readFileBuffer, fileSize, ensureDir, deleteFile } from '../utils/file-io.js';
import { WriteAheadLog } from './wal.js';

/**
 * Hash Index Storage Backend (DDIA Ch3 — Bitcask model + WAL)
 *
 * Improvement over AppendLog: keeps an in-memory Map<key, offset>
 * that points directly to the byte position of the latest value.
 *
 * Write path (with WAL):
 * 1. Write to WAL with CRC32 checksum  ← safety net
 * 2. Append to main log file           ← durable storage
 * 3. Update in-memory hash map          ← fast lookups
 *
 * If the process crashes between step 1 and 2, the WAL has the data.
 * On restart, we rebuild from the main log, then replay the WAL.
 *
 * - SET: WAL write → log append → update hashmap → O(1) write
 * - GET: lookup offset in hashmap + single seek → O(1) read
 * - DEL: WAL write → log append tombstone → remove from hashmap → O(1)
 *
 * Trade-offs (DDIA):
 * ✅ O(1) reads AND writes — very fast
 * ✅ Crash recovery with CRC32 validation via WAL
 * ❌ All keys MUST fit in RAM — can't have more keys than memory
 * ❌ No range queries — hash map only does point lookups
 * ❌ Log grows forever without compaction
 *
 * This is exactly how Bitcask (Riak's storage engine) works.
 */

const RECORD_TYPE_SET = 0x01;
const RECORD_TYPE_DELETE = 0x02;

/** Pointer to a value in the log file */
interface IndexEntry {
  /** Byte offset where the record starts in the log file */
  offset: number;
  /** Total record size in bytes (for reading just this record) */
  recordSize: number;
  /** Byte offset where the value bytes start */
  valueOffset: number;
  /** Length of the value in bytes */
  valueLength: number;
}

export class HashIndex implements StorageBackend {
  readonly name = 'hash-index';
  private readonly filePath: string;
  private readonly wal: WriteAheadLog;
  private readonly index: Map<string, IndexEntry> = new Map();
  private currentOffset: number = 0;
  /** Count of entries recovered from WAL on last startup */
  private lastWalRecoveryCount: number = 0;

  constructor(dataDir: string) {
    ensureDir(dataDir);
    this.filePath = path.join(dataDir, 'engine.log');
    this.wal = new WriteAheadLog(dataDir, 'hash-index.wal');
    this.recoverFromDisk();
  }

  async set(key: string, value: string): Promise<void> {
    // Step 1: Write to WAL first (safety net with CRC32)
    this.wal.appendSet(key, value);

    // Step 2: Append to main log (durable storage)
    const recordOffset = this.currentOffset;
    const record = encodeRecord(RECORD_TYPE_SET, key, value);
    appendToFile(this.filePath, record);

    // Step 3: Update in-memory index
    const keyBuf = Buffer.from(key, 'utf8');
    const valBuf = Buffer.from(value, 'utf8');
    const valueOffset = recordOffset + 1 + 4 + keyBuf.length + 4;

    this.index.set(key, {
      offset: recordOffset,
      recordSize: record.length,
      valueOffset,
      valueLength: valBuf.length,
    });

    this.currentOffset += record.length;

    // WAL is NOT checkpointed here — entries accumulate.
    // Checkpoint happens on: explicit command, clean shutdown, or after recovery.
    // This matches real databases: WAL grows until checkpoint.
  }

  async get(key: string): Promise<string | null> {
    const entry = this.index.get(key);
    if (!entry) return null;

    // Single seek: read just the value bytes from disk
    const fd = fs.openSync(this.filePath, 'r');
    const buf = Buffer.alloc(entry.valueLength);
    fs.readSync(fd, buf, 0, entry.valueLength, entry.valueOffset);
    fs.closeSync(fd);

    return buf.toString('utf8');
  }

  async delete(key: string): Promise<boolean> {
    if (!this.index.has(key)) return false;

    // Step 1: WAL first
    this.wal.appendDelete(key);

    // Step 2: Main log
    const record = encodeRecord(RECORD_TYPE_DELETE, key, '');
    appendToFile(this.filePath, record);
    this.currentOffset += record.length;

    // Step 3: Update index
    this.index.delete(key);
    return true;
  }

  /** Manually checkpoint the WAL — clears all accumulated entries */
  walCheckpoint(): void {
    this.wal.checkpoint();
  }

  async size(): Promise<number> {
    return this.index.size;
  }

  async flush(): Promise<void> {
    // Writes are synchronous, no buffering
  }

  async close(): Promise<void> {
    this.wal.checkpoint();
    this.index.clear();
  }

  async inspect(): Promise<BackendState> {
    // Build a snapshot of the index for visualization
    const indexEntries: Array<{ key: string; offset: number; valueLength: number }> = [];
    for (const [key, entry] of this.index) {
      indexEntries.push({
        key,
        offset: entry.offset,
        valueLength: entry.valueLength,
      });
    }

    return {
      name: this.name,
      keyCount: this.index.size,
      details: {
        filePath: this.filePath,
        fileSizeBytes: fileSize(this.filePath),
        logOffset: this.currentOffset,
        indexSize: this.index.size,
        indexEntries: indexEntries.slice(0, 50),
        totalRecordsOnDisk: this.countTotalRecords(),
        wal: this.wal.inspect(),
        lastWalRecoveryCount: this.lastWalRecoveryCount,
      },
    };
  }

  async clear(): Promise<void> {
    deleteFile(this.filePath);
    this.wal.checkpoint();
    this.index.clear();
    this.currentOffset = 0;
  }

  /**
   * Full crash recovery sequence:
   * 1. Rebuild index from main log (same as before)
   * 2. Replay any WAL entries (data that was written to WAL but not yet in main log)
   * 3. Checkpoint WAL (it's now safely in the main log)
   *
   * This handles the crash scenario:
   * - Process crashed after WAL write but before main log write
   * - WAL has the data, main log doesn't → replay fills the gap
   */
  private recoverFromDisk(): void {
    // Phase 1: Rebuild from main log
    this.rebuildFromLog();

    // Phase 2: Replay WAL entries (if any)
    const { entries, corruptedCount } = this.wal.recover();
    this.lastWalRecoveryCount = entries.length;

    if (entries.length > 0) {
      console.log(`[hash-index] Replaying ${entries.length} WAL entries...`);
      for (const entry of entries) {
        if (entry.type === 'SET') {
          // Write to main log and update index
          const recordOffset = this.currentOffset;
          const record = encodeRecord(RECORD_TYPE_SET, entry.key, entry.value);
          appendToFile(this.filePath, record);

          const keyBuf = Buffer.from(entry.key, 'utf8');
          const valBuf = Buffer.from(entry.value, 'utf8');
          const valueOffset = recordOffset + 1 + 4 + keyBuf.length + 4;

          this.index.set(entry.key, {
            offset: recordOffset,
            recordSize: record.length,
            valueOffset,
            valueLength: valBuf.length,
          });

          this.currentOffset += record.length;
        } else if (entry.type === 'DEL') {
          const record = encodeRecord(RECORD_TYPE_DELETE, entry.key, '');
          appendToFile(this.filePath, record);
          this.currentOffset += record.length;
          this.index.delete(entry.key);
        }
      }
      console.log(`[hash-index] WAL replay complete: ${entries.length} entries applied`);
    }

    if (corruptedCount > 0) {
      console.warn(`[hash-index] ${corruptedCount} corrupted WAL entries skipped (crash damage)`);
    }

    // Phase 3: Checkpoint — WAL data is now safely in main log
    if (entries.length > 0 || corruptedCount > 0) {
      this.wal.checkpoint();
    }
  }

  /**
   * Rebuild the in-memory index by scanning the entire log file.
   */
  private rebuildFromLog(): void {
    const buffer = readFileBuffer(this.filePath);
    if (!buffer || buffer.length === 0) return;

    let offset = 0;
    let recovered = 0;

    while (offset < buffer.length) {
      const parsed = decodeRecordMeta(buffer, offset);
      if (parsed === null) {
        console.error(`[hash-index] Corrupted record at offset ${offset}, stopping recovery`);
        break;
      }

      if (parsed.type === RECORD_TYPE_SET) {
        this.index.set(parsed.key, {
          offset,
          recordSize: parsed.nextOffset - offset,
          valueOffset: parsed.valueOffset,
          valueLength: parsed.valueLength,
        });
      } else if (parsed.type === RECORD_TYPE_DELETE) {
        this.index.delete(parsed.key);
      }

      offset = parsed.nextOffset;
      recovered++;
    }

    this.currentOffset = offset;
    console.log(`[hash-index] Rebuilt index: ${recovered} records, ${this.index.size} live keys`);
  }

  /** Count total records on disk (for inspect) */
  private countTotalRecords(): number {
    const buffer = readFileBuffer(this.filePath);
    if (!buffer || buffer.length === 0) return 0;

    let offset = 0;
    let count = 0;

    while (offset < buffer.length) {
      const parsed = decodeRecordMeta(buffer, offset);
      if (parsed === null) break;
      offset = parsed.nextOffset;
      count++;
    }

    return count;
  }
}

// ── Binary encoding (same format as AppendLog) ───────────────

function encodeRecord(type: number, key: string, value: string): Buffer {
  const keyBuf = Buffer.from(key, 'utf8');
  const valBuf = Buffer.from(value, 'utf8');
  const total = 1 + 4 + keyBuf.length + 4 + valBuf.length;
  const buf = Buffer.alloc(total);

  let offset = 0;
  buf.writeUInt8(type, offset); offset += 1;
  buf.writeUInt32BE(keyBuf.length, offset); offset += 4;
  keyBuf.copy(buf, offset); offset += keyBuf.length;
  buf.writeUInt32BE(valBuf.length, offset); offset += 4;
  valBuf.copy(buf, offset);

  return buf;
}

/** Decode record metadata without copying the value — just positions */
interface RecordMeta {
  type: number;
  key: string;
  valueOffset: number;
  valueLength: number;
  nextOffset: number;
}

function decodeRecordMeta(buf: Buffer, offset: number): RecordMeta | null {
  if (offset + 9 > buf.length) return null;

  const type = buf.readUInt8(offset);
  let pos = offset + 1;

  if (type !== RECORD_TYPE_SET && type !== RECORD_TYPE_DELETE) return null;

  const keyLen = buf.readUInt32BE(pos); pos += 4;
  if (pos + keyLen + 4 > buf.length) return null;

  const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;

  const valLen = buf.readUInt32BE(pos); pos += 4;
  const valueOffset = pos;
  if (pos + valLen > buf.length) return null;
  pos += valLen;

  return { type, key, valueOffset, valueLength: valLen, nextOffset: pos };
}

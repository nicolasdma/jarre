import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MemtableEntry } from './memtable.js';
import { ensureDir } from '../utils/file-io.js';

/**
 * SSTable — Sorted String Table (DDIA Ch3)
 *
 * An SSTable is an IMMUTABLE file on disk where key-value pairs are
 * stored in SORTED order by key. Once written, it's never modified.
 *
 * File layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ Data Block                                           │
 * │ [record₁][record₂]...[recordₙ]                     │
 * │ Each record: [type:1][keyLen:4][key][valLen:4][val]  │
 * ├─────────────────────────────────────────────────────┤
 * │ Index Block (sparse — every Nth key)                 │
 * │ [numEntries:4]                                       │
 * │ [keyLen:4][key][dataOffset:4] × numEntries           │
 * ├─────────────────────────────────────────────────────┤
 * │ Footer (12 bytes)                                    │
 * │ [indexBlockOffset:4][numDataRecords:4][magic:4]      │
 * │ magic = 0x53535401 ("SST" + version 1)               │
 * └─────────────────────────────────────────────────────┘
 *
 * Why sorted? Three reasons:
 * 1. Binary search on the sparse index → O(log n) reads
 * 2. Merging multiple SSTables is just merge sort → O(n)
 * 3. Range queries are sequential disk reads → fast
 *
 * Why sparse index (not every key)?
 * If you have 1M keys and index every 100th, your index has 10K entries.
 * That fits in RAM. To find a key, binary search the index, then scan
 * at most 100 records on disk. Good tradeoff.
 *
 * Why immutable? Because modifying a sorted file is expensive (shift everything).
 * Instead, writes go to the memtable, and when it's full, we write a NEW SSTable.
 * Old SSTables are only removed during compaction (Session 5).
 */

const RECORD_TYPE_SET = 0x01;
const RECORD_TYPE_DELETE = 0x02;
const FOOTER_SIZE = 12;
const MAGIC = 0x53535401; // "SST\x01"
const INDEX_EVERY_N = 4; // Index every 4th key (low for demo visibility)

/** Metadata about an SSTable for visualization */
export interface SSTableMeta {
  filePath: string;
  fileSizeBytes: number;
  numRecords: number;
  numIndexEntries: number;
  minKey: string;
  maxKey: string;
  createdAt: number;
}

/** Sparse index entry: key → byte offset in data block */
interface IndexEntry {
  key: string;
  dataOffset: number;
}

// ── SSTable Writer ───────────────────────────────────────────

/**
 * Write a memtable's sorted entries to a new SSTable file.
 * Returns metadata about the created file.
 */
export function writeSSTable(
  filePath: string,
  entries: MemtableEntry[],
): SSTableMeta {
  ensureDir(path.dirname(filePath));

  const indexEntries: IndexEntry[] = [];
  const dataChunks: Buffer[] = [];
  let dataOffset = 0;
  let recordCount = 0;

  // Phase 1: Encode all records and build sparse index
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const type = entry.deleted ? RECORD_TYPE_DELETE : RECORD_TYPE_SET;
    const record = encodeRecord(type, entry.key, entry.value);

    // Sparse index: record every Nth key
    if (i % INDEX_EVERY_N === 0) {
      indexEntries.push({ key: entry.key, dataOffset });
    }

    dataChunks.push(record);
    dataOffset += record.length;
    recordCount++;
  }

  // Phase 2: Encode index block
  const indexBlockOffset = dataOffset;
  const indexBlock = encodeIndexBlock(indexEntries);

  // Phase 3: Encode footer
  const footer = Buffer.alloc(FOOTER_SIZE);
  footer.writeUInt32BE(indexBlockOffset, 0);
  footer.writeUInt32BE(recordCount, 4);
  footer.writeUInt32BE(MAGIC, 8);

  // Phase 4: Write everything as one buffer
  const fullFile = Buffer.concat([...dataChunks, indexBlock, footer]);
  fs.writeFileSync(filePath, fullFile);

  return {
    filePath,
    fileSizeBytes: fullFile.length,
    numRecords: recordCount,
    numIndexEntries: indexEntries.length,
    minKey: entries.length > 0 ? entries[0].key : '',
    maxKey: entries.length > 0 ? entries[entries.length - 1].key : '',
    createdAt: Date.now(),
  };
}

// ── SSTable Reader ───────────────────────────────────────────

/**
 * An SSTable reader. Loads the sparse index into memory on construction,
 * then does binary search + disk seek for each get().
 */
export class SSTableReader {
  readonly meta: SSTableMeta;
  private readonly filePath: string;
  private readonly index: IndexEntry[] = [];
  private readonly indexBlockOffset: number;
  private readonly numRecords: number;

  constructor(filePath: string) {
    this.filePath = filePath;

    // Read footer (last 12 bytes)
    const stat = fs.statSync(filePath);
    const fd = fs.openSync(filePath, 'r');
    const footerBuf = Buffer.alloc(FOOTER_SIZE);
    fs.readSync(fd, footerBuf, 0, FOOTER_SIZE, stat.size - FOOTER_SIZE);

    this.indexBlockOffset = footerBuf.readUInt32BE(0);
    this.numRecords = footerBuf.readUInt32BE(4);
    const magic = footerBuf.readUInt32BE(8);

    if (magic !== MAGIC) {
      fs.closeSync(fd);
      throw new Error(`Invalid SSTable magic: 0x${magic.toString(16)} (expected 0x${MAGIC.toString(16)})`);
    }

    // Read index block
    const indexSize = stat.size - FOOTER_SIZE - this.indexBlockOffset;
    const indexBuf = Buffer.alloc(indexSize);
    fs.readSync(fd, indexBuf, 0, indexSize, this.indexBlockOffset);
    fs.closeSync(fd);

    this.index = decodeIndexBlock(indexBuf);

    // Build metadata
    this.meta = {
      filePath,
      fileSizeBytes: stat.size,
      numRecords: this.numRecords,
      numIndexEntries: this.index.length,
      minKey: this.index.length > 0 ? this.index[0].key : '',
      maxKey: this.index.length > 0 ? this.index[this.index.length - 1].key : '',
      createdAt: stat.mtimeMs,
    };
  }

  /**
   * Look up a key in this SSTable.
   * Returns { value, deleted } if found, undefined if not in this file.
   *
   * Algorithm:
   * 1. Binary search the sparse index to find which "chunk" the key might be in
   * 2. Scan that chunk of the data block (at most INDEX_EVERY_N records)
   * 3. Return the value if found
   */
  get(key: string): { value: string; deleted: boolean } | undefined {
    if (this.index.length === 0) return undefined;

    // Quick range check: is this key possibly in this SSTable?
    if (key < this.meta.minKey || key > this.meta.maxKey) return undefined;

    // Binary search the sparse index for the largest key <= target
    let lo = 0;
    let hi = this.index.length - 1;
    let bestIdx = 0;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const cmp = this.index[mid].key.localeCompare(key);

      if (cmp <= 0) {
        bestIdx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    // Determine the data range to scan
    const startOffset = this.index[bestIdx].dataOffset;
    const endOffset = bestIdx + 1 < this.index.length
      ? this.index[bestIdx + 1].dataOffset
      : this.indexBlockOffset; // End of data block

    // Read and scan the data chunk
    const chunkSize = endOffset - startOffset;
    const fd = fs.openSync(this.filePath, 'r');
    const chunk = Buffer.alloc(chunkSize);
    fs.readSync(fd, chunk, 0, chunkSize, startOffset);
    fs.closeSync(fd);

    // Linear scan within the chunk (at most INDEX_EVERY_N records)
    let pos = 0;
    while (pos < chunk.length) {
      const decoded = decodeRecord(chunk, pos);
      if (!decoded) break;

      if (decoded.key === key) {
        return {
          value: decoded.value,
          deleted: decoded.type === RECORD_TYPE_DELETE,
        };
      }

      // Since data is sorted, if we've passed the target key, stop early
      if (decoded.key > key) break;

      pos = decoded.nextOffset;
    }

    return undefined;
  }
}

// ── Binary encoding (same format as main log) ────────────────

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

function decodeRecord(buf: Buffer, offset: number): {
  type: number; key: string; value: string; nextOffset: number;
} | null {
  if (offset + 9 > buf.length) return null;

  const type = buf.readUInt8(offset);
  let pos = offset + 1;

  if (type !== RECORD_TYPE_SET && type !== RECORD_TYPE_DELETE) return null;

  const keyLen = buf.readUInt32BE(pos); pos += 4;
  if (pos + keyLen + 4 > buf.length) return null;
  const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;

  const valLen = buf.readUInt32BE(pos); pos += 4;
  if (pos + valLen > buf.length) return null;
  const value = buf.subarray(pos, pos + valLen).toString('utf8'); pos += valLen;

  return { type, key, value, nextOffset: pos };
}

// ── Index block encoding ─────────────────────────────────────

function encodeIndexBlock(entries: IndexEntry[]): Buffer {
  // [numEntries:4][entry₁][entry₂]...
  // entry: [keyLen:4][key][dataOffset:4]
  const chunks: Buffer[] = [];

  const header = Buffer.alloc(4);
  header.writeUInt32BE(entries.length, 0);
  chunks.push(header);

  for (const entry of entries) {
    const keyBuf = Buffer.from(entry.key, 'utf8');
    const entryBuf = Buffer.alloc(4 + keyBuf.length + 4);

    let off = 0;
    entryBuf.writeUInt32BE(keyBuf.length, off); off += 4;
    keyBuf.copy(entryBuf, off); off += keyBuf.length;
    entryBuf.writeUInt32BE(entry.dataOffset, off);

    chunks.push(entryBuf);
  }

  return Buffer.concat(chunks);
}

function decodeIndexBlock(buf: Buffer): IndexEntry[] {
  if (buf.length < 4) return [];

  const numEntries = buf.readUInt32BE(0);
  const entries: IndexEntry[] = [];
  let pos = 4;

  for (let i = 0; i < numEntries && pos < buf.length; i++) {
    if (pos + 4 > buf.length) break;
    const keyLen = buf.readUInt32BE(pos); pos += 4;
    if (pos + keyLen + 4 > buf.length) break;
    const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;
    const dataOffset = buf.readUInt32BE(pos); pos += 4;
    entries.push({ key, dataOffset });
  }

  return entries;
}

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MemtableEntry } from './memtable.js';
import { BloomFilter } from './bloom-filter.js';
import { ensureDir } from '../utils/file-io.js';

/**
 * SSTable — Sorted String Table (DDIA Ch3)
 *
 * An SSTable is an IMMUTABLE file on disk where key-value pairs are
 * stored in SORTED order by key. Once written, it's never modified.
 *
 * File layout (v2 — with Bloom filter):
 * ┌─────────────────────────────────────────────────────┐
 * │ Data Block                                           │
 * │ [record₁][record₂]...[recordₙ]                     │
 * │ Each record: [type:1][keyLen:4][key][valLen:4][val]  │
 * ├─────────────────────────────────────────────────────┤
 * │ Index Block (sparse — every Nth key)                 │
 * │ [numEntries:4]                                       │
 * │ [keyLen:4][key][dataOffset:4] × numEntries           │
 * ├─────────────────────────────────────────────────────┤
 * │ Bloom Filter Block                                   │
 * │ [numBits:4][numHashes:1][itemCount:4][bits...]       │
 * ├─────────────────────────────────────────────────────┤
 * │ Footer (16 bytes)                                    │
 * │ [indexOffset:4][bloomOffset:4][numRecords:4][magic:4] │
 * │ magic = 0x53535402 ("SST" + version 2)               │
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
 * Why Bloom filter?
 * Before doing any disk I/O, ask the Bloom filter: "might this key exist?"
 * If "definitely not" → skip the entire SSTable. Saves disk reads.
 *
 * Why immutable? Because modifying a sorted file is expensive (shift everything).
 * Instead, writes go to the memtable, and when it's full, we write a NEW SSTable.
 * Old SSTables are only removed during compaction.
 */

const RECORD_TYPE_SET = 0x01;
const RECORD_TYPE_DELETE = 0x02;
const FOOTER_SIZE_V1 = 12;
const FOOTER_SIZE_V2 = 16;
const MAGIC_V1 = 0x53535401; // "SST\x01"
const MAGIC_V2 = 0x53535402; // "SST\x02" — with Bloom filter
const INDEX_EVERY_N = 4; // Index every 4th key (low for demo visibility)

/** Bloom filter bits per item. Low for demo (visible false positives). */
const BLOOM_BITS_PER_ITEM = 6;
const BLOOM_NUM_HASHES = 3;

/** Metadata about an SSTable for visualization */
export interface SSTableMeta {
  filePath: string;
  fileSizeBytes: number;
  numRecords: number;
  numIndexEntries: number;
  minKey: string;
  maxKey: string;
  createdAt: number;
  /** Bloom filter stats (v2 only) */
  bloom?: {
    numBits: number;
    numHashes: number;
    bitsSet: number;
    falsePositiveRate: number;
  };
  /** Number of times bloom filter said "definitely not" */
  bloomNegatives: number;
  /** Number of times bloom filter said "maybe yes" */
  bloomPositives: number;
  /** SSTable format version */
  version: number;
  /** Level for compaction (0 = freshly flushed) */
  level: number;
}

/** Sparse index entry: key → byte offset in data block */
interface IndexEntry {
  key: string;
  dataOffset: number;
}

// ── SSTable Writer ───────────────────────────────────────────

/**
 * Write a memtable's sorted entries to a new SSTable file (v2 format).
 * Includes a Bloom filter for fast negative lookups.
 */
export function writeSSTable(
  filePath: string,
  entries: MemtableEntry[],
  level = 0,
): SSTableMeta {
  ensureDir(path.dirname(filePath));

  const indexEntries: IndexEntry[] = [];
  const dataChunks: Buffer[] = [];
  let dataOffset = 0;
  let recordCount = 0;

  // Build Bloom filter sized for the number of entries
  const bloomBits = Math.max(64, entries.length * BLOOM_BITS_PER_ITEM);
  const bloom = new BloomFilter(bloomBits, BLOOM_NUM_HASHES);

  // Phase 1: Encode all records, build sparse index, and populate bloom filter
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const type = entry.deleted ? RECORD_TYPE_DELETE : RECORD_TYPE_SET;
    const record = encodeRecord(type, entry.key, entry.value);

    // Add to bloom filter
    bloom.add(entry.key);

    // Sparse index: every Nth key + always the last key
    if (i % INDEX_EVERY_N === 0 || i === entries.length - 1) {
      indexEntries.push({ key: entry.key, dataOffset });
    }

    dataChunks.push(record);
    dataOffset += record.length;
    recordCount++;
  }

  // Phase 2: Encode index block
  const indexBlockOffset = dataOffset;
  const indexBlock = encodeIndexBlock(indexEntries);

  // Phase 3: Encode bloom filter block
  const bloomOffset = indexBlockOffset + indexBlock.length;
  const bloomBlock = bloom.serialize();

  // Phase 4: Encode footer (v2: 16 bytes)
  const footer = Buffer.alloc(FOOTER_SIZE_V2);
  footer.writeUInt32BE(indexBlockOffset, 0);
  footer.writeUInt32BE(bloomOffset, 4);
  footer.writeUInt32BE(recordCount, 8);
  footer.writeUInt32BE(MAGIC_V2, 12);

  // Phase 5: Write everything as one buffer
  const fullFile = Buffer.concat([...dataChunks, indexBlock, bloomBlock, footer]);
  fs.writeFileSync(filePath, fullFile);

  return {
    filePath,
    fileSizeBytes: fullFile.length,
    numRecords: recordCount,
    numIndexEntries: indexEntries.length,
    minKey: entries.length > 0 ? entries[0].key : '',
    maxKey: entries.length > 0 ? entries[entries.length - 1].key : '',
    createdAt: Date.now(),
    bloom: {
      numBits: bloom.numBits,
      numHashes: bloom.numHashes,
      bitsSet: bloom.bitsSet(),
      falsePositiveRate: bloom.falsePositiveRate(),
    },
    bloomNegatives: 0,
    bloomPositives: 0,
    version: 2,
    level,
  };
}

// ── SSTable Reader ───────────────────────────────────────────

/**
 * An SSTable reader. Loads the sparse index and bloom filter into memory
 * on construction, then does bloom check + binary search + disk seek for each get().
 *
 * Supports both v1 (no bloom) and v2 (with bloom) formats.
 */
export class SSTableReader {
  readonly meta: SSTableMeta;
  private readonly filePath: string;
  private readonly index: IndexEntry[] = [];
  private readonly bloom: BloomFilter | null = null;
  private readonly indexBlockOffset: number;
  private readonly numRecords: number;
  private bloomNegatives: number = 0;
  private bloomPositives: number = 0;
  private level: number;

  constructor(filePath: string, level = 0) {
    this.filePath = filePath;
    this.level = level;

    const stat = fs.statSync(filePath);
    const fd = fs.openSync(filePath, 'r');

    // Try v2 footer first (16 bytes), fall back to v1 (12 bytes)
    const footerV2 = Buffer.alloc(FOOTER_SIZE_V2);
    fs.readSync(fd, footerV2, 0, FOOTER_SIZE_V2, stat.size - FOOTER_SIZE_V2);
    const magicV2 = footerV2.readUInt32BE(12);

    let indexBlockOffset: number;
    let bloomOffset: number | null = null;
    let numRecords: number;
    let version: number;

    if (magicV2 === MAGIC_V2) {
      // v2 format
      indexBlockOffset = footerV2.readUInt32BE(0);
      bloomOffset = footerV2.readUInt32BE(4);
      numRecords = footerV2.readUInt32BE(8);
      version = 2;
    } else {
      // Try v1 format
      const footerV1 = Buffer.alloc(FOOTER_SIZE_V1);
      fs.readSync(fd, footerV1, 0, FOOTER_SIZE_V1, stat.size - FOOTER_SIZE_V1);
      const magicV1 = footerV1.readUInt32BE(8);

      if (magicV1 !== MAGIC_V1) {
        fs.closeSync(fd);
        throw new Error(`Invalid SSTable magic: 0x${magicV2.toString(16)}`);
      }

      indexBlockOffset = footerV1.readUInt32BE(0);
      numRecords = footerV1.readUInt32BE(4);
      version = 1;
    }

    this.indexBlockOffset = indexBlockOffset;
    this.numRecords = numRecords;

    // Read index block
    const footerSize = version === 2 ? FOOTER_SIZE_V2 : FOOTER_SIZE_V1;
    const indexEnd = bloomOffset ?? (stat.size - footerSize);
    const indexSize = indexEnd - indexBlockOffset;
    const indexBuf = Buffer.alloc(indexSize);
    fs.readSync(fd, indexBuf, 0, indexSize, indexBlockOffset);
    this.index = decodeIndexBlock(indexBuf);

    // Read bloom filter (v2 only)
    let bloomMeta: SSTableMeta['bloom'] = undefined;
    if (bloomOffset !== null) {
      const bloomSize = stat.size - footerSize - bloomOffset;
      const bloomBuf = Buffer.alloc(bloomSize);
      fs.readSync(fd, bloomBuf, 0, bloomSize, bloomOffset);
      (this as unknown as { bloom: BloomFilter }).bloom = BloomFilter.deserialize(bloomBuf);
      bloomMeta = {
        numBits: this.bloom!.numBits,
        numHashes: this.bloom!.numHashes,
        bitsSet: this.bloom!.bitsSet(),
        falsePositiveRate: this.bloom!.falsePositiveRate(),
      };
    }

    fs.closeSync(fd);

    // Build metadata
    this.meta = {
      filePath,
      fileSizeBytes: stat.size,
      numRecords: this.numRecords,
      numIndexEntries: this.index.length,
      minKey: this.index.length > 0 ? this.index[0].key : '',
      maxKey: this.index.length > 0 ? this.index[this.index.length - 1].key : '',
      createdAt: stat.mtimeMs,
      bloom: bloomMeta,
      bloomNegatives: 0,
      bloomPositives: 0,
      version,
      level: this.level,
    };
  }

  /**
   * Look up a key in this SSTable.
   * Returns { value, deleted } if found, undefined if not in this file.
   *
   * Algorithm:
   * 0. Check Bloom filter — if "definitely not", skip entirely
   * 1. Binary search the sparse index to find which "chunk" the key might be in
   * 2. Scan that chunk of the data block (at most INDEX_EVERY_N records)
   * 3. Return the value if found
   */
  get(key: string): { value: string; deleted: boolean } | undefined {
    if (this.index.length === 0) return undefined;

    // Quick range check
    if (key < this.meta.minKey || key > this.meta.maxKey) return undefined;

    // Bloom filter check (v2 only)
    if (this.bloom) {
      if (!this.bloom.mightContain(key)) {
        this.bloomNegatives++;
        this.meta.bloomNegatives = this.bloomNegatives;
        return undefined; // Definitely not here — saved a disk read!
      }
      this.bloomPositives++;
      this.meta.bloomPositives = this.bloomPositives;
    }

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
      : this.indexBlockOffset;

    // Read and scan the data chunk
    const chunkSize = endOffset - startOffset;
    const fd = fs.openSync(this.filePath, 'r');
    const chunk = Buffer.alloc(chunkSize);
    fs.readSync(fd, chunk, 0, chunkSize, startOffset);
    fs.closeSync(fd);

    // Linear scan within the chunk
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

      if (decoded.key > key) break;
      pos = decoded.nextOffset;
    }

    return undefined;
  }

  /**
   * Iterate all entries in this SSTable (for compaction merge).
   * Yields entries in sorted order.
   */
  *entries(): Generator<{ key: string; value: string; deleted: boolean }> {
    const fd = fs.openSync(this.filePath, 'r');
    const dataBuf = Buffer.alloc(this.indexBlockOffset);
    fs.readSync(fd, dataBuf, 0, this.indexBlockOffset, 0);
    fs.closeSync(fd);

    let pos = 0;
    while (pos < dataBuf.length) {
      const decoded = decodeRecord(dataBuf, pos);
      if (!decoded) break;

      yield {
        key: decoded.key,
        value: decoded.value,
        deleted: decoded.type === RECORD_TYPE_DELETE,
      };

      pos = decoded.nextOffset;
    }
  }

  /**
   * Get bloom filter probe positions for a key (for visualization).
   */
  bloomProbe(key: string): number[] | null {
    if (!this.bloom) return null;
    return this.bloom.probePositions(key);
  }

  /**
   * Get the raw bloom filter bit array (for visualization).
   */
  bloomBitArray(): number[] | null {
    if (!this.bloom) return null;
    return this.bloom.bitArray();
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

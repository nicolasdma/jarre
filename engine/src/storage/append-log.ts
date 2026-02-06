import * as path from 'node:path';
import type { StorageBackend, BackendState } from './interface.js';
import { appendToFile, readFileBuffer, fileSize, ensureDir, deleteFile } from '../utils/file-io.js';

/**
 * Append-Only Log Storage Backend (DDIA Ch3, Section: "Hash Indexes" intro)
 *
 * The simplest possible storage engine:
 * - SET: append a record to the end of the file → O(1) write
 * - GET: scan the ENTIRE file from end to start → O(n) read
 * - DEL: append a tombstone record → O(1) write
 *
 * Record binary format:
 * ┌──────────┬──────────┬──────────────┬──────────┬───────────────┐
 * │ type (1B)│ keyLen(4)│ key (keyLen) │ valLen(4)│ value(valLen) │
 * └──────────┴──────────┴──────────────┴──────────┴───────────────┘
 *
 * type: 0x01 = SET, 0x02 = DELETE (tombstone)
 * For DELETE records, valLen = 0 and value is empty.
 *
 * Why this is terrible for reads:
 * To find a key, we must scan from the END of the file backwards,
 * reading every record until we find the key or reach the beginning.
 * This is O(n) where n = total records ever written.
 *
 * Why this matters (DDIA):
 * This motivates the need for indexes — hash index, LSM-tree, B-tree —
 * which trade write performance for dramatically better read performance.
 */

const RECORD_TYPE_SET = 0x01;
const RECORD_TYPE_DELETE = 0x02;

/** Raw decoded fields from the binary format */
interface DecodedRecord {
  type: number;
  key: string;
  value: string;
}

/** Enriched record with position metadata */
interface LogRecord extends DecodedRecord {
  /** Byte offset where this record starts in the file */
  offset: number;
  /** Total size of this record in bytes */
  size: number;
}

export class AppendLog implements StorageBackend {
  readonly name = 'append-log';
  private readonly filePath: string;

  constructor(dataDir: string) {
    ensureDir(dataDir);
    this.filePath = path.join(dataDir, 'engine.log');
  }

  async set(key: string, value: string): Promise<void> {
    const record = encodeRecord(RECORD_TYPE_SET, key, value);
    appendToFile(this.filePath, record);
  }

  async get(key: string): Promise<string | null> {
    const records = this.readAllRecords();

    // Scan from end to find the most recent record for this key
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].key === key) {
        if (records[i].type === RECORD_TYPE_DELETE) return null;
        return records[i].value;
      }
    }

    return null;
  }

  async delete(key: string): Promise<boolean> {
    // Check if key exists before writing tombstone
    const existing = await this.get(key);
    if (existing === null) return false;

    const record = encodeRecord(RECORD_TYPE_DELETE, key, '');
    appendToFile(this.filePath, record);
    return true;
  }

  async size(): Promise<number> {
    const records = this.readAllRecords();
    const liveKeys = new Set<string>();

    for (const record of records) {
      if (record.type === RECORD_TYPE_SET) {
        liveKeys.add(record.key);
      } else if (record.type === RECORD_TYPE_DELETE) {
        liveKeys.delete(record.key);
      }
    }

    return liveKeys.size;
  }

  async flush(): Promise<void> {
    // No-op: we write synchronously to the file on every SET/DEL
  }

  async close(): Promise<void> {
    // No resources to clean up
  }

  async inspect(): Promise<BackendState> {
    const records = this.readAllRecords();
    const liveKeys = new Set<string>();

    for (const record of records) {
      if (record.type === RECORD_TYPE_SET) {
        liveKeys.add(record.key);
      } else {
        liveKeys.delete(record.key);
      }
    }

    return {
      name: this.name,
      keyCount: liveKeys.size,
      details: {
        filePath: this.filePath,
        fileSizeBytes: fileSize(this.filePath),
        totalRecords: records.length,
        liveKeys: liveKeys.size,
        // Show the last N records with byte offsets for visualization
        recentRecords: records.slice(-30).map(r => ({
          type: r.type === RECORD_TYPE_SET ? 'SET' : 'DEL',
          key: r.key,
          value: r.type === RECORD_TYPE_SET ? r.value : null,
          offset: r.offset,
          size: r.size,
        })),
      },
    };
  }

  /** Clear all data (used for testing / backend switching) */
  async clear(): Promise<void> {
    deleteFile(this.filePath);
  }

  /** Read and decode all records from the log file */
  private readAllRecords(): LogRecord[] {
    const buffer = readFileBuffer(this.filePath);
    if (!buffer || buffer.length === 0) return [];

    const records: LogRecord[] = [];
    let offset = 0;

    while (offset < buffer.length) {
      const parsed = decodeRecord(buffer, offset);
      if (parsed === null) {
        console.error(`[append-log] Corrupted record at offset ${offset}, stopping`);
        break;
      }
      const size = parsed.nextOffset - offset;
      records.push({ ...parsed.record, offset, size });
      offset = parsed.nextOffset;
    }

    return records;
  }
}

// ── Binary encoding/decoding ──────────────────────────────────

/**
 * Encode a record into binary format:
 * [type:1][keyLen:4][key:keyLen][valLen:4][val:valLen]
 */
function encodeRecord(type: number, key: string, value: string): Buffer {
  const keyBuf = Buffer.from(key, 'utf8');
  const valBuf = Buffer.from(value, 'utf8');

  // 1 (type) + 4 (keyLen) + keyLen + 4 (valLen) + valLen
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

/**
 * Decode a single record from a buffer at the given offset.
 * Returns the record and the offset of the next record, or null if corrupted.
 */
function decodeRecord(
  buf: Buffer,
  offset: number,
): { record: DecodedRecord; nextOffset: number } | null {
  // Minimum record size: 1 + 4 + 0 + 4 + 0 = 9 bytes
  if (offset + 9 > buf.length) return null;

  const type = buf.readUInt8(offset); offset += 1;

  if (type !== RECORD_TYPE_SET && type !== RECORD_TYPE_DELETE) return null;

  const keyLen = buf.readUInt32BE(offset); offset += 4;
  if (offset + keyLen + 4 > buf.length) return null;

  const key = buf.subarray(offset, offset + keyLen).toString('utf8'); offset += keyLen;

  const valLen = buf.readUInt32BE(offset); offset += 4;
  if (offset + valLen > buf.length) return null;

  const value = buf.subarray(offset, offset + valLen).toString('utf8'); offset += valLen;

  return {
    record: { type, key, value },
    nextOffset: offset,
  };
}

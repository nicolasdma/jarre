import * as path from 'node:path';
import { appendToFile, readFileBuffer, fileSize, deleteFile } from '../utils/file-io.js';
import { crc32, verifyCrc32 } from '../utils/crc32.js';

/**
 * Write-Ahead Log (WAL) — DDIA Ch3 Crash Recovery
 *
 * The WAL is the safety net of any storage engine.
 * Rule: NEVER modify the main data structure until the change
 *       is safely written to the WAL with a valid checksum.
 *
 * If the process crashes:
 * - Mid-WAL-write → CRC32 mismatch → entry is discarded (incomplete)
 * - After WAL write, before main log → WAL replay recovers the data
 * - After both writes → WAL is redundant, will be cleared at checkpoint
 *
 * WAL Entry Format:
 * ┌─────────────┬──────────┬─────────────────────────────────────────────┐
 * │ payloadLen   │ crc32    │ payload                                     │
 * │ (4 bytes BE) │ (4 bytes)│ (payloadLen bytes)                          │
 * ├─────────────┼──────────┼──────────┬──────────┬────────┬────────┬─────┤
 * │             │          │ type(1B) │ keyLen(4)│key(var)│valLen(4)│val  │
 * └─────────────┴──────────┴──────────┴──────────┴────────┴────────┴─────┘
 *
 * payloadLen: size of the payload section (everything after crc32)
 * crc32:      checksum of the payload bytes — detects corruption
 * payload:    same binary format as the main log records
 *
 * Why CRC32 before the data?
 * On recovery, we read payloadLen → read crc32 → read payload → verify.
 * If any of these reads return garbage (crash), the CRC won't match.
 */

const RECORD_TYPE_SET = 0x01;
const RECORD_TYPE_DELETE = 0x02;

/** Header size: 4 (payloadLen) + 4 (crc32) = 8 bytes */
const WAL_HEADER_SIZE = 8;

interface WALEntry {
  type: 'SET' | 'DEL';
  key: string;
  value: string;
  /** Byte offset of this entry in the WAL file */
  offset: number;
  /** Total size of this entry in bytes (header + payload) */
  totalSize: number;
  /** Whether the CRC32 checksum is valid */
  checksumValid: boolean;
}

interface WALState {
  filePath: string;
  fileSizeBytes: number;
  entryCount: number;
  corruptedCount: number;
  entries: WALEntry[];
}

export class WriteAheadLog {
  private readonly filePath: string;

  constructor(dataDir: string, walFileName = 'engine.wal') {
    this.filePath = path.join(dataDir, walFileName);
  }

  /**
   * Append a SET entry to the WAL.
   * Must be called BEFORE writing to the main log.
   */
  appendSet(key: string, value: string): void {
    const payload = encodePayload(RECORD_TYPE_SET, key, value);
    this.writeEntry(payload);
  }

  /**
   * Append a DELETE entry to the WAL.
   * Must be called BEFORE writing to the main log.
   */
  appendDelete(key: string): void {
    const payload = encodePayload(RECORD_TYPE_DELETE, key, '');
    this.writeEntry(payload);
  }

  /**
   * Read and validate all WAL entries.
   * Returns valid entries (for replay) and reports corruption.
   *
   * This is the crash recovery mechanism:
   * - Valid entries → operations that need to be replayed
   * - Corrupted entries → incomplete writes from a crash, safely skipped
   */
  recover(): { entries: WALEntry[]; corruptedCount: number } {
    const buffer = readFileBuffer(this.filePath);
    if (!buffer || buffer.length === 0) {
      return { entries: [], corruptedCount: 0 };
    }

    const entries: WALEntry[] = [];
    let corruptedCount = 0;
    let offset = 0;

    while (offset < buffer.length) {
      // Need at least header bytes to continue
      if (offset + WAL_HEADER_SIZE > buffer.length) {
        corruptedCount++;
        console.error(`[wal] Truncated header at offset ${offset} (${buffer.length - offset} bytes remaining)`);
        break;
      }

      const payloadLen = buffer.readUInt32BE(offset);
      const storedCrc = buffer.readUInt32BE(offset + 4);

      // Sanity check: payload length shouldn't be absurdly large
      if (payloadLen > 10 * 1024 * 1024) {
        corruptedCount++;
        console.error(`[wal] Unreasonable payload length ${payloadLen} at offset ${offset}`);
        break;
      }

      // Check if we have enough bytes for the full entry
      if (offset + WAL_HEADER_SIZE + payloadLen > buffer.length) {
        corruptedCount++;
        console.error(`[wal] Truncated payload at offset ${offset} (need ${payloadLen}, have ${buffer.length - offset - WAL_HEADER_SIZE})`);
        break;
      }

      const payload = buffer.subarray(offset + WAL_HEADER_SIZE, offset + WAL_HEADER_SIZE + payloadLen);
      const totalSize = WAL_HEADER_SIZE + payloadLen;
      const checksumValid = verifyCrc32(payload, storedCrc);

      if (!checksumValid) {
        corruptedCount++;
        console.error(`[wal] CRC32 mismatch at offset ${offset} (stored: ${storedCrc.toString(16)}, computed: ${crc32(payload).toString(16)})`);
        // Don't break — try to continue reading (next entry might be valid)
        // But in practice, corruption usually means everything after is garbage
        break;
      }

      // Decode the payload
      const decoded = decodePayload(payload);
      if (!decoded) {
        corruptedCount++;
        console.error(`[wal] Malformed payload at offset ${offset}`);
        break;
      }

      entries.push({
        type: decoded.type === RECORD_TYPE_SET ? 'SET' : 'DEL',
        key: decoded.key,
        value: decoded.value,
        offset,
        totalSize,
        checksumValid,
      });

      offset += totalSize;
    }

    if (entries.length > 0 || corruptedCount > 0) {
      console.log(`[wal] Recovery: ${entries.length} valid entries, ${corruptedCount} corrupted`);
    }

    return { entries, corruptedCount };
  }

  /**
   * Checkpoint: clear the WAL file.
   * Called after all WAL entries have been safely applied to the main log.
   *
   * DDIA concept: checkpointing is the moment when the WAL is no longer
   * needed because all its data is safely in the main data structure.
   */
  checkpoint(): void {
    deleteFile(this.filePath);
    console.log('[wal] Checkpoint complete — WAL cleared');
  }

  /**
   * Get WAL state for visualization.
   */
  inspect(): WALState {
    const { entries, corruptedCount } = this.recover();
    return {
      filePath: this.filePath,
      fileSizeBytes: fileSize(this.filePath),
      entryCount: entries.length,
      corruptedCount,
      entries: entries.slice(0, 50),
    };
  }

  /**
   * Write a checksummed entry to the WAL file.
   */
  private writeEntry(payload: Buffer): void {
    const checksum = crc32(payload);

    // Header: [payloadLen:4][crc32:4]
    const header = Buffer.alloc(WAL_HEADER_SIZE);
    header.writeUInt32BE(payload.length, 0);
    header.writeUInt32BE(checksum, 4);

    // Write header + payload as a single buffer (atomic-ish write)
    const entry = Buffer.concat([header, payload]);
    appendToFile(this.filePath, entry);
  }
}

// ── Binary encoding (same format as main log records) ──────────

function encodePayload(type: number, key: string, value: string): Buffer {
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

interface DecodedPayload {
  type: number;
  key: string;
  value: string;
}

function decodePayload(buf: Buffer): DecodedPayload | null {
  if (buf.length < 9) return null;

  const type = buf.readUInt8(0);
  if (type !== RECORD_TYPE_SET && type !== RECORD_TYPE_DELETE) return null;

  let pos = 1;
  const keyLen = buf.readUInt32BE(pos); pos += 4;
  if (pos + keyLen + 4 > buf.length) return null;

  const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;

  const valLen = buf.readUInt32BE(pos); pos += 4;
  if (pos + valLen > buf.length) return null;

  const value = buf.subarray(pos, pos + valLen).toString('utf8');

  return { type, key, value };
}

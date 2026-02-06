/**
 * CRC32 — Cyclic Redundancy Check (32-bit)
 *
 * Implemented from scratch, zero dependencies.
 * Uses the standard CRC-32 polynomial (0xEDB88320, reflected).
 *
 * How it works:
 * 1. Precompute a 256-entry lookup table (one entry per byte value)
 * 2. For each byte in the input, XOR with current CRC and look up the table
 * 3. Final XOR with 0xFFFFFFFF
 *
 * This is the same algorithm used in gzip, PNG, Ethernet, etc.
 * It detects:
 * - All single-bit errors
 * - All double-bit errors
 * - Any odd number of bit errors
 * - Burst errors up to 32 bits
 *
 * Why we use it in the WAL:
 * If the process crashes mid-write, bytes on disk may be incomplete
 * or corrupted. CRC32 lets us detect this on recovery and skip
 * the corrupted entry rather than reading garbage data.
 */

// Standard CRC-32 polynomial (reversed/reflected form)
const POLYNOMIAL = 0xEDB88320;

// Precomputed lookup table — computed once at module load
const TABLE = new Uint32Array(256);

for (let i = 0; i < 256; i++) {
  let crc = i;
  for (let bit = 0; bit < 8; bit++) {
    if (crc & 1) {
      crc = (crc >>> 1) ^ POLYNOMIAL;
    } else {
      crc = crc >>> 1;
    }
  }
  TABLE[i] = crc;
}

/**
 * Compute CRC32 checksum of a buffer.
 * Returns a 32-bit unsigned integer.
 */
export function crc32(data: Buffer): number {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    crc = (crc >>> 8) ^ TABLE[(crc ^ byte) & 0xFF];
  }

  // Final XOR
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Verify that a buffer matches an expected CRC32 checksum.
 */
export function verifyCrc32(data: Buffer, expected: number): boolean {
  return crc32(data) === expected;
}

/**
 * Bloom Filter — Probabilistic Set Membership (DDIA Ch3)
 *
 * A Bloom filter answers: "Is this key POSSIBLY in this SSTable?"
 *
 * Two possible answers:
 * - "Definitely NOT here"  → skip this SSTable entirely (saves disk I/O)
 * - "MAYBE here"           → check the SSTable (might be a false positive)
 *
 * How it works:
 * ┌────────────────────────────────────────────────────────┐
 * │ Bit Array:  [0][0][1][0][1][0][0][1][0][0][1][0][0]   │
 * │                   ↑     ↑           ↑        ↑         │
 * │                   h₁    h₂          h₃       h₁        │
 * │                                                         │
 * │ add("cat"):  h₁("cat")=2, h₂("cat")=4, h₃("cat")=7  │
 * │              → set bits 2, 4, 7                        │
 * │                                                         │
 * │ mightContain("cat"): bits 2,4,7 all set → "MAYBE"     │
 * │ mightContain("dog"): bit 5 not set      → "DEFINITELY NO" │
 * └────────────────────────────────────────────────────────┘
 *
 * Why "maybe" and not "yes"?
 * Different keys can hash to the same bit positions. If bits 2,4,7
 * are set by OTHER keys, we get a false positive for "cat".
 *
 * False positive rate depends on:
 * - m = number of bits (bigger → fewer collisions)
 * - n = number of items added
 * - k = number of hash functions
 *
 * Optimal k = (m/n) × ln(2) ≈ 0.693 × (m/n)
 * False positive rate ≈ (1 - e^(-kn/m))^k
 *
 * For this demo: m = 64 bits (tiny, visible false positives)
 * Production would use thousands of bits per key.
 *
 * Hash function: FNV-1a with different seeds.
 * FNV-1a is simple, fast, and has good distribution.
 */

const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;

export class BloomFilter {
  /** The bit array, stored as a Uint8Array (8 bits per byte) */
  private readonly bits: Uint8Array;
  /** Total number of bits in the filter */
  readonly numBits: number;
  /** Number of hash functions */
  readonly numHashes: number;
  /** Number of items added */
  private itemCount: number = 0;

  /**
   * Create a Bloom filter.
   * @param numBits Total bits in the filter. More bits → fewer false positives.
   * @param numHashes Number of hash functions. More hashes → fewer false positives (up to a point).
   */
  constructor(numBits = 64, numHashes = 3) {
    this.numBits = numBits;
    this.numHashes = numHashes;
    // Ceil division to get number of bytes needed
    this.bits = new Uint8Array(Math.ceil(numBits / 8));
  }

  /**
   * Add a key to the filter.
   * Sets k bit positions (one per hash function).
   */
  add(key: string): void {
    for (let i = 0; i < this.numHashes; i++) {
      const bitPos = this.hash(key, i);
      this.setBit(bitPos);
    }
    this.itemCount++;
  }

  /**
   * Check if a key MIGHT be in the set.
   *
   * Returns false → key is DEFINITELY NOT in the set (100% certain)
   * Returns true  → key MIGHT be in the set (could be false positive)
   */
  mightContain(key: string): boolean {
    for (let i = 0; i < this.numHashes; i++) {
      const bitPos = this.hash(key, i);
      if (!this.getBit(bitPos)) {
        return false; // Bit not set → definitely not here
      }
    }
    return true; // All bits set → maybe here
  }

  /** Number of items added to the filter */
  count(): number {
    return this.itemCount;
  }

  /**
   * Theoretical false positive rate based on current fill.
   * Formula: (1 - e^(-kn/m))^k
   * where k=numHashes, n=itemCount, m=numBits
   */
  falsePositiveRate(): number {
    if (this.itemCount === 0) return 0;
    const k = this.numHashes;
    const n = this.itemCount;
    const m = this.numBits;
    return Math.pow(1 - Math.exp((-k * n) / m), k);
  }

  /** Number of bits that are set to 1 */
  bitsSet(): number {
    let count = 0;
    for (let i = 0; i < this.numBits; i++) {
      if (this.getBit(i)) count++;
    }
    return count;
  }

  /**
   * Get the hash probe positions for a key (for visualization).
   * Returns the bit indices that this key maps to.
   */
  probePositions(key: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < this.numHashes; i++) {
      positions.push(this.hash(key, i));
    }
    return positions;
  }

  /**
   * Get the raw bit array as an array of 0s and 1s (for visualization).
   */
  bitArray(): number[] {
    const arr: number[] = [];
    for (let i = 0; i < this.numBits; i++) {
      arr.push(this.getBit(i) ? 1 : 0);
    }
    return arr;
  }

  // ── Serialization ─────────────────────────────────────────

  /**
   * Serialize to a Buffer for embedding in SSTable files.
   *
   * Format: [numBits:4][numHashes:1][itemCount:4][bits...]
   * Total: 9 + ceil(numBits/8) bytes
   */
  serialize(): Buffer {
    const bytesNeeded = Math.ceil(this.numBits / 8);
    const buf = Buffer.alloc(9 + bytesNeeded);
    buf.writeUInt32BE(this.numBits, 0);
    buf.writeUInt8(this.numHashes, 4);
    buf.writeUInt32BE(this.itemCount, 5);
    Buffer.from(this.bits.buffer, this.bits.byteOffset, bytesNeeded).copy(buf, 9);
    return buf;
  }

  /**
   * Deserialize from a Buffer.
   */
  static deserialize(buf: Buffer): BloomFilter {
    const numBits = buf.readUInt32BE(0);
    const numHashes = buf.readUInt8(4);
    const itemCount = buf.readUInt32BE(5);
    const filter = new BloomFilter(numBits, numHashes);
    filter.itemCount = itemCount;
    const bytesNeeded = Math.ceil(numBits / 8);
    buf.copy(Buffer.from(filter.bits.buffer, filter.bits.byteOffset, bytesNeeded), 0, 9, 9 + bytesNeeded);
    return filter;
  }

  // ── Internal ──────────────────────────────────────────────

  /**
   * Hash a key with a specific seed using FNV-1a.
   * Returns a bit position in range [0, numBits).
   *
   * FNV-1a: XOR the byte into the hash, then multiply by prime.
   * Different seeds give different hash functions.
   */
  private hash(key: string, seed: number): number {
    let hash = FNV_OFFSET_BASIS ^ seed;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
    // Force to unsigned 32-bit, then take modulo
    return (hash >>> 0) % this.numBits;
  }

  /** Set a bit at position `pos` */
  private setBit(pos: number): void {
    const byteIdx = pos >>> 3;       // pos / 8
    const bitIdx = pos & 7;           // pos % 8
    this.bits[byteIdx] |= (1 << bitIdx);
  }

  /** Get the bit at position `pos` */
  private getBit(pos: number): boolean {
    const byteIdx = pos >>> 3;
    const bitIdx = pos & 7;
    return (this.bits[byteIdx] & (1 << bitIdx)) !== 0;
  }
}

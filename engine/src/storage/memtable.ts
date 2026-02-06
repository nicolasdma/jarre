/**
 * Memtable — Sorted In-Memory Table (DDIA Ch3)
 *
 * The memtable is the "write buffer" of an LSM-Tree. All writes go here first.
 * Data is kept SORTED by key, which is critical: when we flush to disk,
 * we get a sorted file (SSTable) for free.
 *
 * Implementation: sorted array + binary search.
 * - set():    O(n) insert (shift elements), but memtables are small (KB-MB)
 * - get():    O(log n) binary search
 * - delete(): O(log n) find + mark as tombstone
 * - entries(): O(n) iteration in sorted order (for flushing)
 *
 * Why sorted? Because when the memtable fills up, we write it to disk as
 * an SSTable (Sorted String Table). A sorted file enables:
 * 1. Efficient merging (merge sort of multiple files)
 * 2. Range queries (scan from key A to key B)
 * 3. Sparse indexing (only index every Nth key)
 *
 * In production databases (LevelDB, RocksDB), the memtable uses a skip list
 * or red-black tree for O(log n) inserts. We use a sorted array for clarity.
 *
 * Tombstones: DEL doesn't remove the entry — it marks it as deleted.
 * This is necessary because older SSTables might have the key.
 * The tombstone propagates through compaction to eventually delete it.
 */

/** A single entry in the memtable */
export interface MemtableEntry {
  key: string;
  value: string;
  /** If true, this key has been deleted (tombstone) */
  deleted: boolean;
}

/** Default flush threshold: 10 entries (low for demo, production would be ~MB) */
export const DEFAULT_FLUSH_THRESHOLD = 10;

export class Memtable {
  private data: MemtableEntry[] = [];
  private bytes: number = 0;

  /**
   * Insert or update a key-value pair.
   * Maintains sorted order by key.
   */
  set(key: string, value: string): void {
    const idx = this.binarySearch(key);

    if (idx >= 0) {
      // Key exists — update in place
      const old = this.data[idx];
      this.bytes -= old.key.length + old.value.length;
      this.data[idx] = { key, value, deleted: false };
    } else {
      // Key doesn't exist — insert at correct position to maintain sort order
      const insertAt = -(idx + 1);
      this.data.splice(insertAt, 0, { key, value, deleted: false });
    }

    this.bytes += key.length + value.length;
  }

  /**
   * Look up a key.
   * Returns the entry if found (even if deleted — caller checks tombstone).
   * Returns undefined if key was never written to this memtable.
   */
  get(key: string): MemtableEntry | undefined {
    const idx = this.binarySearch(key);
    if (idx < 0) return undefined;
    return this.data[idx];
  }

  /**
   * Mark a key as deleted (tombstone).
   * We don't remove it — we mark it, because older SSTables might have the key.
   */
  delete(key: string): boolean {
    const idx = this.binarySearch(key);

    if (idx >= 0 && !this.data[idx].deleted) {
      this.bytes -= this.data[idx].value.length;
      this.data[idx] = { key, value: '', deleted: true };
      return true;
    }

    if (idx < 0) {
      // Key not in memtable, but might be in SSTables — insert tombstone
      const insertAt = -(idx + 1);
      this.data.splice(insertAt, 0, { key, value: '', deleted: true });
      this.bytes += key.length;
      return true;
    }

    return false;
  }

  /** Number of entries (including tombstones) */
  size(): number {
    return this.data.length;
  }

  /** Approximate memory usage in bytes */
  sizeBytes(): number {
    return this.bytes;
  }

  /** Number of live (non-deleted) entries */
  liveCount(): number {
    return this.data.filter(e => !e.deleted).length;
  }

  /**
   * Iterate all entries in sorted order.
   * Used when flushing to SSTable.
   */
  entries(): MemtableEntry[] {
    return [...this.data];
  }

  /** Clear all entries (after flush) */
  clear(): void {
    this.data = [];
    this.bytes = 0;
  }

  /**
   * Binary search for a key.
   * Returns index if found (>= 0).
   * Returns -(insertionPoint + 1) if not found (< 0).
   * This is the same convention as Java's Arrays.binarySearch.
   */
  private binarySearch(key: string): number {
    let lo = 0;
    let hi = this.data.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const cmp = this.data[mid].key.localeCompare(key);

      if (cmp < 0) {
        lo = mid + 1;
      } else if (cmp > 0) {
        hi = mid - 1;
      } else {
        return mid; // Found
      }
    }

    return -(lo + 1); // Not found, insertion point = lo
  }
}

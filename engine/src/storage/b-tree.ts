import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StorageBackend, BackendState } from './interface.js';
import { WriteAheadLog } from './wal.js';
import { ensureDir, fileSize, deleteFile } from '../utils/file-io.js';

/**
 * B-Tree Storage Backend (DDIA Ch3 — The "other" paradigm)
 *
 * How it works — pages on disk:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ Page 0: METADATA                                        │
 * │ [magic:4 "BTRE"][rootPageId:4][totalPages:4]            │
 * │ [height:4][keyCount:4][splitCount:4]                    │
 * ├─────────────────────────────────────────────────────────┤
 * │ Page 1: ROOT (internal or leaf)                          │
 * │ [nodeType:1][numKeys:2][cells...]                       │
 * ├─────────────────────────────────────────────────────────┤
 * │ Page 2+: More nodes (internal or leaf)                   │
 * │ Each page = exactly 4096 bytes (like PostgreSQL)        │
 * └─────────────────────────────────────────────────────────┘
 *
 * Key difference from LSM-Tree: IN-PLACE UPDATES.
 * - LSM-Tree: append new data, never modify existing files
 * - B-Tree:   overwrite the specific page where the data lives
 *
 * Write path:
 * 1. WAL.append(key, value)        ← crash safety
 * 2. Find the correct leaf page    ← tree traversal, O(log n)
 * 3. Insert key into leaf          ← IN-PLACE page rewrite
 * 4. If leaf overflows → split     ← create new page, push median up
 *
 * Read path:
 * 1. Start at root page
 * 2. Binary search keys in node    ← find which child to follow
 * 3. Follow child pointer to next page
 * 4. Repeat until leaf             ← always O(log n) reads
 *
 * Trade-offs (DDIA):
 * ✅ Predictable read performance — always O(log n), no compaction needed
 * ✅ Good for read-heavy workloads
 * ✅ Natural ordering — range queries are efficient
 * ❌ Write amplification — must rewrite entire 4KB page for any change
 * ❌ Splits are expensive — may cascade up the tree
 * ❌ Random I/O — seeks to different pages (vs sequential in LSM)
 *
 * MAX_KEYS = 4: deliberately tiny so splits happen visibly after 5 inserts.
 * Real databases use hundreds of keys per page.
 */

/** Page size in bytes — matches PostgreSQL's default */
const PAGE_SIZE = 4096;

/**
 * Maximum keys per node. Tiny on purpose so splits happen
 * after just 5 inserts — making the mechanics visible.
 */
const MAX_KEYS = 4;

/** Node types stored in the first byte of each page */
const NODE_TYPE_LEAF = 1;
const NODE_TYPE_INTERNAL = 2;

/** Magic bytes for the metadata page: "BTRE" */
const MAGIC = Buffer.from('BTRE', 'ascii');

// ── Types ─────────────────────────────────────────────────────

interface LeafNode {
  type: 'leaf';
  pageId: number;
  keys: string[];
  values: string[];
}

interface InternalNode {
  type: 'internal';
  pageId: number;
  keys: string[];
  /** childIds.length === keys.length + 1 */
  childIds: number[];
}

type BTreeNode = LeafNode | InternalNode;

interface BTreeMeta {
  rootPageId: number;
  totalPages: number;
  height: number;
  keyCount: number;
  splitCount: number;
}

/** Inspect result for a single node (visualization) */
interface NodeInfo {
  pageId: number;
  type: 'leaf' | 'internal';
  keys: string[];
  values?: string[];
  childIds?: number[];
  level: number;
}

// ── B-Tree Implementation ─────────────────────────────────────

export class BTree implements StorageBackend {
  readonly name = 'b-tree';
  private readonly dataDir: string;
  private readonly filePath: string;
  private readonly wal: WriteAheadLog;
  private fd: number = -1;
  private meta: BTreeMeta;
  private lastWalRecoveryCount: number = 0;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    ensureDir(dataDir);
    this.filePath = path.join(dataDir, 'btree.pages');
    this.wal = new WriteAheadLog(dataDir, 'b-tree.wal');

    // Initialize metadata
    this.meta = {
      rootPageId: 1,
      totalPages: 2, // page 0 = meta, page 1 = empty root leaf
      height: 1,
      keyCount: 0,
      splitCount: 0,
    };

    this.recover();
  }

  // ── Write path ───────────────────────────────────────────

  async set(key: string, value: string): Promise<void> {
    // Step 1: WAL first (crash safety)
    this.wal.appendSet(key, value);

    // Step 2: Find leaf and insert
    this.insertIntoTree(key, value);
  }

  async delete(key: string): Promise<boolean> {
    this.wal.appendDelete(key);

    const leaf = this.findLeaf(key);
    const idx = leaf.keys.indexOf(key);
    if (idx === -1) return false;

    leaf.keys.splice(idx, 1);
    leaf.values.splice(idx, 1);
    this.writePageToDisk(leaf.pageId, this.serializeNode(leaf));
    this.meta.keyCount--;
    this.writeMetaToDisk();
    return true;
  }

  // ── Read path ────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    const leaf = this.findLeaf(key);
    const idx = leaf.keys.indexOf(key);
    if (idx === -1) return null;
    return leaf.values[idx];
  }

  // ── Tree operations ──────────────────────────────────────

  /**
   * Find the leaf node where `key` belongs.
   * Traverses from root to leaf following child pointers.
   */
  private findLeaf(key: string): LeafNode {
    let node = this.readNode(this.meta.rootPageId);

    while (node.type === 'internal') {
      // Binary search: find which child to follow
      const childIdx = this.findChildIndex(node, key);
      node = this.readNode(node.childIds[childIdx]);
    }

    return node;
  }

  /**
   * Find which child pointer to follow in an internal node.
   * Returns the index into childIds.
   */
  private findChildIndex(node: InternalNode, key: string): number {
    for (let i = 0; i < node.keys.length; i++) {
      if (key < node.keys[i]) return i;
    }
    return node.keys.length;
  }

  /**
   * Insert a key-value pair into the tree.
   * If the leaf overflows, split it and push the median key up.
   */
  private insertIntoTree(key: string, value: string): void {
    // Collect the path from root to leaf for potential splits
    const path: BTreeNode[] = [];
    let node = this.readNode(this.meta.rootPageId);
    path.push(node);

    while (node.type === 'internal') {
      const childIdx = this.findChildIndex(node, key);
      node = this.readNode(node.childIds[childIdx]);
      path.push(node);
    }

    // `node` is now the target leaf
    const leaf = node as LeafNode;

    // Check if key already exists (update in place)
    const existingIdx = leaf.keys.indexOf(key);
    if (existingIdx !== -1) {
      leaf.values[existingIdx] = value;
      this.writePageToDisk(leaf.pageId, this.serializeNode(leaf));
      return;
    }

    // Insert key in sorted position
    const insertIdx = leaf.keys.findIndex(k => key < k);
    if (insertIdx === -1) {
      leaf.keys.push(key);
      leaf.values.push(value);
    } else {
      leaf.keys.splice(insertIdx, 0, key);
      leaf.values.splice(insertIdx, 0, value);
    }
    this.meta.keyCount++;

    // Check overflow
    if (leaf.keys.length <= MAX_KEYS) {
      // No overflow — just write the page
      this.writePageToDisk(leaf.pageId, this.serializeNode(leaf));
      this.writeMetaToDisk();
      return;
    }

    // Overflow — split the leaf and propagate up
    this.splitAndPropagate(path);
    this.writeMetaToDisk();
  }

  /**
   * Split the overflowing node at the bottom of `path` and
   * propagate median keys upward. If root splits, create a new root.
   */
  private splitAndPropagate(nodePath: BTreeNode[]): void {
    let current = nodePath.pop()!;

    while (current.keys.length > MAX_KEYS) {
      this.meta.splitCount++;

      if (current.type === 'leaf') {
        const { left, right, medianKey } = this.splitLeaf(current);

        // Write both halves
        this.writePageToDisk(left.pageId, this.serializeNode(left));
        this.writePageToDisk(right.pageId, this.serializeNode(right));

        // Push median up to parent
        const parent = nodePath.pop();
        if (!parent) {
          // Root was a leaf and split — create new root
          this.createNewRoot(medianKey, left.pageId, right.pageId);
          return;
        }

        // Insert median into parent (internal node)
        this.insertIntoInternal(parent as InternalNode, medianKey, right.pageId);
        current = parent;
      } else {
        const { left, right, medianKey } = this.splitInternal(current);

        this.writePageToDisk(left.pageId, this.serializeNode(left));
        this.writePageToDisk(right.pageId, this.serializeNode(right));

        const parent = nodePath.pop();
        if (!parent) {
          // Root internal node split — create new root
          this.createNewRoot(medianKey, left.pageId, right.pageId);
          return;
        }

        this.insertIntoInternal(parent as InternalNode, medianKey, right.pageId);
        current = parent;
      }
    }

    // Current node fits — write it
    this.writePageToDisk(current.pageId, this.serializeNode(current));
  }

  /**
   * Split a leaf node into two halves.
   * Left keeps the original pageId, right gets a new page.
   */
  private splitLeaf(leaf: LeafNode): {
    left: LeafNode;
    right: LeafNode;
    medianKey: string;
  } {
    const mid = Math.ceil(leaf.keys.length / 2);
    const medianKey = leaf.keys[mid]; // First key of the right half

    const left: LeafNode = {
      type: 'leaf',
      pageId: leaf.pageId,
      keys: leaf.keys.slice(0, mid),
      values: leaf.values.slice(0, mid),
    };

    const right: LeafNode = {
      type: 'leaf',
      pageId: this.allocatePage(),
      keys: leaf.keys.slice(mid),
      values: leaf.values.slice(mid),
    };

    return { left, right, medianKey };
  }

  /**
   * Split an internal node into two halves.
   * The median key is pushed UP (not kept in either half).
   */
  private splitInternal(node: InternalNode): {
    left: InternalNode;
    right: InternalNode;
    medianKey: string;
  } {
    const mid = Math.floor(node.keys.length / 2);
    const medianKey = node.keys[mid];

    const left: InternalNode = {
      type: 'internal',
      pageId: node.pageId,
      keys: node.keys.slice(0, mid),
      childIds: node.childIds.slice(0, mid + 1),
    };

    const right: InternalNode = {
      type: 'internal',
      pageId: this.allocatePage(),
      keys: node.keys.slice(mid + 1),
      childIds: node.childIds.slice(mid + 1),
    };

    return { left, right, medianKey };
  }

  /**
   * Create a new root node with one key and two children.
   * This increases the tree height by 1.
   */
  private createNewRoot(key: string, leftChildId: number, rightChildId: number): void {
    const newRootPageId = this.allocatePage();
    const newRoot: InternalNode = {
      type: 'internal',
      pageId: newRootPageId,
      keys: [key],
      childIds: [leftChildId, rightChildId],
    };
    this.writePageToDisk(newRoot.pageId, this.serializeNode(newRoot));
    this.meta.rootPageId = newRootPageId;
    this.meta.height++;
  }

  /**
   * Insert a key + right child pointer into an internal node.
   * The key goes in sorted position; the right child goes after it.
   */
  private insertIntoInternal(node: InternalNode, key: string, rightChildId: number): void {
    const insertIdx = node.keys.findIndex(k => key < k);
    if (insertIdx === -1) {
      node.keys.push(key);
      node.childIds.push(rightChildId);
    } else {
      node.keys.splice(insertIdx, 0, key);
      node.childIds.splice(insertIdx + 1, 0, rightChildId);
    }
  }

  /** Allocate a new page and return its ID */
  private allocatePage(): number {
    const pageId = this.meta.totalPages;
    this.meta.totalPages++;
    return pageId;
  }

  // ── Page I/O ─────────────────────────────────────────────

  /** Ensure the file descriptor is open */
  private ensureFd(): void {
    if (this.fd >= 0) return;

    if (!fs.existsSync(this.filePath)) {
      // Create file with metadata page + empty root leaf
      const buf = Buffer.alloc(PAGE_SIZE * 2);
      this.serializeMeta(buf, 0);
      this.serializeEmptyLeaf(buf, PAGE_SIZE, 1);
      fs.writeFileSync(this.filePath, buf);
    }

    this.fd = fs.openSync(this.filePath, 'r+');
  }

  /** Read a page from disk and deserialize it into a node */
  private readNode(pageId: number): BTreeNode {
    this.ensureFd();
    const buf = Buffer.alloc(PAGE_SIZE);
    fs.readSync(this.fd, buf, 0, PAGE_SIZE, pageId * PAGE_SIZE);
    return this.deserializeNode(buf, pageId);
  }

  /** Write a serialized page buffer to disk at the correct offset */
  private writePageToDisk(pageId: number, buf: Buffer): void {
    this.ensureFd();
    // Ensure file is large enough
    const targetOffset = pageId * PAGE_SIZE;
    const currentSize = fs.fstatSync(this.fd).size;
    if (targetOffset >= currentSize) {
      // Extend file with zeroed pages
      const extension = Buffer.alloc(targetOffset + PAGE_SIZE - currentSize);
      fs.writeSync(this.fd, extension, 0, extension.length, currentSize);
    }
    fs.writeSync(this.fd, buf, 0, PAGE_SIZE, targetOffset);
  }

  /** Write metadata to page 0 */
  private writeMetaToDisk(): void {
    this.ensureFd();
    const buf = Buffer.alloc(PAGE_SIZE);
    this.serializeMeta(buf, 0);
    fs.writeSync(this.fd, buf, 0, PAGE_SIZE, 0);
  }

  // ── Serialization ────────────────────────────────────────

  /**
   * Serialize metadata into a buffer at the given offset.
   *
   * Format: [magic:4][rootPageId:4][totalPages:4][height:4][keyCount:4][splitCount:4]
   */
  private serializeMeta(buf: Buffer, offset: number): void {
    MAGIC.copy(buf, offset);
    buf.writeUInt32BE(this.meta.rootPageId, offset + 4);
    buf.writeUInt32BE(this.meta.totalPages, offset + 8);
    buf.writeUInt32BE(this.meta.height, offset + 12);
    buf.writeUInt32BE(this.meta.keyCount, offset + 16);
    buf.writeUInt32BE(this.meta.splitCount, offset + 20);
  }

  /**
   * Deserialize metadata from page 0.
   */
  private deserializeMeta(buf: Buffer): BTreeMeta | null {
    if (buf.length < 24) return null;
    const magic = buf.subarray(0, 4);
    if (!magic.equals(MAGIC)) return null;

    return {
      rootPageId: buf.readUInt32BE(4),
      totalPages: buf.readUInt32BE(8),
      height: buf.readUInt32BE(12),
      keyCount: buf.readUInt32BE(16),
      splitCount: buf.readUInt32BE(20),
    };
  }

  /** Write an empty leaf node at a specific offset in a buffer */
  private serializeEmptyLeaf(buf: Buffer, offset: number, pageId: number): void {
    buf.writeUInt8(NODE_TYPE_LEAF, offset);      // nodeType
    buf.writeUInt16BE(0, offset + 1);            // numKeys = 0
    // Rest is zero-filled (no cells)
    void pageId; // pageId is implicit from position
  }

  /**
   * Serialize a node to a PAGE_SIZE buffer.
   *
   * Leaf:     [nodeType:1=1][numKeys:2][ [keyLen:2][key][valLen:2][val] ...]
   * Internal: [nodeType:1=2][numKeys:2][ [childId:4][keyLen:2][key] ... [lastChildId:4] ]
   */
  serializeNode(node: BTreeNode): Buffer {
    const buf = Buffer.alloc(PAGE_SIZE);
    let pos = 0;

    if (node.type === 'leaf') {
      buf.writeUInt8(NODE_TYPE_LEAF, pos); pos += 1;
      buf.writeUInt16BE(node.keys.length, pos); pos += 2;

      for (let i = 0; i < node.keys.length; i++) {
        const keyBuf = Buffer.from(node.keys[i], 'utf8');
        const valBuf = Buffer.from(node.values[i], 'utf8');
        buf.writeUInt16BE(keyBuf.length, pos); pos += 2;
        keyBuf.copy(buf, pos); pos += keyBuf.length;
        buf.writeUInt16BE(valBuf.length, pos); pos += 2;
        valBuf.copy(buf, pos); pos += valBuf.length;
      }
    } else {
      buf.writeUInt8(NODE_TYPE_INTERNAL, pos); pos += 1;
      buf.writeUInt16BE(node.keys.length, pos); pos += 2;

      // Format: [child0:4][keyLen:2][key][child1:4][keyLen:2][key]...[lastChild:4]
      for (let i = 0; i < node.keys.length; i++) {
        buf.writeUInt32BE(node.childIds[i], pos); pos += 4;
        const keyBuf = Buffer.from(node.keys[i], 'utf8');
        buf.writeUInt16BE(keyBuf.length, pos); pos += 2;
        keyBuf.copy(buf, pos); pos += keyBuf.length;
      }
      // Last child pointer
      buf.writeUInt32BE(node.childIds[node.keys.length], pos);
    }

    return buf;
  }

  /**
   * Deserialize a page buffer into a node.
   */
  deserializeNode(buf: Buffer, pageId: number): BTreeNode {
    const nodeType = buf.readUInt8(0);
    const numKeys = buf.readUInt16BE(1);
    let pos = 3;

    if (nodeType === NODE_TYPE_LEAF) {
      const keys: string[] = [];
      const values: string[] = [];

      for (let i = 0; i < numKeys; i++) {
        const keyLen = buf.readUInt16BE(pos); pos += 2;
        const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;
        const valLen = buf.readUInt16BE(pos); pos += 2;
        const value = buf.subarray(pos, pos + valLen).toString('utf8'); pos += valLen;
        keys.push(key);
        values.push(value);
      }

      return { type: 'leaf', pageId, keys, values };
    }

    // Internal node
    const keys: string[] = [];
    const childIds: number[] = [];

    for (let i = 0; i < numKeys; i++) {
      childIds.push(buf.readUInt32BE(pos)); pos += 4;
      const keyLen = buf.readUInt16BE(pos); pos += 2;
      const key = buf.subarray(pos, pos + keyLen).toString('utf8'); pos += keyLen;
      keys.push(key);
    }
    // Last child pointer
    childIds.push(buf.readUInt32BE(pos));

    return { type: 'internal', pageId, keys, childIds };
  }

  // ── Interface methods ────────────────────────────────────

  async size(): Promise<number> {
    return this.meta.keyCount;
  }

  async flush(): Promise<void> {
    if (this.fd >= 0) {
      fs.fsyncSync(this.fd);
    }
  }

  async close(): Promise<void> {
    this.wal.checkpoint();
    if (this.fd >= 0) {
      fs.closeSync(this.fd);
      this.fd = -1;
    }
  }

  async clear(): Promise<void> {
    if (this.fd >= 0) {
      fs.closeSync(this.fd);
      this.fd = -1;
    }
    deleteFile(this.filePath);
    this.wal.checkpoint();
    this.meta = {
      rootPageId: 1,
      totalPages: 2,
      height: 1,
      keyCount: 0,
      splitCount: 0,
    };
  }

  walCheckpoint(): void {
    this.wal.checkpoint();
  }

  // ── Inspect (for visualization) ──────────────────────────

  async inspect(): Promise<BackendState> {
    const nodes = this.collectNodes();

    return {
      name: this.name,
      keyCount: this.meta.keyCount,
      details: {
        filePath: this.filePath,
        fileSizeBytes: fileSize(this.filePath),
        rootPageId: this.meta.rootPageId,
        totalPages: this.meta.totalPages,
        height: this.meta.height,
        splitCount: this.meta.splitCount,
        maxKeysPerNode: MAX_KEYS,
        pageSize: PAGE_SIZE,
        nodes,
        wal: this.wal.inspect(),
        lastWalRecoveryCount: this.lastWalRecoveryCount,
      },
    };
  }

  /** BFS collect all nodes for tree visualization */
  private collectNodes(): NodeInfo[] {
    if (this.meta.keyCount === 0 && this.meta.height === 1) {
      // Empty tree — still show root leaf
      const root = this.readNode(this.meta.rootPageId);
      return [{
        pageId: root.pageId,
        type: root.type,
        keys: root.keys,
        values: root.type === 'leaf' ? (root as LeafNode).values : undefined,
        childIds: root.type === 'internal' ? (root as InternalNode).childIds : undefined,
        level: 0,
      }];
    }

    const result: NodeInfo[] = [];
    const queue: Array<{ pageId: number; level: number }> = [
      { pageId: this.meta.rootPageId, level: 0 },
    ];

    while (queue.length > 0) {
      const { pageId, level } = queue.shift()!;
      const node = this.readNode(pageId);

      const info: NodeInfo = {
        pageId: node.pageId,
        type: node.type,
        keys: node.keys,
        level,
      };

      if (node.type === 'leaf') {
        info.values = node.values;
      } else {
        info.childIds = node.childIds;
        for (const childId of node.childIds) {
          queue.push({ pageId: childId, level: level + 1 });
        }
      }

      result.push(info);
    }

    return result;
  }

  // ── Recovery ─────────────────────────────────────────────

  private recover(): void {
    this.loadFromFile();

    const { entries, corruptedCount } = this.wal.recover();
    this.lastWalRecoveryCount = entries.length;

    if (entries.length > 0) {
      console.log(`[b-tree] Replaying ${entries.length} WAL entries...`);
      for (const entry of entries) {
        if (entry.type === 'SET') {
          this.insertIntoTree(entry.key, entry.value);
        } else if (entry.type === 'DEL') {
          const leaf = this.findLeaf(entry.key);
          const idx = leaf.keys.indexOf(entry.key);
          if (idx !== -1) {
            leaf.keys.splice(idx, 1);
            leaf.values.splice(idx, 1);
            this.writePageToDisk(leaf.pageId, this.serializeNode(leaf));
            this.meta.keyCount--;
          }
        }
      }
      this.writeMetaToDisk();
      console.log(`[b-tree] WAL replay complete.`);
    }

    if (corruptedCount > 0) {
      console.warn(`[b-tree] ${corruptedCount} corrupted WAL entries skipped.`);
    }

    if (entries.length > 0 || corruptedCount > 0) {
      this.wal.checkpoint();
    }

    console.log(
      `[b-tree] Ready: ${this.meta.keyCount} keys, height ${this.meta.height}, ` +
      `${this.meta.totalPages} pages, ${this.meta.splitCount} splits.`
    );
  }

  /** Load metadata from the page file if it exists */
  private loadFromFile(): void {
    if (!fs.existsSync(this.filePath)) return;

    this.ensureFd();
    const buf = Buffer.alloc(PAGE_SIZE);
    fs.readSync(this.fd, buf, 0, PAGE_SIZE, 0);

    const meta = this.deserializeMeta(buf);
    if (meta) {
      this.meta = meta;
    }
  }
}

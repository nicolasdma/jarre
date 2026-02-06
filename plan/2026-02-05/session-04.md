# Session 04 — Memtable + SSTable + LSM-Tree

**Date:** 2026-02-05
**Goal:** Implement Session 4 of the storage engine plan

## What was done

### Engine
1. **Memtable** (`engine/src/storage/memtable.ts`)
   - Sorted array with binary search (Java-style -(insertionPoint+1))
   - Supports SET, GET, DEL with tombstones
   - `sizeBytes()` for memory tracking, `liveCount()` excludes tombstones
   - Flush threshold: 10 entries (low for demo visibility)

2. **SSTable** (`engine/src/storage/sstable.ts`)
   - Binary format: Data Block (sorted records) + Index Block (sparse, every 4th key) + Footer (12 bytes, magic 0x53535401)
   - `writeSSTable()`: takes sorted MemtableEntry[], writes immutable file
   - `SSTableReader`: loads sparse index on construction, binary search + disk seek for lookups
   - Reuses same binary record format as append-log

3. **LSM-Tree backend** (`engine/src/storage/lsm-tree.ts`)
   - Three layers: Memtable (RAM) + WAL (crash safety) + SSTables (disk)
   - Write: WAL → Memtable → flush to SSTable when threshold reached
   - Read: Memtable first → SSTables newest-to-oldest → first match wins
   - Crash recovery: load existing SSTables → replay WAL into memtable
   - Registered in server.ts as `lsm-tree`

4. **Per-backend WAL isolation** (bug fix)
   - WAL constructor now accepts filename parameter
   - hash-index uses `hash-index.wal`, lsm-tree uses `lsm-tree.wal`
   - Fixed: crash recovery was broken because hash-index consumed shared WAL on restart

### Web UI
5. **Layout change**: terminal 280px fixed, inspector flex-1 (larger)
6. **LSM-Tree visualization** in state-inspector:
   - Architecture diagram (3 layers: RAM memtable → flush → SSD SSTables)
   - Stats with memtable fill bar (color changes at 60%/90%)
   - Memtable entries table (sorted, shows tombstones)
   - SSTable list with metadata
7. **Lesson steps 8-10** added:
   - Step 8: LSM-Tree — lo mejor de ambos mundos
   - Step 9: Flush — de RAM a disco
   - Step 10: Lectura — memtable primero, SSTables despues

## Testing
- SET/GET basic operations: PASS
- Flush at threshold (10 entries): PASS
- Cross-layer reads (memtable + SSTable): PASS
- Overwrite test (memtable overrides SSTable): PASS
- Crash recovery with WAL replay: PASS (after per-backend WAL fix)

## Commits
- `104747e` [Engine] Add LSM-Tree with memtable, SSTables, and per-backend WAL isolation

## Next session
- Session 5: Bloom filters + compaction (size-tiered)

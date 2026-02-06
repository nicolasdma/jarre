# Session 05 — Bloom Filters + Compaction

**Date:** 2026-02-05
**Goal:** Session 5 of storage engine plan: Bloom filters, SSTable v2, compaction

## What was done

### Engine
1. **Bloom Filter** (`engine/src/storage/bloom-filter.ts`)
   - Bit array with FNV-1a hash functions (configurable seeds)
   - `add()`, `mightContain()`, `falsePositiveRate()`, `probePositions()`
   - Serializable to/from Buffer for SSTable embedding
   - 6 bits per item, 3 hash functions (low for demo — visible false positives)

2. **SSTable v2 format** (`engine/src/storage/sstable.ts`)
   - New layout: Data Block + Index Block + Bloom Filter Block + Footer (16 bytes)
   - Magic `0x53535402` (v2), backward-compatible with v1 `0x53535401`
   - Reader checks bloom filter before any disk I/O
   - Tracks bloomNegatives/bloomPositives per SSTable
   - Always includes last key in sparse index (bug fix for range check)
   - `entries()` generator for compaction merge

3. **Compaction** (`engine/src/storage/lsm-tree.ts`)
   - Auto-triggers when SSTable count >= 4 (COMPACTION_THRESHOLD)
   - K-way merge: collect entries from all SSTables, sort, deduplicate
   - Newest version wins for duplicate keys
   - Tombstones dropped during compaction
   - `DEBUG COMPACT` command for manual trigger
   - Tracks compactionCount, bloom stats

4. **`DEBUG COMPACT` command** (`engine/src/commands/debug-commands.ts`)
   - Manual compaction trigger for lsm-tree backend
   - Fixed `DEBUG WAL INJECT` to use per-backend WAL filename

### Web UI
5. **LSMStats** updated: shows compaction count, SSTable threshold, bloom filter stats
6. **SSTable list** updated: shows bloom filter info (bits, fill, FP rate, skips), compacted badge
7. **LSM-Tree diagram** updated: mentions bloom filters in read path, compaction hint
8. **Lesson steps 11-13** added:
   - Step 11: Bloom Filter — el atajo probabilistico
   - Step 12: Compaction — limpiando SSTables
   - Step 13: Amplificacion — el gran trade-off (write/read/space)

## Testing
- 40 keys → 4 flushes → auto-compaction: PASS
- Compaction: 4 SSTables (1243 B) → 1 SSTable (1084 B), saved 13%: PASS
- GET non-existent keys → nil (bloom filter skips): PASS
- GET existing keys after compaction: PASS
- GET last key in SSTable (range check fix): PASS
- Engine + Next.js compile clean: PASS

## Bug Fixes
- SSTable sparse index always includes last key now (was causing range check to miss last entries)
- `DEBUG WAL INJECT` uses per-backend WAL filename

## Commits
- `a5accee` [Engine] Add Bloom filters, SSTable v2 format, and size-tiered compaction

## Next session
- Session 6: B-Tree

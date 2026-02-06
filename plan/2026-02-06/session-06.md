# Session 6: B-Tree Storage Backend

**Date:** 2026-02-06
**Focus:** B-Tree — the "other" paradigm from DDIA Ch3

## Goals
- Implement B-Tree storage backend with binary page format
- Register in engine server
- Add visualization components (teal/blue theme)
- Add lessons 14-18 covering B-Tree concepts in Spanish

## What Was Done

### Phase 1: B-Tree Backend (`engine/src/storage/b-tree.ts`)
- Binary page format: PAGE_SIZE=4096, MAX_KEYS=4 (tiny for visibility)
- Page 0 = metadata (magic "BTRE", root, total pages, height, key count, splits)
- Leaf nodes: sorted key-value pairs in a page
- Internal nodes: keys + child pointers
- Core operations: get(), set(), delete() with in-place page updates
- Split mechanics: leaf split, internal split, new root creation
- WAL integration (reuses WriteAheadLog with 'b-tree.wal')
- BFS inspect() for tree visualization
- Recovery: load metadata from file → replay WAL

### Phase 2: Server Registration
- Added BTree import and `'b-tree'` entry in BACKEND_FACTORIES

### Phase 3: Visualization (`state-inspector.tsx`)
- BTreeDiagram: static "how it works" with page/split explanation
- BTreeStats: grid showing keys, height, pages, splits, file size, uptime
- BTreeViz: tree rendered level-by-level with node boxes
- BTreeNodeBox: individual node showing keys, values, child pointers, utilization bar
- Color scheme: teal/blue (#2d6a7a) — distinct from LSM purple

### Phase 4: Lessons (`lesson-guide.tsx`)
- Lesson 14: B-Tree pages on disk, contrast with LSM
- Lesson 15: Split mechanics — overflow at 5th key
- Lesson 16: Reading — always O(log n), predictable
- Lesson 17: Writing — write amplification, full page rewrites
- Lesson 18: B-Tree vs LSM-Tree — the central DDIA Ch3 trade-off

## Decisions
- MAX_KEYS=4: splits happen at 5 inserts, very visible for learning
- Simple delete: remove from leaf, no merge/rebalance (keeps scope focused)
- No sibling pointers: not needed for this educational scope
- Reuse existing WAL class with different filename

## Verification
- [x] Engine TypeScript compiles clean
- [x] Next.js build passes
- [ ] Manual test: SET/GET/DEL/DBSIZE with b-tree backend
- [ ] Manual test: 5+ inserts to trigger splits
- [ ] Manual test: restart engine for persistence
- [ ] Manual test: web UI tree visualization

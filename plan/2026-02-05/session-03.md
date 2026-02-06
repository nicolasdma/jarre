# Session 03 — Routing Integration + RAM/SSD Visualization

**Date:** 2026-02-05
**Duration:** Short session (continuation)

## Goals
1. Integrate storage engine playground into normal app flow (Library → /learn → playground)
2. Improve state inspector with concrete RAM vs SSD diagrams
3. Clean up routing so /resource/ is deprecated

## What Was Done

### Routing Integration
- Updated `resource-card.tsx`: `RESOURCES_WITH_LEARN_PAGES` now includes `ddia-ch3`
- Cards without learn pages route directly to `/evaluate/` instead of `/resource/`
- `/learn/[resourceId]/page.tsx`: Added `PLAYGROUND_ROUTES` map that redirects `ddia-ch3` → `/playground/storage-engine`
- Created learn page explanation components (ddia-ch1, ch2, ch3)

### RAM vs SSD Visualization
- Rewrote state inspector with split RAM / SSD diagrams
- Append-Log: RAM shows "No index — empty", SSD shows file with records
- Hash Index: RAM shows Map<key, byte offset>, SSD shows same file
- Clear visual distinction between what lives in memory vs on disk
- Color-coded badges: green for hash-index, amber for append-log

### Flow
```
Library card click → /learn/ddia-ch3 → redirect → /playground/storage-engine
Library card click → /learn/ddia-ch1 → explanation component
Library card click → (no learn page) → /evaluate/[id]
```

## Commits
- `28c69e3` — [Learn] Add /learn routing with playground redirect and RAM/SSD visualization

## Decisions
- Keep `/resource/[resourceId]` route alive but deprecate it (not linked from UI)
- Learn pages use redirect for playground-backed resources, render components for explanation-backed ones

## Next Session
- Session 3 of engine plan: WAL + Crash Recovery
- Or continue improving visualizations based on user feedback

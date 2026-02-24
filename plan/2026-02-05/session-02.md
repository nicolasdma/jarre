# Session 02 — 2026-02-05

## Goal
Implement Session 2 of the Storage Engine: Hash Index backend + Web UI playground

## What was done

### Hash Index Backend (`engine/src/storage/hash-index.ts`)
- In-memory `Map<key, IndexEntry>` pointing to byte offsets in the log file
- SET: append record to log + update hashmap → O(1) write
- GET: lookup offset in hashmap + single `fs.readSync` seek → O(1) read
- DEL: append tombstone + remove from hashmap → O(1)
- Crash recovery: rebuild index by scanning entire log on startup
- inspect() exposes index entries (key, offset, valueLength) for visualization
- Registered in server.ts as default backend

### API Routes Bridge (`src/app/api/playground/storage-engine/`)
- **command/route.ts**: POST — sends inline RESP command to engine via TCP, returns response
  - Complete RESP response detection (handles bulk strings, arrays, etc.)
  - 503 response if engine not running
- **state/route.ts**: GET — proxies engine debug server (port 6381) to browser
  - Timeout handling, error messages

### Web UI (`src/app/playground/storage-engine/`)
- **page.tsx**: Server component with minimal header (no auth required for playground)
- **engine-playground.tsx**: Client orchestrator — manages terminal state, polls engine state every 3s
- **command-terminal.tsx**: Full terminal experience:
  - Command input with history (up/down arrows)
  - RESP response formatting (bulk strings, arrays, errors, integers)
  - Color-coded output (green for OK, red for errors)
  - Auto-scroll, Ctrl+L to clear, focus management
  - Connection status indicator
  - Welcome message with suggested commands
- **state-inspector.tsx**: Right panel showing:
  - Backend name, key count, file size, uptime
  - **Append-log viz**: record list with SET/DEL coloring, wasted space %
  - **Hash-index viz**: index table with key/offset/size, disk vs index comparison
  - Offline state with "npm run engine" instruction

## Verification
- [x] Hash index: SET/GET/DEL all O(1) via netcat
- [x] Index rebuild on restart: data persists
- [x] Backend switching: DEBUG BACKEND append-log / hash-index works
- [x] Debug server returns correct hash-index state with index entries
- [x] Next.js build succeeds (playground/storage-engine is static page)
- [x] API routes registered correctly

## Next Session (Session 3)
- Write-Ahead Log (WAL) with CRC32 checksums
- Crash recovery via WAL replay
- DEBUG CRASH command
- WAL visualization in web UI

# Session 01 — 2026-02-05

## Goal
Implement Session 1 of the Mini Redis Storage Engine: RESP Protocol + Append-Only Log

## What was done

### Engine Foundation (`engine/`)
- Created standalone engine directory with its own `tsconfig.json`
- Added `engine` and `engine:dev` scripts to package.json
- Added `engine/data/` to `.gitignore`

### RESP Protocol (`engine/src/resp/`)
- **parser.ts**: Full RESP2 parser with incremental buffering. Handles:
  - Simple strings (+), errors (-), integers (:), bulk strings ($), arrays (*)
  - Inline commands (for redis-cli compatibility)
  - Incomplete data buffering (handles TCP fragmentation)
  - Quote-aware string splitting for inline commands
- **serializer.ts**: RESP response builder with convenience methods (ok, pong, error, bulkString, integer, array)
- **types.ts**: RESPValue union type, ParsedCommand interface

### Storage Backend (`engine/src/storage/`)
- **interface.ts**: `StorageBackend` interface — the contract all backends implement (set, get, delete, size, flush, close, inspect)
- **append-log.ts**: Append-Only Log backend:
  - Binary record format: `[type:1B][keyLen:4B][key][valLen:4B][value]`
  - SET appends to file → O(1) write
  - GET scans all records from end → O(n) read
  - DEL writes tombstone record
  - inspect() returns full state for visualization

### Command System (`engine/src/commands/`)
- **router.ts**: Command dispatch to appropriate handler module
- **string-commands.ts**: SET, GET, DEL, EXISTS
- **server-commands.ts**: PING, ECHO, DBSIZE, FLUSHDB, INFO, COMMAND (redis-cli handshake), QUIT
- **debug-commands.ts**: INSPECT (full state as JSON), DEBUG BACKEND (show/switch), DEBUG SLEEP

### Server (`engine/src/server.ts`)
- TCP server on port 6380 (RESP protocol, redis-cli compatible)
- Backend registry with hot-swap support
- Graceful shutdown on SIGINT/SIGTERM

### Debug Server (`engine/src/debug/`)
- HTTP server on port 6381 with CORS
- GET / → full engine snapshot as JSON
- GET /health → health check

## Verification
- [x] PING → +PONG
- [x] SET key value → +OK, GET key → value
- [x] DEL key → :1, GET key → $-1 (null)
- [x] DBSIZE returns correct count
- [x] Data persists across engine restart
- [x] Debug HTTP server returns valid JSON state
- [x] INFO, INSPECT, EXISTS, ECHO all work
- [x] Engine type-checks clean (tsc --noEmit)
- [x] Next.js build succeeds (no regressions)

## Architecture Decisions
1. **fileURLToPath instead of import.meta.dirname** — tsx transpiles ESM to CJS, so import.meta.dirname is undefined. Used fileURLToPath(import.meta.url) instead.
2. **Synchronous file I/O in append-log** — simplicity over performance for the learning engine. Async would add complexity without benefit at this scale.
3. **Binary record format** — not JSON. Key learning: working with Buffers and offsets, which is how real storage engines work.
4. **Zero dependencies** — only Node.js built-ins (net, fs, crypto, path, buffer, http, url).

## Next Session (Session 2)
- Hash Index backend: Map<key, {offset, size}> over the append log
- Web UI: `/playground/storage-engine` with terminal + state inspector
- API routes bridge (HTTP → TCP)
- Debug server already done (ahead of schedule)

# Voice + Pipeline Hardening Plan (3 Phases)

## Scope
- Voice session reliability (`/api/voice/session/start|transcript|end`)
- Pipeline write consistency (`resource_sections`, `resource_concepts`, `concepts`)
- Safe rollout with measurable SLOs and rollback gates

## Phase 1: SLOs + Baseline (Stabilize First)
### SLOs (initial targets)
- `voice_transcript_ingest_success_rate` >= 99.9% (5m and 1h windows)
- `voice_session_end_success_rate` >= 99.5%
- `voice_transcript_p95_latency` <= 900ms
- `pipeline_section_write_success_rate` >= 99.9%
- `pipeline_fk_violation_rate(resource_sections_concept_id_fkey)` = 0

### SLIs / Measurements
- Count every transcript batch request by status (`2xx/4xx/5xx`)
- Count transcript rows accepted vs dropped (idempotent dedupe is not failure)
- Count session starts that never receive a successful end within 15 min
- Count pipeline write failures by exact DB error code/constraint

### Immediate Controls
- Idempotent transcript writes using `(session_id, client_turn_id)`
- Client-side transcript queue with retry/backoff + batched flush
- Write-token auth on hot path (avoid heavy auth calls per chunk)
- Defensive concept existence check before inserting `resource_sections`

### Alerting
- Page on `voice_transcript_ingest_success_rate < 99.0%` for 10m
- Page on any sustained FK violations (`>= 3` in 10m)
- Ticket on p95 latency breach for 30m

## Phase 2: Target Architecture (Reliability by Design)
### Voice Ingestion Path
- Keep control plane split:
  - `/start`: authenticated, returns `sessionId + writeToken`
  - `/transcript`: low-overhead, idempotent, token-authorized
  - `/end`: token-first with auth fallback
- Persist transcript ingest as append-only events with idempotency key
- Keep summary generation out of request path (background only)

### Pipeline Write Path
- Single `ensureConcept` contract for all section writes:
  - resolve by concept id
  - fallback by slug
  - create if missing
  - re-read on unique race
- Always `upsert` resource↔concept link before section insert
- Prefer explicit error taxonomy (FK, unique, enum, timeout) in logs and job state

### Data Model Hardening
- Keep unique index on `(session_id, client_turn_id)` for dedupe
- Keep secondary ordering index `(session_id, client_seq)` for replay/debug
- Add runbook query snippets for:
  - orphan voice sessions
  - transcript gap detection
  - pipeline FK diagnostics

## Phase 3: Safe Rollout (Canary + Guardrails)
### Rollout Steps
1. Deploy DB migration first (idempotency columns/indexes)
2. Deploy server routes with compatibility fallback
3. Deploy client queue/batching changes
4. Enable canary traffic: 5% -> 25% -> 50% -> 100%

### Promotion Gates
- No FK violations for 24h
- Transcript ingest success >= 99.9% at each canary level
- No increase in stuck/orphan sessions
- No regression in median tutor response latency

### Rollback Criteria
- Any canary level with:
  - ingest success < 99.0% for 10m, or
  - repeated 401 bursts on transcript path, or
  - FK violations reappearing
- Roll back app first; keep migration (non-breaking additive schema)

### Operational Readiness
- One runbook owner for on-call
- Synthetic probe every 5 min:
  - start session -> send 3 transcript turns -> end session
- Weekly game day for reconnect/network-drop scenarios


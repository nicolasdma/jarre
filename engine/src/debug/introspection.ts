import type { StorageBackend, BackendState } from '../storage/interface.js';

/**
 * Build a complete debug snapshot of the engine state.
 * This is served as JSON on the debug port for the web UI.
 */
interface EngineSnapshot {
  timestamp: string;
  uptimeMs: number;
  backend: BackendState;
}

export async function buildSnapshot(
  backend: StorageBackend,
  startTimeMs: number,
): Promise<EngineSnapshot> {
  return {
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now() - startTimeMs,
    backend: await backend.inspect(),
  };
}

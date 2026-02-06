import type { ParsedCommand } from '../resp/types.js';
import type { CommandContext } from './router.js';
import * as resp from '../resp/serializer.js';

/**
 * Debug/introspection commands: INSPECT, DEBUG BACKEND
 * These provide internal state access for learning and visualization.
 */
export async function handleDebugCommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  switch (cmd.name) {
    case 'INSPECT':
      return handleInspect(ctx);
    case 'DEBUG':
      return handleDebug(cmd, ctx);
    default:
      return resp.error(`debug command '${cmd.name}' not implemented`);
  }
}

/** INSPECT — return full backend state as JSON bulk string */
async function handleInspect(ctx: CommandContext): Promise<string> {
  const state = await ctx.getBackend().inspect();
  return resp.bulkString(JSON.stringify(state, null, 2));
}

/**
 * DEBUG subcommand [args]
 * - DEBUG BACKEND [name]   — show or switch backend
 * - DEBUG SLEEP ms         — simulate slow operation
 */
async function handleDebug(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  const sub = cmd.args[0]?.toUpperCase();

  if (!sub) {
    return resp.error('DEBUG requires a subcommand: BACKEND, SLEEP, CRASH, WAL, COMPACT');
  }

  switch (sub) {
    case 'BACKEND': {
      if (cmd.args.length < 2) {
        // Show current backend
        return resp.bulkString(ctx.getBackend().name);
      }
      const newBackend = ctx.setBackend(cmd.args[1]);
      if (!newBackend) {
        return resp.error(`unknown backend '${cmd.args[1]}'`);
      }
      return resp.ok();
    }

    case 'SLEEP': {
      const ms = parseInt(cmd.args[1] ?? '1000', 10);
      await new Promise(resolve => setTimeout(resolve, ms));
      return resp.ok();
    }

    case 'CRASH': {
      // Simulate a crash: kill the process WITHOUT flushing or checkpointing.
      // This leaves the WAL with un-checkpointed entries.
      // On restart, the engine will replay the WAL to recover.
      console.log('[crash] !!! SIMULATED CRASH — process.exit(1) !!!');
      // Use setTimeout so the response is sent before dying
      setTimeout(() => process.exit(1), 50);
      return resp.bulkString('CRASHING NOW — restart engine to see WAL recovery');
    }

    case 'WAL': {
      return handleWalSubcommand(cmd, ctx);
    }

    case 'COMPACT': {
      const backend = ctx.getBackend();
      if (backend.name !== 'lsm-tree') {
        return resp.error('COMPACT is only available for the lsm-tree backend');
      }
      // Access the compact method via the backend
      const lsm = backend as unknown as { compact: () => Promise<void> };
      await lsm.compact();
      return resp.ok();
    }

    default:
      return resp.error(`unknown DEBUG subcommand '${sub}'`);
  }
}

/**
 * DEBUG WAL [subcommand]
 * - DEBUG WAL          — show WAL status
 * - DEBUG WAL STATUS   — same as above
 * - DEBUG WAL INJECT key value — write ONLY to WAL (not to main log)
 *   This simulates the crash scenario: data is in WAL but not in main log.
 *   On next restart, the engine will replay this entry from the WAL.
 */
async function handleWalSubcommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  const walSub = cmd.args[1]?.toUpperCase() ?? 'STATUS';

  switch (walSub) {
    case 'STATUS': {
      const state = await ctx.getBackend().inspect();
      const wal = (state.details as Record<string, unknown>).wal;
      if (!wal) {
        return resp.error('current backend does not use a WAL');
      }
      return resp.bulkString(JSON.stringify(wal, null, 2));
    }

    case 'CHECKPOINT': {
      const backend = ctx.getBackend();
      if (!backend.walCheckpoint) {
        return resp.error('current backend does not use a WAL');
      }
      backend.walCheckpoint();
      return resp.ok();
    }

    case 'INJECT': {
      // Write to WAL ONLY — simulates a crash between WAL write and main log write
      const key = cmd.args[2];
      const value = cmd.args[3] ?? '';
      if (!key) {
        return resp.error('usage: DEBUG WAL INJECT <key> <value>');
      }

      const { WriteAheadLog } = await import('../storage/wal.js');
      const state = await ctx.getBackend().inspect();
      const details = state.details as Record<string, unknown>;
      const walState = details.wal as { filePath: string } | undefined;
      if (!walState) {
        return resp.error('current backend does not use a WAL');
      }

      const walFileName = walState.filePath.split('/').pop() ?? 'engine.wal';
      const dataDir = walState.filePath.replace(/\/[^/]+$/, '');
      const wal = new WriteAheadLog(dataDir, walFileName);
      wal.appendSet(key, value);

      return resp.bulkString(`Injected into WAL only: ${key}=${value}. Restart engine to see recovery.`);
    }

    default:
      return resp.error(`unknown WAL subcommand '${walSub}'. Try: STATUS, CHECKPOINT, INJECT`);
  }
}

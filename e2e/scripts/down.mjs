#!/usr/bin/env node
/** npm run e2e:down — stops the harness app server (if any) and the local Supabase stack (data kept in its Docker volume). */
import { spawnSync } from 'node:child_process';
import { E2E_DIR, REPO } from '../lib/env.mjs';
import { stopServer } from '../lib/server.mjs';

await stopServer();
const r = spawnSync('supabase', ['stop', '--workdir', E2E_DIR, ...process.argv.slice(2)], { cwd: REPO, stdio: 'inherit' });
process.exit(r.status ?? 0);

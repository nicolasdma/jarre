#!/usr/bin/env node
/**
 * npm run e2e:server -- [--no-build] [--stop]
 * Copies the working tree, builds it against the local stack and serves it on :3107.
 */
import { BASE_URL, buildApp, startServer, stopServer, syncApp } from '../lib/server.mjs';

const argv = process.argv.slice(2);
if (argv.includes('--stop')) {
  await stopServer();
  console.log('harness app server stopped');
  process.exit(0);
}
await stopServer();
const changed = syncApp();
console.log(`app copy synced (${changed} paths changed)`);
if (!argv.includes('--no-build')) {
  const ms = buildApp();
  console.log(`built in ${(ms / 1000).toFixed(0)} s`);
}
const s = await startServer();
console.log(`serving ${BASE_URL}${s.pid ? ` (pid ${s.pid})` : ''}`);

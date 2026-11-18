import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const ROUND = process.env.E2E_ROUND ?? '0';
export const REPORT_DIR = resolve(HERE, '..', 'report');
export const RAW_DIR = join(REPORT_DIR, 'raw');
/** Screenshots go outside the repo, where the owner reviews them. */
export const SHOTS_DIR = process.env.E2E_SHOTS_DIR ?? join(os.homedir(), 'Desktop', '_revisar', 'jarre-loop', `round-${ROUND}`);

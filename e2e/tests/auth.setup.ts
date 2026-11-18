/** Logs in as the local test user through the real form, saves the session for the flows. */
import { join } from 'node:path';
import { loadE2eEnv } from '../lib/env.mjs';
import { expectNoBrokenSteps, test, expect } from './harness';
import { REPORT_DIR } from './paths';

test('login', async ({ page, walk }) => {
  const env = loadE2eEnv();
  await walk.step('login page', async () => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
  await walk.step('sign in', async () => {
    await page.locator('input[type="email"]').fill(env.E2E_USER_EMAIL);
    await page.locator('input[type="password"]').fill(env.E2E_USER_PASSWORD);
    await walk.tap(page.locator('form button[type="submit"]'), 'login submit');
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
  });
  await page.context().storageState({ path: join(REPORT_DIR, '.auth.json') });
  expectNoBrokenSteps(walk);
});

/**
 * Logout, last (file name sorts after the flows) and on a fresh login.
 * Supabase signOut is global: it revokes every session of the user, so
 * e2e/scripts/run.mjs runs each viewport in its own invocation, and each
 * starts with the `setup` project's login.
 */
import { loadE2eEnv } from '../lib/env.mjs';
import { expect, expectNoBrokenSteps, test } from './harness';

test.use({ storageState: { cookies: [], origins: [] } });

test('logout', async ({ page, walk }) => {
  const env = loadE2eEnv();
  await walk.step('logout: fresh login', async () => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(env.E2E_USER_EMAIL);
    await page.locator('input[type="password"]').fill(env.E2E_USER_PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30_000 });
  });
  await walk.step('logout: SALIR', async () => {
    const salir = page
      .getByRole('button', { name: /^(salir|cerrar sesión|log ?out)$/i })
      .or(page.getByText(/^salir$/i))
      .filter({ visible: true })
      .first();
    // Phone: the header folds into a menu. Give the page its first paint before deciding which one this is.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    if (!(await salir.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false))) await walk.tap(page.getByRole('button', { name: /toggle menu|menú/i }).filter({ visible: true }).first(), 'menu');
    await walk.tap(salir, 'salir');
    // Logout sends the user to "/", which redirects to /library: the sign that it worked is the session cookie gone.
    await expect
      .poll(async () => (await page.context().cookies()).some((c) => /^sb-.*-auth-token/.test(c.name)), { timeout: 15_000 })
      .toBe(false);
  });
  await walk.step('logout: protected page after logout', async () => {
    await page.goto('/review');
    await expect(page.locator('input[type="email"]').or(page.getByRole('link', { name: /sign in|iniciar/i })).first()).toBeVisible({ timeout: 15_000 });
  });
  expectNoBrokenSteps(walk);
});

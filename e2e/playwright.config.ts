/**
 * Playwright config for the local e2e walk (`npm run e2e:local`).
 *
 * One worker, one browser at a time (the machine is shared with other work).
 * Two viewports run the same flows: 1440x900 desktop and 390x844 phone.
 * The browser can only resolve loopback hosts, so nothing in a page can reach
 * YouTube, Gemini, a CDN or the hosted Supabase project.
 */
import { defineConfig } from '@playwright/test';
import { join } from 'node:path';
import { REPORT_DIR } from './tests/paths';

const PORT = Number(process.env.E2E_APP_PORT ?? 3107);
const BASE_URL = `http://127.0.0.1:${PORT}`;
// Google Chrome plays the drills' AAC audio; Playwright's Chromium has no proprietary codecs.
const channel = process.env.E2E_CHANNEL === 'chromium' ? undefined : (process.env.E2E_CHANNEL ?? 'chrome');

export default defineConfig({
  testDir: './tests',
  outputDir: join(REPORT_DIR, 'artifacts'),
  timeout: 15 * 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: join(REPORT_DIR, 'playwright.json') }]],
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    channel,
    headless: process.env.E2E_HEADED ? false : true,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Cordoba',
    permissions: ['microphone'],
    actionTimeout: 10_000,
    navigationTimeout: 45_000,
    trace: 'retain-on-failure',
    launchOptions: {
      args: [
        // Loopback only: every other host fails DNS (recorded as "blocked external").
        '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
      ],
    },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'desktop-1440',
      testMatch: /\.spec\.ts/,
      dependencies: ['setup'],
      use: { viewport: { width: 1440, height: 900 }, storageState: join(REPORT_DIR, '.auth.json') },
    },
    {
      name: 'mobile-390',
      testMatch: /\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        storageState: join(REPORT_DIR, '.auth.json'),
      },
    },
  ],
});

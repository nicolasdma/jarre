/**
 * The drills that listen (Repetir, Frase por frase) on a phone with no
 * working speech recognizer, the way every iOS browser is: the take is
 * recorded, sent to /api/practice/transcribe (the net-guard answers the model
 * with a canned line) and graded like a recognized one. And on desktop, the
 * browser recognizer stays the path: no recording, no server call.
 *
 * iOS is simulated in Chromium: an iPhone user agent and no SpeechRecognition
 * (the harness's fake recognizer is removed). The mic is Chrome's fake device.
 */
import type { Page } from '@playwright/test';
import { expect, test } from './harness';

const BASE = '/learn/3y-health-tecnica-v2';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1';

/** Counts the mic tracks still live, so the test can see the mic released. */
function trackMicTracks() {
  const w = window as unknown as { __e2eMicTracks?: MediaStreamTrack[]; __e2eLiveMicTracks?: () => number };
  w.__e2eMicTracks = [];
  w.__e2eLiveMicTracks = () => (w.__e2eMicTracks ?? []).filter((t) => t.readyState === 'live').length;
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) return;
  const original = md.getUserMedia.bind(md);
  md.getUserMedia = async (constraints) => {
    const stream = await original(constraints);
    w.__e2eMicTracks!.push(...stream.getAudioTracks());
    return stream;
  };
}

/** No recognizer at all, as on iOS (the harness installs a fake one first: take it away). */
function removeRecognizer() {
  const w = window as unknown as Record<string, unknown>;
  delete w.SpeechRecognition;
  delete w.webkitSpeechRecognition;
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

const liveMicTracks = (page: Page) => page.evaluate(() => (window as unknown as { __e2eLiveMicTracks: () => number }).__e2eLiveMicTracks());

test.describe('iPhone (no speech recognizer)', () => {
  test.use({ userAgent: IPHONE_UA });

  test('Repetir and Frase por frase record, transcribe and grade', async ({ page, walk }, info) => {
    test.skip(info.project.name !== 'mobile-390', 'phone viewport only');
    await page.addInitScript(removeRecognizer);
    await page.addInitScript(trackMicTracks);
    const transcribed: number[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/practice/transcribe')) transcribed.push(r.status());
    });

    await walk.step('repeat: record, transcribe, score', async () => {
      await open(page, `${BASE}?step=practice&mode=repeat`);
      const trainer = page.locator('[data-testid="drill-trainer"]');
      await expect(trainer.locator('[data-mode="repeat"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-recognition"]')).toHaveCount(0);
      await walk.tap(trainer.getByRole('button', { name: /hablar/i }), 'hablar');
      const status = page.locator('[data-testid="capture-status"]');
      await expect(status).toHaveAttribute('data-capture', 'recording');
      await expect(status).toContainText(/Grabando 0:0\d/);
      await page.waitForTimeout(1600);
      const response = page.waitForResponse((r) => r.url().includes('/api/practice/transcribe'));
      await walk.tap(trainer.getByRole('button', { name: /terminar/i }), 'terminar');
      expect((await response).status()).toBe(200);
      await expect(trainer.getByText('Puntaje')).toBeVisible();
      await expect(trainer.getByText(/^\d+%$/).first()).toBeVisible();
      await expect(status).toHaveCount(0);
      expect(await liveMicTracks(page)).toBe(0);
    });

    await walk.step('phrase by phrase: record, transcribe, grade the phrase', async () => {
      await open(page, `${BASE}?step=practice&mode=sentences`);
      const start = page.locator('[data-testid="sentences-start"]');
      await expect(start).toBeEnabled({ timeout: 20_000 });
      await walk.tap(start, 'empezar');
      const status = page.locator('[data-testid="sentence-status"]');
      // The phrase plays, then the mic records.
      await expect(page.locator('[data-testid="capture-status"]')).toHaveAttribute('data-capture', 'recording', { timeout: 30_000 });
      await expect(status).toContainText(/Grabando 0:0\d · decí esta frase/i);
      await page.waitForTimeout(1600);
      const response = page.waitForResponse((r) => r.url().includes('/api/practice/transcribe'));
      await walk.tap(page.locator('[data-testid="sentence-done"]'), 'listo');
      expect((await response).status()).toBe(200);
      await expect(status).toContainText(/✓ Bien · \d+%|\d+% · va de nuevo/, { timeout: 10_000 });
      expect(await liveMicTracks(page)).toBe(0);
    });

    await walk.step('leaving the mode mid-take releases the mic', async () => {
      await open(page, `${BASE}?step=practice&mode=repeat`);
      const trainer = page.locator('[data-testid="drill-trainer"]');
      await walk.tap(trainer.getByRole('button', { name: /hablar/i }), 'hablar');
      await expect(page.locator('[data-testid="capture-status"]')).toHaveAttribute('data-capture', 'recording');
      expect(await liveMicTracks(page)).toBe(1);
      await walk.tap(trainer.locator('button').filter({ hasText: /^(\d\s*)?escuchar$/i }).first(), 'escuchar');
      await expect.poll(() => liveMicTracks(page)).toBe(0);
    });

    expect(transcribed.every((s) => s === 200)).toBe(true);
    expect(transcribed.length).toBe(2);
    expect(walk.failures()).toEqual([]);
  });
});

test('desktop Chrome keeps the browser recognizer in Repetir', async ({ page, walk }, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'desktop viewport only');
  await page.addInitScript(trackMicTracks);
  let transcribeCalls = 0;
  page.on('request', (r) => {
    if (r.url().includes('/api/practice/transcribe')) transcribeCalls++;
  });
  await walk.step('repeat: the (fake) browser recognizer hears and scores', async () => {
    await open(page, `${BASE}?step=practice&mode=repeat`);
    const trainer = page.locator('[data-testid="drill-trainer"]');
    await walk.tap(trainer.getByRole('button', { name: /hablar/i }), 'hablar');
    await expect(trainer.getByText('Puntaje')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __e2eRecognizerStarts: number }).__e2eRecognizerStarts)).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="capture-status"]')).toHaveCount(0);
    await expect(trainer.getByText('● escuchando…')).toHaveCount(1);
  });
  expect(transcribeCalls).toBe(0);
  expect(walk.failures()).toEqual([]);
});

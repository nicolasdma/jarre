/**
 * The coding mock's microphone and its Live socket, in a real browser.
 *
 * The owner, 2026-11-20: "Jarre sigue desconectando el micrófono". The page
 * replaced a session that was hearing him every time he thought aloud for
 * fifteen seconds (docs/research/voice-probe/coding-mock-deaf.md). Here:
 *
 * - half a minute of voice with nothing transcribed yet keeps its socket, and
 *   the transcription that comes when the turn ends settles it;
 * - a candidate who spoke, went quiet and was never transcribed gets a new
 *   socket, and the same microphone feeds it;
 * - a microphone track the browser ends is opened again;
 * - a reload does not lose what the session wrote down about all that.
 *
 * The microphone is a tone the test turns up and down (a MediaStream from
 * WebAudio in place of getUserMedia); Gemini Live is a socket the test
 * answers, and it transcribes only when told to.
 */
import type { Page, WebSocketRoute } from '@playwright/test';
import { expect, test } from './harness';

const BASE = '/learn/3y-health-tecnica-v2';

/** getUserMedia gives a tone the test controls: `__mic.voice(true)` is the candidate talking. */
function installToneMic() {
  const w = window as unknown as {
    __mic?: { opened: number; tracks: MediaStreamTrack[]; voice: (on: boolean) => void; endTrack: () => void };
  };
  const gains: GainNode[] = [];
  let talking = false;
  w.__mic = {
    opened: 0,
    tracks: [],
    voice(on) {
      talking = on;
      // Never digital silence: a working microphone always has a floor.
      for (const g of gains) g.gain.value = on ? 0.5 : 0.001;
    },
    endTrack() {
      w.__mic!.tracks.at(-1)?.dispatchEvent(new Event('ended'));
    },
  };
  navigator.mediaDevices.getUserMedia = async () => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.value = talking ? 0.5 : 0.001;
    const out = ctx.createMediaStreamDestination();
    osc.connect(gain).connect(out);
    osc.start();
    gains.push(gain);
    w.__mic!.opened += 1;
    w.__mic!.tracks.push(...out.stream.getAudioTracks());
    return out.stream;
  };
}

const mic = {
  voice: (page: Page, on: boolean) => page.evaluate((v) => (window as unknown as { __mic: { voice: (on: boolean) => void } }).__mic.voice(v), on),
  opened: (page: Page) => page.evaluate(() => (window as unknown as { __mic: { opened: number } }).__mic.opened),
  endTrack: (page: Page) => page.evaluate(() => (window as unknown as { __mic: { endTrack: () => void } }).__mic.endTrack()),
};

test('coding mock: a long answer keeps its session; a deaf one and a lost microphone are replaced', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop-1440', 'desktop only: the mock is a desktop exercise');
  test.setTimeout(4 * 60_000);

  const sockets: { route: WebSocketRoute; audioFrames: number }[] = [];
  await context.routeWebSocket(/generativelanguage\.googleapis\.com/, (ws) => {
    const socket = { route: ws, audioFrames: 0 };
    sockets.push(socket);
    ws.onMessage((msg) => {
      const text = typeof msg === 'string' ? msg : msg.toString();
      if (text.includes('"setup"')) ws.send(JSON.stringify({ setupComplete: {} }));
      if (text.includes('"audio"')) socket.audioFrames += 1;
    });
  });
  const transcribe = (text: string) => sockets.at(-1)!.route.send(JSON.stringify({ serverContent: { inputTranscription: { text } } }));
  const ends: Record<string, unknown>[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/voice/session/end')) ends.push((r.postDataJSON() as { diag?: Record<string, unknown> }).diag ?? {});
  });
  await page.addInitScript(installToneMic);

  await page.goto(`${BASE}?step=coding`, { waitUntil: 'domcontentloaded' });
  const mock = page.locator('[data-testid="coding-mock"]');
  await expect(mock).toBeVisible();
  await mock.getByRole('radio', { name: /two sum/i }).click();
  await mock.getByRole('button', { name: /empezar simulacro/i }).click();
  const status = page.locator('[data-testid="coding-mock-mic-status"]');
  await expect(status).toContainText('mic abierto · conectado · sin transcripción todavía', { timeout: 30_000 });
  const warning = page.locator('[data-testid="coding-mock-mic-warning"]');

  // 1. Thirty seconds thinking aloud, nothing transcribed yet: the old rule replaced the session at fifteen.
  await mic.voice(page, true);
  await expect(page.locator('[data-testid="coding-mock-mic"]')).toHaveAttribute('data-talking', 'true');
  await page.waitForTimeout(30_000);
  expect(sockets.length).toBe(1);
  await expect(warning).toHaveCount(0);
  await mic.voice(page, false);
  // The server closes the turn 2.5 s after the last word and the transcription follows.
  await page.waitForTimeout(3200);
  await transcribe(' So I keep a map from each value to its index.');
  await expect(status).toContainText(/te transcribió hace \d+ s/);
  await page.waitForTimeout(13_000);
  expect(sockets.length).toBe(1);
  await expect(warning).toHaveCount(0);
  await expect(status).not.toContainText('reemplazada');

  // 2. They speak, wait, and nothing ever comes back: that session does not hear, and is replaced.
  await mic.voice(page, true);
  await page.waitForTimeout(6000);
  await mic.voice(page, false);
  await expect.poll(() => sockets.length, { timeout: 25_000 }).toBe(2);
  await expect(status).toContainText('sesión reemplazada por no oír: 1');
  await expect(status).toContainText('conectado');
  // The same microphone, never reopened, feeds the new socket.
  expect(await mic.opened(page)).toBe(1);
  const before = sockets[1].audioFrames;
  await expect.poll(() => sockets[1].audioFrames, { timeout: 5000 }).toBeGreaterThan(before + 5);
  await transcribe(' Can you hear me now?');
  await expect(warning).toHaveCount(0);

  // 3. The browser ends the microphone track: the session opens the microphone again.
  await mic.endTrack(page);
  await expect.poll(() => mic.opened(page), { timeout: 10_000 }).toBe(2);
  await expect(status).toContainText('mic reabierto: 1');
  await expect(status).toContainText('mic abierto');
  const afterReopen = sockets[1].audioFrames;
  await expect.poll(() => sockets[1].audioFrames, { timeout: 5000 }).toBeGreaterThan(afterReopen + 5);
  expect(sockets.length).toBe(2);

  // 4. A reload: whoever closes the session sends what it wrote down.
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => ends.length, { timeout: 20_000 }).toBeGreaterThan(0);
  const diag = ends.at(-1)!;
  expect(String(diag.endReason)).toMatch(/pagehide/);
  const kinds = ((diag.events as { k: string }[] | undefined) ?? []).map((e) => e.k);
  expect(kinds).toEqual(expect.arrayContaining(['deaf_restart', 'reconnected', 'mic_ended', 'mic_restarted']));
  expect(Number(diag.micUnheard)).toBe(1);
});

/**
 * Shared fixture for the Jarre e2e walk.
 *
 * Every flow is a list of named steps. `step(name, fn)` runs one, and
 * whatever happens (pass or throw) records, for that step only:
 *   - console errors and uncaught page errors,
 *   - failed requests (HTTP >= 400 or network failure), split from the
 *     external requests the harness blocks on purpose,
 *   - navigation timing, LCP and CLS of the document the step ends on,
 *   - interaction latency: every click the step makes through `tap()` is
 *     timed from dispatch to the next painted frame (INP-like), plus the
 *     browser's own Event Timing entries,
 *   - long tasks, JS bytes transferred, and one screenshot.
 * A failing step does not stop the flow: the next steps still run, and the
 * test fails at the end with the list of broken steps.
 *
 * Network: Chromium resolves only loopback (`--host-resolver-rules` in
 * playwright.config.ts), so YouTube, Gemini, fonts CDNs and the hosted
 * Supabase project are unreachable from the page. The Gemini Live socket is
 * answered by a mock (`routeWebSocket`), and Web Speech by a fake recognizer.
 */
import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RAW_DIR, SHOTS_DIR } from './paths';

export interface StepRecord {
  flow: string;
  step: string;
  project: string;
  viewport: { width: number; height: number } | null;
  ok: boolean;
  error?: string;
  url: string;
  startedAt: string;
  durationMs: number;
  /** Server-side calls the net guard answered or blocked during this step (filled by global-teardown). */
  serverCalls?: { host: string; decision: string; rule?: string }[];
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: { url: string; status: number | string; method: string }[];
  blockedExternal: string[];
  nav?: { ttfbMs: number; domContentLoadedMs: number; loadMs: number } | null;
  lcpMs?: number | null;
  cls: number;
  longTasks: { count: number; totalMs: number; maxMs: number };
  interactions: { label: string; ms: number }[];
  eventTiming: { maxMs: number; worst?: string };
  jsTransferredKB: number;
  totalTransferredKB: number;
  screenshot?: string;
  /** Buttons clicked by walk.sweep() in this step. */
  buttons?: ButtonRecord[];
  /** Pixels of content wider than the viewport when the step ended (0: nothing overflows). */
  overflowXPx?: number;
  /** Things worth a look that are not failures (a control that is gone, an optional path not taken). */
  notes?: string[];
}

export interface ButtonRecord {
  name: string;
  ms: number;
  outcome: 'ok' | 'navigated' | 'error' | 'skipped' | 'disabled';
  errors: string[];
  error?: string;
}

/** Never clicked by a sweep: leaving the session, destroying data, leaving the app. */
export const SWEEP_DENY =
  /cerrar sesi|log ?out|sign ?out|^salir$|eliminar|borrar|delete|remove|reset|reiniciar|olvidar|discard|descartar|google|github|billing|suscrib|upgrade|pagar|español|english/i;

/** Runs before any page script: observers that the step reads back. */
function installObservers() {
  type W = typeof window & { __e2e?: Record<string, unknown> };
  const w = window as W;
  const store = { lcp: 0, cls: 0, longTasks: [] as number[], events: [] as { name: string; duration: number; target: string }[] };
  w.__e2e = store;
  const observe = (type: string, cb: (entries: PerformanceEntryList) => void, extra: Record<string, unknown> = {}) => {
    try {
      new PerformanceObserver((list) => cb(list.getEntries())).observe({ type, buffered: true, ...extra } as PerformanceObserverInit);
    } catch {
      /* unsupported */
    }
  };
  observe('largest-contentful-paint', (es) => {
    for (const e of es) store.lcp = Math.max(store.lcp, e.startTime);
  });
  observe('layout-shift', (es) => {
    for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) store.cls += e.value;
  });
  observe('longtask', (es) => {
    for (const e of es) store.longTasks.push(e.duration);
  });
  observe(
    'event',
    (es) => {
      for (const e of es as (PerformanceEntry & { target?: Element | null })[]) {
        const t = e.target;
        const label = t ? `${t.tagName.toLowerCase()}${t.getAttribute('aria-label') ? `[${t.getAttribute('aria-label')}]` : ''}${t.textContent ? ` "${t.textContent.trim().slice(0, 40)}"` : ''}` : '';
        store.events.push({ name: e.name, duration: e.duration, target: label });
      }
    },
    { durationThreshold: 16 },
  );
}

/** Web Speech stand-in: "hears" window.__e2eHeard (or a default line) word by word, then a final result. */
function installFakeRecognizer() {
  type W = typeof window & { __e2eHeard?: string; __e2eRecognizerStarts?: number };
  const w = window as W;
  w.__e2eRecognizerStarts = 0;
  class FakeRecognition {
    lang = 'en-US';
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onstart: ((e: unknown) => void) | null = null;
    onresult: ((e: unknown) => void) | null = null;
    onend: ((e: unknown) => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onaudiostart: ((e: unknown) => void) | null = null;
    onspeechstart: ((e: unknown) => void) | null = null;
    onspeechend: ((e: unknown) => void) | null = null;
    private timer: ReturnType<typeof setInterval> | null = null;
    private listeners = new Map<string, Set<(e: unknown) => void>>();
    private emit(type: string, event: unknown) {
      (this as unknown as Record<string, ((e: unknown) => void) | null>)[`on${type}`]?.(event);
      for (const l of this.listeners.get(type) ?? []) l(event);
    }
    start() {
      w.__e2eRecognizerStarts = (w.__e2eRecognizerStarts ?? 0) + 1;
      const words = (w.__e2eHeard ?? 'data integrity means the record is complete consistent and accurate').split(/\s+/);
      let i = 0;
      setTimeout(() => {
        this.emit('start', {});
        this.emit('audiostart', {});
        this.emit('speechstart', {});
      }, 30);
      this.timer = setInterval(() => {
        i = Math.min(words.length, i + 2);
        const isFinal = i === words.length;
        const result = Object.assign([{ transcript: words.slice(0, i).join(' '), confidence: 0.92 }], { isFinal });
        this.emit('result', { resultIndex: 0, results: Object.assign([result], { length: 1 }) });
        if (isFinal) this.finish();
      }, 120);
    }
    private finish() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      setTimeout(() => {
        this.emit('speechend', {});
        this.emit('end', {});
      }, 20);
    }
    stop() {
      this.finish();
    }
    abort() {
      this.finish();
    }
    addEventListener(type: string, cb: (e: unknown) => void) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type)!.add(cb);
    }
    removeEventListener(type: string, cb: (e: unknown) => void) {
      this.listeners.get(type)?.delete(cb);
    }
  }
  (window as unknown as Record<string, unknown>).SpeechRecognition = FakeRecognition;
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRecognition;
}

const BLOCKED_NET = /ERR_NAME_NOT_RESOLVED|ERR_NAME_RESOLUTION_FAILED|net::ERR_ADDRESS_UNREACHABLE/;

export interface SweepOptions {
  max?: number;
  deny?: RegExp;
  /** Called after a click navigated away and the sweep came back (re-open a tab, a step...). */
  restore?: () => Promise<void>;
  /** Press Escape after each click (closes menus and dialogs). Default true. */
  escape?: boolean;
}

export interface Walk {
  step: (name: string, fn: () => Promise<void>, opts?: { screenshot?: boolean }) => Promise<boolean>;
  /**
   * Clicks every visible, enabled button/tab inside `scope` once (by label),
   * except SWEEP_DENY, timing each and recording the console errors it caused.
   * A click that navigates is undone (goto back + restore()).
   */
  sweep: (scope: Locator, opts?: SweepOptions) => Promise<ButtonRecord[]>;
  /** Adds a note to the current step's record. */
  note: (text: string) => void;
  /** Gemini Live sockets the page opened so far (all answered by the mock). */
  liveSockets: () => number;
  /** Runs `start` and waits for the page to open a new (mocked) Gemini Live socket. */
  expectLiveSession: (start: () => Promise<unknown>, timeoutMs?: number) => Promise<void>;
  /** Click and time it to the next painted frame. */
  tap: (target: Locator, label?: string) => Promise<number>;
  failures: () => string[];
  page: Page;
}

function isLocal(url: string): boolean {
  try {
    const h = new URL(url).hostname;
    return h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]';
  } catch {
    return true; // data:, blob:
  }
}

export const test = base.extend<{ walk: Walk; flowName: string }>({
  flowName: ['flow', { option: true }],
  walk: async ({ page, context }, use, testInfo: TestInfo) => {
    await context.addInitScript(installObservers);
    await context.addInitScript(installFakeRecognizer);

    // Gemini Live: a socket that completes setup and then stays quiet. Never the real service.
    const liveFrames: string[] = [];
    let liveSocketCount = 0;
    await context.routeWebSocket(/generativelanguage\.googleapis\.com/, (ws) => {
      liveSocketCount++;
      ws.onMessage((msg) => {
        const text = typeof msg === 'string' ? msg : msg.toString();
        liveFrames.push(text.slice(0, 200));
        if (text.includes('"setup"')) ws.send(JSON.stringify({ setupComplete: {} }));
      });
    });

    const project = testInfo.project.name;
    const flow = testInfo.title;
    let consoleErrors: string[] = [];
    let pageErrors: string[] = [];
    let failedRequests: StepRecord['failedRequests'] = [];
    let blockedExternal: string[] = [];
    let jsBytes = 0;
    let allBytes = 0;
    let interactions: StepRecord['interactions'] = [];
    let buttons: ButtonRecord[] = [];
    let notes: string[] = [];
    const failures: string[] = [];

    page.on('console', (m) => {
      // A resource on a host the harness blocks (DNS) is listed in blockedExternal, not as an app error.
      // "Failed to load resource" says nothing about which one: keep the URL the browser attached to it.
      if (m.type() === 'error' && !BLOCKED_NET.test(m.text())) consoleErrors.push(`${m.text()}${m.location()?.url ? ` @ ${m.location().url.replace(/^https?:\/\/[^/]+/, '')}` : ''}`.slice(0, 400));
    });
    page.on('pageerror', (e) => pageErrors.push(`${e.name}: ${e.message}`.slice(0, 400)));
    page.on('requestfailed', (r) => {
      const failure = r.failure()?.errorText ?? 'failed';
      if (!isLocal(r.url()) && BLOCKED_NET.test(failure)) blockedExternal.push(new URL(r.url()).host + new URL(r.url()).pathname.slice(0, 60));
      else if (!/ERR_ABORTED/.test(failure)) failedRequests.push({ url: r.url().slice(0, 200), status: failure, method: r.method() });
    });
    page.on('response', async (r) => {
      if (r.status() >= 400) failedRequests.push({ url: r.url().slice(0, 200), status: r.status(), method: r.request().method() });
      try {
        const sizes = await r.request().sizes();
        const bytes = sizes.responseBodySize + sizes.responseHeadersSize;
        allBytes += bytes;
        if (/javascript/.test(r.headers()['content-type'] ?? '') || r.url().endsWith('.js')) jsBytes += bytes;
      } catch {
        /* response gone */
      }
    });

    mkdirSync(RAW_DIR, { recursive: true });
    mkdirSync(SHOTS_DIR, { recursive: true });
    const rawFile = join(RAW_DIR, `${project}.jsonl`);

    const readPerf = async () =>
      page
        .evaluate(() => {
          const s = (window as unknown as { __e2e?: { lcp: number; cls: number; longTasks: number[]; events: { name: string; duration: number; target: string }[] } }).__e2e;
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
          return {
            lcp: s?.lcp ?? null,
            cls: s?.cls ?? 0,
            longTasks: s?.longTasks ?? [],
            events: s?.events ?? [],
            nav: nav ? { ttfbMs: nav.responseStart, domContentLoadedMs: nav.domContentLoadedEventEnd, loadMs: nav.loadEventEnd } : null,
            // Content wider than the screen: the page scrolls sideways, or the app shell (overflow-x hidden) cuts it off.
            overflowXPx: (() => {
              const shell = document.getElementById('main-content')?.closest('.overflow-y-auto');
              return Math.max(0, document.documentElement.scrollWidth - innerWidth, shell ? shell.scrollWidth - shell.clientWidth : 0);
            })(),
          };
        })
        .catch(() => null);

    const walk: Walk = {
      page,
      failures: () => failures,
      tap: async (target, label) => {
        await target.scrollIntoViewIfNeeded().catch(() => {});
        const name = label ?? ((await target.textContent().catch(() => ''))?.trim().slice(0, 40) || 'click');
        const handle = await target.elementHandle({ timeout: 10_000 });
        if (!handle) throw new Error(`tap: ${name} not found`);
        // Time from the click's dispatch to the next frame the browser paints after it.
        await page.evaluate(() => {
          (window as unknown as { __e2eTap?: number }).__e2eTap = 0;
          addEventListener(
            'click',
            () => {
              const t0 = performance.now();
              requestAnimationFrame(() => setTimeout(() => ((window as unknown as { __e2eTap?: number }).__e2eTap = performance.now() - t0), 0));
            },
            { capture: true, once: true },
          );
        });
        await target.click({ timeout: 10_000 });
        const ms = await page
          .waitForFunction(() => (window as unknown as { __e2eTap?: number }).__e2eTap || null, null, { timeout: 5_000 })
          .then((h) => h.jsonValue() as Promise<number>)
          .catch(() => -1);
        interactions.push({ label: name, ms: Math.round(ms) });
        return ms;
      },
      sweep: async (scope, opts = {}) => {
        const { max = 30, deny, restore, escape = true } = opts;
        // SWEEP_DENY always applies; opts.deny adds to it.
        const denied = (name: string) => SWEEP_DENY.test(name) || (deny ? deny.test(name) : false);
        const startUrl = page.url();
        const seen = new Set<string>();
        const done: ButtonRecord[] = [];
        for (let clicks = 0; clicks < max; ) {
          const candidates = scope.locator('button:visible, [role="tab"]:visible, [role="button"]:visible');
          const n = await candidates.count().catch(() => 0);
          let target: Locator | null = null;
          let label = '';
          for (let j = 0; j < n; j++) {
            const c = candidates.nth(j);
            const name =
              ((await c.getAttribute('aria-label').catch(() => null)) ||
                (await c.innerText({ timeout: 1000 }).catch(() => ''))?.replace(/\s+/g, ' ').trim().slice(0, 50) ||
                (await c.getAttribute('title').catch(() => null)) ||
                `#${j}`) ?? `#${j}`;
            if (seen.has(name)) continue;
            seen.add(name);
            if (denied(name)) {
              done.push({ name, ms: 0, outcome: 'skipped', errors: [] });
              continue;
            }
            if (await c.isDisabled().catch(() => false)) {
              done.push({ name, ms: 0, outcome: 'disabled', errors: [] });
              continue;
            }
            target = c;
            label = name;
            break;
          }
          if (!target) break;
          clicks++;
          const before = consoleErrors.length + pageErrors.length;
          const record: ButtonRecord = { name: label, ms: -1, outcome: 'ok', errors: [] };
          try {
            record.ms = Math.round(await walk.tap(target, label));
          } catch (e) {
            record.outcome = 'error';
            record.error = (e instanceof Error ? e.message : String(e)).split('\n')[0].slice(0, 200);
          }
          await page.waitForTimeout(300);
          record.errors = [...consoleErrors, ...pageErrors].slice(before);
          if (page.url().split('#')[0] !== startUrl.split('#')[0]) {
            if (record.outcome === 'ok') record.outcome = 'navigated';
            await page.goto(startUrl).catch(() => {});
            await restore?.();
          } else if (escape) {
            await page.keyboard.press('Escape').catch(() => {});
          }
          done.push(record);
        }
        buttons.push(...done);
        return done;
      },
      liveSockets: () => liveSocketCount,
      expectLiveSession: async (start, timeoutMs = 20_000) => {
        const before = liveSocketCount;
        await start();
        const deadline = Date.now() + timeoutMs;
        while (liveSocketCount === before && Date.now() < deadline) await page.waitForTimeout(250);
        if (liveSocketCount === before) throw new Error(`no Gemini Live socket opened within ${timeoutMs / 1000} s`);
        await page.waitForTimeout(1500);
      },
      note: (text) => {
        notes.push(text);
      },
      step: async (name, fn, opts = {}) => {
        notes = [];
        buttons = [];
        consoleErrors = [];
        pageErrors = [];
        failedRequests = [];
        blockedExternal = [];
        interactions = [];
        jsBytes = 0;
        allBytes = 0;
        const before = await readPerf();
        const t0 = Date.now();
        const startedAt = new Date(t0).toISOString();
        let ok = true;
        let error: string | undefined;
        try {
          await fn();
        } catch (e) {
          ok = false;
          // eslint-disable-next-line no-control-regex
          error = (e instanceof Error ? e.message : String(e)).replace(/\u001b\[[0-9;]*m/g, '').split('\n').slice(0, 6).join('\n').slice(0, 800);
          failures.push(`${name}: ${error.split('\n')[0]}`);
        }
        const durationMs = Date.now() - t0;
        await page.waitForTimeout(150);
        const after = await readPerf();
        const sameDoc = before && after && before.nav?.ttfbMs === after.nav?.ttfbMs && after.events.length >= before.events.length;
        const newEvents = after ? (sameDoc ? after.events.slice(before!.events.length) : after.events) : [];
        const newLong = after ? (sameDoc ? after.longTasks.slice(before!.longTasks.length) : after.longTasks) : [];
        const worst = newEvents.reduce<{ name: string; duration: number; target: string } | null>((w, e) => (!w || e.duration > w.duration ? e : w), null);
        const vp = page.viewportSize();
        const slug = `${flow}--${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 90);
        let screenshot: string | undefined;
        if (opts.screenshot !== false) {
          screenshot = join(SHOTS_DIR, `${project}--${slug}.png`);
          await page.screenshot({ path: screenshot, fullPage: false, timeout: 15_000 }).catch(() => (screenshot = undefined));
        }
        const record: StepRecord = {
          flow,
          step: name,
          project,
          viewport: vp,
          ok,
          error,
          url: page.url().replace(/^https?:\/\/[^/]+/, ''),
          startedAt,
          durationMs,
          consoleErrors: [...new Set(consoleErrors)],
          pageErrors: [...new Set(pageErrors)],
          failedRequests,
          blockedExternal: [...new Set(blockedExternal)],
          nav: after?.nav ?? null,
          lcpMs: after?.lcp ? Math.round(after.lcp) : null,
          cls: Number((sameDoc ? after!.cls - before!.cls : after?.cls ?? 0).toFixed(4)),
          longTasks: { count: newLong.length, totalMs: Math.round(newLong.reduce((a, b) => a + b, 0)), maxMs: Math.round(Math.max(0, ...newLong)) },
          interactions,
          eventTiming: { maxMs: Math.round(worst?.duration ?? 0), worst: worst ? `${worst.name} ${worst.target}` : undefined },
          jsTransferredKB: Math.round(jsBytes / 1024),
          totalTransferredKB: Math.round(allBytes / 1024),
          screenshot,
          buttons: buttons.length ? buttons : undefined,
          overflowXPx: after?.overflowXPx ?? 0,
          notes: notes.length ? notes : undefined,
        };
        appendFileSync(rawFile, JSON.stringify(record) + '\n');
        return ok;
      },
    };

    await use(walk);
    testInfo.annotations.push({ type: 'gemini-live-frames', description: String(liveFrames.length) });
  },
});

export { expect };

/** Fails the test with every broken step (after all of them ran). */
export function expectNoBrokenSteps(walk: Walk) {
  expect(walk.failures(), 'broken steps').toEqual([]);
}

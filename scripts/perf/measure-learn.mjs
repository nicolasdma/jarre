#!/usr/bin/env node
/**
 * Measures the learn view (/learn/perf-harness, the lesson read from disk)
 * in headless Chromium at 1440x900 @2x, one scenario at a time:
 *
 *   rest       the reading step, untouched, 60 s
 *   drill      Practice · Escuchar, the drill's recording playing, 20 s
 *   repeat     Practice · Repetir, mic from Chromium's fake device and a
 *              scripted recognizer giving interim words every 250 ms, 30 s
 *   interview  the mock step, before starting (no Gemini), 30 s
 *   hover      the pointer on the sidebar tutor 5 s, then 10 s after leaving
 *   heap      the reading step untouched for 10 min: JS heap after a GC
 *              at 0, 2, 5 and 10 min, and CPU over the whole run
 *   heaploop   the same with the drill playing in Loop the whole time
 *
 * Per window: CPU seconds per Chromium process type (SystemInfo), main-thread
 * task/script/style/layout time (Performance.getMetrics), long tasks,
 * React commits and component renders (a devtools-hook stub that counts
 * fibers with PerformedWork), and in a short trace afterwards the frames
 * drawn and paints per second, plus a CPU profile's top self time.
 *
 * Needs a production build serving the harness (names readable with
 * `next build --no-mangling`):
 *
 *   JARRE_PERF_LESSON=<lesson.json> npx next start -p 3107
 *   PLAYWRIGHT_MODULE=<path to playwright/index.mjs> CHROME_PATH=<Chrome for Testing> \
 *     node scripts/perf/measure-learn.mjs --url http://localhost:3107 --label before --scenarios rest,drill
 *
 * Playwright is not a dependency of this repo: point PLAYWRIGHT_MODULE at
 * any install. CHROME_PATH: a full Chrome (new headless, GPU), not the
 * headless shell.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const BASE = args.url ?? 'http://localhost:3107';
const LABEL = args.label ?? 'run';
// A background tab cannot be emulated headless (every page reports "visible"), so there is no hidden scenario.
const SCENARIOS = (args.scenarios ?? 'rest,drill,repeat,interview').split(',');
const OUT = args.out ?? join(process.cwd(), 'results');
const HEAP_MINUTES = (args.heapMinutes ?? '0,2,5,10').split(',').map(Number);
const DRILL = 's1-1-definicion';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Installed before any page script: React devtools hook stub + long-task log. */
const INIT = () => {
  const counts = new Map();
  let commits = 0;
  let fibers = 0;
  const COMPONENT_TAGS = new Set([0, 1, 11, 14, 15]);
  const nameOf = (f) => {
    const t = f.type;
    if (!t) return '?';
    if (typeof t === 'function') return t.displayName || t.name || 'anon';
    if (typeof t === 'object') {
      const inner = t.render || t.type;
      return t.displayName || (inner && (inner.displayName || inner.name)) || 'anon';
    }
    return String(t);
  };
  const walk = (fiber) => {
    // Only subtrees React touched in this commit: an untouched one keeps the same child pointer.
    const stack = [fiber];
    while (stack.length) {
      const f = stack.pop();
      if (COMPONENT_TAGS.has(f.tag) && (f.flags & 1) === 1) {
        fibers++;
        const n = nameOf(f);
        counts.set(n, (counts.get(n) ?? 0) + 1);
      }
      if (f.sibling) stack.push(f.sibling);
      if (f.child && !(f.alternate && f.alternate.child === f.child)) stack.push(f.child);
    }
  };
  let nextId = 1;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    isDisabled: false,
    inject(r) { const id = nextId++; this.renderers.set(id, r); return id; },
    onCommitFiberRoot(_id, root) { commits++; try { walk(root.current); } catch { /* measuring only */ } },
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onScheduleFiberRoot() {},
    checkDCE() {},
    sub() { return () => {}; },
    on() {}, off() {}, emit() {},
  };
  const longtasks = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) longtasks.push(e.duration); })
      .observe({ type: 'longtask', buffered: true });
  } catch { /* unsupported */ }
  window.__perf = {
    reset() { counts.clear(); commits = 0; fibers = 0; longtasks.length = 0; },
    read() {
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
      return { commits, fibers, top, longtasks: longtasks.length, longtaskMs: longtasks.reduce((a, b) => a + b, 0) };
    },
  };
};

/** A recognizer that "hears" the drill text a few words at a time, like a person reading it. */
const FAKE_RECOGNIZER = () => {
  class FakeRecognition {
    constructor() { this.lang = 'en-US'; this.continuous = false; this.interimResults = false; this._t = null; }
    start() {
      const words = 'Data integrity means that clinical trial information is complete consistent and accurate throughout its whole life cycle'.split(' ');
      let i = 0;
      setTimeout(() => this.onstart?.(), 50);
      this._t = setInterval(() => {
        i = Math.min(words.length, i + 1);
        const transcript = words.slice(0, i).join(' ');
        const alt = { transcript, confidence: 0.9 };
        const result = Object.assign([alt], { isFinal: false });
        this.onresult?.({ resultIndex: 0, results: Object.assign([result], { length: 1 }) });
        if (i === words.length) i = 0;
      }, 250);
    }
    stop() { clearInterval(this._t); setTimeout(() => this.onend?.(), 20); }
    abort() { clearInterval(this._t); setTimeout(() => this.onend?.(), 20); }
    addEventListener() {}
    removeEventListener() {}
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
};

async function cpuByType(browserCdp) {
  const { processInfo } = await browserCdp.send('SystemInfo.getProcessInfo');
  const out = {};
  for (const p of processInfo) out[p.type] = (out[p.type] ?? 0) + p.cpuTime;
  return out;
}

async function mainThread(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}

async function frames(page, cdp, seconds = 5) {
  const events = [];
  const onData = (e) => events.push(...e.value);
  cdp.on('Tracing.dataCollected', onData);
  const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', {
    categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame',
    transferMode: 'ReportEvents',
  });
  await sleep(seconds * 1000);
  await cdp.send('Tracing.end');
  await done;
  cdp.off('Tracing.dataCollected', onData);
  const count = (n) => events.filter((e) => e.name === n).length;
  return {
    drawFramePerSec: +(count('DrawFrame') / seconds).toFixed(1),
    paintPerSec: +(count('Paint') / seconds).toFixed(1),
    rafPerSec: +(count('FireAnimationFrame') / seconds).toFixed(1),
    timerPerSec: +(count('TimerFire') / seconds).toFixed(1),
  };
}

async function layers(cdp) {
  let latest = null;
  const on = (e) => { latest = e.layers ?? latest; };
  cdp.on('LayerTree.layerTreeDidChange', on);
  await cdp.send('LayerTree.enable');
  await sleep(1500);
  await cdp.send('LayerTree.disable');
  cdp.off('LayerTree.layerTreeDidChange', on);
  if (!latest) return null;
  const drawn = latest.filter((l) => l.drawsContent);
  return { layers: latest.length, drawing: drawn.length, drawnMpx: +(drawn.reduce((a, l) => a + l.width * l.height, 0) / 1e6).toFixed(2) };
}

/** A CPU profile of the main thread: self time by function, top entries. */
async function profile(cdp, seconds = 10) {
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await sleep(seconds * 1000);
  const { profile: p } = await cdp.send('Profiler.stop');
  await cdp.send('Profiler.disable');
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = p.timeDeltas;
  for (let i = 0; i < p.samples.length; i++) {
    const n = byId.get(p.samples[i]);
    const f = n.callFrame;
    const file = (f.url || '').split('/').pop().split('?')[0];
    const key = `${f.functionName || '(anon)'} ${file}`.trim();
    self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0));
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  return [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, us]) => `${((100 * us) / total).toFixed(1)}% ${k}`);
}

/** One measurement window: CPU, main thread, long tasks, React. */
async function window_(page, cdp, browserCdp, seconds) {
  await page.evaluate(() => window.__perf?.reset());
  const cpu0 = await cpuByType(browserCdp);
  const m0 = await mainThread(cdp);
  const t0 = Date.now();
  await sleep(seconds * 1000);
  const wall = (Date.now() - t0) / 1000;
  const cpu1 = await cpuByType(browserCdp);
  const m1 = await mainThread(cdp);
  const react = await page.evaluate(() => window.__perf?.read());
  const pct = (a, b) => +((100 * (b - a)) / wall).toFixed(1);
  const cpu = Object.fromEntries(Object.keys(cpu1).map((k) => [k, pct(cpu0[k] ?? 0, cpu1[k])]));
  cpu.total = +Object.values(cpu).reduce((a, b) => a + b, 0).toFixed(1);
  return {
    seconds: +wall.toFixed(1),
    cpuPctOfOneCore: cpu,
    mainThreadPct: {
      task: pct(m0.TaskDuration, m1.TaskDuration),
      script: pct(m0.ScriptDuration, m1.ScriptDuration),
      style: pct(m0.RecalcStyleDuration, m1.RecalcStyleDuration),
      layout: pct(m0.LayoutDuration, m1.LayoutDuration),
    },
    styleRecalcsPerSec: +((m1.RecalcStyleCount - m0.RecalcStyleCount) / wall).toFixed(1),
    layoutsPerSec: +((m1.LayoutCount - m0.LayoutCount) / wall).toFixed(1),
    longTasks: react ? { count: react.longtasks, ms: Math.round(react.longtaskMs) } : null,
    react: react
      ? { commitsPerSec: +(react.commits / wall).toFixed(1), componentRendersPerSec: +(react.fibers / wall).toFixed(1), top: react.top.map(([n, c]) => `${n} ${(c / wall).toFixed(1)}/s`) }
      : null,
    heapMB: +(m1.JSHeapUsedSize / 1e6).toFixed(1),
    domNodes: m1.Nodes,
    listeners: m1.JSEventListeners,
  };
}

async function open(browser, path, { recognizer = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  await context.grantPermissions(['microphone'], { origin: BASE });
  await context.addInitScript(INIT);
  if (recognizer) await context.addInitScript(FAKE_RECOGNIZER);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'timeTicks' });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await sleep(5000); // intro, typewriter, fonts
  return { context, page, cdp, errors };
}

async function scenario(browser, browserCdp, name) {
  const learn = '/learn/perf-harness?step=learn';
  const practice = (mode) => `/learn/perf-harness?step=practice&drill=${DRILL}&mode=${mode}`;
  if (name === 'rest') {
    const s = await open(browser, learn);
    const w = await window_(s.page, s.cdp, browserCdp, 60);
    const f = await frames(s.page, s.cdp);
    const l = await layers(s.cdp);
    const p = await profile(s.cdp);
    await s.context.close();
    return { ...w, frames: f, layerTree: l, profile: p, errors: s.errors };
  }
  if (name === 'drill') {
    const s = await open(browser, practice('listen'));
    await s.page.getByRole('button', { name: 'Reproducir' }).first().click();
    await sleep(1000);
    const playing = await s.page.getByRole('button', { name: 'Pausar' }).count();
    const w = await window_(s.page, s.cdp, browserCdp, 20);
    const f = await frames(s.page, s.cdp, 4);
    const p = await profile(s.cdp, 6);
    await s.context.close();
    return { playing: playing > 0, ...w, frames: f, profile: p, errors: s.errors };
  }
  if (name === 'repeat') {
    const s = await open(browser, practice('repeat'), { recognizer: true });
    await s.page.getByRole('button', { name: /Hablar|Grabarme/ }).first().click();
    await sleep(1000);
    const listening = await s.page.getByRole('button', { name: /Terminar/ }).count();
    const w = await window_(s.page, s.cdp, browserCdp, 30);
    const f = await frames(s.page, s.cdp);
    const p = await profile(s.cdp, 6);
    await s.context.close();
    return { listening: listening > 0, ...w, frames: f, profile: p, errors: s.errors };
  }
  if (name === 'interview') {
    const s = await open(browser, '/learn/perf-harness?step=interview');
    const w = await window_(s.page, s.cdp, browserCdp, 30);
    const f = await frames(s.page, s.cdp);
    await s.context.close();
    return { ...w, frames: f, errors: s.errors };
  }
  if (name === 'hover') {
    // The sidebar tutor: animates under the pointer, then settles and stops.
    const s = await open(browser, learn);
    const box = await s.page.getByRole('button', { name: 'Open voice tutor session' }).first().boundingBox();
    await s.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await sleep(1000);
    const hovered = await window_(s.page, s.cdp, browserCdp, 5);
    const hoveredFrames = await frames(s.page, s.cdp, 3);
    await s.page.mouse.move(200, 400, { steps: 5 });
    await sleep(6000);
    const after = await window_(s.page, s.cdp, browserCdp, 10);
    const afterFrames = await frames(s.page, s.cdp, 3);
    await s.context.close();
    return {
      hovered: { cpu: hovered.cpuPctOfOneCore, mainThread: hovered.mainThreadPct, frames: hoveredFrames },
      sixSecondsAfterLeaving: { cpu: after.cpuPctOfOneCore, mainThread: after.mainThreadPct, frames: afterFrames },
      errors: s.errors,
    };
  }
  if (name === 'heap' || name === 'heaploop') {
    // heaploop: the drill playing in Loop the whole time (Practice · Escuchar).
    const s = await open(browser, name === 'heap' ? learn : practice('listen'));
    if (name === 'heaploop') {
      await s.page.getByRole('button', { name: 'Loop', exact: true }).first().click();
      await s.page.getByRole('button', { name: 'Reproducir' }).first().click();
      await sleep(1000);
    }
    const samples = [];
    const cpu0 = await cpuByType(browserCdp);
    const t0 = Date.now();
    for (const min of HEAP_MINUTES) {
      const wait = t0 + min * 60_000 - Date.now();
      if (wait > 0) await sleep(wait);
      await s.cdp.send('HeapProfiler.collectGarbage');
      const m = await mainThread(s.cdp);
      samples.push({ minute: min, heapMB: +(m.JSHeapUsedSize / 1e6).toFixed(2), domNodes: m.Nodes, listeners: m.JSEventListeners });
      console.error(`  heap ${min} min: ${samples.at(-1).heapMB} MB`);
    }
    const cpu1 = await cpuByType(browserCdp);
    const wall = (Date.now() - t0) / 1000;
    const cpu = Object.fromEntries(Object.keys(cpu1).map((k) => [k, +((100 * (cpu1[k] - (cpu0[k] ?? 0))) / wall).toFixed(1)]));
    cpu.total = +Object.values(cpu).reduce((a, b) => a + b, 0).toFixed(1);
    const stillPlaying = name === 'heaploop' ? await s.page.getByRole('button', { name: 'Pausar' }).count() > 0 : undefined;
    await s.context.close();
    return { samples, cpuPctOfOneCore: cpu, stillPlaying, errors: s.errors };
  }
  throw new Error(`unknown scenario ${name}`);
}

const browser = await chromium.launch({
  headless: true,
  // Full Chrome for Testing in new headless mode (same renderer and GPU path as a window).
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const browserCdp = await browser.newBrowserCDPSession();
const gpu = await browserCdp.send('SystemInfo.getInfo').then((i) => ({
  device: i.gpu.devices?.[0]?.deviceString ?? null,
  compositing: i.gpu.featureStatus?.gpu_compositing,
  canvas: i.gpu.featureStatus?.['2d_canvas'],
})).catch(() => null);
const results = { label: LABEL, url: BASE, at: new Date().toISOString(), gpu, scenarios: {} };
try {
  for (const name of SCENARIOS) {
    console.error(`${LABEL}: ${name}…`);
    results.scenarios[name] = await scenario(browser, browserCdp, name);
    console.error(JSON.stringify(results.scenarios[name]));
  }
} finally {
  await browser.close();
}
mkdirSync(OUT, { recursive: true });
const file = join(OUT, `${LABEL}-${SCENARIOS.join('+')}.json`);
writeFileSync(file, JSON.stringify(results, null, 2));
console.error(`→ ${file}`);

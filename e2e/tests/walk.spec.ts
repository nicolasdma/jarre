/**
 * The walk: every screen and control of the main flows, as the test user.
 * Runs once per viewport project (desktop-1440, mobile-390).
 *
 * Each step is recorded by the harness (errors, failed requests, timings,
 * screenshot); `walk.sweep()` clicks every button of a region once.
 * Deep links (`?step=…`) open each lesson step so one broken step does not
 * hide the next; the in-step "next" buttons are clicked too.
 */
import type { Locator, Page } from '@playwright/test';
import { expect, expectNoBrokenSteps, test } from './harness';

const V2 = '3y-health-tecnica-v2';
const REPASO = '3y-health-tecnica-repaso';
const OLDER = '3y-health';

/** Step navigator labels: sweeps leave them to the scripted path. */
// Both label families the lesson has had: Resumen/Entender/Decirlo/Ensayar and Activar/Aprender/Practicar/Tutor de voz/Evaluar/Entrevista/Coding en vivo.
const STEP_NAV = /^✓?\s*(resumen|entender|decirlo|ensayar|evaluación por voz|simulacro|activar|aprender|practicar|tutor de voz|evaluar|entrevista|coding en vivo)/i;
const NEXT = /^(siguiente|(empezar|seguir): (entender|aprender)|aprender\s*→|simulacro de entrevista\s*→)/i;
/** The summary's call to action: "Empezar: Entender, parte 1", or "Seguir: …" once the lesson was started. */
const START_READING = /^((empezar|seguir): (entender|aprender)|aprender\s*→)/i;
/** What stands between a section and its text: a before-reading question or an intro. */
const SKIP_TO_TEXT = /leer directamente|just read|ir al contenido/i;

async function open(page: Page, path: string) {
  // Leave the way a person does, not 50 ms after the last tap: the lesson saves progress 1 s after a change,
  // and a goto in that second cancels it (a "Failed to fetch" that is the walk's, not the learner's).
  if (/^https?:/.test(page.url())) {
    await page.waitForTimeout(1100);
    await page.waitForLoadState('networkidle', { timeout: 3_000 }).catch(() => {});
  }
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

/** A clickable control by its accessible name, whatever its role (button, radio, tab, link). */
function control(page: Page, name: RegExp): Locator {
  return page
    .getByRole('button', { name })
    .or(page.getByRole('radio', { name }))
    .or(page.getByRole('tab', { name }))
    .or(page.getByRole('link', { name }))
    .filter({ visible: true })
    .first();
}

/** Clicks it when present; returns whether it was. */
async function tapIfPresent(walk: { tap: (l: Locator, n?: string) => Promise<number> }, l: Locator, label: string): Promise<boolean> {
  if (!(await l.isVisible({ timeout: 1500 }).catch(() => false))) return false;
  await walk.tap(l, label);
  return true;
}

/** After a voice start: the microphone primer, when the app shows one before asking the browser. */
async function allowMicIfAsked(page: Page, walk: { tap: (l: Locator, n?: string) => Promise<number> }) {
  await tapIfPresent(walk, control(page, /permitir el micr[oó]fono|allow (the )?microphone/i), 'permitir el micrófono');
}

/** The lesson's content column (not the header, not the step navigator). */
function content(page: Page): Locator {
  return page.locator('#main-content');
}

test('app shell: home, library, system, profile', async ({ page, walk }) => {
  await walk.step('home redirects to library', async () => {
    await open(page, '/');
    await expect(page).toHaveURL(/\/library/);
  });
  await walk.step('library', async () => {
    await expect(page.getByText(/3Y Health · Ronda 1 v2/).first()).toBeVisible();
  });
  await walk.step('library: tabs and filters', async () => {
    await walk.sweep(page.locator('#main-content'), {
      deny: new RegExp(`${STEP_NAV.source}|agregar a mi currícula|^(article|book|paper|lecture)\\b`, 'i'),
      max: 25,
    });
  });
  await walk.step('library: language switch (English, back to Español)', async () => {
    await open(page, '/library');
    const en = page.getByRole('button', { name: /english/i }).first();
    if (await en.isVisible().catch(() => false)) {
      await walk.tap(en, 'english');
      await walk.tap(page.getByRole('button', { name: /español/i }).first(), 'español');
    }
  });
  await walk.step('library: open the lesson card', async () => {
    await open(page, '/library');
    await page.getByRole('tab', { name: /^ia$/i }).click({ timeout: 3000 }).catch(() => {});
    await page.getByRole('button', { name: /^todas/i }).click({ timeout: 3000 }).catch(() => {});
    await walk.tap(page.getByText(/3Y Health · Ronda 1 v2/).first(), 'lesson card');
    await page.waitForURL(new RegExp(`/(learn|resource)/${V2}`), { timeout: 30_000 }).catch(async () => {
      // The card may expand with REPASAR/PRACTICAR/EVALUAR first.
      await walk.tap(page.getByRole('button', { name: /^repasar$/i }).first(), 'card: repasar');
      await page.waitForURL(new RegExp(`/(learn|resource)/${V2}`), { timeout: 30_000 });
    });
  });
  await walk.step('review (repaso) page', async () => {
    await open(page, '/review');
    await expect(page.getByRole('button', { name: /comenzar repaso/i })).toBeVisible();
  });
  await walk.step('mi sistema', async () => {
    await open(page, '/mi-sistema');
  });
  await walk.step('mi sistema: buttons', async () => {
    await walk.sweep(page.locator('#main-content'), { max: 20 });
  });
  await walk.step('profile (settings redirects here)', async () => {
    await open(page, '/settings');
    await expect(page).toHaveURL(/\/profile/);
  });
  await walk.step('profile: buttons', async () => {
    await walk.sweep(page.locator('#main-content'), { max: 20 });
  });
  expectNoBrokenSteps(walk);
});

test('lesson v2: summary, reading, before-reading question, quiz, code tabs', async ({ page, walk }) => {
  const base = `/learn/${V2}`;
  /** Opens a reading section from the table of contents ("03Two Sum…"). */
  const section = async (n: string) => {
    if (!/step=learn/.test(page.url())) await open(page, `${base}?step=learn`);
    // The table of contents is a sidebar on desktop and a slide-over behind "Table of contents" on the phone
    // (the column also lists the other sections, but never the open one).
    const entry = page.getByRole('button', { name: new RegExp(`^${n}\\s?\\S`) }).filter({ visible: true }).first();
    if (!(await entry.isVisible().catch(() => false))) await walk.tap(page.getByRole('button', { name: /^table of contents$/i }).filter({ visible: true }).first(), 'table of contents');
    await walk.tap(entry, `section ${n}`);
    await page.waitForTimeout(500);
  };
  await walk.step('summary (activate)', async () => {
    await open(page, `${base}?step=activate`);
    await expect(page.getByRole('button', { name: START_READING }).first()).toBeVisible();
    if (!(await page.locator('[data-testid="lesson-summary"]').isVisible().catch(() => false))) walk.note('no lesson summary block on the first step');
  });
  await walk.step('summary: buttons', async () => {
    await walk.sweep(content(page), { deny: new RegExp(`${STEP_NAV.source}|${NEXT.source}`, 'i'), max: 15 });
  });
  await walk.step('summary → reading', async () => {
    await open(page, `${base}?step=activate`);
    await walk.tap(page.getByRole('button', { name: START_READING }), 'empezar/seguir: entender');
    await expect(page).toHaveURL(/step=learn/);
  });
  await walk.step('reading: section 01 quiz (multiple choice + true/false)', async () => {
    await section('01');
    await page.getByRole('button', { name: SKIP_TO_TEXT }).first().click({ timeout: 2000 }).catch(() => {});
    await tapIfPresent(walk, page.locator('#intro-skip'), 'intro: entendido');
    await tapIfPresent(walk, control(page, SKIP_TO_TEXT), 'skip to text');
    // The quiz's own options (role radio inside its radiogroup): /^A.../ alone also matched the step navigator's "Aprender".
    const options = page.getByRole('radiogroup', { name: /opciones de respuesta/i }).filter({ visible: true }).first().getByRole('radio');
    await walk.tap(options.first(), 'quiz option A');
    if (!(await tapIfPresent(walk, control(page, /^(verificar|comprobar|check)$/i), 'quiz verificar'))) walk.note('no check button after choosing a quiz option');
    if (!(await tapIfPresent(walk, control(page, /^(verdadero|true)$/i), 'quiz verdadero'))) walk.note('no true/false question in section 01');
  });
  await walk.step('reading: section 02 before-reading question', async () => {
    await section('02');
    const skip = control(page, SKIP_TO_TEXT);
    if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) await walk.tap(skip, 'leer directamente');
    else walk.note('no before-reading question on section 02 (removed, or already answered)');
  });
  await walk.step('reading: section 03 JS/TS code tabs', async () => {
    await section('03');
    await page.getByRole('button', { name: SKIP_TO_TEXT }).first().click({ timeout: 2000 }).catch(() => {});
    const tabs = page.locator('[data-testid="code-tabs"] [role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 15_000 });
    const n = await tabs.count();
    for (let i = 0; i < n; i++) await walk.tap(tabs.nth(i), `code tab ${(await tabs.nth(i).innerText()).trim()}`);
  });
  await walk.step('reading: section 03 code trace (paso a paso)', async () => {
    const launcher = page.locator('[data-testid="trace-launcher"]').filter({ visible: true }).first();
    if (!(await launcher.count())) {
      walk.note('no "Ver paso a paso" block in section 03');
      return;
    }
    await walk.tap(launcher, 'ver paso a paso');
    const trace = page.locator('[data-testid="code-trace"]').first();
    await expect(trace).toBeVisible({ timeout: 15_000 });
    const before = await trace.locator('[data-testid="code-trace-caption"]').innerText();
    for (let i = 0; i < 3; i++) await walk.tap(trace.locator('[data-testid="code-trace-next"]'), `trace: siguiente ${i + 1}`);
    expect(await trace.locator('[data-testid="code-trace-caption"]').innerText(), 'the caption follows the steps').not.toBe(before);
    await walk.sweep(trace, { max: 12 });
  });
  await walk.step('reading: section 03 code trace closes back to its button', async () => {
    const launcher = page.locator('[data-testid="trace-launcher"]').filter({ visible: true }).first();
    if (await launcher.isVisible().catch(() => false)) await walk.tap(launcher, 'ver paso a paso (again)');
    const close = page.locator('[data-testid="code-trace-close"]').filter({ visible: true }).first();
    if (!(await close.isVisible({ timeout: 10_000 }).catch(() => false))) {
      walk.note('no open trace to close');
      return;
    }
    await walk.tap(close, 'cerrar paso a paso');
    await expect(page.locator('[data-testid="trace-launcher"]').filter({ visible: true }).first()).toBeFocused();
  });
  await walk.step('reading: section 03 code exercise (open, run, verify)', async () => {
    const list = page.locator('[data-testid="section-exercises"]');
    await list.scrollIntoViewIfNeeded({ timeout: 15_000 });
    await walk.tap(list.getByRole('button', { name: /guiado/i }).first(), 'exercise: guiado');
    const exercise = page.locator('[data-testid="code-exercise"]').first();
    await expect(exercise).toBeVisible({ timeout: 15_000 });
    const buttons = exercise.locator('button');
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    for (let i = 0; i < labels.length; i++) {
      if (!labels[i] || /solución|solution|reiniciar|reset/i.test(labels[i])) continue;
      await walk.tap(buttons.nth(i), `exercise: ${labels[i]}`);
      await page.waitForTimeout(800);
    }
    await expect(exercise.locator('[data-testid="run-output"]').first()).toBeVisible({ timeout: 15_000 });
  });
  await walk.step('reading: section voice tutor entry (mocked Live)', async () => {
    await open(page, `${base}?step=learn`);
    await section('01');
    await page.getByRole('button', { name: SKIP_TO_TEXT }).first().click({ timeout: 2000 }).catch(() => {});
    const entry = control(page, /iniciar sesión de voz|charlarlo con el tutor/i);
    if (!(await entry.isVisible({ timeout: 3000 }).catch(() => false))) {
      walk.note('no "Iniciar sesión de voz" in the reading section (the tutor lives in Ensayar)');
      return;
    }
    // The entry starts the session itself; older versions opened a panel with its own start button first.
    await walk.expectLiveSession(async () => {
      const before = walk.liveSockets();
      await walk.tap(entry, 'tutor from the section');
      await allowMicIfAsked(page, walk);
      await page.waitForTimeout(1500);
      if (walk.liveSockets() === before) await tapIfPresent(walk, control(page, /^(empezar|comenzar)/i), 'empezar (section tutor)');
    });
  });
  await walk.step('reading: section 03 every button', async () => {
    await open(page, `${base}?step=learn`);
    await section('03');
    await page.getByRole('button', { name: SKIP_TO_TEXT }).first().click({ timeout: 2000 }).catch(() => {});
    await walk.sweep(content(page), { deny: new RegExp(`${STEP_NAV.source}|${NEXT.source}|^\\d{2}\\s?\\S|sesión de voz`, 'i'), max: 30 });
  });
  await walk.step('reading: every section in turn', async () => {
    await open(page, `${base}?step=learn`);
    for (let i = 1; i <= 15; i++) {
      const n = String(i).padStart(2, '0');
      const b = page.getByRole('button', { name: new RegExp(`^${n}\\s?\\S`) }).filter({ visible: true }).first();
      const toc = page.getByRole('button', { name: /^table of contents$/i }).filter({ visible: true }).first();
      if (!(await b.isVisible().catch(() => false)) && (await toc.isVisible().catch(() => false))) await walk.tap(toc, 'table of contents');
      if (!(await b.isVisible().catch(() => false))) break;
      await walk.tap(b, `section ${n}`);
      await page.waitForTimeout(300);
    }
  });
  expectNoBrokenSteps(walk);
});

test('lesson v2: practice (every drill mode)', async ({ page, walk }) => {
  const base = `/learn/${V2}`;
  const trainer = () => page.locator('[data-testid="drill-trainer"]');
  const mode = (name: RegExp) => page.locator('[data-testid="drill-trainer"] button, [data-testid="drill-trainer"] [role="tab"], [data-testid="practice-step"] a, [data-testid="practice-step"] button').filter({ hasText: name }).first();

  await walk.step('practice: open', async () => {
    await open(page, `${base}?step=practice`);
    await expect(trainer()).toBeVisible();
    await expect(page.locator('[data-testid="drill-title"]')).toBeVisible();
  });
  const modes: [string, RegExp, string][] = [
    ['listen', /^(\d\s*)?escuchar$/i, 'listen'],
    ['copy', /^copiar/i, 'copy'],
    ['repeat', /^(\d\s*)?repetir$/i, 'repeat'],
    ['phrase by phrase', /^frase por frase$/i, 'sentences'],
    ['question → answer', /pregunta.*respuesta|sin mirar/i, 'recall'],
  ];
  for (const [label, tab, param] of modes) {
    await walk.step(`practice: ${label} mode`, async () => {
      // The mode controls changed shape over time (tabs, numbered steps, "more ways" links): click it when
      // there is one with that name, and open the mode by its link otherwise (the URL contract is stable).
      if (!(await tapIfPresent(walk, mode(tab), `mode ${label}`))) {
        walk.note(`no "${label}" control in the trainer: opened by link`);
        await open(page, `${base}?step=practice&mode=${param}`);
      }
      await expect(trainer()).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`mode=${param}`));
    });
    await walk.step(`practice: ${label} controls`, async () => {
      if (param === 'copy') {
        const box = trainer().locator('textarea, input[type="text"]').first();
        if (await box.isVisible().catch(() => false)) await box.fill('data integrity means the record is complete');
      }
      await walk.sweep(trainer(), {
        deny: /drill anterior|drill siguiente|frase anterior|frase siguiente|^(\d\s*)?(escuchar|copiar|repetir|frase por frase|pregunta|sin mirar)/i,
        max: 14,
        restore: async () => {
          await open(page, `${base}?step=practice&mode=${param}`);
        },
      });
    });
  }
  await walk.step('practice: next / previous drill', async () => {
    await walk.tap(trainer().getByRole('button', { name: /drill siguiente|frase siguiente/i }).first(), 'next drill');
    await walk.tap(trainer().getByRole('button', { name: /drill anterior|frase anterior/i }).first(), 'previous drill');
  });
  await walk.step('practice: drill list (third drill)', async () => {
    const nav = page.locator('[data-testid="practice-nav"] button');
    if ((await nav.count()) > 2 && (await nav.nth(2).isVisible())) await walk.tap(nav.nth(2), 'drill list #3');
  });
  await walk.step('practice: next step button', async () => {
    await walk.tap(control(page, /^(siguiente: ensayar|simulacro de entrevista\s*→)/i), 'next step');
    await expect(page).toHaveURL(/step=(practice-eval|ensayar|interview)/);
  });
  expectNoBrokenSteps(walk);
});

test('lesson v2: voice tutor, voice evaluation, interview, coding mock', async ({ page, walk }) => {
  const base = `/learn/${V2}`;
  await walk.step('tutor (practice-eval): entry', async () => {
    await open(page, `${base}?step=practice-eval`);
    await tapIfPresent(walk, control(page, /^con el tutor/i), 'option: con el tutor');
    await expect(control(page, /^(comenzar pr[aá]ctica|empezar)$/i)).toBeVisible();
  });
  await walk.step('tutor: start voice session (mocked Live)', async () => {
    await walk.expectLiveSession(async () => {
      await walk.tap(control(page, /^(comenzar pr[aá]ctica|empezar)$/i), 'empezar (tutor)');
      await allowMicIfAsked(page, walk);
    });
  });
  await walk.step('tutor: session controls', async () => {
    await walk.sweep(content(page), { deny: new RegExp(`${STEP_NAV.source}|${NEXT.source}`, 'i'), max: 10 });
  });
  await walk.step('tutor: prefer writing', async () => {
    await open(page, `${base}?step=practice-eval`);
    await walk.tap(control(page, /prefiero escribir/i), 'prefiero escribir');
    await page.waitForTimeout(800);
  });
  await walk.step('voice evaluation: entry', async () => {
    await open(page, `${base}?step=evaluate`);
    await tapIfPresent(walk, control(page, /^evaluación por voz$/i), 'evaluación por voz');
    await expect(control(page, /^(comenzar conversaci[oó]n|empezar)$/i)).toBeVisible();
  });
  await walk.step('voice evaluation: prefer writing', async () => {
    await walk.tap(control(page, /prefiero escribir/i), 'prefiero escribir');
    await page.waitForTimeout(800);
    await walk.sweep(content(page), { deny: new RegExp(`${STEP_NAV.source}|${NEXT.source}|enviar|submit`, 'i'), max: 10 });
  });
  await walk.step('interview: setup', async () => {
    await open(page, `${base}?step=interview`);
    await expect(page.locator('[data-testid="interview-mode"]')).toBeVisible();
    const radios = page.locator('[data-testid="interview-mode"] [role="radio"]');
    const n = await radios.count();
    for (let i = 0; i < n; i++) await walk.tap(radios.nth(i), `interview option ${i + 1}`);
  });
  await walk.step('interview: start (mocked Live)', async () => {
    const mode = page.locator('[data-testid="interview-mode"]');
    await walk.expectLiveSession(async () => {
      await walk.tap(mode.getByRole('button', { name: /^empezar( entrevista)?$/i }).first(), 'empezar entrevista');
      await allowMicIfAsked(page, walk);
    });
  });
  await walk.step('interview: session controls', async () => {
    await walk.sweep(page.locator('[data-testid="interview-mode"]'), { max: 10 });
  });
  await walk.step('coding mock: setup', async () => {
    await open(page, `${base}?step=coding`);
    const mock = page.locator('[data-testid="coding-mock"]');
    await expect(mock).toBeVisible();
    await walk.tap(mock.getByRole('radio', { name: /two sum/i }), 'problem: two sum');
    const durations = mock.getByRole('radio', { name: /min/i });
    const n = await durations.count();
    for (let i = 0; i < n; i++) await walk.tap(durations.nth(i), `duration ${(await durations.nth(i).innerText()).trim()}`);
  });
  await walk.step('coding mock: start (mocked Live)', async () => {
    const mock = page.locator('[data-testid="coding-mock"]');
    await walk.tap(mock.getByRole('button', { name: /empezar simulacro/i }), 'empezar simulacro');
    await expect(page.locator('[data-testid="code-editor"]').first()).toBeVisible({ timeout: 20_000 });
  });
  await walk.step('coding mock: editor, run and verify', async () => {
    const editor = page.locator('[data-testid="code-editor"] .cm-content').first();
    if (await editor.isVisible().catch(() => false)) {
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type('\n// e2e');
    }
    await walk.sweep(page.locator('[data-testid="coding-mock"]'), { deny: /terminar|finish|end|salir|abandonar/i, max: 14, escape: false });
  });
  expectNoBrokenSteps(walk);
});

test('feed: posts, flip card, YouTube facade', async ({ page, walk }) => {
  await walk.step('feed: open', async () => {
    await open(page, `/learn/${V2}/feed`);
    await expect(page.getByRole('link', { name: /lección/i }).first()).toBeVisible();
  });
  await walk.step('feed: scroll through posts', async () => {
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => scrollTo(0, 0));
  });
  await walk.step('feed: post buttons', async () => {
    await walk.sweep(page.locator('body'), { deny: /^ir a |reproducir:|ver en youtube|términos/i, max: 12 });
  });
  await walk.step('feed: flip a card', async () => {
    const flip = page.getByRole('button', { name: /dar vuelta/i }).first();
    if (!(await flip.count())) {
      walk.note('no flashcard post in the loaded part of the feed');
      return;
    }
    await flip.scrollIntoViewIfNeeded();
    await walk.tap(flip, 'dar vuelta');
  });
  await walk.step('feed: YouTube facade (no player before it is needed)', async () => {
    await open(page, `/learn/${V2}/feed`);
    expect(await page.locator('iframe[src*="youtube"]').count(), 'YouTube iframes at load').toBe(0);
    const facade = page.getByRole('button', { name: /^reproducir:/i }).first();
    await expect(facade).toBeAttached({ timeout: 15_000 });
    await facade.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    // The feed may start the video on its own once the post is the visible one.
    if ((await page.locator('iframe[src*="youtube"]').count()) === 0) await walk.tap(facade, 'youtube facade');
    await expect(page.locator('iframe[src*="youtube"]').first()).toBeAttached({ timeout: 10_000 });
    const src = await page.locator('iframe[src*="youtube"]').first().getAttribute('src');
    if (!/youtube-nocookie\.com/.test(src ?? '')) throw new Error(`player is not youtube-nocookie: ${src}`);
  });
  await walk.step('feed: jump buttons', async () => {
    const jumps = page.getByRole('button', { name: /^ir a /i });
    const n = Math.min(await jumps.count(), 3);
    for (let i = 0; i < n; i++) await walk.tap(jumps.nth(i), `jump ${i + 1}`);
  });
  expectNoBrokenSteps(walk);
});

test('review deck', async ({ page, walk }) => {
  await walk.step('review: start', async () => {
    await open(page, '/review');
    await walk.tap(page.getByRole('button', { name: /comenzar repaso/i }), 'comenzar repaso');
    await page.waitForTimeout(1500);
  });
  await walk.step('review: card controls', async () => {
    // The phone's header menu would stay open over the card (escape is off here): leave it out.
    await walk.sweep(page.locator('#main-content'), { max: 12, escape: false, deny: /toggle menu/i });
  });
  await walk.step('review deck page', async () => {
    await open(page, '/review/deck');
  });
  await walk.step('review deck: controls', async () => {
    // The phone's header menu would stay open over the card (escape is off here): leave it out.
    await walk.sweep(page.locator('#main-content'), { max: 12, escape: false, deny: /toggle menu/i });
  });
  expectNoBrokenSteps(walk);
});

test('other lessons: repaso and the older lesson', async ({ page, walk }) => {
  for (const id of [REPASO, OLDER]) {
    await walk.step(`${id}: summary`, async () => {
      await open(page, `/learn/${id}?step=activate`);
      await expect(page.getByRole('button', { name: START_READING })).toBeVisible();
    });
    await walk.step(`${id}: reading`, async () => {
      await open(page, `/learn/${id}?step=learn`);
      await page.getByRole('button', { name: SKIP_TO_TEXT }).first().click({ timeout: 3000 }).catch(() => {});
    });
    await walk.step(`${id}: practice listen`, async () => {
      await open(page, `/learn/${id}?step=practice`);
      const play = page.locator('[data-testid="drill-trainer"]').getByRole('button', { name: /^reproducir$/i });
      await walk.tap(play, 'reproducir');
      await page.waitForTimeout(1200);
    });
    await walk.step(`${id}: feed`, async () => {
      await open(page, `/learn/${id}/feed`);
    });
  }
  expectNoBrokenSteps(walk);
});

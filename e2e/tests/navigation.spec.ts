/**
 * Navigation inside a lesson, the way a learner expects it (owner, 2026-11-18):
 *
 * - Changing section opens it with its heading at the top of the screen, just
 *   under the sticky header, the first time in a visit; coming back to a
 *   section restores where the learner had scrolled in it. Every way of
 *   changing section: the table of contents, the ← → arrows ("5 de 15"), the
 *   dashed step bar, a collapsed section's title and the "Siguiente sección"
 *   button at the end of one.
 * - Moving to another drill starts it in Escuchar, whatever mode the previous
 *   one was in (next / previous, the list, the copy mode's "Siguiente").
 * - The page lands where the learner left it when they come back from the feed.
 *
 * Screenshots of the reported cases go to ~/Desktop/_revisar/jarre-navegacion/<NAV_SHOTS_TAG>/.
 */
import os from 'node:os';
import { join } from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, expectNoBrokenSteps, test } from './harness';

const V2 = '3y-health-tecnica-v2';
const BASE = `/learn/${V2}`;
const SHOTS = join(os.homedir(), 'Desktop', '_revisar', 'jarre-navegacion', process.env.NAV_SHOTS_TAG ?? 'after');
const SKIP_TO_TEXT = /leer directamente|just read|ir al contenido/i;
/** The owner's case: from this drill in Pregunta → respuesta to the next one. */
const DRILL_A = 'tt-06b-longest-substring-optimizar';
const DRILL_B_TITLE = /la complejidad, en voz alta/i;

interface Geometry {
  scrollTop: number;
  /** Bottom edge of the lesson's sticky header, in viewport pixels. */
  headerBottom: number;
  /** Top of the open section's heading row, in viewport pixels (null: no open section). */
  headingTop: number | null;
  title: string | null;
}

async function geometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const main = document.getElementById('main-content')!;
    let node: HTMLElement | null = main.parentElement;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    const scroller = node ?? (document.scrollingElement as HTMLElement);
    const header = main.querySelector<HTMLElement>('div.sticky.top-0');
    const open = main.querySelector<HTMLElement>('div.border-l-2.border-j-accent.pl-6.py-6');
    const heading = open?.firstElementChild as HTMLElement | null | undefined;
    return {
      scrollTop: Math.round(scroller.scrollTop),
      headerBottom: Math.round(header?.getBoundingClientRect().bottom ?? 0),
      headingTop: heading ? Math.round(heading.getBoundingClientRect().top) : null,
      title: heading?.textContent?.trim() ?? null,
    };
  });
}

/** Scrolls the lesson the way a finger or a wheel would (the scroll event fires). */
async function scrollBy(page: Page, dy: number) {
  await page.evaluate((d) => {
    const main = document.getElementById('main-content')!;
    let node: HTMLElement | null = main.parentElement;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    (node ?? (document.scrollingElement as HTMLElement)).scrollBy(0, d);
  }, dy);
  await page.waitForTimeout(250);
}

/** The open section's heading sits right under the sticky header, fully visible. */
async function expectHeadingAtTop(page: Page, n: string) {
  await page.waitForTimeout(400);
  const g = await geometry(page);
  expect(g.title, 'the open section').toMatch(new RegExp(`^${n}`));
  expect(g.headingTop, `heading of ${n} under the header (header ends at ${g.headerBottom})`).not.toBeNull();
  expect(g.headingTop!, `heading of ${n} not hidden behind the header`).toBeGreaterThanOrEqual(g.headerBottom - 1);
  expect(g.headingTop!, `heading of ${n} at the top, not further down`).toBeLessThanOrEqual(g.headerBottom + 64);
}

async function shot(page: Page, project: string, name: string) {
  await page.screenshot({ path: join(SHOTS, `${project}--${name}.png`) }).catch(() => {});
}

async function open(page: Page, path: string) {
  if (/^https?:/.test(page.url())) await page.waitForTimeout(1100);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
}

/** A section's entry in the table of contents (sidebar on desktop, slide-over on the phone): its sections list is the last one. */
async function tocEntry(page: Page, n: string): Promise<Locator> {
  const sidebar = page.locator('aside nav');
  let nav = sidebar;
  if (!(await sidebar.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^table of contents$/i }).filter({ visible: true }).first().click();
    nav = page.locator('div.fixed.right-0 nav');
    await expect(nav).toBeVisible();
  }
  return nav.locator('ul').last().locator('li').nth(Number(n) - 1).getByRole('button');
}

async function skipIntro(page: Page) {
  await page.getByRole('button', { name: SKIP_TO_TEXT }).filter({ visible: true }).first().click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(300);
}

test('lesson v2: section navigation keeps the place', async ({ page, walk }, info) => {
  const project = info.project.name;
  const phone = (page.viewportSize()?.width ?? 1440) < 1024;
  let rel1 = 0;
  let rel2 = 0;

  await walk.step('nav: open section 01 from the table of contents', async () => {
    await open(page, `${BASE}?step=learn`);
    await (await tocEntry(page, '01')).click();
    await skipIntro(page);
    await expectHeadingAtTop(page, '01');
  });
  await walk.step('nav: scroll down in 01, open 02 from the table of contents', async () => {
    await scrollBy(page, 1400);
    const g = await geometry(page);
    rel1 = g.headingTop! - g.headerBottom;
    await shot(page, project, '01-scrolled-in-section-01');
    await (await tocEntry(page, '02')).click();
    await skipIntro(page);
    await shot(page, project, '02-opened-section-02');
    await expectHeadingAtTop(page, '02');
  });
  await walk.step('nav: back to 01 restores where I was', async () => {
    await scrollBy(page, 600);
    const g = await geometry(page);
    rel2 = g.headingTop! - g.headerBottom;
    await (await tocEntry(page, '01')).click();
    await page.waitForTimeout(500);
    await shot(page, project, '03-back-to-section-01');
    const back = await geometry(page);
    expect(back.title).toMatch(/^01/);
    expect(Math.abs(back.headingTop! - back.headerBottom - rel1), `01 restored (was ${rel1}, now ${back.headingTop! - back.headerBottom})`).toBeLessThanOrEqual(40);
  });
  await walk.step('nav: and to 02 again restores 02', async () => {
    await (await tocEntry(page, '02')).click();
    await page.waitForTimeout(500);
    const back = await geometry(page);
    expect(back.title).toMatch(/^02/);
    expect(Math.abs(back.headingTop! - back.headerBottom - rel2), `02 restored (was ${rel2}, now ${back.headingTop! - back.headerBottom})`).toBeLessThanOrEqual(40);
  });
  if (phone) {
    await walk.step('nav: arrow → opens 03 at its heading', async () => {
      await page.getByRole('button', { name: /^sección siguiente$/i }).click();
      await skipIntro(page);
      await shot(page, project, '04-arrow-next-section-03');
      await expectHeadingAtTop(page, '03');
    });
    await walk.step('nav: dashed bar opens 05 at its heading', async () => {
      await page.getByRole('button', { name: /^5\.\s/ }).click();
      await skipIntro(page);
      await expectHeadingAtTop(page, '05');
    });
    await walk.step('nav: arrow ← opens 04 at its heading', async () => {
      await page.getByRole('button', { name: /^sección anterior$/i }).click();
      await skipIntro(page);
      await expectHeadingAtTop(page, '04');
    });
  }
  await walk.step('nav: a collapsed section title opens 06 at its heading', async () => {
    // The collapsed row in the reading column, not the table of contents.
    await page.locator('xpath=//main[@id="main-content"]//button[not(ancestor::aside) and not(ancestor::nav)]').filter({ hasText: /^\s*06/ }).first().click();
    await skipIntro(page);
    await expectHeadingAtTop(page, '06');
  });
  await walk.step('nav: focus moves to the new section heading', async () => {
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
    expect(focused, 'focus on the open section heading').toMatch(/^06/);
  });
  await walk.step('nav: "Siguiente sección" at the end of 06 opens 07 at its heading', async () => {
    const skipTutor = page.getByRole('button', { name: /^saltar al quiz$/i }).filter({ visible: true }).first();
    await skipTutor.click({ timeout: 5000 });
    await page.getByRole('button', { name: /comprueba tu comprensión/i }).filter({ visible: true }).first().click();
    const done = page.getByRole('button', { name: /^(saltar|siguiente sección\s*→)$/i }).filter({ visible: true }).first();
    await done.click({ timeout: 15_000 });
    await skipIntro(page);
    await expectHeadingAtTop(page, '07');
  });
  await walk.step('nav: back from the feed lands on the same place', async () => {
    await scrollBy(page, 900);
    const before = await geometry(page);
    await page.locator(`a[href="/learn/${V2}/feed"]`).first().click();
    await page.waitForURL(/\/feed/);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await scrollBy(page, 2500);
    await page.goBack();
    await page.waitForURL(new RegExp(`${BASE}(\\?|$)`));
    await page.waitForTimeout(1200);
    const after = await geometry(page);
    expect(after.title).toMatch(/^07/);
    expect(Math.abs(after.headingTop! - after.headerBottom - (before.headingTop! - before.headerBottom)), 'same place after back').toBeLessThanOrEqual(40);
  });
  expectNoBrokenSteps(walk);
});

test('lesson v2: a new drill starts in Escuchar', async ({ page, walk }, info) => {
  const project = info.project.name;
  const phone = (page.viewportSize()?.width ?? 1440) < 1024;
  const trainer = page.locator('[data-testid="practice-step"] [data-testid="drill-trainer"]');
  const selectedMode = () => trainer.locator('[role="tab"][aria-selected="true"]').innerText();

  await walk.step('drill: the owner\'s case, Pregunta → respuesta then next', async () => {
    await open(page, `${BASE}?step=practice&drill=${DRILL_A}&mode=recall`);
    await expect(trainer).toBeVisible();
    expect(await selectedMode()).toMatch(/pregunta/i);
    await shot(page, project, '05-drill-a-in-recall');
    await trainer.getByRole('button', { name: /^drill siguiente$/i }).click();
    await expect(trainer.locator('[data-testid="drill-title"]')).toHaveText(DRILL_B_TITLE);
    await page.waitForTimeout(300);
    await shot(page, project, '06-drill-b-after-next');
    expect(await selectedMode(), 'the next drill starts in Escuchar').toMatch(/^escuchar/i);
    await expect(page).toHaveURL(/mode=listen/);
  });
  await walk.step('drill: focus stays on the arrow after next', async () => {
    const label = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName);
    expect(label).toBe('Drill siguiente');
  });
  await walk.step('drill: Copiar, then previous starts in Escuchar', async () => {
    await trainer.getByRole('tab', { name: /^copiar/i }).click();
    await trainer.getByRole('button', { name: /^drill anterior$/i }).click();
    await page.waitForTimeout(300);
    expect(await selectedMode()).toMatch(/^escuchar/i);
  });
  await walk.step('drill: Repetir, then pick another from the list starts in Escuchar', async () => {
    await trainer.getByRole('tab', { name: /^repetir/i }).click();
    if (phone) {
      await page.getByRole('combobox', { name: /elegir drill/i }).selectOption({ index: 2 });
    } else {
      await page.locator('[data-testid="practice-nav"] button').nth(2).click();
    }
    await page.waitForTimeout(300);
    expect(await selectedMode()).toMatch(/^escuchar/i);
  });
  await walk.step('drill: Copiar to the end, "Siguiente" shows the next drill from its top', async () => {
    await trainer.getByRole('tab', { name: /^copiar/i }).click();
    await trainer.getByRole('textbox', { name: /copiá el texto/i }).fill('it is');
    await trainer.getByRole('button', { name: /^revisar/i }).click();
    const title = await trainer.locator('[data-testid="drill-title"]').innerText();
    await trainer.getByRole('button', { name: /^siguiente · enter$/i }).click();
    await expect(trainer.locator('[data-testid="drill-title"]')).not.toHaveText(title);
    await page.waitForTimeout(400);
    expect(await selectedMode()).toMatch(/^escuchar/i);
    const g = await geometry(page);
    const top = await trainer.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(top, `the new drill's top is on screen under the header (${g.headerBottom})`).toBeGreaterThanOrEqual(g.headerBottom - 40);
    expect(top).toBeLessThan((page.viewportSize()?.height ?? 800) / 2);
  });
  await walk.step('drill: under a reading section, another drill opens in Escuchar', async () => {
    await open(page, `${BASE}?step=learn`);
    const drills = page.locator('[data-testid="section-drills"]').first();
    if (!(await drills.count())) {
      await (await tocEntry(page, '06')).click();
      await skipIntro(page);
    }
    const rows = page.locator('[data-testid="section-drills"] li > button');
    await rows.first().click();
    const inline = page.locator('[data-testid="section-drills"] [data-testid="drill-trainer"]');
    await inline.getByRole('tab', { name: /^repetir/i }).click();
    if ((await rows.count()) < 2) {
      walk.note('only one drill under this section');
      return;
    }
    await rows.nth(1).click();
    await page.waitForTimeout(300);
    expect(await inline.locator('[role="tab"][aria-selected="true"]').innerText()).toMatch(/^escuchar/i);
    const g = await geometry(page);
    const top = await rows.nth(1).evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(top, 'the opened drill row is on screen').toBeGreaterThanOrEqual(g.headerBottom - 1);
  });
  expectNoBrokenSteps(walk);
});

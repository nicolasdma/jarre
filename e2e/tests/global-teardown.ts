/**
 * Merges the per-step records (report/raw/<project>.jsonl) into
 * e2e/report/latest.json and prints the ranked problems.
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import type { StepRecord } from './harness';
import { RAW_DIR, REPORT_DIR, SHOTS_DIR } from './paths';

const NET_LOG = join(process.env.JARRE_E2E_HOME ?? join(os.homedir(), '.cache', 'jarre-e2e'), 'net-guard.log');

export default async function globalTeardown() {
  if (!existsSync(RAW_DIR)) return;
  const steps: StepRecord[] = readdirSync(RAW_DIR)
    .filter((f) => f.endsWith('.jsonl'))
    .flatMap((f) =>
      readFileSync(join(RAW_DIR, f), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as StepRecord),
    );
  const meta = existsSync(join(REPORT_DIR, 'run-meta.json')) ? JSON.parse(readFileSync(join(REPORT_DIR, 'run-meta.json'), 'utf8')) : {};
  const where = (s: StepRecord) => `${s.project} · ${s.flow} › ${s.step}`;

  const broken = steps.filter((s) => !s.ok).map((s) => ({ where: where(s), url: s.url, error: s.error, screenshot: s.screenshot }));
  const consoleErrors = steps
    .filter((s) => s.consoleErrors.length || s.pageErrors.length)
    .map((s) => ({ where: where(s), url: s.url, pageErrors: s.pageErrors, consoleErrors: s.consoleErrors }));
  const failedRequests = steps
    .filter((s) => s.failedRequests.length)
    .map((s) => ({ where: where(s), requests: s.failedRequests }));
  const interactions = steps
    .flatMap((s) => s.interactions.map((i) => ({ where: where(s), label: i.label, ms: i.ms })))
    .sort((a, b) => b.ms - a.ms);
  const eventTiming = steps
    .filter((s) => s.eventTiming.maxMs > 0)
    .map((s) => ({ where: where(s), maxMs: s.eventTiming.maxMs, worst: s.eventTiming.worst }))
    .sort((a, b) => b.maxMs - a.maxMs);
  const pages = steps
    .filter((s) => s.totalTransferredKB > 0)
    .map((s) => ({ where: where(s), url: s.url, jsKB: s.jsTransferredKB, totalKB: s.totalTransferredKB, lcpMs: s.lcpMs, ttfbMs: s.nav?.ttfbMs ?? null }))
    .sort((a, b) => b.jsKB - a.jsKB);
  const lcp = steps.filter((s) => s.lcpMs).map((s) => ({ where: where(s), url: s.url, lcpMs: s.lcpMs })).sort((a, b) => (b.lcpMs ?? 0) - (a.lcpMs ?? 0));
  const cls = steps.filter((s) => s.cls > 0.01).map((s) => ({ where: where(s), url: s.url, cls: s.cls })).sort((a, b) => b.cls - a.cls);
  const longTasks = steps
    .filter((s) => s.longTasks.totalMs > 0)
    .map((s) => ({ where: where(s), ...s.longTasks }))
    .sort((a, b) => b.totalMs - a.totalMs);
  const buttonSweeps = steps.flatMap((s) =>
    ((s as StepRecord & { buttons?: { name: string; ms: number; errors: string[]; outcome: string }[] }).buttons ?? []).map((b) => ({ where: where(s), ...b })),
  );
  const brokenButtons = buttonSweeps.filter((b) => b.errors.length || b.outcome === 'error');

  const net = existsSync(NET_LOG)
    ? readFileSync(NET_LOG, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as { host: string; decision: string; rule?: string; promptHead?: string; t: string })
        .filter((e) => !meta.startedAt || e.t >= meta.startedAt)
    : [];
  const serverCalls = Object.values(
    net.reduce<Record<string, { host: string; decision: string; rule?: string; count: number; promptHead?: string }>>((acc, e) => {
      const k = `${e.host}|${e.decision}|${e.rule ?? ''}`;
      acc[k] ??= { host: e.host, decision: e.decision, rule: e.rule, count: 0, promptHead: e.promptHead };
      acc[k].count++;
      return acc;
    }, {}),
  );

  // Attribute each server call to the step that was running when it happened.
  for (const e of net) {
    const owner = steps.find((s) => s.startedAt && e.t >= s.startedAt && Date.parse(e.t) <= Date.parse(s.startedAt) + s.durationMs + 400);
    if (owner) (owner.serverCalls ??= []).push({ host: e.host, decision: e.decision, rule: e.rule });
  }

  const report = {
    meta: { ...meta, finishedAt: new Date().toISOString(), loadAverageAtEnd: os.loadavg().map((n) => Number(n.toFixed(2))), shotsDir: SHOTS_DIR },
    totals: {
      steps: steps.length,
      broken: broken.length,
      stepsWithConsoleErrors: consoleErrors.length,
      stepsWithFailedRequests: failedRequests.length,
      buttonsClicked: buttonSweeps.length,
      buttonsWithErrors: brokenButtons.length,
    },
    problems: {
      broken,
      brokenButtons,
      consoleErrors,
      failedRequests,
      slowestInteractions: interactions.slice(0, 25),
      slowestEventTiming: eventTiming.slice(0, 15),
      heaviestPages: pages.slice(0, 15),
      worstLcp: lcp.slice(0, 15),
      layoutShift: cls,
      horizontalOverflow: steps.filter((s) => (s.overflowXPx ?? 0) > 1).map((s) => ({ where: where(s), px: s.overflowXPx, screenshot: s.screenshot })),
      notes: steps.filter((s) => s.notes?.length).map((s) => ({ where: where(s), notes: s.notes })),
      longTasks: longTasks.slice(0, 15),
      serverCalls,
    },
    steps,
  };
  writeFileSync(join(REPORT_DIR, 'latest.json'), JSON.stringify(report, null, 2));
  if (existsSync(SHOTS_DIR)) copyFileSync(join(REPORT_DIR, 'latest.json'), join(SHOTS_DIR, 'report.json'));

  const line = (s: string) => process.stdout.write(s + '\n');
  line(`\n── e2e report: ${steps.length} steps, ${broken.length} broken, ${brokenButtons.length}/${buttonSweeps.length} buttons with errors → e2e/report/latest.json`);
  for (const b of broken.slice(0, 20)) line(`  BROKEN  ${b.where}: ${(b.error ?? '').split('\n')[0]}`);
  for (const i of interactions.slice(0, 8)) line(`  SLOW    ${i.ms} ms  ${i.where} [${i.label}]`);
  for (const p of pages.slice(0, 5)) line(`  HEAVY   ${p.jsKB} KB JS / ${p.totalKB} KB  ${p.url}`);
}

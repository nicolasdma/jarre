/**
 * POST /api/interview/coding-report
 * Body: { resourceId, problemId, transcript: [{ role, text }], finalCode, facts }
 * Response: { report: CodingReport }
 *
 * The written scorecard after a coding mock: five dimensions scored 1-4 at
 * senior bar with quoted moments, what the engineer would note, and the three
 * things to drill next. The problem (statement, approach, senior signals,
 * pitfalls, hints) is read here from the lesson, not taken from the client;
 * the measured facts (final tests, runs, hints) come from the page. Same
 * pipeline as /api/interview/report. See src/lib/coding/report.ts.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { checkTokenBudget } from '@/lib/api/rate-limit';
import { TOKEN_BUDGETS } from '@/lib/constants';
import { TABLES } from '@/lib/db/tables';
import { logTokenUsage } from '@/lib/db/token-usage';
import { findProblem, parseCodingConfig } from '@/lib/coding/format';
import { buildCodingReportMessages, hasCandidateSpeech, parseCodingReport } from '@/lib/coding/report';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';

const log = createLogger('CodingReport');

const BodySchema = z.object({
  resourceId: z.string().min(1),
  problemId: z.string().min(1),
  transcript: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(8000) }))
    .min(2)
    .max(400),
  finalCode: z.string().max(40_000),
  facts: z.object({
    minutes: z.number().int().min(1).max(120),
    elapsedSeconds: z.number().int().min(0).max(10_000),
    firstEditSeconds: z.number().int().min(0).nullable(),
    runs: z.number().int().min(0),
    exampleRuns: z.number().int().min(0),
    finalTests: z.object({
      passed: z.number().int().min(0),
      total: z.number().int().min(0),
      failing: z.array(z.string().max(400)).max(40),
      error: z.string().max(1000).optional(),
    }),
    hintsGiven: z.number().int().min(0),
    checkIns: z.number().int().min(0),
  }),
});

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest('resourceId, problemId, a transcript, the final code and the facts are required');
  const { resourceId, problemId, transcript, finalCode, facts } = parsed.data;
  if (!hasCandidateSpeech(transcript)) throw badRequest('The session has no answers to report on');

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json({ error: 'Monthly token limit exceeded', used: budget.used, limit: budget.limit }, { status: 429 });
  }

  const [{ data: resource }, { data: drills }] = await Promise.all([
    supabase.from(TABLES.resources).select('*').eq('id', resourceId).single(),
    supabase.from(TABLES.lessonDrills).select('slug, title').eq('resource_id', resourceId).order('priority'),
  ]);
  if (!resource) throw badRequest('Unknown resource');
  const config = parseCodingConfig((resource as Record<string, unknown>).interview ?? null);
  const problem = config ? findProblem(config, problemId) : null;
  if (!config || !problem) throw badRequest('Unknown coding problem');

  const lessonDrills = (drills ?? []) as { slug: string; title: string }[];
  const { system, user: prompt } = buildCodingReportMessages({
    problem,
    interviewerName: config.interviewer.name,
    transcript,
    finalCode,
    facts,
    drills: lessonDrills,
    problems: config.problems.map((p) => ({ id: p.id, title: p.title })),
  });

  const { content, tokensUsed } = await callDeepSeek({
    apiKey: byokKeys.deepseek,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.CODING_REPORT,
    responseFormat: 'json',
    timeoutMs: 90_000,
    retryOnTimeout: true,
  });
  logTokenUsage({ userId: user.id, category: 'coding_report', tokens: tokensUsed });

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    log.error('Report is not JSON');
    throw badRequest('The report could not be generated, try again');
  }
  const report = parseCodingReport(raw, {
    drills: new Set(lessonDrills.map((d) => d.slug)),
    problems: new Set(config.problems.map((p) => p.id)),
  });
  return jsonOk({ report });
});

/**
 * POST /api/interview/report
 * Body: { resourceId, personaId?, depth?, transcript: [{ role: 'user' | 'model', text }] }
 * Response: { report: InterviewReport }
 *
 * The written report after an interview mock: a score per question against
 * the lesson's answer key, the misconceptions, what was not known by heart,
 * key terms that came out wrong, recurring English errors and three drills to
 * practice next. The answer key and the drills are read here from the lesson,
 * not taken from the client. See src/lib/interview/report.ts.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { checkTokenBudget } from '@/lib/api/rate-limit';
import { TOKEN_BUDGETS } from '@/lib/constants';
import { TABLES } from '@/lib/db/tables';
import { logTokenUsage } from '@/lib/db/token-usage';
import { resolveInterviewSetup } from '@/lib/interview/personas';
import { buildInterviewReportMessages, hasAnswers, parseInterviewReport } from '@/lib/interview/report';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';

const log = createLogger('InterviewReport');

const BodySchema = z.object({
  resourceId: z.string().min(1),
  personaId: z.string().nullish(),
  depth: z.number().int().min(1).max(3).nullish(),
  transcript: z
    .array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(8000) }))
    .min(2)
    .max(200),
});

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest('resourceId and a transcript are required');
  const { resourceId, personaId, depth, transcript } = parsed.data;
  if (!hasAnswers(transcript)) throw badRequest('The interview has no answers to report on');

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json({ error: 'Monthly token limit exceeded', used: budget.used, limit: budget.limit }, { status: 429 });
  }

  // `*`: `interview` exists only once its migration is applied.
  const [{ data: resource }, { data: drills }, { data: sections }] = await Promise.all([
    supabase.from(TABLES.resources).select('*').eq('id', resourceId).single(),
    supabase.from(TABLES.lessonDrills).select('slug, title, text_en').eq('resource_id', resourceId).order('priority'),
    supabase
      .from(TABLES.resourceSections)
      .select('section_title, content_markdown')
      .eq('resource_id', resourceId)
      .order('sort_order', { ascending: true }),
  ]);
  if (!resource) throw badRequest('Unknown resource');

  const setup = resolveInterviewSetup((resource as Record<string, unknown>).interview ?? null, { personaId, depth });
  const lessonDrills = (drills ?? []) as { slug: string; title: string; text_en: string }[];
  const { system, user: prompt } = buildInterviewReportMessages({
    setup,
    drills: lessonDrills,
    sections: (sections ?? []).map((s: { section_title: string; content_markdown: string }) => ({
      title: s.section_title,
      content: s.content_markdown,
    })),
    transcript,
  });

  const { content, tokensUsed } = await callDeepSeek({
    apiKey: byokKeys.deepseek,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.INTERVIEW_REPORT,
    responseFormat: 'json',
    timeoutMs: 90_000,
    retryOnTimeout: true,
  });
  logTokenUsage({ userId: user.id, category: 'interview_report', tokens: tokensUsed });

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    log.error('Report is not JSON');
    throw badRequest('The report could not be generated, try again');
  }
  const report = parseInterviewReport(raw, new Set(lessonDrills.map((d) => d.slug)));
  return jsonOk({ report });
});

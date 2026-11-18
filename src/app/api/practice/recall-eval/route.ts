/**
 * POST /api/practice/recall-eval
 * Body: { resourceId, drill, transcript, cutOff? }
 * Response: { evaluation: RecallEvaluation } | { empty: true }
 *
 * Pregunta → respuesta: a lenient third party judges what the learner said
 * against the drill's own text. One call to the cheap evaluation model, text
 * only (the transcript comes from the browser's recognizer). The question,
 * the reference and the key points are read here from the lesson, not taken
 * from the client. See src/lib/practice/recall-eval.ts.
 *
 * Any failure is a non-2xx: the mode falls back to self-rating.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { checkTokenBudget } from '@/lib/api/rate-limit';
import { TOKEN_BUDGETS } from '@/lib/constants';
import { TABLES } from '@/lib/db/tables';
import { logTokenUsage } from '@/lib/db/token-usage';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { recallPrompt } from '@/lib/practice/recall';
import { MAX_TRANSCRIPT_CHARS, drillQuestionFromInterview, evaluateRecallAnswer, isJudgeable } from '@/lib/practice/recall-eval';

const BodySchema = z.object({
  resourceId: z.string().min(1),
  drill: z.string().min(1).max(200),
  transcript: z.string().max(MAX_TRANSCRIPT_CHARS),
  cutOff: z.boolean().optional(),
});

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest('resourceId, drill and transcript are required');
  const { resourceId, drill: slug, transcript, cutOff } = parsed.data;
  if (!isJudgeable(transcript)) return jsonOk({ empty: true });

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json({ error: budget.message, reason: budget.reason, used: budget.used, limit: budget.limit }, { status: 429 });
  }

  // `*`: `interview` exists only once its migration is applied.
  const [{ data: resource }, { data: drill }] = await Promise.all([
    supabase.from(TABLES.resources).select('*').eq('id', resourceId).single(),
    supabase.from(TABLES.lessonDrills).select('title, text_en').eq('resource_id', resourceId).eq('slug', slug).maybeSingle(),
  ]);
  if (!resource || !drill) throw badRequest('Unknown drill');

  const linked = drillQuestionFromInterview((resource as Record<string, unknown>).interview ?? null, slug);
  const { title, text_en } = drill as { title: string; text_en: string };

  const outcome = await evaluateRecallAnswer(
    {
      question: recallPrompt(title, linked?.ask).question,
      reference: text_en,
      keyPoints: linked?.keyPoints,
      transcript,
      cutOff,
    },
    ({ system, user: prompt }) =>
      callDeepSeek({
        apiKey: byokKeys.deepseek,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        maxTokens: TOKEN_BUDGETS.RECALL_EVAL,
        responseFormat: 'json',
        timeoutMs: 15_000,
      }),
  );
  if (outcome.kind === 'empty') return jsonOk({ empty: true });

  logTokenUsage({ userId: user.id, category: 'recall_eval', tokens: outcome.tokensUsed });
  return jsonOk({ evaluation: outcome.evaluation });
});

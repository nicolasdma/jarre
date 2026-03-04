import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getUserProfile } from '@/lib/db/queries/user';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { checkTokenBudget } from '@/lib/api/rate-limit';
import { logTokenUsage } from '@/lib/db/token-usage';
import { TOKEN_BUDGETS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('Curriculum/Copilot');

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(MessageSchema).max(12).optional(),
});

const CopilotResponseSchema = z.object({
  reply: z.string().min(1),
  suggestedResources: z.array(z.object({
    title: z.string().min(1).max(180),
    url: z.string().min(1).max(500),
    type: z.enum(['youtube', 'article', 'paper', 'book', 'podcast', 'other']),
    phaseHint: z.string().min(1).max(10).optional(),
    reason: z.string().min(1).max(300),
  })).max(6).default([]),
});

type CopilotResponse = z.infer<typeof CopilotResponseSchema>;

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const rawBody = await request.json().catch(() => null);
  const parsedBody = RequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    throw badRequest('Invalid request body');
  }

  const { message, history = [] } = parsedBody.data;
  const { language, currentPhase } = await getUserProfile(supabase, user.id);

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: 'Monthly token limit exceeded', used: budget.used, limit: budget.limit },
      { status: 429 },
    );
  }

  const contextPhases = ['0', '1', '1.5', '2', '3'];
  const { data: coreResources, error: resourceError } = await supabase
    .from(TABLES.resources)
    .select('id, title, phase, type, url, description, sort_order')
    .eq('is_archived', false)
    .is('created_by', null)
    .in('phase', contextPhases)
    .order('phase')
    .order('sort_order')
    .limit(60);

  if (resourceError) {
    throw new Error(`Failed to load curriculum context: ${resourceError.message}`);
  }

  const resourceContext = (coreResources || [])
    .map((resource) => {
      const url = resource.url ? ` | ${resource.url}` : '';
      const summary = resource.description ? ` | ${resource.description.slice(0, 160)}` : '';
      return `[${resource.phase}] ${resource.id}: ${resource.title} (${resource.type})${url}${summary}`;
    })
    .join('\n');

  const historySlice = history.slice(-8).map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));

  const systemPrompt = language === 'es'
    ? `Sos el Copilot Curricular de Jarre.
Tu trabajo es ayudar al usuario a moldear su currícula sin abrumarlo.

Reglas:
- Responde en español.
- Priorizá claridad, foco y secuencia.
- Si recomienda recursos, devolvé solo URLs reales y estables.
- Preferí anclar recomendaciones en el catálogo core cuando sea posible.
- Si faltan bases matemáticas, proponé una fase puente 1.5 antes de fase 2.
- No inventes IDs inexistentes.

Debes responder JSON válido con este formato:
{
  "reply": "respuesta breve y accionable",
  "suggestedResources": [
    {
      "title": "nombre",
      "url": "https://...",
      "type": "youtube|article|paper|book|podcast|other",
      "phaseHint": "1.5",
      "reason": "por qué ayuda ahora"
    }
  ]
}`
    : `You are Jarre's Curriculum Copilot.
Help the learner reshape curriculum sequencing without overwhelming them.

Rules:
- Reply in English.
- Keep suggestions concrete and staged.
- Only return real, stable URLs for recommendations.
- Prefer grounding recommendations in core catalog resources when possible.
- If math foundations are missing, propose a bridge phase 1.5 before phase 2.
- Do not invent non-existent resource IDs.

Return valid JSON:
{
  "reply": "short actionable reply",
  "suggestedResources": [
    {
      "title": "name",
      "url": "https://...",
      "type": "youtube|article|paper|book|podcast|other",
      "phaseHint": "1.5",
      "reason": "why this helps now"
    }
  ]
}`;

  const userPrompt = language === 'es'
    ? `Contexto del estudiante:
- Fase actual: ${currentPhase}
- Mensaje del estudiante: ${message}

Catálogo core (fases 0, 1, 1.5, 2, 3):
${resourceContext || '(sin datos)'}

Si propones un ajuste de secuencia, explicalo en términos de carga cognitiva y prerequisitos.`
    : `Student context:
- Current phase: ${currentPhase}
- Student message: ${message}

Core catalog (phases 0, 1, 1.5, 2, 3):
${resourceContext || '(no data)'}

If you suggest sequencing changes, explain in terms of cognitive load and prerequisites.`;

  const { content, tokensUsed } = await callDeepSeek({
    messages: [
      { role: 'system', content: systemPrompt },
      ...historySlice,
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.CURRICULUM_GENERATE,
    responseFormat: 'json',
    apiKey: byokKeys.deepseek,
  });

  const parsed = parseJsonResponse<CopilotResponse>(content, CopilotResponseSchema);
  logTokenUsage({ userId: user.id, category: 'curriculum_copilot', tokens: tokensUsed }).catch(() => {});

  log.info(`Curriculum copilot response generated for user=${user.id}, tokens=${tokensUsed}`);
  return jsonOk(parsed);
});

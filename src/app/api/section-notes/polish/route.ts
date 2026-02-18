import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { logTokenUsage } from '@/lib/db/token-usage';

const log = createLogger('NotesPolish');

const SYSTEM_PROMPT = `You are a note formatter. You receive raw, messy study notes and return them cleaned up as HTML for a contentEditable div.

Rules:
- Add structure: use <b> for key terms and section headers
- Use <br> for line breaks between ideas
- Group related ideas into bullet lists using • character (not <ul>/<li> since contentEditable handles them poorly)
- Add logical connectors between ideas (→, por lo tanto, es decir, en cambio, etc.)
- Keep the SAME language as the input (Spanish or English)
- Keep ALL <mark data-annotation-id="...">...</mark> tags EXACTLY as they are — do not modify, remove, or reorder them
- Do NOT add new information. Only restructure and connect what's already there
- Do NOT duplicate content. If a section header already appears (e.g. "2. Two-Phase Locking (2PL)"), do NOT repeat it as a bullet point below — use it once as a header only
- Do NOT wrap in <html>, <body>, or <div> — return bare inline HTML
- Keep it concise. These are study notes, not prose
- Use <br> ONLY to separate major sections (e.g. between topic changes). Do NOT put <br> between bullet points or between lines within the same section — just use newline characters
- NEVER use <br><br> or multiple consecutive <br> tags`;

export const POST = withAuth(async (request, { user }) => {
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  // Strip HTML tags for the LLM prompt but preserve mark tags info
  const textForLlm = content;

  try {
    const { content: polished, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: textForLlm },
      ],
      temperature: 0.2,
      maxTokens: 3000,
      responseFormat: 'text',
      timeoutMs: 90_000,
    });

    logTokenUsage({ userId: user.id, category: 'notes_polish', tokens: tokensUsed });

    log.info(`Polished notes: ${tokensUsed} tokens used`);

    return NextResponse.json({ content: polished.trim() });
  } catch (error) {
    log.error('Polish error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to polish notes' },
      { status: 500 }
    );
  }
});

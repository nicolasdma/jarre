/**
 * Socratic Tutor Chat API Route
 *
 * Handles two modes:
 * - Reactive (chat): user sends a message, tutor responds via SSE stream.
 * - Proactive: no user message, tutor generates a question as JSON.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { callDeepSeekStream } from '@/lib/llm/streaming';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { buildTutorMessages } from '@/lib/llm/tutor-prompts';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS } from '@/lib/constants';

const log = createLogger('Tutor');

const VALID_PLAYGROUNDS = ['consensus', 'replication', 'partitioning', 'latency'] as const;
type Playground = (typeof VALID_PLAYGROUNDS)[number];

function isValidPlayground(value: unknown): value is Playground {
  return typeof value === 'string' && VALID_PLAYGROUNDS.includes(value as Playground);
}

export const POST = withAuth(async (request, { }) => {
  try {
    const body = await request.json();
    const { playground, state, history, userMessage } = body as {
      playground: unknown;
      state: unknown;
      history: Array<{ role: 'user' | 'assistant'; content: string }>;
      userMessage?: string;
    };

    if (!isValidPlayground(playground)) {
      return NextResponse.json(
        { error: `Invalid playground. Must be one of: ${VALID_PLAYGROUNDS.join(', ')}` },
        { status: 400 }
      );
    }

    const messages = buildTutorMessages(playground, state, history, userMessage);

    if (userMessage) {
      // Reactive mode: stream the response as SSE
      const stream = await callDeepSeekStream({
        messages,
        temperature: 0.4,
        maxTokens: TOKEN_BUDGETS.PLAYGROUND_TUTOR,
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }) as unknown as NextResponse;
    }

    // Proactive mode: generate a single question
    const { content } = await callDeepSeek({
      messages,
      temperature: 0.5,
      maxTokens: TOKEN_BUDGETS.PLAYGROUND_HINT,
      responseFormat: 'text',
    });

    return NextResponse.json({ question: content });
  } catch (error) {
    log.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud del tutor' },
      { status: 500 }
    );
  }
});

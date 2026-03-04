/**
 * Pipeline Stage 4: Generate Quizzes
 *
 * Generates inline quizzes positioned after bold headings in each section.
 * Formats: ~35% mc, ~30% tf, ~35% mc2.
 * Validates that positionAfterHeading matches actual headings.
 */

import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, PIPELINE_MAX_CONCURRENT } from '@/lib/constants';
import { QuizGenerationResponseSchema } from '../schemas';
import type { ContentOutput, QuizOutput, InlineQuizDef } from '../types';

const log = createLogger('Pipeline:Quizzes');

type ParsedQuizPayload = {
  quizzes: Array<{
    positionAfterHeading: string;
    format: 'mc' | 'tf' | 'mc2';
    questionText: string;
    options: Array<{ label: string; text: string }> | null;
    correctAnswer: string;
    explanation: string;
    justificationHint?: string;
  }>;
};

function extractJsonString(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  const lines = trimmed.split('\n');
  if (lines.length >= 3 && lines[lines.length - 1].trim() === '```') {
    return lines.slice(1, -1).join('\n').trim();
  }

  return trimmed;
}

function normalizeQuizPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const maybeObj = payload as Record<string, unknown>;
  const quizzes = maybeObj.quizzes;
  if (!Array.isArray(quizzes)) return payload;

  const normalized = quizzes.map((q) => {
    if (!q || typeof q !== 'object') return q;
    const item = { ...(q as Record<string, unknown>) };

    if (item.justificationHint === null) {
      delete item.justificationHint;
    }

    if (item.format === 'tf') {
      if (Array.isArray(item.options) && item.options.length === 0) {
        item.options = null;
      }
      if (typeof item.correctAnswer === 'boolean') {
        item.correctAnswer = item.correctAnswer ? 'true' : 'false';
      }
    }

    return item;
  });

  return { ...maybeObj, quizzes: normalized };
}

function parseQuizResponse(raw: string): ParsedQuizPayload {
  const parsed = JSON.parse(extractJsonString(raw));
  const normalized = normalizeQuizPayload(parsed);
  return QuizGenerationResponseSchema.parse(normalized);
}

/**
 * Run a batch of async functions with concurrency limit.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      results[index] = await tasks[index]();
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * Generate quizzes for a single section.
 */
async function generateSectionQuizzes(
  sectionTitle: string,
  contentMarkdown: string,
  headings: string[],
  language: string,
  apiKey?: string,
): Promise<{ quizzes: InlineQuizDef[]; tokensUsed: number }> {
  if (headings.length === 0) {
    log.warn(`Section "${sectionTitle}" has no headings — skipping quiz generation`);
    return { quizzes: [], tokensUsed: 0 };
  }

  const langInstruction =
    language === 'es'
      ? 'Write ALL quiz content in Spanish. Keep a technical-academic tone.'
      : 'Write ALL quiz content in English. Keep a technical-academic tone.';

  const headingsList = headings.map((h, i) => `  ${i + 1}. "${h}"`).join('\n');

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
    messages: [
      {
        role: 'system',
        content: `You are a quiz designer for a deep learning platform. Generate inline quizzes for a section of learning content.

Each quiz tests comprehension of the material BEFORE the heading it's positioned after.

${langInstruction}

Rules:
- Generate 3-5 quizzes per section
- Position each quiz after one of the available headings
- Mix formats with a technical bias: ~45% "mc2", ~45% "mc", at most 10% "tf" (max 1 tf if needed)
- Questions must test reasoning, mechanism understanding, and error detection; avoid trivial recall
- Include at least 1 question with a concrete scenario, numeric detail, or code/pseudocode interpretation when applicable
- Distractors should be plausible misconceptions, not obviously wrong answers
- For "tf": options must be null, correctAnswer must be "true" or "false" (lowercase string)
- For "mc": 4 options with labels A, B, C, D. correctAnswer is the label letter (A, B, C, or D)
- For "mc2": same as mc, but add justificationHint. correctAnswer is the label letter
- Explanation must state why the correct option is right and why the main distractor is wrong, in at most 2 sentences
- Do NOT output LaTeX, escaped math, or self-corrections inside fields

Available headings for positioning:
${headingsList}

IMPORTANT: positionAfterHeading MUST exactly match one of the headings listed above.

Respond with JSON:
{
  "quizzes": [
    {
      "positionAfterHeading": "exact heading text",
      "format": "mc",
      "questionText": "question?",
      "options": [{"label":"A","text":"option 1"},{"label":"B","text":"option 2"},{"label":"C","text":"option 3"},{"label":"D","text":"option 4"}],
      "correctAnswer": "B",
      "explanation": "why B is correct...",
      "justificationHint": "only for mc2 format"
    }
  ]
}`,
      },
      {
        role: 'user',
        content: `Section: "${sectionTitle}"

Content:
${contentMarkdown.slice(0, 8_000)}`,
      },
    ],
    temperature: 0.4,
    maxTokens: TOKEN_BUDGETS.PIPELINE_QUIZZES,
    responseFormat: 'json',
    timeoutMs: 60_000,
    retryOnTimeout: true,
  });

  let finalTokensUsed = tokensUsed;
  let parsed: ParsedQuizPayload;
  try {
    parsed = parseQuizResponse(content);
  } catch (firstErr) {
    log.warn(`Quiz JSON parse failed for "${sectionTitle}", attempting repair...`);

    const { content: repairedContent, tokensUsed: repairTokens } = await callDeepSeek({
      apiKey,
      messages: [
        {
          role: 'system',
          content: `You are a strict JSON repair tool.

Input may contain malformed JSON. Return valid JSON that matches exactly:
{
  "quizzes": [
    {
      "positionAfterHeading": "string",
      "format": "mc" | "tf" | "mc2",
      "questionText": "string",
      "options": null OR [{"label":"A","text":"..."},{"label":"B","text":"..."},{"label":"C","text":"..."},{"label":"D","text":"..."}],
      "correctAnswer": "string",
      "explanation": "string",
      "justificationHint": "string (optional)"
    }
  ]
}

Rules:
- Return ONLY valid JSON.
- Preserve the original quiz intent.
- Remove malformed fragments and self-corrections.
- Ensure positionAfterHeading values are plain strings.`,
        },
        {
          role: 'user',
          content: `Repair this into valid JSON:\n\n${content.slice(0, 12_000)}`,
        },
      ],
      temperature: 0,
      maxTokens: TOKEN_BUDGETS.PIPELINE_QUIZZES,
      responseFormat: 'json',
      timeoutMs: 120_000,
      retryOnTimeout: true,
    });

    parsed = parseQuizResponse(repairedContent);
    finalTokensUsed += repairTokens;
    log.warn(`Quiz JSON repaired for "${sectionTitle}" after parse error: ${(firstErr as Error).message}`);
  }

  // Validate and fix positionAfterHeading
  const headingSet = new Set(headings);
  const validQuizzes: InlineQuizDef[] = [];
  let sortOrder = 0;

  for (const quiz of parsed.quizzes) {
    // Check if heading matches exactly
    if (headingSet.has(quiz.positionAfterHeading)) {
      validQuizzes.push({
        ...quiz,
        sortOrder: sortOrder++,
        options: quiz.options,
        justificationHint: quiz.justificationHint ?? undefined,
      });
    } else {
      // Try fuzzy match: find closest heading
      const closest = headings.find(
        (h) =>
          h.toLowerCase().includes(quiz.positionAfterHeading.toLowerCase()) ||
          quiz.positionAfterHeading.toLowerCase().includes(h.toLowerCase()),
      );
      if (closest) {
        log.warn(
          `Quiz heading "${quiz.positionAfterHeading}" → fuzzy matched to "${closest}"`,
        );
        validQuizzes.push({
          ...quiz,
          positionAfterHeading: closest,
          sortOrder: sortOrder++,
          options: quiz.options,
          justificationHint: quiz.justificationHint ?? undefined,
        });
      } else {
        // Default to first heading
        log.warn(
          `Quiz heading "${quiz.positionAfterHeading}" not found — defaulting to "${headings[0]}"`,
        );
        validQuizzes.push({
          ...quiz,
          positionAfterHeading: headings[0],
          sortOrder: sortOrder++,
          options: quiz.options,
          justificationHint: quiz.justificationHint ?? undefined,
        });
      }
    }
  }

  return { quizzes: validQuizzes, tokensUsed: finalTokensUsed };
}

/**
 * Stage 4: Generate inline quizzes for all sections.
 */
export async function generateQuizzes(
  contentOutput: ContentOutput,
  language: string,
  apiKey?: string,
): Promise<{ output: QuizOutput; tokensUsed: number }> {
  let totalTokens = 0;

  const tasks = contentOutput.sections.map((section) => {
    return async () => {
      const result = await generateSectionQuizzes(
        section.title,
        section.contentMarkdown,
        section.headings,
        language,
        apiKey,
      );
      return { sectionTitle: section.title, ...result };
    };
  });

  const results = await runWithConcurrency(tasks, PIPELINE_MAX_CONCURRENT);

  const quizzesBySection = results.map((r) => {
    totalTokens += r.tokensUsed;
    return {
      sectionTitle: r.sectionTitle,
      quizzes: r.quizzes,
    };
  });

  const totalQuizzes = quizzesBySection.reduce((sum, s) => sum + s.quizzes.length, 0);
  log.info(`Generated ${totalQuizzes} quizzes across ${quizzesBySection.length} sections (${totalTokens} tokens)`);

  return {
    output: { quizzesBySection },
    tokensUsed: totalTokens,
  };
}

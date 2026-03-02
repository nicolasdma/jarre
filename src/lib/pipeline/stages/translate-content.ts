/**
 * Pipeline Stage 3b: Translate Content (Conditional)
 *
 * Translates section content from source language to target language.
 * Only called when video language differs from user's target language.
 * Uses paragraph-by-paragraph translation with sliding context.
 */

import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, PIPELINE_MAX_CONCURRENT } from '@/lib/constants';
import type { ContentOutput, ContentSection } from '../types';

const log = createLogger('Pipeline:Translate');

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
 * Translate a single section's markdown content.
 */
async function translateSection(
  contentMarkdown: string,
  fromLang: string,
  toLang: string,
  sectionTitle: string,
): Promise<{ translatedMarkdown: string; tokensUsed: number }> {
  const langNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    pt: 'Portuguese',
    de: 'German',
  };

  const fromName = langNames[fromLang] || fromLang;
  const toName = langNames[toLang] || toLang;

  const { content, tokensUsed } = await callDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You are a technical translator. Translate the following markdown content from ${fromName} to ${toName}.

Rules:
- Preserve ALL markdown formatting exactly (bold, code blocks, lists, etc.)
- Keep technical terms in English when they are standard (e.g., "backpropagation", "gradient descent", "API", "cache")
- Translate explanatory text naturally, not word-for-word
- Keep code examples unchanged
- Bold headings (**text**) should be translated

IMPORTANT: Return ONLY the translated markdown. No JSON wrapping, no preamble, no explanation.`,
      },
      {
        role: 'user',
        content: `Section: "${sectionTitle}"\n\n${contentMarkdown}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.PIPELINE_TRANSLATE,
    responseFormat: 'text',
    timeoutMs: 90_000,
    retryOnTimeout: true,
  });

  return { translatedMarkdown: content.trim(), tokensUsed };
}

/**
 * Re-extract bold headings from translated content.
 */
function extractBoldHeadings(markdown: string): string[] {
  const headings: string[] = [];
  for (const line of markdown.split('\n')) {
    const match = line.trim().match(/^\*\*([^*]+)\*\*$/);
    if (match) headings.push(match[1].trim());
  }
  return headings;
}

/**
 * Stage 3b: Translate content if needed.
 * Returns the same ContentOutput with translated content, or the original if no translation needed.
 */
export async function translateContent(
  contentOutput: ContentOutput,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<{ output: ContentOutput; tokensUsed: number }> {
  // No translation needed if languages match
  if (sourceLanguage === targetLanguage) {
    log.info('Source and target language match — skipping translation');
    return { output: contentOutput, tokensUsed: 0 };
  }

  log.info(`Translating ${contentOutput.sections.length} sections from ${sourceLanguage} to ${targetLanguage}`);

  let totalTokens = 0;

  const tasks = contentOutput.sections.map((section) => {
    return async () => {
      const result = await translateSection(
        section.contentMarkdown,
        sourceLanguage,
        targetLanguage,
        section.title,
      );
      return result;
    };
  });

  const results = await runWithConcurrency(tasks, PIPELINE_MAX_CONCURRENT);

  const translatedSections: ContentSection[] = contentOutput.sections.map((section, i) => {
    const { translatedMarkdown, tokensUsed } = results[i];
    totalTokens += tokensUsed;

    return {
      ...section,
      contentMarkdown: translatedMarkdown,
      headings: extractBoldHeadings(translatedMarkdown),
    };
  });

  log.info(`Translation complete (${totalTokens} tokens)`);

  return {
    output: {
      sections: translatedSections,
      activateData: contentOutput.activateData,
    },
    tokensUsed: totalTokens,
  };
}

/**
 * On-demand Translation Service
 *
 * Translates resource content when user language differs from resource language.
 * Results are cached in dedicated translation tables for instant subsequent access.
 * Uses DeepSeek V3 with the same quality prompt as the original pipeline translation.
 */

import { createLogger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/server';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { TABLES } from '@/lib/db/tables';
import { TOKEN_BUDGETS, TRANSLATION_MAX_CONCURRENT } from '@/lib/constants';
import { logTokenUsage } from '@/lib/db/token-usage';
import type { ActivateData } from '@/lib/pipeline/types';

const log = createLogger('Translation');

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  pt: 'Portuguese',
  de: 'German',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function md5Hash(text: string): string {
  // Simple hash for cache invalidation — not cryptographic
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash.toString(36);
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrent: number,
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(tasks.length).fill(null);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (err) {
        log.error(`Task ${index}/${tasks.length} failed: ${err}`);
        // Continue with next task — don't kill the worker
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, tasks.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/** Split markdown by bold headings into chunks under maxChars */
function splitByHeadings(markdown: string, maxChars: number): string[] {
  if (markdown.length <= maxChars) return [markdown];

  const lines = markdown.split('\n');
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;

  for (const line of lines) {
    const isHeading = /^\*\*[^*]+\*\*\s*$/.test(line.trim());
    const lineLen = line.length + 1; // +1 for newline

    if (isHeading && currentLen > 0 && currentLen + lineLen > maxChars) {
      chunks.push(current.join('\n'));
      current = [line];
      currentLen = lineLen;
    } else {
      current.push(line);
      currentLen += lineLen;
    }
  }

  if (current.length > 0) {
    chunks.push(current.join('\n'));
  }

  return chunks;
}

const CHUNK_THRESHOLD = 8_000;

async function translateMarkdown(
  markdown: string,
  fromLang: string,
  toLang: string,
  context: string,
  apiKey?: string,
): Promise<{ translated: string; tokensUsed: number }> {
  const fromName = LANG_NAMES[fromLang] || fromLang;
  const toName = LANG_NAMES[toLang] || toLang;

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
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
        content: `Context: "${context}"\n\n${markdown}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.PIPELINE_TRANSLATE,
    responseFormat: 'text',
    timeoutMs: 120_000,
    retryOnTimeout: true,
  });

  return { translated: content.trim(), tokensUsed };
}

/** Translate markdown, chunking large content to avoid token/timeout limits */
async function translateMarkdownChunked(
  markdown: string,
  fromLang: string,
  toLang: string,
  context: string,
  apiKey?: string,
): Promise<{ translated: string; tokensUsed: number }> {
  const chunks = splitByHeadings(markdown, CHUNK_THRESHOLD);
  if (chunks.length === 1) {
    return translateMarkdown(markdown, fromLang, toLang, context, apiKey);
  }

  log.info(`Chunked translation: ${chunks.length} chunks (${markdown.length} chars)`);
  let totalTokens = 0;
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const { translated, tokensUsed } = await translateMarkdown(chunk, fromLang, toLang, context, apiKey);
    translatedChunks.push(translated);
    totalTokens += tokensUsed;
  }

  return { translated: translatedChunks.join('\n\n'), tokensUsed: totalTokens };
}

async function translatePlainText(
  text: string,
  fromLang: string,
  toLang: string,
  context: string,
  apiKey?: string,
): Promise<{ translated: string; tokensUsed: number }> {
  const fromName = LANG_NAMES[fromLang] || fromLang;
  const toName = LANG_NAMES[toLang] || toLang;

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
    messages: [
      {
        role: 'system',
        content: `You are a technical translator. Translate the following plain text from ${fromName} to ${toName}.

Rules:
- This is PLAIN TEXT, not markdown. Do NOT add any formatting: no **, no *, no backticks, no headers, no bullet points.
- Keep technical terms in English when they are standard (e.g., "backpropagation", "gradient descent", "API", "cache")
- Translate explanatory text naturally, not word-for-word
- Preserve any separator tokens exactly as they appear (e.g., ===SEPARATOR===, ---)

IMPORTANT: Return ONLY the translated text. No JSON wrapping, no preamble, no explanation. No added formatting.`,
      },
      {
        role: 'user',
        content: `Context: "${context}"\n\n${text}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.PIPELINE_TRANSLATE,
    responseFormat: 'text',
    timeoutMs: 120_000,
    retryOnTimeout: true,
  });

  return { translated: content.trim(), tokensUsed };
}

// ---------------------------------------------------------------------------
// Section translations
// ---------------------------------------------------------------------------

interface TranslatedSection {
  id: string;
  conceptId: string;
  sectionTitle: string;
  contentMarkdown: string;
  sortOrder: number;
  pendingTranslation?: boolean;
}

/**
 * Get sections with translated content. Returns original content if languages match.
 * Translates and caches missing translations on-demand.
 */
export async function getTranslatedSections(
  resourceId: string,
  resourceLanguage: string,
  targetLanguage: string,
  userId: string,
): Promise<TranslatedSection[]> {
  const supabase = createAdminClient();

  // Fetch sections with any existing translations
  const { data: sections, error } = await supabase
    .from(TABLES.resourceSections)
    .select('id, concept_id, section_title, content_markdown, sort_order')
    .eq('resource_id', resourceId)
    .order('sort_order', { ascending: true });

  if (error || !sections || sections.length === 0) {
    log.error(`Failed to fetch sections for ${resourceId}: ${error?.message}`);
    return [];
  }

  // No translation needed
  if (resourceLanguage === targetLanguage) {
    return sections.map((s) => ({
      id: s.id,
      conceptId: s.concept_id,
      sectionTitle: s.section_title,
      contentMarkdown: s.content_markdown,
      sortOrder: s.sort_order,
    }));
  }

  // Fetch existing translations
  const sectionIds = sections.map((s) => s.id);
  const { data: existingTranslations } = await supabase
    .from(TABLES.sectionTranslations)
    .select('section_id, section_title, content_markdown, content_hash')
    .in('section_id', sectionIds)
    .eq('language', targetLanguage);

  const translationMap = new Map(
    (existingTranslations || []).map((t) => [t.section_id, t]),
  );

  // Identify sections that need translation (missing or stale hash)
  const pendingSectionIds = new Set<string>();
  for (const section of sections) {
    const cached = translationMap.get(section.id);
    const currentHash = md5Hash(section.content_markdown);
    if (!cached || cached.content_hash !== currentHash) {
      pendingSectionIds.add(section.id);
    }
  }

  // Fire-and-forget: translate missing sections in background
  if (pendingSectionIds.size > 0) {
    log.info(`Background translating ${pendingSectionIds.size}/${sections.length} sections for ${resourceId} → ${targetLanguage}`);

    const bgSections = sections.filter((s) => pendingSectionIds.has(s.id));
    const tasks = bgSections.map((section) => async () => {
      log.info(`Translating section ${section.id} (${section.content_markdown.length} chars)`);
      const { translated: translatedMarkdown, tokensUsed } = await translateMarkdownChunked(
        section.content_markdown,
        resourceLanguage,
        targetLanguage,
        section.section_title,
      );

      const { translated: translatedTitle, tokensUsed: titleTokens } = await translatePlainText(
        section.section_title,
        resourceLanguage,
        targetLanguage,
        'Section title',
      );

      const tokens = tokensUsed + titleTokens;

      // UPSERT translation cache
      const { error: upsertErr } = await supabase
        .from(TABLES.sectionTranslations)
        .upsert(
          {
            section_id: section.id,
            language: targetLanguage,
            section_title: translatedTitle,
            content_markdown: translatedMarkdown,
            content_hash: md5Hash(section.content_markdown),
            translated_at: new Date().toISOString(),
          },
          { onConflict: 'section_id,language' },
        );

      if (upsertErr) {
        log.error(`Failed to cache section translation: ${upsertErr.message}`);
      }

      // Fire-and-forget: token usage tracking
      logTokenUsage({ userId, category: 'translation-sections', tokens }).catch(() => {});
    });

    // Do NOT await — let it run in the background
    runWithConcurrency(tasks, TRANSLATION_MAX_CONCURRENT)
      .then(() => log.info(`Background section translation complete for ${resourceId}`))
      .catch((err) => log.error(`Background section translation failed: ${err}`));
  }

  // Build result: cached translations where available, originals (with flag) where not
  return sections.map((s) => {
    const cached = translationMap.get(s.id);
    const isPending = pendingSectionIds.has(s.id);
    return {
      id: s.id,
      conceptId: s.concept_id,
      sectionTitle: cached?.section_title ?? s.section_title,
      contentMarkdown: cached?.content_markdown ?? s.content_markdown,
      sortOrder: s.sort_order,
      ...(isPending ? { pendingTranslation: true } : {}),
    };
  });
}

// ---------------------------------------------------------------------------
// Activate data translations
// ---------------------------------------------------------------------------

/**
 * Get translated activate_data. Returns original if languages match.
 */
export async function getTranslatedActivateData(
  resourceId: string,
  activateData: ActivateData | null,
  resourceLanguage: string,
  targetLanguage: string,
  userId: string,
): Promise<{ data: ActivateData; pendingTranslation: boolean } | null> {
  if (!activateData) return null;
  if (resourceLanguage === targetLanguage) return { data: activateData, pendingTranslation: false };

  const supabase = createAdminClient();
  const currentHash = md5Hash(JSON.stringify(activateData));

  // Check cache
  const { data: cached } = await supabase
    .from(TABLES.resourceTranslations)
    .select('activate_data, content_hash')
    .eq('resource_id', resourceId)
    .eq('language', targetLanguage)
    .maybeSingle();

  if (cached && cached.content_hash === currentHash) {
    return { data: cached.activate_data as ActivateData, pendingTranslation: false };
  }

  // Fire-and-forget: translate in background, return original now
  log.info(`Background translating activate_data for ${resourceId} → ${targetLanguage}`);

  void (async () => {
    try {
      const textToTranslate = [
        activateData.summary,
        activateData.insight,
        ...activateData.sections.map((s) => `${s.title}: ${s.description}`),
      ].join('\n---\n');

      const { translated, tokensUsed } = await translatePlainText(
        textToTranslate,
        resourceLanguage,
        targetLanguage,
        'Resource overview',
      );

      const parts = translated.split('\n---\n');
      const translatedData: ActivateData = {
        summary: parts[0]?.trim() || activateData.summary,
        insight: parts[1]?.trim() || activateData.insight,
        keyConcepts: activateData.keyConcepts,
        sections: activateData.sections.map((s, i) => {
          const raw = parts[i + 2]?.trim() || `${s.title}: ${s.description}`;
          const colonIdx = raw.indexOf(':');
          return {
            number: s.number,
            title: colonIdx > 0 ? raw.slice(0, colonIdx).trim() : s.title,
            description: colonIdx > 0 ? raw.slice(colonIdx + 1).trim() : raw,
          };
        }),
      };

      const { error: upsertErr } = await supabase
        .from(TABLES.resourceTranslations)
        .upsert(
          {
            resource_id: resourceId,
            language: targetLanguage,
            activate_data: translatedData as unknown as Record<string, unknown>,
            content_hash: currentHash,
            translated_at: new Date().toISOString(),
          },
          { onConflict: 'resource_id,language' },
        );

      if (upsertErr) {
        log.error(`Failed to cache activate_data translation: ${upsertErr.message}`);
      }

      // Fire-and-forget: token usage tracking
      logTokenUsage({ userId, category: 'translation-activate', tokens: tokensUsed }).catch(() => {});
      log.info(`Background activate_data translation complete for ${resourceId}`);
    } catch (err) {
      log.error(`Background activate_data translation failed: ${err}`);
    }
  })();

  // Return original content immediately with pending flag
  return { data: activateData, pendingTranslation: true };
}

// ---------------------------------------------------------------------------
// Quiz translations
// ---------------------------------------------------------------------------

interface QuizRow {
  id: string;
  section_id: string;
  question_text: string;
  options: { label: string; text: string }[] | null;
  explanation: string;
  justification_hint: string | null;
}

interface TranslatedQuizFields {
  questionText: string;
  options: { label: string; text: string }[] | null;
  explanation: string;
  justificationHint: string | null;
}

/**
 * Get translated quiz fields for a set of quizzes.
 * Returns a map of quizId → translated fields. Only translates text fields,
 * structural fields (format, correct_answer, position, sort_order) are unchanged.
 */
export async function getTranslatedQuizzes(
  quizzes: QuizRow[],
  resourceLanguage: string,
  targetLanguage: string,
  userId: string,
): Promise<{ translations: Map<string, TranslatedQuizFields>; pendingIds: Set<string> }> {
  const translations = new Map<string, TranslatedQuizFields>();
  const pendingIds = new Set<string>();

  if (quizzes.length === 0) return { translations, pendingIds };
  if (resourceLanguage === targetLanguage) {
    for (const q of quizzes) {
      translations.set(q.id, {
        questionText: q.question_text,
        options: q.options,
        explanation: q.explanation,
        justificationHint: q.justification_hint,
      });
    }
    return { translations, pendingIds };
  }

  const supabase = createAdminClient();
  const quizIds = quizzes.map((q) => q.id);

  // Fetch existing translations
  const { data: existingTranslations } = await supabase
    .from(TABLES.quizTranslations)
    .select('quiz_id, question_text, options, explanation, justification_hint, content_hash')
    .in('quiz_id', quizIds)
    .eq('language', targetLanguage);

  const cacheMap = new Map(
    (existingTranslations || []).map((t) => [t.quiz_id, t]),
  );

  // Determine what needs translation
  const needsTranslation: QuizRow[] = [];
  for (const quiz of quizzes) {
    const cached = cacheMap.get(quiz.id);
    const currentHash = md5Hash(quiz.question_text + quiz.explanation);
    if (cached && cached.content_hash === currentHash) {
      translations.set(quiz.id, {
        questionText: cached.question_text,
        options: cached.options as TranslatedQuizFields['options'],
        explanation: cached.explanation,
        justificationHint: cached.justification_hint,
      });
    } else {
      needsTranslation.push(quiz);
    }
  }

  // Fill in uncached quizzes with original content immediately
  for (const quiz of needsTranslation) {
    pendingIds.add(quiz.id);
    translations.set(quiz.id, {
      questionText: quiz.question_text,
      options: quiz.options,
      explanation: quiz.explanation,
      justificationHint: quiz.justification_hint,
    });
  }

  // Fire-and-forget: translate missing quizzes in background
  if (needsTranslation.length > 0) {
    log.info(`Background translating ${needsTranslation.length} quizzes → ${targetLanguage}`);

    const tasks = needsTranslation.map((quiz) => async () => {
      const optionsText = quiz.options
        ? quiz.options.map((o) => `${o.label}: ${o.text}`).join('\n')
        : '';
      const parts = [
        quiz.question_text,
        optionsText,
        quiz.explanation,
        quiz.justification_hint || '',
      ];

      const { translated, tokensUsed } = await translatePlainText(
        parts.join('\n===SEPARATOR===\n'),
        resourceLanguage,
        targetLanguage,
        'Quiz content',
      );

      const translatedParts = translated.split('\n===SEPARATOR===\n');
      const translatedQuestion = translatedParts[0]?.trim() || quiz.question_text;
      const translatedOptionsRaw = translatedParts[1]?.trim() || '';
      const translatedExplanation = translatedParts[2]?.trim() || quiz.explanation;
      const translatedHint = translatedParts[3]?.trim() || null;

      let translatedOptions: { label: string; text: string }[] | null = null;
      if (quiz.options && translatedOptionsRaw) {
        translatedOptions = translatedOptionsRaw.split('\n').map((line, i) => {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) {
            return { label: line.slice(0, colonIdx).trim(), text: line.slice(colonIdx + 1).trim() };
          }
          return quiz.options![i] || { label: '', text: line.trim() };
        });
      }

      // Cache
      const { error: upsertErr } = await supabase
        .from(TABLES.quizTranslations)
        .upsert(
          {
            quiz_id: quiz.id,
            language: targetLanguage,
            question_text: translatedQuestion,
            options: translatedOptions,
            explanation: translatedExplanation,
            justification_hint: translatedHint,
            content_hash: md5Hash(quiz.question_text + quiz.explanation),
            translated_at: new Date().toISOString(),
          },
          { onConflict: 'quiz_id,language' },
        );

      if (upsertErr) {
        log.error(`Failed to cache quiz translation: ${upsertErr.message}`);
      }

      // Fire-and-forget: token usage tracking
      logTokenUsage({ userId, category: 'translation-quizzes', tokens: tokensUsed }).catch(() => {});
    });

    // Do NOT await — let it run in the background
    runWithConcurrency(tasks, TRANSLATION_MAX_CONCURRENT)
      .then(() => log.info(`Background quiz translation complete`))
      .catch((err) => log.error(`Background quiz translation failed: ${err}`));
  }

  return { translations, pendingIds };
}

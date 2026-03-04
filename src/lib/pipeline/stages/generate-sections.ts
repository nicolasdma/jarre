/**
 * Pipeline Stage 3: Generate Section Content
 *
 * - YouTube: pedagogical expansion into course-style sections.
 * - PDF: faithful document rendering, with optional strict translation.
 */

import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, PIPELINE_MAX_CONCURRENT, TRANSLATION_MAX_CONCURRENT } from '@/lib/constants';
import { ActivateDataResponseSchema } from '../schemas';
import type { SegmentOutput, ContentOutput, ContentSection, ActivateData } from '../types';

const log = createLogger('Pipeline:Content');
const PDF_TRANSLATION_CHUNK_CHARS = 5_000;
const PDF_TRANSLATION_FAST_TIMEOUT_MS = 25_000;
const PDF_TRANSLATION_CHUNK_TIMEOUT_MS = 20_000;
const DEEPL_TRANSLATE_TIMEOUT_MS = 30_000;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

interface GenerateSectionsOptions {
  sourceType?: 'youtube' | 'pdf';
  sourceLanguage?: string;
}

/**
 * Build position context for the user prompt.
 */
function buildPositionContext(sectionIndex: number, totalSections: number): string {
  if (totalSections <= 1) return 'Role: This is the only section - cover everything thoroughly.';

  if (sectionIndex === 0) {
    return 'Role: OPENING section - establish foundations, define key terms, build scaffolding from what the reader likely already knows. Set up the mental model that later sections will build on.';
  }

  if (sectionIndex === totalSections - 1) {
    return 'Role: CLOSING section - synthesize the full picture, connect all prior concepts, show the big insight. Reference ideas from earlier sections to create closure.';
  }

  const position = sectionIndex / (totalSections - 1);
  if (position < 0.4) {
    return 'Role: EARLY section - building core concepts. Reference the foundations from the opening section and start deepening.';
  }
  if (position < 0.7) {
    return 'Role: MIDDLE section - peak complexity. This is where the hardest ideas live. Use all 3 angles (intuitive, formal, numerical) heavily.';
  }
  return 'Role: LATE section - connecting and applying. Start tying concepts together and showing how the pieces fit into the full picture.';
}

/**
 * Extract bold headings from markdown content.
 */
function extractBoldHeadings(markdown: string): string[] {
  const headings: string[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (match) headings.push(match[1].trim());
  }

  return headings;
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
 * Build the system prompt for YouTube section content generation.
 */
function buildContentSystemPrompt(language: string): string {
  const langInstruction =
    language === 'es'
      ? 'Escribi TODO en espanol tecnico claro (registro academico). Evita tono coloquial o motivacional.'
      : 'Write ALL content in technical, academic English.';

  return `You are writing UNIVERSITY-LEVEL technical learning material for computer science and AI engineering.

Goal: produce rigorous, precise section content that can be used in an upper-undergraduate / early-graduate course.

${langInstruction}

## QUALITY BAR (MANDATORY)

1. **Technical correctness first**
   - Do not invent claims not supported by the transcript context.
   - If a detail is uncertain, state a bounded assumption instead of pretending certainty.
   - Prefer precise definitions over metaphors.

2. **Formalism + intuition**
   - For each core concept, include:
     - a precise definition (and notation when relevant),
     - an intuitive explanation,
     - one concrete worked example.
   - If the concept is mathematical/probabilistic, include equations or symbolic expressions.

3. **Evidence-oriented exposition**
   - Show why a claim is true using derivation, mini-proof sketch, or numerical verification.
   - Avoid rhetorical hooks, storytelling filler, and hype language.

4. **Implementation relevance**
   - If coding is relevant, include short code or pseudocode blocks tied to the concept.
   - Explain assumptions, input/output behavior, and common failure modes.

5. **Boundary conditions**
   - Explicitly state at least one limitation, trade-off, or failure case for the method in this section.

## REQUIRED STRUCTURE

- Use **bold headings** on their own line: \`**Heading Text**\`
- Use 4-7 headings per section.
- Include all of these section functions (heading wording can vary):
  - objective/scope,
  - core mechanism or definition,
  - worked example (numeric or procedural),
  - limitations or edge cases,
  - concise takeaway.
- Use paragraphs as primary vehicle. Lists are allowed only when they improve precision.
- Use code fences for code.
- No H1/H2/H3 markdown headers; only bold headings.

## TARGETS

- **Length**: 3,500-8,000 characters per section.
- **Worked examples**: at least 1 per section.
- **Code/pseudocode**: include when topic is computational.

## ANTI-PATTERNS (FORBIDDEN)

- Empty motivational phrases or dramatic narration.
- Generic analogies without explicit mapping to technical entities.
- Pure summary without derivation, verification, or concrete example.
- Trivia-style prose that does not improve conceptual mastery.
- Contradictions with the transcript.

IMPORTANT: Return ONLY markdown content. No JSON, no preamble, no meta-commentary. Start directly with the first **bold heading**.`;
}

/**
 * Generate enriched markdown for a single YouTube section.
 */
async function generateSectionContent(
  sectionTitle: string,
  transcriptText: string,
  videoTitle: string,
  language: string,
  sectionIndex: number,
  totalSections: number,
  apiKey?: string,
): Promise<{ contentMarkdown: string; tokensUsed: number }> {
  const positionContext = buildPositionContext(sectionIndex, totalSections);

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
    messages: [
      {
        role: 'system',
        content: buildContentSystemPrompt(language),
      },
      {
        role: 'user',
        content: `Video: "${videoTitle}"
Section: "${sectionTitle}" (${sectionIndex + 1} of ${totalSections})
${positionContext}

Transcript excerpt for this section:
${transcriptText.slice(0, 20_000)}`,
      },
    ],
    temperature: 0.3,
    maxTokens: TOKEN_BUDGETS.PIPELINE_CONTENT,
    responseFormat: 'text',
    timeoutMs: 180_000,
    retryOnTimeout: true,
  });

  const contentMarkdown = content.trim();

  if (contentMarkdown.length < 100) {
    throw new Error(`Section "${sectionTitle}" generated too little content (${contentMarkdown.length} chars)`);
  }

  return { contentMarkdown, tokensUsed };
}

/**
 * Generate activateData (advance organizer) via LLM.
 */
async function generateActivateData(
  videoTitle: string,
  sections: Array<{ title: string; conceptName: string }>,
  language: string,
  apiKey?: string,
): Promise<{ activateData: ActivateData; tokensUsed: number }> {
  const langInstruction =
    language === 'es'
      ? 'Write ALL content in Spanish.'
      : 'Write ALL content in English.';

  const sectionList = sections
    .map((s, i) => `${i + 1}. "${s.title}" - concept: ${s.conceptName}`)
    .join('\n');

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
    messages: [
      {
        role: 'system',
        content: `You are creating an advance organizer for a learning resource. This is a brief overview that primes the learner before they dive into the material.

${langInstruction}

You MUST respond with valid JSON:
{
  "summary": "2-3 sentence overview of what this resource covers and why it matters",
  "sections": [
    { "number": 1, "title": "section title", "description": "1-sentence preview of this section" }
  ],
  "keyConcepts": ["concept1", "concept2", ...],
  "insight": "One compelling insight or question that motivates studying this material"
}`,
      },
      {
        role: 'user',
        content: `Resource: "${videoTitle}"

Sections:
${sectionList}`,
      },
    ],
    temperature: 0.3,
    maxTokens: TOKEN_BUDGETS.PIPELINE_ACTIVATE,
    responseFormat: 'json',
    timeoutMs: 30_000,
  });

  const parsed = parseJsonResponse(content, ActivateDataResponseSchema);
  return { activateData: parsed, tokensUsed };
}

function normalizePdfMarkdown(markdown: string): string {
  return markdown
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripEditorialPdfPrefixes(markdown: string): string {
  const lines = markdown.split('\n');
  const cleaned: string[] = [];
  let skipped = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (skipped < 3) {
      if (/^(section|seccion|sección)\s*:/i.test(trimmed)) {
        skipped += 1;
        continue;
      }
      if (/^p[aá]gina\s+\d+\s*:/i.test(trimmed)) {
        skipped += 1;
        continue;
      }
      if (/^page\s+\d+\s*:/i.test(trimmed)) {
        skipped += 1;
        continue;
      }
    }
    cleaned.push(line);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function ensurePdfHeadingOnce(sectionTitle: string, body: string): string {
  const normalizedBody = body.trim();
  const normalizedTitle = sectionTitle.replace(/\s+/g, ' ').trim();
  if (!normalizedBody) {
    return `**${normalizedTitle}**`;
  }

  const bodyStart = normalizedBody
    .slice(0, Math.min(220, normalizedBody.length))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const normalizedTitleLower = normalizedTitle.toLowerCase();

  if (
    bodyStart.startsWith(`**${normalizedTitleLower}**`)
    || bodyStart.startsWith(normalizedTitleLower)
    || bodyStart.startsWith(`sección: "${normalizedTitleLower}`)
    || bodyStart.startsWith(`section: "${normalizedTitleLower}`)
  ) {
    return normalizedBody;
  }

  return `**${normalizedTitle}**\n\n${normalizedBody}`;
}

function toDeepLLangCode(lang: string): string | null {
  const normalized = lang.trim().toLowerCase();
  const map: Record<string, string> = {
    en: 'EN',
    es: 'ES',
    fr: 'FR',
    pt: 'PT',
    de: 'DE',
  };
  return map[normalized] ?? null;
}

function protectMarkdownSegments(markdown: string): {
  protectedText: string;
  restore: (input: string) => string;
} {
  const patterns = [
    /```[\s\S]*?```/g,
    /`[^`\n]+`/g,
    /!\[[^\]]*]\([^)]+\)/g,
    /\[[^\]]+]\([^)]+\)/g,
  ];

  const saved: string[] = [];
  let protectedText = markdown;

  for (const pattern of patterns) {
    protectedText = protectedText.replace(pattern, (match) => {
      const token = `__JARRE_KEEP_${saved.length}__`;
      saved.push(match);
      return token;
    });
  }

  const restore = (input: string): string => {
    let output = input;
    for (let i = 0; i < saved.length; i++) {
      output = output.replaceAll(`__JARRE_KEEP_${i}__`, saved[i]);
    }
    return output;
  };

  return { protectedText, restore };
}

interface DeepLTranslateResponse {
  translations?: Array<{ text?: string }>;
}

async function translatePdfSectionWithDeepL(
  markdown: string,
  fromLang: string,
  toLang: string,
): Promise<string | null> {
  const deeplKey = process.env.DEEPL_API_KEY;
  if (!deeplKey) return null;

  const fromCode = toDeepLLangCode(fromLang);
  const toCode = toDeepLLangCode(toLang);
  if (!fromCode || !toCode) return null;

  const { protectedText, restore } = protectMarkdownSegments(markdown);

  const body = new URLSearchParams();
  body.set('text', protectedText);
  body.set('source_lang', fromCode);
  body.set('target_lang', toCode);
  body.set('preserve_formatting', '1');
  body.set('split_sentences', 'nonewlines');

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(DEEPL_TRANSLATE_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error (${response.status}): ${errorText.slice(0, 300)}`);
    }

    const json = (await response.json()) as DeepLTranslateResponse;
    const translated = json.translations?.[0]?.text?.trim() || '';
    if (translated.length < 40) {
      throw new Error(`DeepL translated content too short (${translated.length} chars)`);
    }

    return stripEditorialPdfPrefixes(restore(translated));
  } catch (error) {
    log.warn(`DeepL translation failed: ${(error as Error).message}`);
    return null;
  }
}

async function translatePdfSectionFaithfully(
  contentMarkdown: string,
  sectionTitle: string,
  fromLang: string,
  toLang: string,
  apiKey?: string,
): Promise<{ translatedMarkdown: string; tokensUsed: number; timedOut: boolean }> {
  if (fromLang === toLang) {
    return { translatedMarkdown: contentMarkdown, tokensUsed: 0, timedOut: false };
  }

  const deeplTranslated = await translatePdfSectionWithDeepL(contentMarkdown, fromLang, toLang);
  if (deeplTranslated) {
    return { translatedMarkdown: deeplTranslated, tokensUsed: 0, timedOut: false };
  }

  const langNames: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    pt: 'Portuguese',
    de: 'German',
  };

  const fromName = langNames[fromLang] || fromLang;
  const toName = langNames[toLang] || toLang;

  const basePrompt = `You are a precise technical translator. Translate markdown from ${fromName} to ${toName} with maximum fidelity to the source.

Rules:
- Preserve every factual claim, equation, citation number, symbol, and ordering.
- Do NOT summarize, simplify, expand, or add examples.
- Keep markdown structure and spacing stable whenever possible.
- Preserve markdown image syntax exactly: ![alt](url)
- Keep code blocks and inline code unchanged.
- Keep all numeric values exactly the same.
- Do not add labels such as "Section:", "Sección:", "Page:", or editorial comments.

IMPORTANT: Return ONLY translated markdown. No notes, no JSON, no explanations.`;

  // Fast path: one request per section.
  try {
    const { content, tokensUsed } = await callDeepSeek({
      apiKey,
      messages: [
        { role: 'system', content: basePrompt },
        {
          role: 'user',
          content: `Translate this markdown section exactly:\n\n${contentMarkdown}`,
        },
      ],
      temperature: 0,
      maxTokens: TOKEN_BUDGETS.PIPELINE_TRANSLATE,
      responseFormat: 'text',
      timeoutMs: PDF_TRANSLATION_FAST_TIMEOUT_MS,
      retryOnTimeout: false,
    });

    const cleaned = stripEditorialPdfPrefixes(content.trim());
    if (cleaned.length >= 40) {
      return { translatedMarkdown: cleaned, tokensUsed, timedOut: false };
    }
  } catch (error) {
    const message = (error as Error).message;
    if (/timeout/i.test(message)) {
      log.warn(
        `PDF translation fast path timed out for "${sectionTitle}" (${Math.round(PDF_TRANSLATION_FAST_TIMEOUT_MS / 1000)}s). Falling back to original text.`,
      );
      return {
        translatedMarkdown: contentMarkdown,
        tokensUsed: 0,
        timedOut: true,
      };
    }
    log.warn(`PDF translation fast path failed for "${sectionTitle}": ${message}`);
  }

  // Fallback path: chunked translation with fail-fast calls.
  const chunks = contentMarkdown
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<string[]>((acc, part) => {
      if (acc.length === 0) {
        acc.push(part);
        return acc;
      }
      const lastIndex = acc.length - 1;
      const candidate = `${acc[lastIndex]}\n\n${part}`;
      if (candidate.length <= PDF_TRANSLATION_CHUNK_CHARS) {
        acc[lastIndex] = candidate;
      } else {
        acc.push(part);
      }
      return acc;
    }, []);

  const safeChunks = chunks.length > 0 ? chunks : [contentMarkdown];
  let totalTokens = 0;
  const translatedChunks: string[] = [];

  for (let i = 0; i < safeChunks.length; i++) {
    const chunk = safeChunks[i];

    try {
      const { content, tokensUsed } = await callDeepSeek({
        apiKey,
        messages: [
          { role: 'system', content: basePrompt },
          {
            role: 'user',
            content: `Translate this markdown chunk exactly (${i + 1}/${safeChunks.length}):\n\n${chunk}`,
          },
        ],
        temperature: 0,
        maxTokens: TOKEN_BUDGETS.PIPELINE_TRANSLATE,
        responseFormat: 'text',
        timeoutMs: PDF_TRANSLATION_CHUNK_TIMEOUT_MS,
        retryOnTimeout: false,
      });

      const cleaned = stripEditorialPdfPrefixes(content.trim());
      translatedChunks.push(cleaned || chunk);
      totalTokens += tokensUsed;
    } catch (error) {
      const message = (error as Error).message;
      if (/timeout/i.test(message)) {
        log.warn(
          `PDF translation chunk timed out for "${sectionTitle}" at ${i + 1}/${safeChunks.length} (${Math.round(PDF_TRANSLATION_CHUNK_TIMEOUT_MS / 1000)}s). Falling back to original text.`,
        );
      } else {
        log.warn(`PDF translation section fallback for "${sectionTitle}" at chunk ${i + 1}/${safeChunks.length}: ${message}`);
      }
      return {
        translatedMarkdown: contentMarkdown,
        tokensUsed: totalTokens,
        timedOut: /timeout/i.test(message),
      };
    }
  }

  const translatedMarkdown = stripEditorialPdfPrefixes(translatedChunks.join('\n\n').trim());
  if (translatedMarkdown.length < 40) {
    throw new Error(`Translation for "${sectionTitle}" is too short (${translatedMarkdown.length} chars)`);
  }

  return { translatedMarkdown, tokensUsed: totalTokens, timedOut: false };
}

async function isTranslationProviderHealthy(apiKey?: string): Promise<boolean> {
  try {
    await callDeepSeek({
      apiKey,
      messages: [
        { role: 'system', content: 'Reply with exactly: ok' },
        { role: 'user', content: 'ok' },
      ],
      temperature: 0,
      maxTokens: 10,
      responseFormat: 'text',
      timeoutMs: 8_000,
      retryOnTimeout: false,
    });
    return true;
  } catch {
    return false;
  }
}

function buildPdfActivateData(
  resourceTitle: string,
  sections: SegmentOutput['sections'],
  language: string,
): ActivateData {
  const isEs = language === 'es';
  const summary = isEs
    ? `Version web del documento original "${resourceTitle}" con traduccion fiel y orden de lectura preservado.`
    : `Web version of the original document "${resourceTitle}" with faithful translation and preserved reading order.`;

  const sectionRows = sections.slice(0, 16).map((section, i) => ({
    number: i + 1,
    title: section.title,
    description: isEs
      ? 'Traduccion fiel del contenido original en este bloque.'
      : 'Faithful translation of the original content in this block.',
  }));

  const keyConcepts = Array.from(
    new Set(
      sections
        .map((s) => s.conceptName || s.title)
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);

  const insight = isEs
    ? 'Leelo en orden para seguir el argumento original del paper sin perder fidelidad tecnica.'
    : 'Read it in order to follow the original paper argument without losing technical fidelity.';

  return {
    summary,
    sections: sectionRows,
    keyConcepts,
    insight,
  };
}

async function buildPdfContent(
  segment: SegmentOutput,
  videoTitle: string,
  targetLanguage: string,
  sourceLanguage: string,
  apiKey?: string,
): Promise<{ output: ContentOutput; tokensUsed: number }> {
  let totalTokens = 0;
  let translationEnabled = sourceLanguage !== targetLanguage;

  if (translationEnabled) {
    const healthy = await isTranslationProviderHealthy(apiKey);
    if (!healthy) {
      translationEnabled = false;
      log.warn('PDF translation skipped for this run: provider is not healthy (timeout/availability). Keeping original language.');
    }
  }

  const tasks = segment.sections.map((section) => {
    return async () => {
      const original = normalizePdfMarkdown(section.transcriptText);
      if (!translationEnabled) {
        return {
          contentOriginal: original,
          contentMarkdown: original,
          tokensUsed: 0,
          timedOut: false,
        };
      }

      const { translatedMarkdown, tokensUsed, timedOut } = await translatePdfSectionFaithfully(
        original,
        section.title,
        sourceLanguage,
        targetLanguage,
        apiKey,
      );

      if (timedOut && translationEnabled) {
        translationEnabled = false;
        log.warn(`PDF translation disabled after timeout at section "${section.title}". Remaining sections will keep original language in this run.`);
      }

      return {
        contentOriginal: original,
        contentMarkdown: translatedMarkdown,
        tokensUsed,
        timedOut,
      };
    };
  });

  const translated = await runWithConcurrency(tasks, TRANSLATION_MAX_CONCURRENT);

  const sections: ContentSection[] = segment.sections.map((seg, i) => {
    const row = translated[i];
    totalTokens += row.tokensUsed;

    const contentMarkdown = ensurePdfHeadingOnce(seg.title, stripEditorialPdfPrefixes(row.contentMarkdown));

    return {
      title: seg.title,
      conceptName: seg.conceptName,
      conceptSlug: seg.conceptSlug,
      contentMarkdown,
      contentOriginal: row.contentOriginal,
      headings: [seg.title],
      startSeconds: seg.startSeconds,
      endSeconds: seg.endSeconds,
      startPage: seg.startPage,
      endPage: seg.endPage,
    };
  });

  const activateData = buildPdfActivateData(videoTitle, segment.sections, targetLanguage);

  log.info(`Prepared PDF content for ${sections.length} sections (${totalTokens} translation tokens)`);

  return {
    output: { sections, activateData },
    tokensUsed: totalTokens,
  };
}

/**
 * Stage 3: Generate content for all sections + activateData.
 */
export async function generateSections(
  segment: SegmentOutput,
  videoTitle: string,
  language: string,
  apiKey?: string,
  options: GenerateSectionsOptions = {},
): Promise<{ output: ContentOutput; tokensUsed: number }> {
  const sourceType = options.sourceType ?? 'youtube';
  const sourceLanguage = options.sourceLanguage ?? language;

  if (sourceType === 'pdf') {
    return buildPdfContent(
      segment,
      videoTitle,
      language,
      sourceLanguage,
      apiKey,
    );
  }

  let totalTokens = 0;
  const totalSections = segment.sections.length;

  const tasks = segment.sections.map((section, index) => {
    return async () => {
      return generateSectionContent(
        section.title,
        section.transcriptText,
        videoTitle,
        language,
        index,
        totalSections,
        apiKey,
      );
    };
  });

  const sectionResults = await runWithConcurrency(tasks, PIPELINE_MAX_CONCURRENT);

  const { activateData, tokensUsed: activateTokens } = await generateActivateData(
    videoTitle,
    segment.sections,
    language,
    apiKey,
  );
  totalTokens += activateTokens;

  const sections: ContentSection[] = segment.sections.map((seg, i) => {
    const { contentMarkdown, tokensUsed } = sectionResults[i];
    totalTokens += tokensUsed;

    const headings = extractBoldHeadings(contentMarkdown);

    return {
      title: seg.title,
      conceptName: seg.conceptName,
      conceptSlug: seg.conceptSlug,
      contentMarkdown,
      headings,
      startSeconds: seg.startSeconds,
      endSeconds: seg.endSeconds,
      startPage: seg.startPage,
      endPage: seg.endPage,
    };
  });

  for (const section of sections) {
    if (section.headings.length === 0) {
      log.warn(`Section "${section.title}" has no bold headings - content may not position quizzes well`);
    }
  }

  log.info(`Generated content for ${sections.length} sections (${totalTokens} tokens total)`);

  return {
    output: { sections, activateData },
    tokensUsed: totalTokens,
  };
}

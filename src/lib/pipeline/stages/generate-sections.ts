/**
 * Pipeline Stage 3: Generate Section Content
 *
 * For each section, generates enriched markdown with bold headings,
 * clear explanations, and analogies. Also generates activateData.
 * Runs LLM calls in parallel (max PIPELINE_MAX_CONCURRENT).
 */

import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, PIPELINE_MAX_CONCURRENT } from '@/lib/constants';
import { ActivateDataResponseSchema } from '../schemas';
import type { SegmentOutput, ContentOutput, ContentSection, ActivateData } from '../types';

const log = createLogger('Pipeline:Content');

/**
 * Build position context for the user prompt.
 * Tells the LLM what role this section plays in the progression.
 */
function buildPositionContext(sectionIndex: number, totalSections: number): string {
  if (totalSections <= 1) return 'Role: This is the only section — cover everything thoroughly.';

  if (sectionIndex === 0) {
    return 'Role: OPENING section — establish foundations, define key terms, build scaffolding from what the reader likely already knows. Set up the mental model that later sections will build on.';
  }

  if (sectionIndex === totalSections - 1) {
    return 'Role: CLOSING section — synthesize the full picture, connect all prior concepts, show the big insight. Reference ideas from earlier sections to create closure.';
  }

  const position = sectionIndex / (totalSections - 1);
  if (position < 0.4) {
    return 'Role: EARLY section — building core concepts. Reference the foundations from the opening section and start deepening.';
  }
  if (position < 0.7) {
    return 'Role: MIDDLE section — peak complexity. This is where the hardest ideas live. Use all 3 angles (intuitive, formal, numerical) heavily.';
  }
  return 'Role: LATE section — connecting and applying. Start tying concepts together and showing how the pieces fit into the full picture.';
}

/**
 * Extract bold headings from markdown content.
 * Matches lines that are standalone bold text: **Heading Text**
 */
function extractBoldHeadings(markdown: string): string[] {
  const headings: string[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Match standalone bold: **text** (possibly with leading whitespace)
    const match = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      headings.push(match[1].trim());
    }
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
 * Build the system prompt for section content generation.
 * Encodes pedagogical quality standards directly into the prompt.
 */
function buildContentSystemPrompt(language: string): string {
  const langInstruction =
    language === 'es'
      ? 'Escribí TODO en español técnico claro (registro académico). Evitá tono coloquial o motivacional.'
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

- **Length**: 3,500–8,000 characters per section.
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
 * Generate enriched markdown for a single section.
 * Uses text mode (not JSON) because markdown with code blocks breaks JSON serialization.
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

  // Content is raw markdown — no JSON parsing needed
  const contentMarkdown = content.trim();

  if (contentMarkdown.length < 100) {
    throw new Error(`Section "${sectionTitle}" generated too little content (${contentMarkdown.length} chars)`);
  }

  return { contentMarkdown, tokensUsed };
}

/**
 * Generate activateData (advance organizer) from all sections.
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
    .map((s, i) => `${i + 1}. "${s.title}" — concept: ${s.conceptName}`)
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

/**
 * Stage 3: Generate enriched content for all sections + activateData.
 */
export async function generateSections(
  segment: SegmentOutput,
  videoTitle: string,
  language: string,
  apiKey?: string,
): Promise<{ output: ContentOutput; tokensUsed: number }> {
  let totalTokens = 0;

  // Generate section content in parallel (max PIPELINE_MAX_CONCURRENT)
  const totalSections = segment.sections.length;
  const tasks = segment.sections.map((section, index) => {
    return async () => {
      const result = await generateSectionContent(
        section.title,
        section.transcriptText,
        videoTitle,
        language,
        index,
        totalSections,
        apiKey,
      );
      return result;
    };
  });

  const sectionResults = await runWithConcurrency(tasks, PIPELINE_MAX_CONCURRENT);

  // Generate activateData
  const { activateData, tokensUsed: activateTokens } = await generateActivateData(
    videoTitle,
    segment.sections,
    language,
    apiKey,
  );
  totalTokens += activateTokens;

  // Assemble content sections
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
    };
  });

  // Validate: every section should have at least 1 heading
  for (const section of sections) {
    if (section.headings.length === 0) {
      log.warn(`Section "${section.title}" has no bold headings — content may not position quizzes well`);
    }
  }

  log.info(
    `Generated content for ${sections.length} sections (${totalTokens} tokens total)`,
  );

  return {
    output: { sections, activateData },
    tokensUsed: totalTokens,
  };
}

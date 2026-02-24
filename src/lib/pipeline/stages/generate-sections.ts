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
      ? 'Escribí TODO el contenido en español rioplatense (voseo: "vos tenés", "pensá", "fijate"). NUNCA uses "tú" ni "usted".'
      : 'Write ALL content in English. Use a conversational, precise tone.';

  return `You are an instrument of active comprehension. You do NOT summarize, translate, or tutor. You BUILD understanding from scratch — the reader should finish each section feeling they could re-derive the ideas themselves.

## YOUR 6 OPERATIONS

1. **EXPAND**: When the transcript assumes prior knowledge (says something in 1 line that deserves a full paragraph), you MUST unpack it. Ask yourself: "Would someone without the prerequisite truly follow this?" If not, expand.

2. **TRIPLE COVERAGE**: Every core concept gets covered from 3 angles:
   - Narrative/intuitive (analogy, visual, story)
   - Formal/precise (definition, formula, pseudocode)
   - Numerical/concrete (worked example with real numbers, step-by-step)
   If the concept doesn't lend itself to all 3, use at least 2.

3. **EUREKA MOMENTS**: Build tension → revelation → anchor. Don't just state facts. First show WHY something is surprising or counterintuitive, THEN reveal the insight, THEN anchor it with a concrete verification. The reader should feel "¡ahh, claro!" at least once per section.

4. **FUNCTIONAL ANALOGIES**: Analogies must be:
   - Mappable (each part of the analogy corresponds to a real component)
   - Scalable (the analogy still works when complexity increases)
   - Disposable (explicitly say when the analogy breaks down)
   Bad: "It's like a brain." Good: "Imagine a spreadsheet where each column is a feature and each row is a data point. The weight vector is a recipe that says how much each column matters for the final answer. This analogy breaks when we add non-linearity — spreadsheets don't compose functions."

5. **DISTRIBUTED REPETITION**: Key concepts must reappear naturally in new contexts. If you introduce "gradient" in paragraph 2, it should show up again in a code example, then in a numerical verification, each time deepening understanding.

6. **INCREMENTAL CODE**: When the topic involves code, build it up piece by piece:
   - Start with the simplest version (even pseudocode)
   - Add complexity one step at a time
   - NEVER drop a full block of code without prior build-up
   - After each code step, explain what changed and why

## 9 MANDATORY ELEMENTS (include ALL that apply to this section's topic)

A. **Conceptual scaffolding** — bridge from what the reader likely knows to what's new
B. **At least 2 functional analogies** per section (if topic allows)
C. **Numerical verification** — pick concrete numbers, compute step by step, show the result matches the theory
D. **"What if" variations** — change one variable and show what happens (builds intuition for edge cases)
E. **Build-up code** — incremental, never monolithic (when code is relevant)
F. **Explicit connection to prior sections** — reference what was established before
G. **At least 1 eureka moment** — the reader should feel surprise → insight → confirmation
H. **Anti-patterns** — explicitly show what NOT to do and why it fails
I. **Micro-summary at the end** — 2-3 sentences that crystallize the key insight (not a list of topics)

## RHYTHM

Follow a 3-beat cycle throughout the section:
Intuition → Formalization → Verification → (next concept) → Intuition → ...

Do NOT front-load all intuition then all math then all code. Interleave them per concept.

## TONE

- Conversational but precise — like a brilliant friend explaining at a whiteboard
- ${langInstruction}
- NEVER sound like: a textbook, a tutorial blog post, a research paper, or a chatbot
- Use direct address ("fijate que...", "pensá en esto...", "notice how...", "think about...")
- Convey genuine enthusiasm for elegant ideas without being cheesy

## FORMAT

- Structure with **bold headings** on their own line: \`**Heading Text**\`
- Use 6-10 bold headings per section to create clear rhythm
- Regular paragraphs between headings
- Code blocks with \`\`\`language
- Tables when comparing options or showing data
- NO H1/H2/H3 markdown headers — only **bold text** headings
- NO bullet-point lists as the primary content vehicle (paragraphs are primary, lists only for enumeration)

## TARGETS

- **Length**: 10,000–18,000 characters per section. This is NOT optional — short sections fail the quality bar.
- **Headings**: 6-10 per section
- **Code blocks**: at least 1 if the topic involves any programming concept
- **Numerical examples**: at least 1 per section with actual computed values

## ANTI-PATTERNS (NEVER do these)

- Surface summary that just restates the transcript in fewer words
- Monolithic code blocks without build-up or explanation
- Formulas without numerical verification
- Analogies that don't map to the real components
- Generic filler ("This is an important concept in machine learning...")
- Starting with "In this section we will learn about..."

IMPORTANT: Return ONLY the markdown content. No JSON wrapping, no preamble, no meta-commentary. Just the markdown starting with the first **bold heading**.`;
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
): Promise<{ contentMarkdown: string; tokensUsed: number }> {
  const positionContext = buildPositionContext(sectionIndex, totalSections);

  const { content, tokensUsed } = await callDeepSeek({
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
): Promise<{ activateData: ActivateData; tokensUsed: number }> {
  const langInstruction =
    language === 'es'
      ? 'Write ALL content in Spanish.'
      : 'Write ALL content in English.';

  const sectionList = sections
    .map((s, i) => `${i + 1}. "${s.title}" — concept: ${s.conceptName}`)
    .join('\n');

  const { content, tokensUsed } = await callDeepSeek({
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

/**
 * Pipeline Stage 2: Segment Content
 *
 * - YouTube: LLM-driven thematic segmentation.
 * - PDF: deterministic page-ordered segmentation to preserve document fidelity.
 */

import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, CONTENT_TRUNCATION_CHARS } from '@/lib/constants';
import { SegmentResponseSchema } from '../schemas';
import type { ResolveOutput, SegmentOutput, SegmentSection } from '../types';

const log = createLogger('Pipeline:Segment');
const MAX_PDF_SECTIONS = 24;

/**
 * Build a chapter context string for the LLM prompt.
 */
function formatChapters(chapters: ResolveOutput['chapters']): string {
  if (chapters.length === 0) return 'No YouTube chapters available.';

  return (
    'YouTube chapters (use as guidance, not rigid boundaries):\n' +
    chapters
      .map((ch, i) => `  ${i + 1}. [${formatTime(ch.startSeconds)}] ${ch.title}`)
      .join('\n')
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function inferPdfSectionHeading(markdown: string): string | null {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^!\[[^\]]*]\([^)]+\)$/.test(line))
    .filter((line) => line.length >= 12 && line.length <= 120)
    .filter((line) => !/^[\d.\s-]+$/.test(line));

  const headingLike = lines.find((line) => {
    const words = line
      .split(/\s+/)
      .map((word) => word.replace(/[^A-Za-z0-9-]/g, ''))
      .filter(Boolean);
    if (words.length < 2 || words.length > 12) return false;

    const titleCaseCount = words.filter((word) => /^[A-Z][A-Za-z0-9-]*$/.test(word)).length;
    return titleCaseCount / words.length >= 0.7;
  });
  if (headingLike) {
    return headingLike.replace(/\s+/g, ' ').trim();
  }

  for (const line of lines) {
    const normalized = line.replace(/\s+/g, ' ').trim();
    const lower = normalized.toLowerCase();
    if (lower.startsWith('figure ') || lower.startsWith('table ')) continue;
    if (lower.includes('copyright')) continue;
    if (lower.includes('provided proper attribution')) continue;
    if (lower.includes('all rights reserved')) continue;
    if (lower.includes('arxiv:')) continue;
    return normalized;
  }

  return null;
}

function buildPdfSections(resolve: ResolveOutput): SegmentSection[] {
  const orderedSnippets = [...resolve.snippets].sort((a, b) => a.start - b.start);
  const withPages = orderedSnippets.filter((snippet) => typeof snippet.pageNumber === 'number');
  const sourceSnippets = withPages.length > 0 ? withPages : orderedSnippets;
  if (sourceSnippets.length === 0) return [];

  const groupSize = Math.max(1, Math.ceil(sourceSnippets.length / MAX_PDF_SECTIONS));
  const sections: SegmentSection[] = [];

  for (let i = 0; i < sourceSnippets.length; i += groupSize) {
    const group = sourceSnippets.slice(i, i + groupSize);
    const first = group[0];
    const last = group[group.length - 1];

    const startPage = first.pageNumber;
    const endPage = last.pageNumber;
    const pageLabel =
      typeof startPage === 'number'
        ? (startPage === endPage ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`)
        : `Part ${sections.length + 1}`;

    const heading = inferPdfSectionHeading(first.text);
    const title = heading ? `${pageLabel}: ${heading}` : pageLabel;
    const transcriptText = group.map((snippet) => snippet.text).join('\n\n');

    sections.push({
      title,
      conceptName: heading || pageLabel,
      conceptSlug: slugify(`${pageLabel} ${heading || ''}`) || `pdf-part-${sections.length + 1}`,
      startSeconds: first.start,
      endSeconds: last.start + last.duration,
      transcriptText,
      startPage,
      endPage,
    });
  }

  return sections;
}

/**
 * Stage 2: Segment transcript into thematic sections.
 */
export async function segmentContent(
  resolve: ResolveOutput,
  sourceType: 'youtube' | 'pdf' = (resolve.sourceType ?? 'youtube'),
  apiKey?: string,
): Promise<{ output: SegmentOutput; tokensUsed: number }> {
  if (sourceType === 'pdf') {
    const sections = buildPdfSections(resolve);
    if (sections.length === 0) {
      throw new Error('Could not segment PDF content into sections.');
    }

    log.info(`Segmented PDF into ${sections.length} ordered sections (deterministic)`);
    return {
      output: { sections },
      tokensUsed: 0,
    };
  }

  const truncatedTranscript =
    resolve.fullTranscript.length > CONTENT_TRUNCATION_CHARS
      ? resolve.fullTranscript.slice(0, CONTENT_TRUNCATION_CHARS) + '\n[Transcript truncated...]'
      : resolve.fullTranscript;

  const chaptersContext = formatChapters(resolve.chapters);

  const systemPrompt = `You are a curriculum designer. Given a video transcript, divide it into 4-6 thematic sections that form a logical learning sequence.

${chaptersContext}

Each section should:
- Have a clear, descriptive title
- Cover a coherent topic or concept
- Have reasonable time boundaries (based on content flow, not equal splits)
- Include a conceptName (short identifier) and conceptSlug (URL-safe)

Estimate startSeconds and endSeconds for each section based on the content distribution in the transcript. The video is ${resolve.durationSeconds} seconds long.

You MUST respond with valid JSON using EXACTLY this schema:
{
  "sections": [
    {
      "title": "Section Title",
      "conceptName": "short concept identifier",
      "conceptSlug": "url-safe-slug",
      "startSeconds": 0,
      "endSeconds": 300
    }
  ]
}

Requirements:
- 4-6 sections total
- Sections must be ordered chronologically
- startSeconds of section N+1 should equal endSeconds of section N
- Last section endSeconds should be close to the video duration (${resolve.durationSeconds}s)`;

  const { content, tokensUsed } = await callDeepSeek({
    apiKey,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `Video: "${resolve.title}" (${resolve.durationSeconds}s, language: ${resolve.language})

Transcript:
${truncatedTranscript}`,
      },
    ],
    temperature: 0.2,
    maxTokens: TOKEN_BUDGETS.PIPELINE_SEGMENT,
    responseFormat: 'json',
    timeoutMs: 60_000,
    retryOnTimeout: true,
  });

  const parsed = parseJsonResponse(content, SegmentResponseSchema);

  // Post-process: ensure slugs are valid and assign transcript text per section
  const sections: SegmentSection[] = parsed.sections.map((s) => {
    const slug = s.conceptSlug || slugify(s.title);

    // Extract transcript text for this section's time range
    const sectionSnippets = resolve.snippets.filter(
      (sn) => sn.start >= s.startSeconds && sn.start < s.endSeconds,
    );
    const transcriptText = sectionSnippets.map((sn) => sn.text).join(' ');

    return {
      title: s.title,
      conceptName: s.conceptName,
      conceptSlug: slug,
      startSeconds: s.startSeconds,
      endSeconds: s.endSeconds,
      transcriptText: transcriptText || resolve.fullTranscript.slice(0, 2000),
    };
  });

  log.info(`Segmented into ${sections.length} sections (${tokensUsed} tokens)`);

  return {
    output: { sections },
    tokensUsed,
  };
}

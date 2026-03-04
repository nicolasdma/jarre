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
const PDF_MIN_SECTIONS = 4;
const PDF_MAX_SECTIONS = 8;

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

function parseHeadingNumber(line: string): number | null {
  const match = line.match(/^([1-9]|[1-3]\d)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferPdfSectionHeading(markdown: string, expectedSectionNumber?: number): string | null {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^!\[[^\]]*]\([^)]+\)$/.test(line))
    .filter((line) => line.length >= 3 && line.length <= 140)
    .filter((line) => !/^[\d.\s-]+$/.test(line));

  const explicitSections = lines
    .filter((line) => /^(?:[1-9]|[1-3]\d)(?:\.(?:\d+)?)?\s+[A-Za-z].{2,}$/.test(line))
    .filter((line) => {
      const text = line.replace(/^(?:[1-9]|[1-3]\d)(?:\.(?:\d+)?)?\s+/, '');
      if (text.length > 90) return false;
      if (/[;:]/.test(text)) return false;
      if (text.endsWith('.')) return false;
      if ((text.match(/,/g) || []).length > 0) return false;

      const words = text.split(/\s+/).filter(Boolean);
      if (words.length < 2 || words.length > 14) return false;

      const letters = text.replace(/[^A-Za-z]/g, '');
      if (letters.length < 3) return false;
      const upperRatio = letters.replace(/[^A-Z]/g, '').length / letters.length;
      if (upperRatio > 0.8 && !/^(REFERENCES|APPENDIX)/.test(text.trim())) {
        return false;
      }
      return true;
    });
  if (explicitSections.length > 0) {
    const scored = explicitSections.map((line, index) => {
      const prefix = line.split(/\s+/, 1)[0];
      const depth = (prefix.match(/\./g) || []).length;
      const num = parseHeadingNumber(line);
      const distance =
        typeof expectedSectionNumber === 'number' && typeof num === 'number'
          ? Math.abs(num - expectedSectionNumber)
          : 0;
      return { line, depth, index, distance };
    });

    const best = scored.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.index - b.index;
    })[0].line;
    return best.replace(/\s+/g, ' ').trim();
  }

  const namedHeading = lines.find((line) => /^(abstract|introduction|conclusion|references|appendix)\b/i.test(line));
  if (namedHeading) {
    return namedHeading.replace(/\s+/g, ' ').trim();
  }

  return null;
}

function buildPdfSections(resolve: ResolveOutput): SegmentSection[] {
  const orderedSnippets = [...resolve.snippets].sort((a, b) => a.start - b.start);
  const withPages = orderedSnippets.filter((snippet) => typeof snippet.pageNumber === 'number');
  const sourceSnippets = withPages.length > 0 ? withPages : orderedSnippets;
  if (sourceSnippets.length === 0) return [];

  const desiredSections = Math.max(
    PDF_MIN_SECTIONS,
    Math.min(PDF_MAX_SECTIONS, Math.round(sourceSnippets.length / 3)),
  );
  const groupSize = Math.max(1, Math.ceil(sourceSnippets.length / desiredSections));
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

    const heading = inferPdfSectionHeading(
      group.map((snippet) => snippet.text).join('\n'),
      sections.length + 1,
    );
    const title = heading
      ? `${heading} (${pageLabel})`
      : pageLabel;
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

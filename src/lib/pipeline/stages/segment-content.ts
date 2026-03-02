/**
 * Pipeline Stage 2: Segment Content
 *
 * Uses LLM to divide the full transcript into 4-6 thematic sections.
 * If YouTube chapters exist, they guide the segmentation.
 */

import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS, CONTENT_TRUNCATION_CHARS } from '@/lib/constants';
import { SegmentResponseSchema } from '../schemas';
import type { ResolveOutput, SegmentOutput, SegmentSection } from '../types';

const log = createLogger('Pipeline:Segment');

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

/**
 * Stage 2: Segment transcript into thematic sections.
 */
export async function segmentContent(
  resolve: ResolveOutput,
): Promise<{ output: SegmentOutput; tokensUsed: number }> {
  const truncatedTranscript =
    resolve.fullTranscript.length > CONTENT_TRUNCATION_CHARS
      ? resolve.fullTranscript.slice(0, CONTENT_TRUNCATION_CHARS) + '\n[Transcript truncated...]'
      : resolve.fullTranscript;

  const chaptersContext = formatChapters(resolve.chapters);

  const { content, tokensUsed } = await callDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You are a curriculum designer. Given a video transcript, divide it into 4-6 thematic sections that form a logical learning sequence.

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
- Last section endSeconds should be close to the video duration (${resolve.durationSeconds}s)`,
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

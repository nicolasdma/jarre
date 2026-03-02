/**
 * Pipeline Stage 5: Map Video Segments (Deterministic)
 *
 * Maps video timestamps to bold headings within each section.
 * No LLM calls — uses transcript snippet timestamps + section boundaries.
 */

import { createLogger } from '@/lib/logger';
import type {
  ContentOutput,
  ResolveOutput,
  VideoMapOutput,
  VideoSegmentDef,
} from '../types';

const log = createLogger('Pipeline:VideoMap');

/**
 * Stage 5: Map video segments to headings.
 * Distributes the section's time range evenly across its headings.
 */
export function mapVideoSegments(
  contentOutput: ContentOutput,
  resolve: ResolveOutput,
): VideoMapOutput {
  const segmentsBySection: VideoMapOutput['segmentsBySection'] = [];

  for (const section of contentOutput.sections) {
    const segments: VideoSegmentDef[] = [];
    const { headings, startSeconds, endSeconds } = section;

    if (headings.length === 0) {
      segmentsBySection.push({ sectionTitle: section.title, segments: [] });
      continue;
    }

    const sectionDuration = endSeconds - startSeconds;
    const segmentDuration = sectionDuration / headings.length;

    for (let i = 0; i < headings.length; i++) {
      const segStart = Math.round(startSeconds + i * segmentDuration);
      const segEnd = Math.round(
        i === headings.length - 1
          ? endSeconds
          : startSeconds + (i + 1) * segmentDuration,
      );

      // Skip very short segments (< 10 seconds)
      if (segEnd - segStart < 10) continue;

      segments.push({
        positionAfterHeading: headings[i],
        sortOrder: i,
        youtubeVideoId: resolve.videoId,
        startSeconds: segStart,
        endSeconds: segEnd,
        label: headings[i],
      });
    }

    segmentsBySection.push({ sectionTitle: section.title, segments });
  }

  const totalSegments = segmentsBySection.reduce(
    (sum, s) => sum + s.segments.length,
    0,
  );
  log.info(
    `Mapped ${totalSegments} video segments across ${segmentsBySection.length} sections`,
  );

  return { segmentsBySection };
}

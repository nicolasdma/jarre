/**
 * Jarre - Content Resolver
 *
 * Resolves raw text content from external resources.
 * YouTube: fetches transcript via yt-dlp (supports auto-generated captions).
 * Everything else: falls back to user-provided notes.
 */

import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLogger } from '@/lib/logger';
import type { ResolvedContent } from './types';

const log = createLogger('ContentResolver');

/**
 * Extract YouTube video ID from various URL formats.
 */
function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse VTT subtitle file into plain text.
 * Strips timestamps, formatting tags, and deduplicates repeated lines.
 */
function parseVttToText(vtt: string): string {
  const lines = vtt.split('\n');
  const textLines: string[] = [];
  let prevLine = '';

  for (const line of lines) {
    // Skip header, empty lines, and timestamp lines
    if (
      line.startsWith('WEBVTT') ||
      line.startsWith('Kind:') ||
      line.startsWith('Language:') ||
      line.trim() === '' ||
      /^\d{2}:\d{2}/.test(line.trim()) ||
      /-->/.test(line)
    ) {
      continue;
    }

    // Strip VTT formatting tags like <00:00:00.400><c> word</c>
    const cleaned = line
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Deduplicate consecutive identical lines (VTT repeats lines across cues)
    if (cleaned && cleaned !== prevLine) {
      textLines.push(cleaned);
      prevLine = cleaned;
    }
  }

  return textLines.join(' ');
}

/**
 * Fetch YouTube transcript using yt-dlp.
 * Supports both manual and auto-generated subtitles.
 * Returns null if no subtitles are available.
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  const outputBase = join(tmpdir(), `jarre-yt-${randomUUID()}`);

  try {
    // Run yt-dlp to download subtitles only
    await new Promise<void>((resolve, reject) => {
      execFile(
        'yt-dlp',
        [
          '--write-auto-sub',
          '--write-sub',
          '--sub-lang', 'en',
          '--sub-format', 'vtt',
          '--skip-download',
          '-o', outputBase,
          `https://www.youtube.com/watch?v=${videoId}`,
        ],
        { timeout: 30000 },
        (error, _stdout, stderr) => {
          if (error) {
            log.warn(`yt-dlp error for ${videoId}: ${stderr || error.message}`);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    // yt-dlp writes to {outputBase}.en.vtt
    const vttPath = `${outputBase}.en.vtt`;
    const vttContent = await readFile(vttPath, 'utf-8');

    // Clean up temp file
    await unlink(vttPath).catch(() => {});

    const text = parseVttToText(vttContent);
    if (!text || text.length < 50) {
      log.warn(`Transcript too short for video ${videoId}: ${text.length} chars`);
      return null;
    }

    log.info(`Fetched transcript for video ${videoId}: ${text.length} chars`);
    return text;
  } catch (err) {
    // Clean up any partial files
    await unlink(`${outputBase}.en.vtt`).catch(() => {});
    log.warn(`Failed to fetch YouTube transcript for ${videoId}:`, (err as Error).message);
    return null;
  }
}

/**
 * Resolve content for an external resource.
 * Priority: YouTube transcript > user notes > none.
 */
export async function resolveContent(params: {
  url: string | null;
  type: string;
  userNotes: string | null;
}): Promise<ResolvedContent> {
  const { url, type, userNotes } = params;

  // Try YouTube transcript first
  if (type === 'youtube' && url) {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      const transcript = await fetchYouTubeTranscript(videoId);
      if (transcript) {
        return { rawContent: transcript, source: 'transcript' };
      }
      log.info('YouTube transcript unavailable, falling back to user notes');
    }
  }

  // Fallback to user notes
  if (userNotes && userNotes.trim().length > 0) {
    return { rawContent: userNotes.trim(), source: 'user_notes' };
  }

  return { rawContent: null, source: 'none' };
}

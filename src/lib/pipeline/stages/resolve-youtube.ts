/**
 * Pipeline Stage 1: Resolve YouTube
 *
 * Extracts transcript with timestamps, chapters, and metadata from a YouTube URL.
 * Extends the content-resolver pattern with timestamped snippets.
 */

import { execFile } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { TOKEN_BUDGETS } from '@/lib/constants';
import { LanguageDetectionResponseSchema } from '../schemas';
import type { ResolveOutput, TranscriptSnippet, YouTubeChapter } from '../types';

const log = createLogger('Pipeline:Resolve');

/**
 * Extract YouTube video ID from various URL formats.
 */
export function extractYouTubeVideoId(url: string): string | null {
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

/** Common yt-dlp args to avoid rate limiting via impersonation */
const YT_DLP_COMMON_ARGS = ['--impersonate', 'chrome'];

/**
 * Fetch video metadata (title, duration, chapters) using yt-dlp --dump-json.
 */
async function fetchVideoMetadata(videoId: string): Promise<{
  title: string;
  durationSeconds: number;
  chapters: YouTubeChapter[];
}> {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      [...YT_DLP_COMMON_ARGS, '--dump-json', '--no-download', `https://www.youtube.com/watch?v=${videoId}`],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          log.error(`yt-dlp metadata error for ${videoId}: ${stderr || error.message}`);
          reject(new Error(`Failed to fetch video metadata: ${error.message}`));
          return;
        }

        try {
          const data = JSON.parse(stdout);
          const chapters: YouTubeChapter[] = (data.chapters || []).map(
            (ch: { title: string; start_time: number }) => ({
              title: ch.title,
              startSeconds: Math.round(ch.start_time),
            }),
          );

          resolve({
            title: data.title || 'Untitled',
            durationSeconds: Math.round(data.duration || 0),
            chapters,
          });
        } catch (parseErr) {
          reject(new Error(`Failed to parse video metadata: ${(parseErr as Error).message}`));
        }
      },
    );
  });
}

/**
 * Parse VTT subtitle file into timestamped snippets.
 * Preserves start time and duration for each cue.
 */
function parseVttToSnippets(vtt: string): TranscriptSnippet[] {
  const snippets: TranscriptSnippet[] = [];
  const lines = vtt.split('\n');

  let currentStart = 0;
  let currentEnd = 0;
  let currentText = '';

  for (const line of lines) {
    // Skip header lines
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:') || line.trim() === '') {
      if (currentText.trim()) {
        snippets.push({
          text: currentText.trim(),
          start: currentStart,
          duration: currentEnd - currentStart,
        });
        currentText = '';
      }
      continue;
    }

    // Parse timestamp line: 00:00:01.234 --> 00:00:04.567
    const tsMatch = line.match(
      /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/,
    );
    if (tsMatch) {
      // Save previous snippet if exists
      if (currentText.trim()) {
        snippets.push({
          text: currentText.trim(),
          start: currentStart,
          duration: currentEnd - currentStart,
        });
        currentText = '';
      }
      currentStart =
        parseInt(tsMatch[1]) * 3600 + parseInt(tsMatch[2]) * 60 + parseInt(tsMatch[3]) + parseInt(tsMatch[4]) / 1000;
      currentEnd =
        parseInt(tsMatch[5]) * 3600 + parseInt(tsMatch[6]) * 60 + parseInt(tsMatch[7]) + parseInt(tsMatch[8]) / 1000;
      continue;
    }

    // Text line — strip VTT formatting tags
    const cleaned = line
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned) {
      currentText += (currentText ? ' ' : '') + cleaned;
    }
  }

  // Don't forget the last snippet
  if (currentText.trim()) {
    snippets.push({
      text: currentText.trim(),
      start: currentStart,
      duration: currentEnd - currentStart,
    });
  }

  // Deduplicate consecutive identical text (VTT often repeats cues)
  const deduped: TranscriptSnippet[] = [];
  for (const s of snippets) {
    if (deduped.length === 0 || deduped[deduped.length - 1].text !== s.text) {
      deduped.push(s);
    }
  }

  return deduped;
}

/**
 * Try to download subtitles for a single language.
 * Returns VTT content if successful, null otherwise.
 */
async function tryDownloadSubs(
  videoId: string,
  lang: string,
  outputBase: string,
): Promise<string | null> {
  try {
    await new Promise<void>((resolve, reject) => {
      execFile(
        'yt-dlp',
        [
          ...YT_DLP_COMMON_ARGS,
          '--write-auto-sub',
          '--write-sub',
          '--sub-lang', lang,
          '--sub-format', 'vtt',
          '--skip-download',
          '-o', outputBase,
          `https://www.youtube.com/watch?v=${videoId}`,
        ],
        { timeout: 45_000 },
        (error, _stdout, stderr) => {
          if (error) {
            log.warn(`yt-dlp subtitle error (${lang}) for ${videoId}: ${stderr || error.message}`);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });

    const vttPath = `${outputBase}.${lang}.vtt`;
    try {
      const content = await readFile(vttPath, 'utf-8');
      if (content.length > 100) return content;
    } catch { /* file doesn't exist */ }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch YouTube transcript with timestamps using yt-dlp.
 * Tries each language separately with impersonation to avoid 429 errors.
 */
async function fetchTimestampedTranscript(
  videoId: string,
): Promise<{ snippets: TranscriptSnippet[]; detectedLang: string } | null> {
  const langOrder = ['en', 'es'];

  for (const lang of langOrder) {
    const outputBase = join(tmpdir(), `jarre-pipe-${randomUUID()}`);

    try {
      const vttContent = await tryDownloadSubs(videoId, lang, outputBase);
      if (vttContent) {
        const snippets = parseVttToSnippets(vttContent);
        if (snippets.length > 5) {
          log.info(`Found ${lang} subs for ${videoId}: ${snippets.length} snippets`);
          return { snippets, detectedLang: lang };
        }
      }
    } finally {
      // Clean up temp files
      await unlink(`${outputBase}.${lang}.vtt`).catch(() => {});
    }
  }

  log.warn(`No subtitles found for ${videoId}`);
  return null;
}

/**
 * Detect transcript language using a quick LLM call.
 */
async function detectLanguage(text: string): Promise<string> {
  const sample = text.slice(0, 500);

  try {
    const { content } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: `Detect the language of the following text. Return JSON: { "language": "en" or "es" or ISO code, "confidence": 0.0-1.0 }`,
        },
        { role: 'user', content: sample },
      ],
      temperature: 0,
      maxTokens: TOKEN_BUDGETS.PIPELINE_LANGUAGE_DETECT,
      responseFormat: 'json',
      timeoutMs: 10_000,
    });

    const parsed = parseJsonResponse(content, LanguageDetectionResponseSchema);
    return parsed.language;
  } catch {
    // Heuristic fallback: check for common Spanish words
    const spanishIndicators = /\b(de|que|en|el|la|los|las|por|con|una|del|para|como|pero|más)\b/gi;
    const matches = sample.match(spanishIndicators);
    return (matches?.length ?? 0) > 5 ? 'es' : 'en';
  }
}

/**
 * Stage 1: Resolve YouTube URL into transcript, chapters, and metadata.
 */
export async function resolveYouTube(url: string): Promise<ResolveOutput> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error(`Invalid YouTube URL: ${url}`);
  }

  log.info(`Resolving video ${videoId}...`);

  // Fetch metadata and transcript in parallel
  const [metadata, transcriptResult] = await Promise.all([
    fetchVideoMetadata(videoId),
    fetchTimestampedTranscript(videoId),
  ]);

  if (!transcriptResult || transcriptResult.snippets.length === 0) {
    throw new Error(`No transcript available for video ${videoId}. The video may not have captions.`);
  }

  const { snippets, detectedLang } = transcriptResult;
  const fullTranscript = snippets.map((s) => s.text).join(' ');

  // Confirm language detection
  const language = await detectLanguage(fullTranscript);

  log.info(
    `Resolved ${videoId}: "${metadata.title}" (${metadata.durationSeconds}s, ${language}, ${snippets.length} snippets, ${metadata.chapters.length} chapters)`,
  );

  return {
    videoId,
    title: metadata.title,
    durationSeconds: metadata.durationSeconds,
    language: language || detectedLang,
    snippets,
    chapters: metadata.chapters,
    fullTranscript,
  };
}

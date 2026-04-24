/**
 * Pipeline Stage 1 (PDF): Resolve PDF URL into ordered markdown snippets.
 *
 * Primary path uses PyMuPDF (python script) to preserve page flow and inline
 * figures in reading order. Fallback path uses pdfjs text extraction.
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfWorkerModule from 'pdfjs-dist/legacy/build/pdf.worker.mjs';
import { createLogger } from '@/lib/logger';
import { isAllowedPdfDomain, normalizePdfSourceUrl } from '@/lib/pdf/source-policy';
import type { ResolveOutput, TranscriptSnippet } from '../types';

const log = createLogger('Pipeline:ResolvePDF');
const execFileAsync = promisify(execFile);

const FETCH_TIMEOUT_MS = 45_000;
const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_PDF_PAGES = 150;
const MIN_TEXT_CHARS = 1_200;
const PYTHON_TIMEOUT_MS = 120_000;
const PYTHON_MAX_BUFFER = 20 * 1024 * 1024;
const MAX_IMAGES_PER_PAGE = 6;

interface PythonPageExtract {
  pageNumber: number;
  text: string;
  markdown: string;
  imageCount: number;
}

interface PythonExtractResult {
  pageCount: number;
  totalImages: number;
  metadataTitle: string | null;
  pages: PythonPageExtract[];
}

const require = createRequire(import.meta.url);
const STANDARD_FONT_DATA_URL = (() => {
  try {
    const pdfjsPackageDir = dirname(require.resolve('pdfjs-dist/package.json'));
    return join(pdfjsPackageDir, 'standard_fonts') + '/';
  } catch {
    return undefined;
  }
})();

const pdfjsGlobal = globalThis as typeof globalThis & {
  pdfjsWorker?: { WorkerMessageHandler?: unknown };
};

// In Next.js server bundles, pdfjs fake worker may fail to resolve the default
// relative worker path ("./pdf.worker.mjs"). Pre-registering the worker handler
// avoids that dynamic import and keeps extraction stable in Node runtimes.
if (!pdfjsGlobal.pdfjsWorker?.WorkerMessageHandler) {
  pdfjsGlobal.pdfjsWorker = {
    WorkerMessageHandler: (pdfWorkerModule as { WorkerMessageHandler?: unknown }).WorkerMessageHandler,
  };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function stripMarkdownForLanguageHeuristic(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[*_#>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COVER_SHEET_PATTERNS: readonly RegExp[] = [
  /Downloaded from\b/i,
  /Academic Repository\b/i,
  /author accepted manuscript/i,
  /If you have any enquiries/i,
  /URL of record/i,
  /cite (as|the published)/i,
  /Kent Academic Repository\b/i,
  /ScholarsArchive\b/i,
  /hdl\.handle\.net/i,
];

/**
 * Detect repository cover sheets (KAR, ScholarsArchive, OSF, DSpace, etc.)
 * that academic repositories prepend to AAM PDFs. These contain metadata
 * about the deposit rather than paper content and should be skipped.
 */
function isRepositoryCoverSheet(pageText: string): boolean {
  if (pageText.length > 2500) return false;
  const sample = pageText.slice(0, 3000);
  let matches = 0;
  for (const pattern of COVER_SHEET_PATTERNS) {
    if (pattern.test(sample)) matches++;
    if (matches >= 2) return true;
  }
  return false;
}

function detectLanguageHeuristic(text: string): string {
  const sample = text.slice(0, 3000).toLowerCase();
  const spanishIndicators = /\b(de|que|en|el|la|los|las|por|con|una|del|para|como|pero|más)\b/g;
  const matches = sample.match(spanishIndicators);
  return (matches?.length ?? 0) > 20 ? 'es' : 'en';
}

function inferTitle(firstPageText: string, fallbackUrl: string): string {
  const lines = firstPageText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length >= 12 && line.length <= 180);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('submitted') || lower.includes('published') || lower.includes('proceedings')) continue;
    if (lower.includes('journal of') || lower.includes('conference on')) continue;
    if (/^arxiv:/i.test(line)) continue;
    if (/^[\d\s./-]+$/.test(line)) continue;
    return line;
  }

  try {
    const parsed = new URL(fallbackUrl);
    const leaf = parsed.pathname.split('/').filter(Boolean).pop() || 'document';
    return decodeURIComponent(leaf.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
  } catch {
    return 'PDF Resource';
  }
}

function splitIntoChunks(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length >= 80);

  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (!current) {
      current = paragraph;
      continue;
    }

    if ((current.length + 2 + paragraph.length) <= 700) {
      current = `${current}\n\n${paragraph}`;
      continue;
    }

    chunks.push(current);
    current = paragraph;
  }

  if (current) chunks.push(current);
  if (chunks.length > 0) return chunks;

  const sentenceChunks = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const fallback: string[] = [];
  let block = '';
  for (const sentence of sentenceChunks) {
    if (!block) {
      block = sentence;
      continue;
    }
    if ((block.length + 1 + sentence.length) <= 700) {
      block = `${block} ${sentence}`;
      continue;
    }
    fallback.push(block);
    block = sentence;
  }
  if (block) fallback.push(block);
  return fallback;
}

function buildVirtualSnippets(text: string): {
  snippets: TranscriptSnippet[];
  virtualDurationSeconds: number;
} {
  const chunks = splitIntoChunks(text);
  if (chunks.length === 0) {
    return {
      snippets: [{ text, start: 0, duration: 60 }],
      virtualDurationSeconds: 60,
    };
  }

  const chunkWordCounts = chunks.map((chunk) => Math.max(countWords(chunk), 1));
  const totalWords = chunkWordCounts.reduce((sum, c) => sum + c, 0);
  const virtualDurationSeconds = Math.max(600, Math.min(10_800, Math.round(totalWords / 2)));

  const snippets: TranscriptSnippet[] = [];
  let elapsed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const isLast = i === chunks.length - 1;
    const proportional = Math.max(8, Math.round((chunkWordCounts[i] / totalWords) * virtualDurationSeconds));
    const duration = isLast ? Math.max(8, virtualDurationSeconds - elapsed) : proportional;

    snippets.push({
      text: chunks[i],
      start: elapsed,
      duration,
    });
    elapsed += duration;
  }

  return { snippets, virtualDurationSeconds };
}

function buildSnippetsFromPages(pages: PythonPageExtract[]): {
  snippets: TranscriptSnippet[];
  fullText: string;
  firstPageText: string;
  virtualDurationSeconds: number;
} {
  const normalizedPages = pages
    .map((page) => ({
      pageNumber: page.pageNumber,
      markdown: normalizeWhitespace(page.markdown || page.text || ''),
      plainText: normalizeWhitespace(page.text || stripMarkdownForLanguageHeuristic(page.markdown || '')),
    }))
    .filter((page) => page.markdown.length > 0);

  if (normalizedPages.length === 0) {
    return {
      snippets: [],
      fullText: '',
      firstPageText: '',
      virtualDurationSeconds: 60,
    };
  }

  const wordCounts = normalizedPages.map((page) => Math.max(countWords(page.plainText), 1));
  const totalWords = wordCounts.reduce((sum, c) => sum + c, 0);
  const virtualDurationSeconds = Math.max(600, Math.min(10_800, Math.round(totalWords / 2)));

  const snippets: TranscriptSnippet[] = [];
  let elapsed = 0;

  for (let i = 0; i < normalizedPages.length; i++) {
    const page = normalizedPages[i];
    const isLast = i === normalizedPages.length - 1;
    const proportional = Math.max(12, Math.round((wordCounts[i] / totalWords) * virtualDurationSeconds));
    const duration = isLast ? Math.max(12, virtualDurationSeconds - elapsed) : proportional;

    snippets.push({
      text: page.markdown,
      start: elapsed,
      duration,
      pageNumber: page.pageNumber,
    });
    elapsed += duration;
  }

  return {
    snippets,
    fullText: snippets.map((snippet) => snippet.text).join('\n\n'),
    firstPageText: normalizedPages[0].plainText,
    virtualDurationSeconds,
  };
}

async function extractPdfTextWithPdfJs(buffer: Uint8Array): Promise<{
  fullText: string;
  firstPageText: string;
  pageCount: number;
}> {
  const loadingTask = getDocument({
    data: buffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });

  const pdf = await loadingTask.promise;
  const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);

  const pageTexts: string[] = [];
  let firstPageText = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: unknown) =>
        item && typeof item === 'object' && 'str' in item
          ? String((item as { str: string }).str)
          : '',
      )
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (i === 1) firstPageText = text;
    if (text.length > 0) pageTexts.push(text);
  }

  await loadingTask.destroy();

  return {
    fullText: normalizeWhitespace(pageTexts.join('\n\n')),
    firstPageText,
    pageCount,
  };
}

async function extractWithPython(buffer: Uint8Array, sourceId: string): Promise<PythonExtractResult | null> {
  const scriptPath = join(process.cwd(), 'scripts', 'pipeline_extract_pdf.py');
  const tempDir = await mkdtemp(join(tmpdir(), 'jarre-pdf-'));
  const tempPdfPath = join(tempDir, 'input.pdf');
  const outDir = join(process.cwd(), 'public', 'generated', 'pdfs', sourceId);
  const publicPrefix = `/generated/pdfs/${sourceId}`;

  try {
    await writeFile(tempPdfPath, buffer);
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });

    const { stdout } = await execFileAsync(
      'python3',
      [
        scriptPath,
        '--pdf', tempPdfPath,
        '--out-dir', outDir,
        '--public-prefix', publicPrefix,
        '--max-pages', String(MAX_PDF_PAGES),
        '--max-images-per-page', String(MAX_IMAGES_PER_PAGE),
      ],
      {
        timeout: PYTHON_TIMEOUT_MS,
        maxBuffer: PYTHON_MAX_BUFFER,
      },
    );

    const parsed = JSON.parse(stdout.trim()) as PythonExtractResult;
    if (!Array.isArray(parsed.pages)) {
      throw new Error('Invalid extractor output');
    }

    return parsed;
  } catch (error) {
    log.warn(`Python PDF extraction failed, using text-only fallback: ${(error as Error).message}`);
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function resolvePdf(url: string, titleOverride?: string): Promise<ResolveOutput> {
  const normalizedUrl = normalizePdfSourceUrl(url);

  if (!isAllowedPdfDomain(normalizedUrl)) {
    throw new Error('PDF URL domain not allowed. Use a supported academic source URL.');
  }

  log.info(`Resolving PDF: ${normalizedUrl}`);

  const response = await fetch(normalizedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JarrePipeline/1.0)' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF (${response.status})`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('pdf') && !normalizedUrl.toLowerCase().includes('.pdf')) {
    throw new Error('URL does not appear to be a PDF document.');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
    throw new Error('PDF is too large. Max supported size is 25MB.');
  }

  const sourceId = `pdf-${createHash('sha1').update(normalizedUrl).digest('hex').slice(0, 12)}`;
  const binary = new Uint8Array(arrayBuffer);

  const pythonExtract = await extractWithPython(binary, sourceId);

  let pageCount = 0;
  let snippets: TranscriptSnippet[] = [];
  let fullText = '';
  let firstPageText = '';
  let virtualDurationSeconds = 0;
  let totalImages = 0;
  let metadataTitle: string | null = null;

  if (pythonExtract && pythonExtract.pages.length > 0) {
    const filteredPages = pythonExtract.pages.filter((page, index) => {
      if (index === 0 && isRepositoryCoverSheet(page.text)) {
        log.info(`Skipping page 1 — detected as repository cover sheet`);
        return false;
      }
      return true;
    });
    const pageResult = buildSnippetsFromPages(filteredPages);
    snippets = pageResult.snippets;
    fullText = pageResult.fullText;
    firstPageText = pageResult.firstPageText;
    virtualDurationSeconds = pageResult.virtualDurationSeconds;
    pageCount = filteredPages.length;
    totalImages = pythonExtract.totalImages;
    metadataTitle = pythonExtract.metadataTitle;
  } else {
    const fallback = await extractPdfTextWithPdfJs(binary);
    pageCount = fallback.pageCount;
    fullText = fallback.fullText;
    firstPageText = fallback.firstPageText;
    const virtual = buildVirtualSnippets(fullText);
    snippets = virtual.snippets;
    virtualDurationSeconds = virtual.virtualDurationSeconds;
  }

  const plainForLanguage = stripMarkdownForLanguageHeuristic(fullText);
  if (plainForLanguage.length < MIN_TEXT_CHARS) {
    throw new Error('Could not extract enough text from PDF (document may be scanned/image-based).');
  }

  const language = detectLanguageHeuristic(plainForLanguage);
  const resolvedTitle =
    titleOverride?.trim()
    || metadataTitle?.trim()
    || inferTitle(firstPageText || plainForLanguage.slice(0, 1000), normalizedUrl);

  log.info(
    `Resolved PDF ${sourceId}: "${resolvedTitle}" (${pageCount} pages, ${snippets.length} snippets, ${fullText.length} chars, ${totalImages} images)`,
  );

  return {
    videoId: sourceId,
    title: resolvedTitle,
    durationSeconds: virtualDurationSeconds,
    language,
    snippets,
    chapters: [],
    fullTranscript: fullText,
    sourceType: 'pdf',
    sourceUrl: normalizedUrl,
    sourceId,
  };
}

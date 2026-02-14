import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { PDF_CACHE_TTL_MS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('ProxyPDF');

// Cache fetched PDFs in memory to avoid re-downloading
const pdfCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>();

/**
 * Allowed PDF source domains.
 * Only these hosts are permitted to prevent SSRF attacks.
 */
const ALLOWED_PDF_DOMAINS = [
  'arxiv.org',
  'dl.acm.org',
  'papers.nips.cc',
  'proceedings.neurips.cc',
  'openreview.net',
  'aclanthology.org',
  'proceedings.mlr.press',
  'jmlr.org',
  'raw.githubusercontent.com',
  'github.com',
  'huggingface.co',
];

/**
 * Validate that a URL points to an allowed domain.
 */
function isAllowedDomain(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    // Check hostname against whitelist (allow subdomains)
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_PDF_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/proxy-pdf?url=...&start=...&end=...
 * Proxies external PDFs from whitelisted domains and optionally extracts page range
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const startPage = request.nextUrl.searchParams.get('start');
  const endPage = request.nextUrl.searchParams.get('end');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(url);

    // Validate URL structure
    if (!isAllowedDomain(decodedUrl)) {
      log.error(`Blocked PDF request for disallowed domain: ${decodedUrl}`);
      return NextResponse.json(
        { error: 'Domain not allowed. Only known academic sources are permitted.' },
        { status: 403 }
      );
    }

    if (!decodedUrl.toLowerCase().includes('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
    }

    // Check cache
    const cached = pdfCache.get(decodedUrl);
    let pdfBuffer: ArrayBuffer;

    if (cached && Date.now() - cached.timestamp < PDF_CACHE_TTL_MS) {
      pdfBuffer = cached.buffer;
    } else {
      // Fetch the PDF
      const response = await fetch(decodedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JarreApp/1.0)',
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch PDF: ${response.status}` },
          { status: response.status }
        );
      }

      pdfBuffer = await response.arrayBuffer();

      // Cache the full PDF
      pdfCache.set(decodedUrl, { buffer: pdfBuffer, timestamp: Date.now() });
    }

    // If page range specified, extract those pages
    if (startPage && endPage) {
      const start = parseInt(startPage, 10);
      const end = parseInt(endPage, 10);

      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        const sourcePdf = await PDFDocument.load(pdfBuffer);
        const newPdf = await PDFDocument.create();

        // PDF pages are 0-indexed, user provides 1-indexed
        const pageIndices = [];
        for (let i = start - 1; i < end && i < sourcePdf.getPageCount(); i++) {
          pageIndices.push(i);
        }

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const extractedBuffer = await newPdf.save();

        return new NextResponse(Buffer.from(extractedBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }

    // Return full PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    log.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy PDF' },
      { status: 500 }
    );
  }
}

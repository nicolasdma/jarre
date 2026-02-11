import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { PDF_CACHE_TTL_MS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('ProxyPDF');

// Cache fetched PDFs in memory to avoid re-downloading
const pdfCache = new Map<string, { buffer: ArrayBuffer; timestamp: number }>();

/**
 * GET /api/proxy-pdf?url=...&start=...&end=...
 * Proxies external PDFs and optionally extracts page range
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

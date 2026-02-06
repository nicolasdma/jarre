'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { t, type Language } from '@/lib/translations';

interface PdfViewerProps {
  url: string | null;
  title: string;
  language: Language;
  startPage?: number | null;
  endPage?: number | null;
}

function getProxyUrl(url: string, startPage?: number | null, endPage?: number | null): string {
  const baseUrl = url.replace(/#page=\d+/, '');
  let proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(baseUrl)}`;
  if (startPage && endPage) {
    proxyUrl += `&start=${startPage}&end=${endPage}`;
  }
  return proxyUrl;
}

export function PdfViewer({ url, title, language, startPage, endPage }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [scale, setScale] = useState(2.3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renderedPages, setRenderedPages] = useState<Map<number, HTMLCanvasElement>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const proxyUrl = getProxyUrl(url!, startPage, endPage);
        const loadingTask = pdfjs.getDocument(proxyUrl);
        const pdfDoc = await loadingTask.promise;

        if (cancelled) return;

        setPdf(pdfDoc);
        setRenderedPages(new Map());
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[PdfViewer] Error loading PDF:', err);
        setError('Failed to load PDF');
        setLoading(false);
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, [url, startPage, endPage]);

  // Render a single page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdf || renderedPages.has(pageNum)) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      setRenderedPages(prev => new Map(prev).set(pageNum, canvas));
    } catch (err) {
      console.error(`[PdfViewer] Error rendering page ${pageNum}:`, err);
    }
  }, [pdf, scale, renderedPages]);

  // Fit to container width when PDF first loads
  useEffect(() => {
    if (!pdf || !scrollRef.current) return;

    async function fitToWidth() {
      try {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const containerWidth = scrollRef.current!.clientWidth - 32; // padding
        const fitScale = containerWidth / viewport.width;
        // Use fit scale but ensure at least 2.0 for readability
        setScale(Math.max(fitScale, 2.0));
      } catch (err) {
        console.error('[PdfViewer] Error fitting to width:', err);
      }
    }

    fitToWidth();
  }, [pdf]);

  // Render all pages when PDF loads or scale changes
  useEffect(() => {
    if (!pdf) return;

    // Clear rendered pages on scale change
    setRenderedPages(new Map());

    // Render all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      renderPage(i);
    }
  }, [pdf, scale]);

  // Re-render pages when renderedPages is cleared (scale change)
  useEffect(() => {
    if (!pdf || renderedPages.size > 0) return;

    for (let i = 1; i <= pdf.numPages; i++) {
      renderPage(i);
    }
  }, [pdf, renderedPages, renderPage]);

  // Track current page on scroll
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !pdf) return;

    const handleScroll = () => {
      const containerTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const viewportMiddle = containerTop + containerHeight / 3;

      let currentPageNum = 1;
      pageRefs.current.forEach((element, pageNum) => {
        if (element.offsetTop <= viewportMiddle) {
          currentPageNum = pageNum;
        }
      });

      setCurrentPage(currentPageNum);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [pdf]);

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.3, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.3, 1));
  }, []);

  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-stone-100 p-8 text-center">
        <FileText className="mb-4 h-16 w-16 text-stone-400" />
        <h3 className="mb-2 text-lg font-medium text-stone-700">{title}</h3>
        <p className="text-sm text-stone-500">{t('study.noUrl', language)}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-800">
        <p className="text-sm text-stone-400">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-stone-100 p-8 text-center">
        <FileText className="mb-4 h-16 w-16 text-stone-400" />
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-stone-800">
      {/* Minimal toolbar */}
      <div className="flex items-center justify-between bg-stone-900 px-3 py-1.5">
        <span className="text-xs text-stone-400">
          {currentPage} / {pdf?.numPages || 0}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="rounded p-1 text-stone-400 hover:bg-stone-700 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[40px] text-center text-xs text-stone-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="rounded p-1 text-stone-400 hover:bg-stone-700 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable PDF pages - only vertical scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col items-center gap-[1px]">
          {pdf && Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(pageNum => (
            <div
              key={pageNum}
              ref={el => { if (el) pageRefs.current.set(pageNum, el); }}
            >
              {renderedPages.has(pageNum) ? (
                <canvas
                  ref={el => {
                    if (el && renderedPages.get(pageNum)) {
                      const source = renderedPages.get(pageNum)!;
                      el.width = source.width;
                      el.height = source.height;
                      el.getContext('2d')?.drawImage(source, 0, 0);
                    }
                  }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-stone-700"
                  style={{ width: 600 * scale, height: 800 * scale }}
                >
                  <p className="text-xs text-stone-500">Loading page {pageNum}...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

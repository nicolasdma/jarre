'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ScrollProgressProps {
  containerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Thin progress bar at the top of the viewport showing scroll position.
 * Defaults to tracking the full page scroll; pass containerRef to track
 * a specific scrollable element.
 */
export function ScrollProgress({ containerRef }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  const updateProgress = useCallback(() => {
    const el = containerRef?.current;
    if (el) {
      const scrollable = el.scrollHeight - el.clientHeight;
      setProgress(scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0);
    } else {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0);
    }
  }, [containerRef]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  useEffect(() => {
    const target = containerRef?.current ?? window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    return () => {
      target.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, handleScroll, updateProgress]);

  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-[60] pointer-events-none">
      <div
        className="h-full bg-j-accent transition-[width] duration-75 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

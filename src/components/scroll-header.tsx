'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollHeaderProps {
  children: React.ReactNode;
}

export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    // Walk up the DOM to find the nearest scrollable ancestor.
    // AppShell uses overflow-y-auto on a flex child instead of window scroll.
    function findScrollParent(el: HTMLElement): HTMLElement | Window {
      let node = el.parentElement;
      while (node) {
        const { overflowY } = getComputedStyle(node);
        if (overflowY === 'auto' || overflowY === 'scroll') return node;
        node = node.parentElement;
      }
      return window;
    }

    const scrollContainer = findScrollParent(header);

    const handleScroll = () => {
      const scrollTop =
        scrollContainer instanceof HTMLElement
          ? scrollContainer.scrollTop
          : window.scrollY;
      setScrolled(scrollTop > 20);
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 transition-colors duration-300 j-header-line ${
        scrolled
          ? 'bg-j-bg/90 backdrop-blur-md border-b border-j-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {children}
    </header>
  );
}

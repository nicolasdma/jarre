'use client';

import { useEffect, useState } from 'react';

interface ScrollHeaderProps {
  children: React.ReactNode;
}

export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // AppShell moves scroll from window to #main-scroll-container
    const scrollContainer =
      document.getElementById('main-scroll-container') ?? window;

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

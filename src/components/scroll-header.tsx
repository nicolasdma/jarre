'use client';

import { useEffect, useState } from 'react';

interface ScrollHeaderProps {
  children: React.ReactNode;
}

export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

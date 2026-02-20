'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavLink {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
}

interface MobileNavProps {
  links: NavLink[];
  streakDays: number;
  totalXp: number;
  xpLevel: number;
  isAuthenticated: boolean;
  logoutLabel: string;
}

export function MobileNav({ links, streakDays, totalXp, xpLevel, isAuthenticated, logoutLabel }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus trap: cycle Tab within menu panel
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Focus first link on open
    const focusableElements = panel.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, [isOpen]);

  const handleOverlayClick = useCallback(() => {
    setIsOpen(false);
    toggleRef.current?.focus();
  }, []);

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 min-h-[44px]"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span className={`block w-5 h-px bg-j-text transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-[3.5px]' : ''}`} />
        <span className={`block w-5 h-px bg-j-text transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-px bg-j-text transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-[3.5px]' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Semitransparent overlay — closes menu on click */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="absolute top-full left-0 right-0 bg-j-bg/95 backdrop-blur-lg border-b border-j-border z-50"
          >
            <nav className="flex flex-col px-8 py-4 gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  aria-current={link.active ? 'page' : undefined}
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors flex items-center gap-2 py-2 min-h-[44px] ${
                    link.active ? 'text-j-accent' : 'text-j-text-secondary'
                  }`}
                >
                  {link.label}
                  {link.badge && link.badge > 0 ? (
                    <span className="bg-j-accent text-j-text-on-accent text-[9px] font-mono px-1.5 py-0.5 min-w-[18px] text-center">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  ) : null}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <div className="border-t border-j-border pt-3 mt-1 flex items-center gap-4">
                    {streakDays > 0 && (
                      <div className="flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-j-warm">
                          <path d="M12 2C12 2 4 8 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 8 12 2 12 2Z" fill="currentColor" opacity="0.9"/>
                        </svg>
                        <span className="font-mono text-[10px] text-j-text">{streakDays}</span>
                      </div>
                    )}
                    <span className="font-mono text-[10px] text-j-text-secondary">
                      {totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}k` : totalXp} XP · Nv {xpLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2 min-h-[44px]">
                    <ThemeToggle />
                    <LogoutButton label={logoutLabel} />
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="flex items-center gap-3 py-2 border-t border-j-border pt-3 min-h-[44px]">
                  <ThemeToggle />
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

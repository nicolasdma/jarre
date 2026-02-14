import Link from 'next/link';
import type { ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

interface BackLinkProps {
  href: string;
  children: ReactNode;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Consistent back-navigation link for the Jarre design system.
 *
 * Renders "← {children}" with j-* styling and hover transition.
 * Uses Next.js Link for client-side navigation.
 */
export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase hover:text-j-text transition-colors"
    >
      <span aria-hidden="true">&larr;</span>
      {children}
    </Link>
  );
}

export type { BackLinkProps };

import * as React from 'react';

// ============================================================================
// Types
// ============================================================================

type ErrorVariant = 'inline' | 'banner' | 'block';

interface ErrorMessageProps {
  message: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Unified error display component for the Jarre design system.
 *
 * Variants:
 * - `inline`: Small inline text error (e.g., form validation). Default.
 * - `banner`: Full-width background banner for page-level errors.
 * - `block`: Bordered block with optional retry, for section-level errors.
 *
 * All variants use the j-error design token for consistent styling.
 */
export function ErrorMessage({ message, variant = 'inline', onRetry }: ErrorMessageProps) {
  if (!message) return null;

  if (variant === 'inline') {
    return (
      <p className="text-sm text-j-error" role="alert">
        {message}
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-j-error-bg border border-j-error/20 px-4 py-3" role="alert">
        <p className="text-sm text-j-error">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-mono text-[10px] tracking-[0.15em] text-j-error underline uppercase hover:no-underline transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // variant === 'block'
  return (
    <div className="border border-j-error/20 bg-j-error-bg p-4" role="alert">
      <p className="font-mono text-[10px] tracking-[0.15em] text-j-error uppercase mb-1">
        Error
      </p>
      <p className="text-sm text-j-text-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-mono text-[10px] tracking-[0.15em] border border-j-error/30 text-j-error px-3 py-1.5 uppercase hover:bg-j-error-bg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

import * as React from 'react';

// ============================================================================
// Types
// ============================================================================

type JarreButtonVariant = 'j-primary' | 'j-secondary' | 'j-ghost' | 'j-danger';
type JarreButtonSize = 'default' | 'sm';

interface JarreButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: JarreButtonVariant;
  size?: JarreButtonSize;
}

// ============================================================================
// Variant + Size class maps
// ============================================================================

const VARIANT_CLASSES: Record<JarreButtonVariant, string> = {
  'j-primary': 'bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover disabled:opacity-50 j-glow-accent hover:shadow-[0_0_20px_rgba(94,170,94,0.15)]',
  'j-secondary': 'border border-j-border-input bg-transparent text-j-text-secondary hover:border-j-accent hover:text-j-text disabled:opacity-50',
  'j-ghost': 'bg-transparent text-j-text-secondary hover:bg-j-bg-alt hover:text-j-text disabled:opacity-50',
  'j-danger': 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
};

const SIZE_CLASSES: Record<JarreButtonSize, string> = {
  default: 'px-6 py-3',
  sm: 'px-4 py-2',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Unified button component for the Jarre design system.
 *
 * Always applies: font-mono text-[10px] tracking-[0.15em] uppercase transition-colors
 * Supports forwarded refs for composition with form libraries.
 */
const JarreButton = React.forwardRef<HTMLButtonElement, JarreButtonProps>(
  ({ variant = 'j-primary', size = 'default', className = '', children, ...props }, ref) => {
    const classes = [
      'font-mono text-[10px] tracking-[0.15em] uppercase transition-colors rounded',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

JarreButton.displayName = 'JarreButton';

export { JarreButton };

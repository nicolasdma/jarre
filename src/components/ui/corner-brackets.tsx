interface CornerBracketsProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideLeft?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
} as const;

export function CornerBrackets({ className = '', size = 'md', hideLeft = false }: CornerBracketsProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <>
      {!hideLeft && <div className={`absolute top-0 left-0 ${sizeClass} border-l border-t ${className}`} />}
      <div className={`absolute top-0 right-0 ${sizeClass} border-r border-t ${className}`} />
      {!hideLeft && <div className={`absolute bottom-0 left-0 ${sizeClass} border-l border-b ${className}`} />}
      <div className={`absolute bottom-0 right-0 ${sizeClass} border-r border-b ${className}`} />
    </>
  );
}

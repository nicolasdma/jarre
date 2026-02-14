'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface SelectionPopoverProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onHighlight: () => void;
}

interface PopoverPosition {
  top: number;
  left: number;
}

/**
 * Floating "Subrayar" button that appears at the mouse cursor position
 * when text is selected. Enter key also triggers highlight.
 */
export function SelectionPopover({ containerRef, onHighlight }: SelectionPopoverProps) {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track mouse position (page coordinates)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.pageX, y: e.pageY };
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition(null);
      return;
    }

    const container = containerRef.current;
    if (!container) { setPosition(null); return; }

    const range = selection.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      setPosition(null);
      return;
    }

    const startSegment = findSegmentAncestor(range.startContainer);
    const endSegment = findSegmentAncestor(range.endContainer);
    if (!startSegment || startSegment !== endSegment) {
      setPosition(null);
      return;
    }

    // Convert page coords to container-relative coords
    const containerRect = container.getBoundingClientRect();
    const pos = {
      top: mouseRef.current.y - (containerRect.top + window.scrollY) + 8,
      left: mouseRef.current.x - (containerRect.left + window.scrollX),
    };
    setPosition(pos);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const handleClick = useCallback(() => {
    onHighlight();
    setPosition(null);
  }, [onHighlight]);

  // Enter triggers highlight when popover is visible
  useEffect(() => {
    if (!position) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleClick(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [position, handleClick]);

  if (!position) return null;

  return (
    <button
      type="button"
      data-popover="subrayar"
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 60,
      }}
      className="bg-j-text text-j-bg-white px-3 py-1.5 text-xs font-mono tracking-wider uppercase shadow-lg hover:bg-j-accent transition-colors"
    >
      Subrayar
    </button>
  );
}

function findSegmentAncestor(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== document.body) {
    if (current instanceof HTMLElement && current.hasAttribute('data-segment-index')) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

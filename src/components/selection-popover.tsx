'use client';

import { useEffect, useCallback } from 'react';

interface SelectionPopoverProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onHighlight: () => void;
  enabled: boolean;
}

/**
 * Auto-highlight: when enabled, any text selection inside the container
 * is immediately converted to a highlight on mouseup. No popover needed.
 */
export function SelectionPopover({ containerRef, onHighlight, enabled }: SelectionPopoverProps) {
  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return;

    const startSegment = findSegmentAncestor(range.startContainer);
    const endSegment = findSegmentAncestor(range.endContainer);
    if (!startSegment || startSegment !== endSegment) return;

    // Small delay to let the selection finalize
    requestAnimationFrame(() => {
      onHighlight();
    });
  }, [containerRef, onHighlight, enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef, handleMouseUp]);

  return null;
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

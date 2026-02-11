/**
 * Text anchoring utilities for highlight positioning.
 *
 * Creates stable anchors from DOM selections and re-finds them after re-render.
 * Uses prefix/suffix context for disambiguation when the same text appears multiple times.
 */

import type { HighlightAnchor } from '@/types';

const CONTEXT_LENGTH = 50;

/**
 * Create an anchor from the current Selection within a segment container.
 * Returns null if the selection is empty or spans multiple segments.
 */
export function createAnchor(
  selection: Selection,
  containerEl: HTMLElement
): HighlightAnchor | null {
  if (selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString().trim();
  if (!selectedText) return null;

  // Ensure the selection is fully within the container
  if (
    !containerEl.contains(range.startContainer) ||
    !containerEl.contains(range.endContainer)
  ) {
    return null;
  }

  // Find segment index from the closest data-segment-index ancestor
  const segmentEl = findSegmentAncestor(range.startContainer);
  const endSegmentEl = findSegmentAncestor(range.endContainer);

  // Reject cross-segment selections
  if (!segmentEl || segmentEl !== endSegmentEl) return null;

  const segmentIndex = parseInt(segmentEl.getAttribute('data-segment-index') || '0', 10);

  // Get full text content of the segment
  const fullText = segmentEl.textContent || '';
  const selStart = getTextOffset(segmentEl, range.startContainer, range.startOffset);

  const prefix = fullText.slice(Math.max(0, selStart - CONTEXT_LENGTH), selStart);
  const suffix = fullText.slice(
    selStart + selectedText.length,
    selStart + selectedText.length + CONTEXT_LENGTH
  );

  return { selectedText, prefix, suffix, segmentIndex };
}

/**
 * Find the position of an anchor's text within a segment's textContent.
 * Returns the character offset, or -1 if not found.
 */
export function findAnchorPosition(
  anchor: HighlightAnchor,
  segmentText: string
): number {
  // Try exact match with context first
  const withContext = anchor.prefix + anchor.selectedText + anchor.suffix;
  const contextIdx = segmentText.indexOf(withContext);
  if (contextIdx !== -1) {
    return contextIdx + anchor.prefix.length;
  }

  // Fallback: find selectedText and use prefix to disambiguate
  let searchStart = 0;
  while (true) {
    const idx = segmentText.indexOf(anchor.selectedText, searchStart);
    if (idx === -1) return -1;

    // Check if prefix matches (fuzzy: last N chars before this position)
    if (anchor.prefix) {
      const beforeText = segmentText.slice(Math.max(0, idx - CONTEXT_LENGTH), idx);
      if (beforeText.endsWith(anchor.prefix.slice(-20))) {
        return idx;
      }
    } else {
      return idx;
    }

    searchStart = idx + 1;
  }
}

/**
 * Build a DOM Range for a highlight anchor within a segment element.
 * Returns null if the text cannot be located.
 */
export function buildRangeForAnchor(
  anchor: HighlightAnchor,
  segmentEl: HTMLElement
): Range | null {
  const fullText = segmentEl.textContent || '';
  const offset = findAnchorPosition(anchor, fullText);
  if (offset === -1) return null;

  const range = document.createRange();
  const walker = document.createTreeWalker(segmentEl, NodeFilter.SHOW_TEXT);

  let charCount = 0;
  let startSet = false;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const nodeLen = node.length;

    // Set start
    if (!startSet && charCount + nodeLen > offset) {
      range.setStart(node, offset - charCount);
      startSet = true;
    }

    // Set end
    if (startSet && charCount + nodeLen >= offset + anchor.selectedText.length) {
      range.setEnd(node, offset + anchor.selectedText.length - charCount);
      return range;
    }

    charCount += nodeLen;
  }

  return null;
}

/**
 * Apply CSS Custom Highlight API for a set of ranges under a highlight name.
 * Returns true if the API is supported and highlights were applied.
 */
export function applyHighlightsCSS(
  name: string,
  ranges: Range[]
): boolean {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return false;

  const highlight = new Highlight(...ranges);
  (CSS as { highlights: Map<string, Highlight> }).highlights.set(name, highlight);
  return true;
}

/**
 * Remove a CSS Custom Highlight by name.
 */
export function removeHighlightCSS(name: string): void {
  if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
  (CSS as { highlights: Map<string, Highlight> }).highlights.delete(name);
}

/**
 * Check if the CSS Custom Highlight API is supported.
 */
export function supportsHighlightAPI(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSegmentAncestor(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== document.body) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute('data-segment-index')
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function getTextOffset(
  root: Node,
  targetNode: Node,
  targetOffset: number
): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;

  while (walker.nextNode()) {
    if (walker.currentNode === targetNode) {
      return offset + targetOffset;
    }
    offset += (walker.currentNode as Text).length;
  }

  return offset;
}

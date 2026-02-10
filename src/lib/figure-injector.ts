import type { FigureRegistry } from './figure-registry';

/**
 * Pre-processes markdown to inject figure images at caption positions.
 *
 * Matches standalone italic caption lines like:
 *   _Figura 5-1. Replicación basada en líder..._
 *
 * For each match, if the figure exists in the registry, REPLACES the caption
 * line with a block-level image tag (surrounded by blank lines so react-markdown
 * treats it as a block element, not inline inside a <p>).
 *
 * The caption text becomes the alt text, rendered as <figcaption> by the img component.
 *
 * Inline text references like "la Figura 5-1" are left untouched.
 * Captions without a matching registry entry are left as-is.
 */
export function injectFigures(markdown: string, registry: FigureRegistry): string {
  const lines = markdown.split('\n');
  const result: string[] = [];

  // Match standalone italic caption lines: _Figura X-Y. caption text._
  const captionPattern = /^_Figura (\d+-\d+)\.\s*(.+?)_$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(captionPattern);

    if (match) {
      const figId = match[1];
      const figure = registry[figId];

      if (figure) {
        // Extract full caption text (everything after "Figura X-Y. ")
        const captionText = trimmed.slice(1, -1); // remove surrounding underscores
        // Replace caption line with block-level image (blank lines ensure it's not inline)
        result.push('');
        result.push(`![${captionText}](${figure.path})`);
        result.push('');
        continue; // skip the original caption line
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

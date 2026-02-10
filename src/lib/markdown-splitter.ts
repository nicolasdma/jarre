interface MarkdownSegment {
  heading: string | null;
  content: string;
}

/**
 * Splits markdown at bold heading boundaries.
 * Bold headings are standalone lines matching **Heading Text**.
 * Returns an array of segments, each with the heading text (or null for
 * content before the first bold heading) and the content below it.
 */
export function splitAtBoldHeadings(markdown: string): MarkdownSegment[] {
  const lines = markdown.split("\n");
  const boldHeadingPattern = /^\*\*(.+?)\*\*$/;
  const segments: MarkdownSegment[] = [];

  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const match = line.trim().match(boldHeadingPattern);

    if (match) {
      // Flush the previous segment if there are accumulated lines
      // or if this is not the very first content (to handle leading headings)
      if (currentLines.length > 0 || segments.length > 0 || currentHeading !== null) {
        segments.push({
          heading: currentHeading,
          content: currentLines.join("\n").trim(),
        });
      }

      currentHeading = match[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush the final segment
  if (currentLines.length > 0 || currentHeading !== null) {
    segments.push({
      heading: currentHeading,
      content: currentLines.join("\n").trim(),
    });
  }

  return segments;
}

/**
 * The shared look of a code block in a lesson, so the JS | TS tabs, their
 * loading fallback and a plain snippet all read the same.
 */

export const CODE_BLOCK_CLASS =
  'overflow-x-auto rounded-lg border border-j-border bg-j-bg-white p-3 font-mono text-xs leading-relaxed text-j-text whitespace-pre';

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className={CODE_BLOCK_CLASS} lang="en">
      {code}
    </pre>
  );
}

'use client';

/**
 * The code editor of the coding exercises and the mock. CodeMirror (several
 * hundred kB) loads only when an editor mounts: the implementation lives in
 * ./code-editor-impl.tsx and comes in through next/dynamic, so lessons without
 * a code exercise never download it. Same props as before.
 */

import dynamic from 'next/dynamic';
import type { CodeEditorProps } from './code-editor-impl';

const CodeEditorImpl = dynamic(() => import('./code-editor-impl').then((m) => m.CodeEditorImpl), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      className="w-full"
      style={{
        minHeight: 160,
        backgroundColor: 'var(--j-bg-white)',
        border: '1px solid var(--j-border)',
      }}
    />
  ),
});

export type { CodeEditorProps };

export function CodeEditor(props: CodeEditorProps) {
  return <CodeEditorImpl {...props} />;
}

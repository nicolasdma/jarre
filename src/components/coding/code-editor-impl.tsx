'use client';

/**
 * The code editor of the coding exercises and the mock: CodeMirror 6 with
 * TypeScript highlighting, bracket matching, auto-indent, Tab to indent and
 * the language's own word completion. No AI completion, as in the interview.
 * Cmd/Ctrl+Enter runs. Uncontrolled inside, synced when `value` is replaced
 * from outside (reset, a restored draft).
 *
 * Loaded on demand through ./code-editor.tsx: CodeMirror stays out of the
 * lesson bundle until an exercise with an editor mounts.
 */

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';

export interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  /** Cmd/Ctrl+Enter. */
  onRun?: () => void;
  /** CSS height of the editor, e.g. "420px" or "100%". */
  height?: string;
  ariaLabel?: string;
  readOnly?: boolean;
}

const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--j-bg-white)',
    color: 'var(--j-text)',
    fontSize: '14px',
    border: '1px solid var(--j-border)',
  },
  '&.cm-focused': { outline: '1px solid var(--j-accent)' },
  '.cm-content': { fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace', padding: '8px 0' },
  '.cm-gutters': {
    backgroundColor: 'var(--j-bg-alt)',
    color: 'var(--j-text-tertiary)',
    borderRight: '1px solid var(--j-border)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--j-accent) 6%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'color-mix(in srgb, var(--j-accent) 10%, transparent)' },
  '.cm-scroller': { overflow: 'auto' },
  // CodeMirror's light defaults: a black caret and a pale grey selection, invisible on the dark theme.
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--j-text)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--j-accent) 30%, transparent)',
  },
});

export function CodeEditorImpl({ value, onChange, onRun, height = '420px', ariaLabel = 'Editor de código', readOnly = false }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          Prec.highest(
            keymap.of([
              {
                key: 'Mod-Enter',
                run: () => {
                  onRunRef.current?.();
                  return true;
                },
              },
            ]),
          ),
          basicSetup,
          keymap.of([indentWithTab]),
          javascript({ typescript: true }),
          indentUnit.of('  '),
          EditorState.tabSize.of(2),
          EditorState.readOnly.of(readOnly),
          theme,
          EditorView.theme({ '&': { height }, '.cm-scroller': { minHeight: height } }),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel, spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // The editor is created once; `value` changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, readOnly]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current !== value) v.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return <div ref={host} data-testid="code-editor" />;
}

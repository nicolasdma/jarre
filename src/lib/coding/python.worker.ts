/**
 * Web Worker that runs the candidate's Python (src/lib/coding/run-python.ts
 * keeps one loaded and terminates it when a run goes past its budget). It
 * loads Pyodide from the CDN once, says it is ready, then runs each request
 * in a fresh namespace (./python-run.ts). Nothing here touches the page.
 */

import { runPythonCode, type PyodideLike } from './python-run';
import { PYODIDE_INDEX_URL, type PythonRunMessage, type PythonWorkerMessage } from './python-protocol';

interface PyodideWorkerScope {
  importScripts(...urls: string[]): void;
  loadPyodide(options: { indexURL: string }): Promise<PyodideLike>;
  postMessage(message: PythonWorkerMessage): void;
  onmessage: ((event: MessageEvent<PythonRunMessage>) => void) | null;
}

const scope = self as unknown as PyodideWorkerScope;

const ready: Promise<PyodideLike | null> = (async () => {
  try {
    scope.importScripts(`${PYODIDE_INDEX_URL}pyodide.js`);
    const py = await scope.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
    scope.postMessage({ type: 'ready' });
    return py;
  } catch (e) {
    scope.postMessage({ type: 'load-error', message: (e as Error).message || String(e) });
    return null;
  }
})();

scope.onmessage = async (event) => {
  if (event.data.type !== 'run') return;
  const py = await ready;
  if (!py) return;
  const result = await runPythonCode(py, event.data.req);
  scope.postMessage({ type: 'result', id: event.data.id, result });
};
